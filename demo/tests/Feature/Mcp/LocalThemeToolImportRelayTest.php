<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemeOperationStatus;

final class LocalThemeToolImportRelayTest extends LocalThemeRelayBrowserTestCase
{
    public function test_css_import_preview_rejection_uses_the_authenticated_relay_result_route(): void
    {
        $pairingId = 'css-relay-pair';
        $this->createBrowserPair($pairingId);
        $payload = '{"schemaVersion":4,"customCss":".unsafe { color:red }"}';
        LocalThemeServer::tool(LocalThemeImportPreview::class, ['pairing_id' => $pairingId, 'raw_json' => $payload,
            'filename' => 'filament-theme.json', 'proposed_name' => 'Unsafe CSS'])
            ->assertStructuredContent(fn ($json) => $json->where('kind', 'import')->where('status', 'pending')
                ->has('operation_id')->etc())
            ->assertDontSee($payload);
        $id = substr(app(RelayStore::class)->keys('operation-')[0], strlen('operation-'));
        $digest = hash('sha256', $payload);
        $this->relay()->get('/local-theme/relay/operations/'.$id.'/payload')->assertOk()->assertExactJson([
            'version' => 1, 'operationId' => $id, 'payload' => $payload, 'filename' => 'filament-theme.json',
            'proposedName' => 'Unsafe CSS', 'digest' => $digest, 'byteLength' => strlen($payload),
        ]);
        $this->relayPost('/local-theme/relay/operations/'.$id.'/result', ['version' => 1, 'errorCategory' => 'invalid_theme'])
            ->assertOk()->assertExactJson(['version' => 1, 'status' => 'rejected']);
        $this->relay()->get('/local-theme/relay/operations/'.$id.'/result')->assertOk()->assertExactJson([
            'version' => 1, 'operationId' => $id, 'kind' => 'import', 'status' => 'rejected', 'errorCategory' => 'invalid_theme',
        ]);
        LocalThemeServer::tool(LocalThemeImportStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'import', 'status' => 'rejected',
                'error_category' => 'invalid_theme']);
        LocalThemeServer::tool(LocalThemeOperationStatus::class, ['operation_id' => $id])
            ->assertStructuredContent(['operation_id' => $id, 'kind' => 'import', 'status' => 'rejected',
                'error_category' => 'invalid_theme']);
        $operation = json_decode((string) app(RelayStore::class)->read('operation-'.$id), true);
        self::assertNull(app(RelayStore::class)->read('payload-'.$id));
        self::assertSame('rejected', $operation['status']);
        self::assertArrayNotHasKey('recordId', $operation);
        self::assertNull($operation['result']);
    }
}
