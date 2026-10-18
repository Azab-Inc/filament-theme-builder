<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\OperationResultStore;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayRecordReader;
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
            $metadata = $store->read('operation-'.$id);
            $result = json_encode($life->authorize('pair-safe', 'wrong-process', $clock->time));
            $serializedOperation = json_encode([
                'operationId' => $id,
                'record' => (new RelayRecordReader($store))->read('operation-'.$id),
            ]);
            self::assertStringNotContainsString($secret, $metadata);
            self::assertStringNotContainsString($payload, $metadata);
            self::assertStringNotContainsString($secret, $result);
            self::assertStringNotContainsString($payload, $result);
            self::assertStringNotContainsString($secret, $serializedOperation);
            self::assertStringNotContainsString($payload, $serializedOperation);
            self::assertFalse((new OperationResultStore($store, $clock))->publish(
                $id, 'pair-safe', 'process-safe', hash('sha256', $payload), $payload));
            try {
                $store->atomicWrite('payload-oversized', $payload.str_repeat('x', 1_048_576));
                self::fail('Oversized payload was accepted.');
            } catch (\InvalidArgumentException $error) {
                self::assertStringNotContainsString($payload, $error->getMessage());
            }
            self::assertNotNull((new RelayRecordReader($store))->read('operation-'.$id));
            Log::shouldNotHaveReceived('error');
            Log::shouldNotHaveReceived('warning');
            Log::shouldNotHaveReceived('debug');
            Log::shouldNotHaveReceived('info');
            Log::shouldNotHaveReceived('notice');
            Log::shouldNotHaveReceived('critical');
            Log::shouldNotHaveReceived('alert');
            Log::shouldNotHaveReceived('emergency');
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
