<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayRoutesTest extends TestCase
{
    private string $csrf = '';

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-route-tests-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true,
            'local-theme-relay.origin' => 'http://localhost:8000', 'local-theme-relay.host' => 'localhost:8000',
            'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
    }

    public function test_bootstrap_requires_exact_origin_and_host_and_returns_safe_dto(): void
    {
        $body = $this->host()->withHeader('Origin', 'http://localhost:8000')
            ->get('/local-theme/relay/bootstrap')->assertOk()->json();
        self::assertSame(['version', 'origin', 'host', 'csrfToken', 'enabled'], array_keys($body));
        self::assertSame(1, $body['version']);
        self::assertSame('http://localhost:8000', $body['origin']);
        self::assertSame('localhost:8000', $body['host']);
        self::assertIsString($body['csrfToken']);
        self::assertTrue($body['enabled']);
        $this->withHeader('Origin', 'http://localhost:8000')
            ->get('http://evil.test/local-theme/relay/bootstrap')->assertForbidden();
    }

    public function test_pairing_creation_requires_tab_header_and_never_echoes_it(): void
    {
        $this->startBrowserSession();
        $this->relayPost('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('1', 64)])
            ->assertForbidden();
        $key = str_repeat('a', 64);
        $response = $this->withHeader('X-FTB-Tab-Key', $key)->relayPost('/local-theme/relay/pairings', [
            'version' => 1, 'pairingId' => str_repeat('2', 64),
        ]);
        $response->assertOk()->assertJsonMissing(['tabKey' => $key]);
        self::assertStringNotContainsString($key, (string) $response->getContent());
    }

    public function test_missing_origin_is_rejected_without_same_origin_fetch_metadata(): void
    {
        $this->startBrowserSession();
        $this->withoutHeader('Origin')->host()->withHeader('X-FTB-Tab-Key', str_repeat('b', 64))->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('3', 64)])
            ->assertForbidden();
    }

    public function test_wrong_origin_is_rejected_even_with_valid_host(): void
    {
        $this->startBrowserSession();
        $this->withHeader('X-FTB-Tab-Key', str_repeat('e', 64))->withHeader('Origin', 'http://evil.test')
            ->withHeader('X-CSRF-TOKEN', $this->csrf)->host()
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('5', 64)])
            ->assertForbidden();
    }

    private function relayPost(string $uri, array $body)
    {
        return $this->host()->withHeader('Origin', 'http://localhost:8000')
            ->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson($uri, $body);
    }

    private function host(): self
    {
        return $this->withHeader('Host', 'localhost:8000');
    }

    private function startBrowserSession(): void
    {
        $response = $this->host()->withHeader('Origin', 'http://localhost:8000')->get('/local-theme/relay/bootstrap');
        $response->assertOk();
        $this->csrf = (string) $response->json('csrfToken');
        $cookie = $response->getCookie((string) config('session.cookie'));
        self::assertNotNull($cookie);
        $this->withCookie((string) config('session.cookie'), $cookie->getValue());
    }
}
