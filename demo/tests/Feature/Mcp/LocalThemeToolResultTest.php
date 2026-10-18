<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\OperationResultLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeExport;
use App\Mcp\Tools\LocalThemeOperationStatus;
use App\Mcp\Tools\LocalThemePair;

final class LocalThemeToolResultTest extends LocalThemeToolTestCase
{
    public function test_export_result_is_consumed_once_by_its_authorized_process(): void
    {
        $this->approveBrowserPair('pair-export', 'session-export');
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-export'])
            ->assertStructuredContent(['pairing_id' => 'pair-export', 'status' => 'approved', 'expires_at' => $this->pairExpiry('pair-export')]);
        LocalThemeServer::tool(LocalThemeExport::class, ['pairing_id' => 'pair-export', 'theme_id' => 'theme-local'])
            ->assertStructuredContent(fn ($json) => $json->where('kind', 'export')->where('status', 'pending')->has('operation_id')->etc());
        $operationId = substr(app(RelayStore::class)->keys('operation-')[0], strlen('operation-'));
        $session = json_decode((string) app(RelayStore::class)->read('session-session-export'), true);
        $json = '{"schemaVersion":4}';
        $result = ['version' => 1, 'filename' => 'filament-theme.json', 'schemaVersion' => 4, 'json' => $json];
        self::assertSame('approved', app(OperationResultLifecycle::class)->publish($operationId, $result, $session));

        $expected = ['operation_id' => $operationId, 'kind' => 'export', 'status' => 'approved',
            'result' => ['filename' => 'filament-theme.json', 'schemaVersion' => 4, 'json' => $json]];
        LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $operationId])
            ->assertStructuredContent($expected);
        LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $operationId])
            ->assertStructuredContent(['operation_id' => $operationId, 'kind' => 'export', 'status' => 'approved']);
    }
}
