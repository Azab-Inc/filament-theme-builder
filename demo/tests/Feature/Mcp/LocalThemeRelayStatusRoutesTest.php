<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayStatusRoutesTest extends TestCase
{
    private string $csrf;

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-status-route-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true, 'local-theme-relay.origin' => 'http://localhost:8000',
            'local-theme-relay.host' => 'localhost:8000', 'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
        $bootstrap = $this->host()->withHeader('Origin', 'http://localhost:8000')->get('/local-theme/relay/bootstrap');
        $this->csrf = $bootstrap->json('csrfToken');
        $this->withCookie((string) config('session.cookie'), $bootstrap->getCookie((string) config('session.cookie'))->getValue());
    }

    public function test_pending_and_rejected_result_statuses_have_the_complete_dto(): void
    {
        $pairingId = $this->approvedPairing();
        $operations = $this->app->make(OperationStore::class);
        $pending = $operations->create('list', $pairingId, 'mcp-process', hash('sha256', 'pending'));
        $this->relayGet('/local-theme/relay/operations/'.$pending.'/result')->assertOk()->assertExactJson([
            'version' => 1, 'operationId' => $pending, 'kind' => 'list', 'status' => 'pending',
        ]);
        $rejected = $operations->create('list', $pairingId, 'mcp-process', hash('sha256', 'rejected'));
        $this->relayPost('/local-theme/relay/operations/'.$rejected.'/result', [
            'version' => 1, 'errorCategory' => 'operation_failed',
        ])->assertOk()->assertExactJson(['version' => 1, 'status' => 'rejected']);
        $this->relayGet('/local-theme/relay/operations/'.$rejected.'/result')->assertOk()->assertExactJson([
            'version' => 1, 'operationId' => $rejected, 'kind' => 'list', 'status' => 'rejected',
            'errorCategory' => 'operation_failed',
        ]);
    }

    private function approvedPairing(): string
    {
        $id = 'status-pair';
        $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => $id])->assertOk();
        $pair = json_decode($this->app->make(RelayStore::class)->read('pairing-'.$id), true);
        $claim = $this->relayGet('/local-theme/relay/pairings/'.$id)->assertOk()->json('claimId');
        $this->relayPost('/local-theme/relay/pairings/'.$id.'/approve', ['version' => 1, 'claimId' => $claim])->assertOk();
        $this->app->make(RelayLifecycle::class)->bindPairing($id, 'mcp-process', $pair['sessionId']);

        return $id;
    }

    private function relayGet(string $uri)
    {
        return $this->relay()->get($uri);
    }

    private function relayPost(string $uri, array $body)
    {
        return $this->relay()->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson($uri, $body);
    }

    private function relay(): self
    {
        return $this->host()->withHeader('Origin', 'http://localhost:8000')->withHeader('X-FTB-Tab-Key', str_repeat('a', 64));
    }

    private function host(): self
    {
        return $this->withHeader('Host', 'localhost:8000');
    }
}
