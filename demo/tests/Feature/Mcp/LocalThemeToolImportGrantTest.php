<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\ImportGrantStore;
use App\Mcp\ThemeRelay\OperationPreviewLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemePair;

final class LocalThemeToolImportGrantTest extends LocalThemeToolTestCase
{
    public function test_import_tool_operation_rejects_altered_digest_and_stale_revision_grant(): void
    {
        $this->approveBrowserPair('pair-grant', 'session-grant');
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-grant']);
        $payload = '{"schemaVersion":4}';
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-grant', 'raw_json' => $payload,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Imported'])
            ->assertStructuredContent(fn ($json) => $json->where('status', 'pending')->has('operation_id')->etc())
            ->assertDontSee($payload);
        $store = app(RelayStore::class);
        $id = substr($store->keys('operation-')[0], strlen('operation-'));
        $session = json_decode((string) $store->read('session-session-grant'), true);
        $digest = hash('sha256', $payload);
        $preview = ['sourceVersion' => 4, 'targetVersion' => 4, 'migrationPath' => [4], 'displayName' => 'Imported',
            'summary' => [], 'payloadDigest' => $digest, 'byteLength' => strlen($payload)];
        $previews = app(OperationPreviewLifecycle::class);
        self::assertNull($previews->record($id, [...$preview, 'payloadDigest' => hash('sha256', 'altered')], $session));
        self::assertSame('pending', $previews->record($id, $preview, $session));
        $grant = $previews->authorizeApply($id, $digest, 7, 'Imported', $session);
        self::assertIsArray($grant);
        $grants = app(ImportGrantStore::class);
        self::assertFalse($grants->approve($grant['grantId'], $id, $digest, 'Imported', 8, $session['sessionId']));
        self::assertTrue($grants->approve($grant['grantId'], $id, $digest, 'Imported', 7, $session['sessionId']));
        self::assertFalse($grants->consume($grant['grantId'], $id, $digest, 'Imported', 8, $session['sessionId']));
        self::assertTrue($grants->consume($grant['grantId'], $id, $digest, 'Imported', 7, $session['sessionId']));
        self::assertFalse($grants->consume($grant['grantId'], $id, $digest, 'Imported', 7, $session['sessionId']));
        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(fn ($json) => $json->where('status', 'pending')->etc());
    }
}
