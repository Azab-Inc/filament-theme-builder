<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\RelayLimits;
use Laravel\Mcp\Server\Transport\FakeTransporter;

final class LocalThemeToolSchemaTest extends LocalThemeToolTestCase
{
    public function test_server_registers_only_the_seven_local_theme_tools(): void
    {
        $server = app()->make(LocalThemeServer::class, ['transport' => new FakeTransporter]);
        $tools = collect($server->createContext()->tools())->map(fn ($tool) => $tool->name())->sort()->values()->all();

        self::assertSame(['local_theme_disconnect', 'local_theme_export', 'local_theme_import_preview',
            'local_theme_import_status', 'local_theme_list', 'local_theme_operation_status', 'local_theme_pair'], $tools);
    }

    public function test_operation_status_is_the_common_async_retrieval_tool(): void
    {
        $tool = app(LocalThemeToolRegistry::class)->tool('local_theme_operation_status');

        self::assertNotNull($tool);
        self::assertSame(['operation_id'], array_keys($tool['inputSchema']['properties']));
        self::assertFalse($tool['inputSchema']['additionalProperties']);
    }

    public function test_tools_reject_unknown_arguments_and_never_expose_authority_inputs(): void
    {
        $server = app()->make(LocalThemeServer::class, ['transport' => new FakeTransporter]);
        $forbidden = ['owner_id', 'process_id', 'session_id', 'confirmed', 'force', 'apply'];

        foreach (collect($server->createContext()->tools()) as $tool) {
            $schema = $tool->toArray()['inputSchema'];
            self::assertFalse($schema['additionalProperties'], $tool->name());
            self::assertSame([], array_intersect($forbidden, array_keys($schema['properties'])), $tool->name());
        }
    }

    public function test_all_tool_schemas_are_exact_and_bounded(): void
    {
        $expected = ['local_theme_pair' => ['pairing_id'], 'local_theme_list' => ['pairing_id'],
            'local_theme_export' => ['pairing_id', 'theme_id'],
            'local_theme_import_preview' => ['pairing_id', 'raw_json', 'filename', 'proposed_name'],
            'local_theme_import_status' => ['operation_id'], 'local_theme_operation_status' => ['operation_id'],
            'local_theme_disconnect' => ['pairing_id']];
        foreach ($expected as $name => $properties) {
            $tool = app(LocalThemeToolRegistry::class)->tool($name);
            self::assertNotNull($tool, $name);
            self::assertSame($properties, array_keys($tool['inputSchema']['properties']), $name);
            self::assertSame($properties, $tool['inputSchema']['required'], $name);
            self::assertFalse($tool['inputSchema']['additionalProperties'], $name);
        }
        $import = app(LocalThemeToolRegistry::class)->tool('local_theme_import_preview')['inputSchema']['properties'];
        self::assertSame(RelayLimits::MAX_THEME_BYTES, $import['raw_json']['maxLength']);
        self::assertSame(['filament-theme.json'], $import['filename']['enum']);
        $status = app(LocalThemeToolRegistry::class)->tool('local_theme_operation_status')['inputSchema']['properties'];
        self::assertSame('^[a-f0-9]{64}$', $status['operation_id']['pattern']);
    }
}
