<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayResultRoutesTest extends TestCase
{
    private string $csrf;

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-result-route-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true, 'local-theme-relay.origin' => 'http://localhost:8000',
            'local-theme-relay.host' => 'localhost:8000', 'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
        $bootstrap = $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->get('/local-theme/relay/bootstrap');
        $this->csrf = (string) $bootstrap->json('csrfToken');
        $this->withCookie((string) config('session.cookie'), $bootstrap->getCookie((string) config('session.cookie'))->getValue());
    }

    public function test_list_and_export_results_use_exact_dtos_and_status_never_leaks_export_json(): void
    {
        $pairingId = $this->approvedPairing();
        $themes = [['id' => 'theme-1', 'name' => 'One', 'updatedAt' => 123, 'active' => true]];
        $listId = $this->app->make(OperationStore::class)->create('list', $pairingId, 'mcp-process', hash('sha256', 'list'));
        $this->relayPost('/local-theme/relay/operations/'.$listId.'/result', ['version' => 1, 'themes' => $themes])
            ->assertOk()->assertExactJson(['version' => 1, 'status' => 'approved']);
        $json = '{"version":4,"theme":"private"}';
        $exportId = $this->app->make(OperationStore::class)->create('export', $pairingId, 'mcp-process', hash('sha256', 'export'));
        $this->relayPost('/local-theme/relay/operations/'.$exportId.'/result', [
            'version' => 1, 'filename' => 'filament-theme.json', 'schemaVersion' => 4, 'json' => $json,
        ])->assertOk()->assertExactJson(['version' => 1, 'status' => 'approved']);
        $response = $this->relayGet('/local-theme/relay/operations/'.$exportId.'/result')->assertOk()
            ->assertExactJson(['version' => 1, 'status' => 'approved']);
        self::assertStringNotContainsString($json, (string) $response->getContent());
        $wrongProcess = $this->app->make(OperationStore::class)->create('list', $pairingId, 'other-process', hash('sha256', 'other'));
        $this->relayGet('/local-theme/relay/operations/'.$wrongProcess.'/result')->assertNotFound()
            ->assertExactJson(['error' => 'operation_unavailable']);
        $otherPair = $this->app->make(OperationStore::class)->create('list', 'another-pair', 'mcp-process', hash('sha256', 'another'));
        $this->relayGet('/local-theme/relay/operations/'.$otherPair.'/result')->assertNotFound()
            ->assertExactJson(['error' => 'operation_unavailable']);
    }

    public function test_expired_operation_status_uses_only_the_defined_status_dto(): void
    {
        $pairingId = $this->approvedPairing();
        $payload = '{"theme":"private"}';
        $id = $this->app->make(OperationStore::class)->create('import', $pairingId, 'mcp-process', hash('sha256', $payload));
        $store = $this->app->make(RelayStore::class);
        self::assertTrue($this->app->make(OperationPayloadLifecycle::class)->publish(
            $id, $pairingId, 'mcp-process', $payload, 'filament-theme.json', 'Expired'));
        $record = json_decode($store->read('operation-'.$id), true);
        $record['expiresAt'] = time() - 1;
        $store->atomicWrite('operation-'.$id, json_encode($record));
        $this->relayGet('/local-theme/relay/operations/'.$id.'/result')->assertOk()
            ->assertExactJson(['version' => 1, 'status' => 'expired']);
        self::assertNull($store->read('payload-'.$id));
        self::assertSame('expired', json_decode($store->read('operation-'.$id), true)['status']);
    }

    private function approvedPairing(): string
    {
        $pairingId = str_repeat('b', 64);
        $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => $pairingId])->assertOk();
        $pair = json_decode($this->app->make(RelayStore::class)->read('pairing-'.$pairingId), true);
        $this->app->make(RelayLifecycle::class)->bindPairing($pairingId, 'mcp-process', $pair['sessionId']);
        $claim = $this->relayGet('/local-theme/relay/pairings/'.$pairingId)->json('claimId');
        $this->relayPost('/local-theme/relay/pairings/'.$pairingId.'/approve', ['version' => 1, 'claimId' => $claim])->assertOk();

        return $pairingId;
    }

    private function relayPost(string $uri, array $body)
    {
        return $this->relay()->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson($uri, $body);
    }

    private function relayGet(string $uri)
    {
        return $this->relay()->get($uri);
    }

    private function relay(): self
    {
        return $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->withHeader('X-FTB-Tab-Key', str_repeat('a', 64));
    }
}
