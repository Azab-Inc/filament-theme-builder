<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayRecordReader;
use Symfony\Component\Process\Process;
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

    public function test_default_relay_directory_path_is_preserved(): void
    {
        self::assertSame(sys_get_temp_dir().'/ftb-local-theme-relay', config('local-theme-relay.storage_path'));
    }

    public function test_supported_php_runtime_exposes_effective_uid(): void
    {
        self::assertTrue(function_exists('posix_geteuid'));
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

    public function test_private_store_accepts_directory_owned_by_effective_runtime_user(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));

        try {
            mkdir($path, 0700);

            if (function_exists('posix_geteuid') && posix_geteuid() !== getmyuid()) {
                self::assertNotSame(getmyuid(), fileowner($path));
            }

            new FileRelayStore($path);

            self::assertSame(0700, fileperms($path) & 0777);
        } finally {
            RelayTestDirectory::remove($path);
        }
    }

    public function test_private_directory_fails_closed_when_posix_effective_uid_is_unavailable(): void
    {
        $code = <<<'PHP'
function base_path(string $path = ''): string { return '/var/www/html'.($path === '' ? '' : '/'.$path); }
require $argv[1];
if (function_exists('posix_geteuid')) { exit(3); }
$path = sys_get_temp_dir().'/ftb-no-posix-'.bin2hex(random_bytes(8));
mkdir($path, 0700);
try {
    new App\Mcp\ThemeRelay\PrivateRelayDirectory($path);
    echo 'accepted';
    exit(1);
} catch (InvalidArgumentException) {
    echo 'rejected';
} finally {
    rmdir($path);
}
PHP;
        $process = new Process([PHP_BINARY, '-d', 'disable_functions=posix_geteuid', '-r', $code,
            base_path('app/Mcp/ThemeRelay/PrivateRelayDirectory.php')], base_path());
        $process->run();

        self::assertSame(0, $process->getExitCode(), $process->getErrorOutput());
        self::assertSame('rejected', $process->getOutput());
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
