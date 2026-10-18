<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayRecordReader;
use Tests\TestCase;

class RelayStoreTest extends TestCase
{
    public function test_relay_lifetimes_are_configured_to_the_approved_values(): void
    {
        self::assertSame(300, config('local-theme-relay.pairing_seconds'));
        self::assertSame(1800, config('local-theme-relay.idle_seconds'));
        self::assertSame(28800, config('local-theme-relay.session_seconds'));
        self::assertSame(15, config('local-theme-relay.heartbeat_seconds'));
        self::assertSame(45, config('local-theme-relay.lease_seconds'));
    }

    public function test_private_store_atomically_round_trips_safe_records(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new FileRelayStore($path);
        try {
            self::assertSame(0700, fileperms($path) & 0777);
            $store->atomicWrite('session-index', '{"sessions":[]}');
            self::assertSame('{"sessions":[]}', $store->read('session-index'));
            $store->delete('session-index');
            self::assertNull($store->read('session-index'));
        } finally {
            RelayTestDirectory::remove($path);
        }
    }

    public function test_repository_path_is_rejected_as_store_root(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new FileRelayStore(base_path('storage'));
    }

    public function test_repository_descendant_is_explicitly_rejected_as_store_root(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new FileRelayStore(base_path('storage/app'));
    }

    public function test_repository_root_itself_is_rejected_as_store_root(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new FileRelayStore(base_path());
    }

    public function test_json_record_reader_rejects_malformed_data(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new FileRelayStore($path);
        try {
            $store->atomicWrite('pairing-x', '{broken');
            self::assertNull((new RelayRecordReader($store))->read('pairing-x'));
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
