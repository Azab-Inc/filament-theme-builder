<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\OperationCleanup;
use App\Mcp\ThemeRelay\OperationResultStore;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayRecordReader;
use App\Mcp\ThemeRelay\SessionCleanup;
use Tests\TestCase;

class RelayLifecycleLockTest extends TestCase
{
    public function test_all_lifecycle_and_cleanup_mutations_take_the_session_index_lock(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $fileStore = new LockObservingFileRelayStore($path);
        $store = new ObservedRelayStore($fileStore);
        try {
            $clock = new MutableRelayClock;
            $lifecycle = new RelayLifecycle($store, $clock);
            $lifecycle->createPairing('pair-a', 'session-a', hash('sha256', 'secret'), 'process-a');
            $lifecycle->approve('pair-a', hash('sha256', 'secret'), 'process-a');
            $lifecycle->heartbeat('pair-a', 'process-a');
            $lifecycle->authorize('pair-a', 'process-a', $clock->time);
            (new SessionCleanup($fileStore, $clock))->removeStale();
            self::assertSame(4, count(array_filter($store->lockedKeys, fn (string $key): bool => $key === 'session-index')));
            self::assertContains('session-index', $fileStore->lockedKeys);
        } finally {
            RelayTestDirectory::remove($path);
        }
    }

    public function test_heartbeat_rechecks_pairing_after_acquiring_shared_lock(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $fileStore = new FileRelayStore($path);
        $store = new ObservedRelayStore($fileStore);
        try {
            $clock = new MutableRelayClock;
            $lifecycle = new RelayLifecycle($store, $clock);
            $lifecycle->createPairing('pair-a', 'session-a', hash('sha256', 'secret'), 'process-a');
            $lifecycle->approve('pair-a', hash('sha256', 'secret'), 'process-a');
            $store->beforeLock = function (string $key) use ($fileStore): void {
                if ($key === 'session-index') {
                    $pair = (new RelayRecordReader($fileStore))->read('pairing-pair-a');
                    $pair['status'] = 'disconnected';
                    $fileStore->atomicWrite('pairing-pair-a', json_encode($pair));
                }
            };
            try {
                $lifecycle->heartbeat('pair-a', 'process-a');
                self::fail('Stale pair heartbeat succeeded.');
            } catch (\RuntimeException $error) {
                self::assertSame('Pairing unavailable.', $error->getMessage());
            }
        } finally {
            RelayTestDirectory::remove($path);
        }
    }

    public function test_operation_transition_takes_global_and_operation_locks_before_revalidation(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $fileStore = new FileRelayStore($path);
        $store = new ObservedRelayStore($fileStore);
        try {
            $clock = new MutableRelayClock;
            $ops = new OperationStore($store, $clock);
            $id = $ops->create('export', 'pair-a', 'process-a', hash('sha256', 'payload'));
            $results = new OperationResultStore($store, $clock);
            self::assertFalse($results->publish($id, 'wrong-pair', 'process-a', hash('sha256', 'payload'), 'result'));
            self::assertContains('session-index', $store->lockedKeys);
            self::assertContains('operation-'.$id, $store->lockedKeys);
        } finally {
            RelayTestDirectory::remove($path);
        }
    }

    public function test_expiry_cleanup_holds_global_index_before_operation_record_lock(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new LockObservingFileRelayStore($path);
        try {
            $clock = new MutableRelayClock;
            $id = (new OperationStore($store, $clock))->create('import', 'pair-a', 'process-a', hash('sha256', 'payload'));
            $clock->time += 300;
            (new OperationCleanup($store, $clock))->expireUndelivered();
            self::assertSame(['session-index', 'session-index', 'operation-'.$id], array_values(array_filter(
                $store->lockedKeys, fn (string $key): bool => $key === 'session-index' || $key === 'operation-'.$id)));
            self::assertNull($store->read('operation-'.$id));
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
