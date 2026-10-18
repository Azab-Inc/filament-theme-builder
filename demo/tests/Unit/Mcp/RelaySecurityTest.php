<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class RelaySecurityTest extends TestCase
{
    public function test_credentials_and_raw_payload_never_appear_in_errors_logs_or_persisted_metadata(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new FileRelayStore($path);
        Log::spy();
        try {
            $clock = new MutableRelayClock;
            $life = new RelayLifecycle($store, $clock);
            $secret = 'tab-secret-plaintext';
            $life->createPairing('pair-safe', 'session-safe', hash('sha256', $secret), 'process-safe');
            try {
                $life->approve('pair-safe', hash('sha256', 'wrong'), 'process-safe');
                self::fail('Invalid credential unexpectedly approved.');
            } catch (\RuntimeException $error) {
                self::assertSame('Pairing unavailable.', $error->getMessage());
                self::assertStringNotContainsString($secret, $error->getMessage());
            }
            $payload = 'raw-theme-json-secret';
            $id = (new OperationStore($store, $clock))->create('import', 'pair-safe', 'process-safe', hash('sha256', $payload));
            $store->atomicWrite('payload-'.$id, $payload);
            self::assertStringNotContainsString($secret, $store->read('operation-'.$id));
            self::assertStringNotContainsString($payload, $store->read('operation-'.$id));
            Log::shouldNotHaveReceived('error');
            Log::shouldNotHaveReceived('warning');
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
