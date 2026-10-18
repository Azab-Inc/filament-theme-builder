<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayBindingTest extends TestCase
{
    private string $csrf;

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-binding-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true, 'local-theme-relay.origin' => 'http://localhost:8000',
            'local-theme-relay.host' => 'localhost:8000', 'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
        $bootstrap = $this->host()->withHeader('Origin', 'http://localhost:8000')->get('/local-theme/relay/bootstrap');
        $this->csrf = $bootstrap->json('csrfToken');
        $this->withCookie((string) config('session.cookie'), $bootstrap->getCookie((string) config('session.cookie'))->getValue());
    }

    public function test_pending_pairing_requires_one_time_browser_approval_before_process_binding(): void
    {
        $id = 'bind-check';
        $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => 'process-denied', 'processId' => 'browser'])
            ->assertUnprocessable();
        $created = $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => $id])->assertOk();
        self::assertSame(['version', 'pairingId', 'status', 'expiresAt'], array_keys($created->json()));
        $pair = json_decode($this->app->make(RelayStore::class)->read('pairing-'.$id), true);
        $lifecycle = $this->app->make(RelayLifecycle::class);
        self::assertFalse($lifecycle->bindPairing($id, 'trusted-process', $pair['sessionId']));
        self::assertFalse($lifecycle->bindPairing('unknown-pair', 'trusted-process', $pair['sessionId']));
        $pairingStatus = $this->relay()->get('/local-theme/relay/pairings/'.$id)->assertOk()->json();
        self::assertSame(['version', 'pairingId', 'status', 'expiresAt', 'claimId'], array_keys($pairingStatus));
        $claim = $pairingStatus['claimId'];
        self::assertMatchesRegularExpression('/\A[a-f0-9]{64}\z/', $claim);
        $this->relayPost('/local-theme/relay/pairings/'.$id.'/approve', ['version' => 1, 'claimId' => str_repeat('0', 64)])
            ->assertNotFound()->assertExactJson(['error' => 'pairing_required']);
        $this->relay()->withHeader('X-FTB-Tab-Key', str_repeat('b', 64))
            ->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('/local-theme/relay/pairings/'.$id.'/approve', ['version' => 1, 'claimId' => $claim])
            ->assertNotFound()->assertExactJson(['error' => 'pairing_required']);
        $approved = $this->relayPost('/local-theme/relay/pairings/'.$id.'/approve', ['version' => 1, 'claimId' => $claim]);
        $approved->assertOk()->assertExactJson([
            'version' => 1, 'status' => 'approved', 'sessionId' => $pair['sessionId'],
            'sessionExpiresAt' => $approved->json('sessionExpiresAt'),
        ]);
        self::assertTrue($lifecycle->bindPairing($id, 'trusted-process', $pair['sessionId']));
        self::assertTrue($lifecycle->bindPairing($id, 'trusted-process', $pair['sessionId']));
        self::assertFalse($lifecycle->bindPairing($id, 'other-process', $pair['sessionId']));
        $sessionId = (string) $approved->json('sessionId');
        $this->relayPost('/local-theme/relay/sessions/poll', ['version' => 1, 'sessionId' => 'another-session'])
            ->assertNotFound()->assertExactJson(['error' => 'pairing_required']);
        $this->relayPost('/local-theme/relay/sessions/poll', ['version' => 1, 'sessionId' => $sessionId])
            ->assertOk()->assertExactJson(['version' => 1, 'operations' => []]);
        $heartbeat = $this->relayPost('/local-theme/relay/sessions/heartbeat', ['version' => 1, 'sessionId' => $sessionId])->assertOk();
        self::assertSame(['version', 'status', 'leaseExpiresAt'], array_keys($heartbeat->json()));
        self::assertSame('alive', $heartbeat->json('status'));
        self::assertIsInt($heartbeat->json('leaseExpiresAt'));
        $this->relayPost('/local-theme/relay/sessions/disconnect', ['version' => 1, 'sessionId' => $sessionId])
            ->assertOk()->assertExactJson(['version' => 1, 'status' => 'disconnected']);
        $this->relayPost('/local-theme/relay/pairings/'.$id.'/approve', ['version' => 1, 'claimId' => $claim])
            ->assertNotFound()->assertExactJson(['error' => 'pairing_required']);
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
