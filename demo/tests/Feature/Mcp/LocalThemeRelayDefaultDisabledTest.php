<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use Tests\TestCase;

final class LocalThemeRelayDefaultDisabledTest extends TestCase
{
    public function test_default_configuration_denies_bootstrap_and_browser_routes(): void
    {
        self::assertFalse(config('local-theme-relay.enabled'));
        self::assertFalse(app()->environment('production'));
        $this->get('/local-theme/relay/bootstrap')->assertNotFound()
            ->assertExactJson(['error' => 'relay_unavailable']);
        $this->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => 'pair-default'])
            ->assertNotFound()->assertExactJson(['error' => 'relay_unavailable']);
    }
}
