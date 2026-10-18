<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemePair;
use Illuminate\Testing\TestResponse;

abstract class LocalThemeRelayBrowserTestCase extends LocalThemeToolTestCase
{
    private string $csrf;

    private string $tabKey;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true,
            'local-theme-relay.origin' => 'http://localhost:8000', 'local-theme-relay.host' => 'localhost:8000']);
        $this->tabKey = str_repeat('a', 64);
        $this->withCredentials();
        $bootstrap = $this->relay()->get('/local-theme/relay/bootstrap')->assertOk();
        $this->csrf = (string) $bootstrap->json('csrfToken');
        $cookie = $bootstrap->getCookie((string) config('session.cookie'));
        $this->withCookie((string) config('session.cookie'), $cookie->getValue());
    }

    protected function createBrowserPair(string $pairingId): void
    {
        $approved = $this->approveBrowserPairForProcess($pairingId);
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $pairingId])
            ->assertStructuredContent(['pairing_id' => $pairingId, 'status' => 'approved', 'expires_at' => $this->pairExpiry($pairingId)]);
        $session = json_decode((string) app(RelayStore::class)->read('session-'.$approved->json('sessionId')), true);
        self::assertSame($pairingId, $session['pairingId']);
    }

    protected function approveBrowserPairForProcess(string $pairingId): TestResponse
    {
        $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => $pairingId])->assertOk();
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $pairingId])
            ->assertStructuredContent(fn ($json) => $json->where('status', 'pending')->has('expires_at')->etc());
        $claim = $this->relay()->get('/local-theme/relay/pairings/'.$pairingId)->assertOk()->json('claimId');

        return $this->relayPost('/local-theme/relay/pairings/'.$pairingId.'/approve',
            ['version' => 1, 'claimId' => $claim])->assertOk();
    }

    protected function relayPost(string $path, array $body): TestResponse
    {
        return $this->relay()->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson($path, $body);
    }

    protected function relay(): self
    {
        return $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->withHeader('X-FTB-Tab-Key', $this->tabKey);
    }
}
