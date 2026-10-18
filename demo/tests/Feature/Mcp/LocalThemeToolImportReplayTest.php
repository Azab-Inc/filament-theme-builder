<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\OperationPreviewLifecycle;
use App\Mcp\ThemeRelay\OperationResultLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemePair;

final class LocalThemeToolImportReplayTest extends LocalThemeToolTestCase
{
    public function test_tool_status_reports_browser_result_and_rejects_replayed_different_record(): void
    {
        $this->approveBrowserPair('pair-replay', 'session-replay');
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-replay']);
        $payload = '{"schemaVersion":4}';
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-replay', 'raw_json' => $payload,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Imported']);
        $store = app(RelayStore::class);
        $id = substr($store->keys('operation-')[0], strlen('operation-'));
        $session = json_decode((string) $store->read('session-session-replay'), true);
        $digest = hash('sha256', $payload);
        $preview = ['sourceVersion' => 4, 'targetVersion' => 4, 'migrationPath' => [4], 'displayName' => 'Imported',
            'summary' => [], 'payloadDigest' => $digest, 'byteLength' => strlen($payload)];
        self::assertSame('pending', app(OperationPreviewLifecycle::class)->record($id, $preview, $session));
        $grant = app(OperationPreviewLifecycle::class)->authorizeApply($id, $digest, 7, 'Imported', $session);
        self::assertIsArray($grant);
        $results = app(OperationResultLifecycle::class);
        $committed = ['version' => 1, 'grantId' => $grant['grantId'], 'recordId' => 'record-first', 'digest' => $digest];
        self::assertSame('approved', $results->publish($id, $committed, $session));
        self::assertNull($results->publish($id, [...$committed, 'recordId' => 'record-replay'], $session));
        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'import', 'status' => 'approved',
                'record_id' => 'record-first', 'digest' => $digest, 'preview' => $preview]);
    }
}
