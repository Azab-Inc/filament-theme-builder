<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\LockHandle;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

final class LocalThemeRelayDisclosureTest extends TestCase
{
    public function test_storage_exception_is_replaced_with_a_generic_response(): void
    {
        config(['app.env' => 'testing', 'local-theme-relay.enabled' => true,
            'local-theme-relay.origin' => 'http://localhost:8000', 'local-theme-relay.host' => 'localhost:8000']);
        $this->withCredentials();
        $bootstrap = $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->get('/local-theme/relay/bootstrap');
        $this->withCookie((string) config('session.cookie'), $bootstrap->getCookie((string) config('session.cookie'))->getValue());
        $this->app->instance(RelayStore::class, new FailingRelayStore);
        $response = $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'http://localhost:8000')
            ->withHeader('X-FTB-Tab-Key', str_repeat('a', 64))->get('/local-theme/relay/pairings/pair-1');
        $response->assertStatus(503)->assertExactJson(['error' => 'relay_unavailable']);
        self::assertStringNotContainsString('private payload', (string) $response->getContent());
    }
}

final class FailingRelayStore implements RelayStore
{
    public function read(string $key): ?string
    {
        throw new \RuntimeException('private payload secret');
    }

    public function atomicWrite(string $key, string $value): void {}

    public function delete(string $key): void {}

    public function keys(string $prefix): array
    {
        return [];
    }

    public function lock(string $key): LockHandle
    {
        return new class implements LockHandle
        {
            public function release(): void {}
        };
    }
}
