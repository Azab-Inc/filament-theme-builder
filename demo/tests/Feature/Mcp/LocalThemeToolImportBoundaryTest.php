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
use Illuminate\Support\Facades\Log;

final class LocalThemeToolImportBoundaryTest extends LocalThemeToolTestCase
{
    public function test_css_rejection_after_preview_submission_is_reported_without_raw_payload_or_logs(): void
    {
        $this->approveBrowserPair('pair-css', 'session-css');
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-css']);
        $raw = '{"schemaVersion":4,"customCss":".private-secret { color:red }"}';
        Log::spy();
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-css', 'raw_json' => $raw,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Unsafe CSS'])
            ->assertStructuredContent(fn ($json) => $json->where('kind', 'import')->where('status', 'pending')->has('operation_id')->etc())
            ->assertDontSee($raw)->assertDontSee('private-secret');
        $id = $this->operationId();
        $store = app(RelayStore::class);
        $session = json_decode((string) $store->read('session-session-css'), true);
        $preview = ['sourceVersion' => 4, 'targetVersion' => 4, 'migrationPath' => [4], 'displayName' => 'Unsafe CSS',
            'summary' => [], 'payloadDigest' => hash('sha256', 'altered'), 'byteLength' => strlen($raw)];
        self::assertNull(app(OperationPreviewLifecycle::class)->record($id, $preview, $session));
        self::assertSame('rejected', app(OperationResultLifecycle::class)->publish($id,
            ['version' => 1, 'errorCategory' => 'invalid_theme'], $session));
        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'import', 'status' => 'rejected',
                'error_category' => 'invalid_theme']);
        self::assertNull($store->read('payload-'.$id));
        foreach (['error', 'warning', 'debug', 'info', 'notice', 'critical', 'alert', 'emergency'] as $level) {
            Log::shouldNotHaveReceived($level);
        }
    }

    private function operationId(): string
    {
        return substr(app(RelayStore::class)->keys('operation-')[0], strlen('operation-'));
    }
}
