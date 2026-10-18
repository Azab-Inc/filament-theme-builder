<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\PairingStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayRecordReader;
use Tests\TestCase;

class RelayPairingRaceTest extends TestCase
{
    public function test_approval_revalidates_pairing_after_global_lock_interleaving(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $fileStore = new FileRelayStore($path);
        $store = new ObservedRelayStore($fileStore);
        try {
            $clock = new MutableRelayClock;
            $pairings = new PairingStore($store, $clock);
            $pairings->create('pair-a', 'session-a', hash('sha256', 'secret'), 'process-a');
            $store->beforeLock = function (string $key) use ($fileStore, $clock): void {
                if ($key !== 'session-index') {
                    return;
                }
                $record = (new RelayRecordReader($fileStore))->read('pairing-pair-a');
                $record['expiresAt'] = $clock->time;
                $fileStore->atomicWrite('pairing-pair-a', json_encode($record));
            };
            try {
                $pairings->approve('pair-a', hash('sha256', 'secret'), 'process-a');
                self::fail('Expired pairing was approved.');
            } catch (\RuntimeException $error) {
                self::assertSame('Pairing unavailable.', $error->getMessage());
            }
            self::assertNull($fileStore->read('session-session-a'));
        } finally {
            RelayTestDirectory::remove($path);
        }
    }

    public function test_authorization_rechecks_pair_under_shared_lock(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $fileStore = new FileRelayStore($path);
        $store = new ObservedRelayStore($fileStore);
        try {
            $life = new RelayLifecycle($store, new MutableRelayClock);
            $life->createPairing('pair-b', 'session-b', hash('sha256', 'secret'), 'process-a');
            $life->approve('pair-b', hash('sha256', 'secret'), 'process-a');
            $store->beforeLock = function (string $key) use ($fileStore): void {
                if ($key === 'session-index') {
                    $fileStore->delete('pairing-pair-b');
                }
            };
            self::assertFalse($life->authorize('pair-b', 'process-a', 1_000)->ok);
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
