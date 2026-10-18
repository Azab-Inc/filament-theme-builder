<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayOriginTest extends TestCase
{
    private string $csrf;

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-origin-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true,
            'local-theme-relay.origin' => 'http://localhost:8000', 'local-theme-relay.host' => 'localhost:8000',
            'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
        $response = $this->host()->withHeader('Origin', 'http://localhost:8000')->get('/local-theme/relay/bootstrap');
        $this->csrf = $response->json('csrfToken');
        $this->withCookie((string) config('session.cookie'), $response->getCookie((string) config('session.cookie'))->getValue());
    }

    public function test_exact_referer_and_host_are_accepted_without_origin(): void
    {
        $this->withoutHeader('Origin')->withHeader('Referer', 'http://localhost:8000/editor')
            ->withHeader('X-FTB-Tab-Key', str_repeat('a', 64))->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => 'referer-ok'])
            ->assertOk()->assertJsonPath('status', 'pending');
    }

    public function test_wrong_referer_is_rejected_without_origin(): void
    {
        $this->withoutHeader('Origin')->withHeader('Referer', 'http://evil.test/editor')
            ->withHeader('X-FTB-Tab-Key', str_repeat('b', 64))->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => 'referer-denied'])
            ->assertForbidden();
    }

    public function test_mismatched_host_is_rejected_even_with_allowed_origin(): void
    {
        $this->withHeader('Origin', 'http://localhost:8000')->withHeader('X-FTB-Tab-Key', str_repeat('c', 64))
            ->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('http://evil.test/local-theme/relay/pairings', ['version' => 1, 'pairingId' => 'host-denied'])
            ->assertForbidden();
    }

    private function host(): self
    {
        return $this->withHeader('Host', 'localhost:8000');
    }
}
