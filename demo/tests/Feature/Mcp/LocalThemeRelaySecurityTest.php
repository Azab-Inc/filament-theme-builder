<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelaySecurityTest extends TestCase
{
    private string $csrf;

    private string $key = '';

    protected function setUp(): void
    {
        parent::setUp();
        $path = sys_get_temp_dir().'/ftb-security-'.bin2hex(random_bytes(8));
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true, 'local-theme-relay.origin' => 'http://localhost:8000',
            'local-theme-relay.host' => 'localhost:8000', 'local-theme-relay.storage_path' => $path]);
        $this->app->instance(RelayStore::class, new FileRelayStore($path));
        $this->withCredentials();
        $this->key = str_repeat('a', 64);
    }

    public function test_mutation_rejects_missing_session_cookie_and_bad_csrf(): void
    {
        $this->withHeader('Origin', 'http://localhost:8000')->withHeader('X-FTB-Tab-Key', $this->key)
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('1', 64)])
            ->assertForbidden();
        $this->bootstrap();
        $this->relay()->withHeader('X-CSRF-TOKEN', 'wrong-token')->postJson('/local-theme/relay/pairings', [
            'version' => 1, 'pairingId' => str_repeat('2', 64),
        ])->assertForbidden();
    }

    public function test_secret_body_unknown_fields_and_oversized_tab_header_are_rejected(): void
    {
        $this->bootstrap();
        $this->relay()->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson('/local-theme/relay/pairings', [
            'version' => 1, 'pairingId' => str_repeat('3', 64), 'tabKey' => $this->key,
        ])->assertUnprocessable();
        $this->relay()->withHeader('X-FTB-Tab-Key', str_repeat('a', 129))->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('4', 64)])
            ->assertForbidden();
    }

    public function test_json_body_limit_and_disabled_relay_fail_safely(): void
    {
        $this->bootstrap();
        config(['local-theme-relay.max_envelope_bytes' => 24]);
        $this->relay()->withHeader('X-CSRF-TOKEN', $this->csrf)->postJson('/local-theme/relay/pairings', [
            'version' => 1, 'pairingId' => str_repeat('5', 64),
        ])->assertStatus(413)->assertExactJson(['error' => 'relay_request_too_large']);
        config(['local-theme-relay.enabled' => false]);
        $this->relay()->get('/local-theme/relay/bootstrap')->assertNotFound()->assertExactJson(['error' => 'relay_unavailable']);
    }

    public function test_originless_same_origin_fetch_metadata_is_accepted_with_exact_host(): void
    {
        $this->bootstrap();
        $this->withoutHeader('Origin')->withHeader('Host', 'localhost:8000')
            ->withHeader('Sec-Fetch-Site', 'same-origin')->withHeader('X-FTB-Tab-Key', $this->key)
            ->withHeader('X-CSRF-TOKEN', $this->csrf)
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('6', 64)])
            ->assertOk()->assertJsonPath('status', 'pending');
    }

    public function test_enabled_relay_remains_unavailable_in_production(): void
    {
        $this->app->detectEnvironment(static fn (): string => 'production');
        $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->get('/local-theme/relay/bootstrap')->assertNotFound()
            ->assertExactJson(['error' => 'relay_unavailable']);
    }

    private function bootstrap(): void
    {
        $response = $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->get('/local-theme/relay/bootstrap')->assertOk();
        $this->csrf = $response->json('csrfToken');
        $this->withCookie((string) config('session.cookie'), $response->getCookie((string) config('session.cookie'))->getValue());
    }

    private function relay(): self
    {
        return $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->withHeader('X-FTB-Tab-Key', $this->key);
    }
}
