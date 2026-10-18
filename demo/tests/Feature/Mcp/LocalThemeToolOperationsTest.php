<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\ProcessScope;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemeList;
use App\Mcp\Tools\LocalThemeOperationStatus;
use App\Mcp\Tools\LocalThemePair;

final class LocalThemeToolOperationsTest extends LocalThemeToolTestCase
{
    public function test_pairing_is_idempotent_only_for_the_bound_process(): void
    {
        $this->approveBrowserPair('pair-one', 'session-one');
        $approved = ['pairing_id' => 'pair-one', 'status' => 'approved', 'expires_at' => $this->pairExpiry('pair-one')];
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-one'])->assertStructuredContent($approved);
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-one'])->assertStructuredContent($approved);
        $this->app->instance(ProcessScope::class, new ProcessScope('another-mcp-process'));
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-one'])
            ->assertStructuredContent(['error' => 'pairing_required']);
    }

    public function test_unknown_pairing_returns_only_the_generic_credential_error(): void
    {
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'unknown'])
            ->assertStructuredContent(['error' => 'pairing_required']);
    }

    public function test_expired_pairing_is_not_reported_as_pending(): void
    {
        app(RelayLifecycle::class)->createPendingPairing(
            'pair-expired', 'session-expired', hash('sha256', str_repeat('a', 64)));
        $pair = json_decode((string) app(RelayStore::class)->read('pairing-pair-expired'), true);
        $pair['expiresAt'] = 1;
        app(RelayStore::class)->atomicWrite('pairing-pair-expired', json_encode($pair));

        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-expired'])
            ->assertStructuredContent(['error' => 'pairing_required']);
    }

    public function test_list_is_async_and_operation_status_is_process_scoped(): void
    {
        $this->approved('pair-list', 'session-list');
        LocalThemeServer::tool(LocalThemeList::class, ['pairing_id' => 'pair-list'])
            ->assertStructuredContent(fn ($json) => $json->where('kind', 'list')->where('status', 'pending')->has('operation_id')->etc());
        $id = $this->operationId();
        LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'list', 'status' => 'pending']);
        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['error' => 'pairing_required']);
        $this->app->instance(ProcessScope::class, new ProcessScope('unrelated-process'));
        LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['error' => 'pairing_required']);
    }

    public function test_import_preview_stores_bounded_bytes_without_returning_or_applying_them(): void
    {
        $this->approved('pair-import', 'session-import');
        $raw = '{"secret":"do-not-return","schemaVersion":4}';
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-import', 'raw_json' => $raw,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Proposed'])
            ->assertStructuredContent(fn ($json) => $json->where('kind', 'import')->where('status', 'pending')->has('operation_id')->etc())
            ->assertDontSee($raw)->assertDontSee('do-not-return');
        $id = $this->operationId();
        self::assertSame($raw, app(RelayStore::class)->read('payload-'.$id));
        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'import', 'status' => 'pending']);
    }

    private function approved(string $id, string $session): void
    {
        $this->approveBrowserPair($id, $session);
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => $id])
            ->assertStructuredContent(['pairing_id' => $id, 'status' => 'approved', 'expires_at' => $this->pairExpiry($id)]);
    }

    private function operationId(): string
    {
        return substr(app(RelayStore::class)->keys('operation-')[0], strlen('operation-'));
    }
}
