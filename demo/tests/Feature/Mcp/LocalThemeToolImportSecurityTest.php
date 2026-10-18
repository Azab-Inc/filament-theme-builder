<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\RelayLimits;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemePair;

final class LocalThemeToolImportSecurityTest extends LocalThemeToolTestCase
{
    public function test_confirmation_argument_is_rejected_without_creating_an_operation(): void
    {
        $this->approved('pair-confirm', 'session-confirm');
        foreach (['confirmed' => true, 'force' => true, 'apply' => true, 'skip_preview' => true,
            'confirmation_token' => str_repeat('a', 64)] as $field => $value) {
            LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-confirm',
                'raw_json' => '{"schemaVersion":4}', 'filename' => 'filament-theme.json',
                'proposed_name' => 'Theme', $field => $value])->assertStructuredContent(['error' => 'pairing_required']);
        }

        self::assertSame([], app(RelayStore::class)->keys('operation-'));
    }

    public function test_oversized_import_is_rejected_before_storage(): void
    {
        $this->approved('pair-large', 'session-large');
        $raw = str_repeat('x', RelayLimits::MAX_THEME_BYTES + 1);
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-large',
            'raw_json' => $raw, 'filename' => 'filament-theme.json', 'proposed_name' => 'Theme'])
            ->assertStructuredContent(['error' => 'pairing_required'])->assertDontSee($raw);

        self::assertSame([], app(RelayStore::class)->keys('operation-'));
    }

    private function approved(string $id, string $session): void
    {
        $this->approveBrowserPair($id, $session);
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $id])
            ->assertStructuredContent(['pairing_id' => $id, 'status' => 'approved', 'expires_at' => $this->pairExpiry($id)]);
    }
}
