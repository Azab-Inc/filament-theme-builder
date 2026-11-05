<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\OperationResultValidator;
use App\Mcp\ThemeRelay\RelayImportPreviewValidator;
use Tests\TestCase;

final class ThemeRelayValidationV6Test extends TestCase
{
    public function test_v6_export_and_import_preview_envelopes_are_accepted(): void
    {
        $json = json_encode([
            'schemaVersion' => 6,
            'overrides' => [['targetId' => 'buttons', 'controlId' => 'background', 'scope' => 'component', 'value' => '#111111', 'darkValue' => '#222222', 'mode' => 'dark']],
        ]);
        self::assertIsString($json);
        self::assertTrue(OperationResultValidator::valid('export', [
            'version' => 1, 'filename' => 'filament-theme.json', 'schemaVersion' => 6, 'json' => $json,
        ]));
        self::assertTrue(RelayImportPreviewValidator::valid([
            'sourceVersion' => 6, 'targetVersion' => 6, 'migrationPath' => [6], 'displayName' => 'Example',
            'summary' => ['Mode-aware v6 theme'], 'payloadDigest' => hash('sha256', $json), 'byteLength' => strlen($json),
        ]));
    }

    public function test_envelopes_reject_malformed_versions_and_invalid_mode_values(): void
    {
        self::assertFalse(OperationResultValidator::valid('export', [
            'version' => 1, 'filename' => 'filament-theme.json', 'schemaVersion' => 7, 'json' => '{}',
        ]));
        self::assertFalse(RelayImportPreviewValidator::valid([
            'sourceVersion' => 6, 'targetVersion' => 6, 'migrationPath' => [6, 'dark'], 'displayName' => 'Example',
            'summary' => [], 'payloadDigest' => str_repeat('a', 64), 'byteLength' => 2,
        ]));
    }

    public function test_relay_origin_and_authentication_guards_reject_untrusted_requests(): void
    {
        config(['local-theme-relay.enabled' => true, 'local-theme-relay.origin' => 'http://localhost:8000', 'local-theme-relay.host' => 'localhost:8000']);
        $this->withHeader('Host', 'localhost:8000')->withHeader('Origin', 'https://evil.example')
            ->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => str_repeat('a', 64)])
            ->assertForbidden();
    }
}
