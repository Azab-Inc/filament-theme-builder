<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayRecordReader;
use Tests\TestCase;

class RelayLifecycleTest extends TestCase
{
    private FileRelayStore $store;

    private string $path;

    protected function setUp(): void
    {
        parent::setUp();
        $this->path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $this->store = new FileRelayStore($this->path);
    }

    protected function tearDown(): void
    {
        RelayTestDirectory::remove($this->path);
        parent::tearDown();
    }

    public function test_authorized_operation_resets_idle_but_heartbeat_only_renews_lease(): void
    {
        $clock = new MutableRelayClock;
        $life = new RelayLifecycle($this->store, $clock);
        $life->createPairing('pair-a', 'session-a', hash('sha256', 'secret'), 'process-a');
        $life->approve('pair-a', hash('sha256', 'secret'), 'process-a');
        self::assertFalse($life->authorize('pair-a', 'process-b', $clock->time)->ok);
        for ($clock->time = 1_015; $clock->time < 2_800; $clock->time += 15) {
            $life->heartbeat('pair-a', 'process-a');
        }
        self::assertFalse($life->authorize('pair-a', 'process-a', $clock->time)->ok);
    }

    public function test_pairing_expiry_and_wrong_secret_fail_closed(): void
    {
        $clock = new MutableRelayClock;
        $life = new RelayLifecycle($this->store, $clock);
        $hash = hash('sha256', 'secret');
        $life->createPairing('pair-b', 'session-b', $hash, 'process-a');
        self::assertStringContainsString($hash, $this->store->read('pairing-pair-b'));
        self::assertStringNotContainsString('secret', $this->store->read('pairing-pair-b'));
        try {
            $life->approve('pair-b', hash('sha256', 'wrong'), 'process-a');
            self::fail('Wrong secret approved.');
        } catch (\RuntimeException) {
            self::assertTrue(true);
        }
        $clock->time += 300;
        try {
            $life->approve('pair-b', hash('sha256', 'secret'), 'process-a');
            self::fail('Expired pairing approved.');
        } catch (\RuntimeException) {
            self::assertTrue(true);
        }
    }

    public function test_session_cannot_outlive_eight_hour_absolute_deadline(): void
    {
        $clock = new MutableRelayClock;
        $life = new RelayLifecycle($this->store, $clock);
        $life->createPairing('pair-c', 'session-c', hash('sha256', 'secret'), 'process-a');
        $life->approve('pair-c', hash('sha256', 'secret'), 'process-a');
        $session = (new RelayRecordReader($this->store))->read('session-session-c');
        $session['createdAt'] = $clock->time - 28_800;
        $this->store->atomicWrite('session-session-c', json_encode($session));
        self::assertFalse($life->authorize('pair-c', 'process-a', $clock->time)->ok);
    }
}
