<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemeList;
use App\Mcp\Tools\LocalThemeOperationStatus;
use App\Mcp\Tools\LocalThemePair;

final class LocalThemeToolExpiryTest extends LocalThemeToolTestCase
{
    public function test_import_expiry_status_removes_the_stored_raw_payload(): void
    {
        $this->approveBrowserPair('pair-expired-import', 'session-expired-import');
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-expired-import']);
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => 'pair-expired-import',
            'raw_json' => '{"schemaVersion":4}', 'filename' => 'filament-theme.json', 'proposed_name' => 'Theme']);
        $id = $this->operationId();
        $this->expireOperation($id);

        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'import', 'status' => 'expired']);
        self::assertNull(app(RelayStore::class)->read('payload-'.$id));
    }

    public function test_list_operation_status_reports_expiry(): void
    {
        $this->approveBrowserPair('pair-expired-list', 'session-expired-list');
        LocalThemeServer::tool(LocalThemePair::class, ['pairing_id' => 'pair-expired-list']);
        LocalThemeServer::tool(LocalThemeList::class, ['pairing_id' => 'pair-expired-list']);
        $id = $this->operationId();
        $this->expireOperation($id);

        LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'list', 'status' => 'expired']);
    }

    private function operationId(): string
    {
        return substr(app(RelayStore::class)->keys('operation-')[0], strlen('operation-'));
    }

    private function expireOperation(string $id): void
    {
        $store = app(RelayStore::class);
        $operation = json_decode((string) $store->read('operation-'.$id), true);
        $operation['expiresAt'] = 1;
        $store->atomicWrite('operation-'.$id, json_encode($operation));
    }
}
