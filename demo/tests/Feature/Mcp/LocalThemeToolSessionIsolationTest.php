<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeDisconnect;
use App\Mcp\Tools\LocalThemeExport;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemeList;
use App\Mcp\Tools\LocalThemeOperationStatus;
use App\Mcp\Tools\LocalThemePair;
use Laravel\Mcp\Server\Testing\TestResponse;

final class LocalThemeToolSessionIsolationTest extends LocalThemeToolTestCase
{
    public function test_tools_deny_a_pairing_record_rebound_to_a_different_browser_session(): void
    {
        foreach (['pair-a' => 'session-a', 'pair-b' => 'session-b'] as $pair => $session) {
            $this->approveBrowserPair($pair, $session);
            LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $pair]);
        }
        LocalThemeServer::tool(LocalThemeList::class, ['pairing_id' => 'pair-a']);
        LocalThemeServer::tool(LocalThemeExport::class, ['pairing_id' => 'pair-a', 'theme_id' => 'theme-a']);
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-a', 'raw_json' => '{"schemaVersion":4}',
            'filename' => 'filament-theme.json', 'proposed_name' => 'Theme A']);
        $ids = $this->operationIdsByKind();
        $store = app(RelayStore::class);
        $pair = json_decode((string) $store->read('pairing-pair-a'), true);
        $pair['sessionId'] = 'session-b';
        $store->atomicWrite('pairing-pair-a', json_encode($pair));

        foreach ([
            LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-a']),
            LocalThemeServer::tool(LocalThemeList::class, ['pairing_id' => 'pair-a']),
            LocalThemeServer::tool(LocalThemeExport::class, ['pairing_id' => 'pair-a', 'theme_id' => 'theme-a']),
            LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-a', 'raw_json' => '{}',
                'filename' => 'filament-theme.json', 'proposed_name' => 'Theme A']),
            LocalThemeServer::tool(LocalThemeDisconnect::class, ['pairing_id' => 'pair-a']),
            LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $ids['list']]),
            LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $ids['export']]),
            LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $ids['import']]),
        ] as $response) {
            $this->assertDenied($response);
        }
        self::assertSame('approved', json_decode((string) $store->read('session-session-a'), true)['status']);
    }

    /** @return array<string, string> */
    private function operationIdsByKind(): array
    {
        $ids = [];
        foreach (app(RelayStore::class)->keys('operation-') as $key) {
            $record = json_decode((string) app(RelayStore::class)->read($key), true);
            $ids[$record['kind']] = $record['operationId'];
        }

        return $ids;
    }

    private function assertDenied(TestResponse $response): void
    {
        $response->assertStructuredContent(['error' => 'pairing_required']);
    }
}
