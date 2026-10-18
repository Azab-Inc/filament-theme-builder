<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayRecordReader;
use App\Mcp\ThemeRelay\SessionCleanup;
use Tests\TestCase;

class RelayCleanupTest extends TestCase
{
    public function test_crash_stale_session_is_removed_after_lease_expiry(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new FileRelayStore($path);
        $clock = new MutableRelayClock;
        try {
            $life = new RelayLifecycle($store, $clock);
            $life->createPairing('pair-a', 'session-a', hash('sha256', 'secret'), 'process-a');
            $life->approve('pair-a', hash('sha256', 'secret'), 'process-a');
            $clock->time += 45;
            (new SessionCleanup($store, $clock))->removeStale();
            self::assertNull($store->read('session-session-a'));
            self::assertNull($store->read('pairing-pair-a'));
            self::assertSame([], (new RelayRecordReader($store))->read('session-index')['sessions']);
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
