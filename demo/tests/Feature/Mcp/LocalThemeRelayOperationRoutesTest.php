<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayOperationRoutesTest extends TestCase
{
    private string $csrf = '';

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-op-route-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true, 'local-theme-relay.origin' => 'http://localhost:8000',
            'local-theme-relay.host' => 'localhost:8000', 'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
        $bootstrap = $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->get('/local-theme/relay/bootstrap');
        $bootstrap->assertOk();
        $this->csrf = $bootstrap->json('csrfToken');
        $this->withCookie((string) config('session.cookie'), $bootstrap->getCookie((string) config('session.cookie'))->getValue());
    }

    public function test_import_payload_receipt_preview_grant_and_result_routes(): void
    {
        [$pairingId, $sessionId] = $this->approvedPairing();
        $this->relayPost('/local-theme/relay/sessions/poll', ['version' => 1, 'sessionId' => 'another-session'])
            ->assertNotFound()->assertExactJson(['error' => 'pairing_required']);
        $payload = '{"version":4,"name":"Example"}';
        $digest = hash('sha256', $payload);
        $operation = $this->app->make(OperationStore::class)->create('import', $pairingId, 'mcp-process', $digest);
        self::assertTrue($this->app->make(OperationPayloadLifecycle::class)->publish(
            $operation, $pairingId, 'mcp-process', $payload, 'filament-theme.json', 'Example'));
        $this->relayPost('/local-theme/relay/sessions/poll', ['version' => 1, 'sessionId' => $sessionId])
            ->assertOk()->assertJsonPath('operations.0.operationId', $operation);
        $this->get('/local-theme/relay/operations/'.$operation.'/payload')->assertOk()
            ->assertJsonPath('payload', $payload)->assertJsonPath('digest', $digest);
        $this->relayPost('/local-theme/relay/operations/'.$operation.'/receipt', [
            'version' => 1, 'digest' => $digest, 'received' => true,
        ])->assertOk()->assertExactJson(['version' => 1, 'status' => 'received']);
        $this->relayPost('/local-theme/relay/operations/'.$operation.'/receipt', [
            'version' => 1, 'digest' => $digest, 'received' => true,
        ])->assertNotFound();
        $preview = ['sourceVersion' => 4, 'targetVersion' => 4, 'migrationPath' => [4], 'displayName' => 'Example',
            'summary' => ['One change'], 'payloadDigest' => $digest, 'byteLength' => strlen($payload)];
        $this->relayPost('/local-theme/relay/operations/'.$operation.'/preview', ['version' => 1, 'preview' => $preview])
            ->assertOk()->assertExactJson(['version' => 1, 'status' => 'pending', 'digest' => $digest]);
        $grant = $this->relayPost('/local-theme/relay/operations/'.$operation.'/authorize-apply', [
            'version' => 1, 'digest' => $digest, 'revision' => 2, 'displayName' => 'Example',
        ])->assertOk()->json('grantId');
        self::assertIsString($grant);
        $this->relayPost('/local-theme/relay/operations/'.$operation.'/result', [
            'version' => 1, 'grantId' => $grant, 'recordId' => str_repeat('f', 64), 'digest' => $digest,
        ])->assertOk()->assertExactJson(['version' => 1, 'status' => 'approved']);
        $this->get('/local-theme/relay/operations/'.$operation.'/result')->assertOk()
            ->assertExactJson(['version' => 1, 'status' => 'approved', 'recordId' => str_repeat('f', 64)]);
        $this->relayPost('/local-theme/relay/sessions/heartbeat', ['version' => 1, 'sessionId' => $sessionId])
            ->assertOk()->assertJsonPath('status', 'alive');
        $this->relayPost('/local-theme/relay/sessions/disconnect', ['version' => 1, 'sessionId' => $sessionId])
            ->assertOk()->assertExactJson(['version' => 1, 'status' => 'disconnected']);
    }

    /** @return array{string, string} */
    private function approvedPairing(): array
    {
        $pairingId = str_repeat('b', 64);
        $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => $pairingId])->assertOk();
        $pair = json_decode($this->app->make(RelayStore::class)->read('pairing-'.$pairingId), true);
        $this->app->make(RelayLifecycle::class)->bindPairing($pairingId, 'mcp-process', $pair['sessionId']);
        self::assertTrue($this->app->make(RelayLifecycle::class)->bindPairing($pairingId, 'mcp-process', $pair['sessionId']));
        self::assertFalse($this->app->make(RelayLifecycle::class)->bindPairing($pairingId, 'other-process', $pair['sessionId']));
        $claim = $this->relay()->get('/local-theme/relay/pairings/'.$pairingId)->assertOk()->json('claimId');
        $response = $this->relayPost('/local-theme/relay/pairings/'.$pairingId.'/approve', ['version' => 1, 'claimId' => $claim]);
        $response->assertOk();
        $this->relayPost('/local-theme/relay/pairings/'.$pairingId.'/approve', ['version' => 1, 'claimId' => $claim])
            ->assertNotFound()->assertExactJson(['error' => 'pairing_required']);

        return [$pairingId, $response->json('sessionId')];
    }

    private function relayPost(string $uri, array $body)
    {
        return $this->relay()->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson($uri, $body);
    }

    private function relay(): self
    {
        return $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->withHeader('X-FTB-Tab-Key', str_repeat('a', 64));
    }
}
