<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\ProcessScope;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeDisconnect;
use App\Mcp\Tools\LocalThemeExport;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemeList;
use App\Mcp\Tools\LocalThemeOperationStatus;
use App\Mcp\Tools\LocalThemePair;
use Laravel\Mcp\Server\Testing\TestResponse;

final class LocalThemeToolsTest extends LocalThemeToolTestCase
{
    public function test_tools_deny_every_pair_and_operation_owned_by_another_process(): void
    {
        $pairingId = 'foreign-pair';
        $this->approveBrowserPair($pairingId, 'foreign-session');
        $this->app->instance(ProcessScope::class, new ProcessScope('foreign-process'));
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $pairingId])
            ->assertStructuredContent(['pairing_id' => $pairingId, 'status' => 'approved', 'expires_at' => $this->pairExpiry($pairingId)]);
        LocalThemeServer::tool(LocalThemeList::class, ['pairing_id' => $pairingId]);
        LocalThemeServer::tool(LocalThemeExport::class, ['pairing_id' => $pairingId, 'theme_id' => 'theme-1']);
        $payload = '{"schemaVersion":4,"customCss":".private{}"}';
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => $pairingId, 'raw_json' => $payload,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Private']);
        $operationIds = $this->operationIdsByKind();

        $this->app->instance(ProcessScope::class, new ProcessScope('local-theme-test-process'));
        $this->assertPairingRequired(LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $pairingId]));
        $this->assertPairingRequired(LocalThemeServer::tool(LocalThemeList::class, ['pairing_id' => $pairingId]));
        $this->assertPairingRequired(LocalThemeServer::tool(LocalThemeExport::class,
            ['pairing_id' => $pairingId, 'theme_id' => 'theme-1']));
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => $pairingId, 'raw_json' => $payload,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Private'])
            ->assertStructuredContent(['error' => 'pairing_required'])->assertDontSee($payload);
        $this->assertPairingRequired(LocalThemeServer::tool(LocalThemeDisconnect::class, ['pairing_id' => $pairingId]));
        foreach ($operationIds as $id) {
            $this->assertPairingRequired(LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $id]));
        }
        $this->assertPairingRequired(LocalThemeServer::tool(LocalThemeImportStatus::class,
            ['operation_id' => $operationIds['import']]));

        self::assertSame('approved', json_decode((string) app(RelayStore::class)->read('session-foreign-session'), true)['status']);
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

    private function assertPairingRequired(TestResponse $response): void
    {
        $response->assertStructuredContent(['error' => 'pairing_required']);
    }
}
