<?php

namespace Tests\Feature\Mcp;

use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ServeLocalThemeMcpTest extends TestCase
{
    public function test_command_is_not_registered_when_the_local_flag_is_disabled(): void
    {
        $process = $this->runArtisan(['list', '--raw'], ['APP_ENV' => 'local', 'FTB_LOCAL_MCP_ENABLED' => 'false']);
        self::assertStringNotContainsString("\nftb:mcp ", "\n".$process->getOutput());
    }

    public function test_command_is_not_registered_in_production_even_when_enabled(): void
    {
        $process = $this->runArtisan(['list', '--raw'], ['APP_ENV' => 'production', 'FTB_LOCAL_MCP_ENABLED' => 'true']);
        self::assertStringNotContainsString("\nftb:mcp ", "\n".$process->getOutput());
    }

    public function test_malformed_input_diagnostics_are_stderr_only(): void
    {
        $process = $this->runArtisan(['ftb:mcp'], ['APP_ENV' => 'testing', 'FTB_LOCAL_MCP_ENABLED' => 'true'], "{bad}\n");
        self::assertSame(1, $process->getExitCode());
        self::assertSame('', $process->getOutput());
        self::assertSame("ftb:mcp: stdio_server_error\n", $process->getErrorOutput());
    }

    public function test_command_serves_registered_tools_and_call_over_clean_stdio(): void
    {
        $relayPath = sys_get_temp_dir().'/ftb-mcp-stdio-'.bin2hex(random_bytes(8));
        mkdir($relayPath, 0700);
        chown($relayPath, posix_geteuid());
        chmod($relayPath, 0700);
        $input = implode("\n", [
            '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}',
            '{"jsonrpc":"2.0","method":"notifications/initialized"}',
            '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}',
            '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"local_theme_pair","arguments":{"pairing_id":"unknown"}}}',
            '',
        ]);
        $process = $this->runArtisan(['ftb:mcp'], ['APP_ENV' => 'testing', 'FTB_LOCAL_MCP_ENABLED' => 'true',
            'FTB_LOCAL_RELAY_PATH' => $relayPath], $input);
        File::deleteDirectory($relayPath);
        self::assertSame(0, $process->getExitCode(), $process->getErrorOutput());
        self::assertSame('', $process->getErrorOutput());
        $responses = array_map(json_decode(...), array_filter(explode("\n", trim($process->getOutput()))));
        self::assertCount(3, $responses);
        self::assertSame('2.0', $responses[0]->jsonrpc);
        self::assertSame(1, $responses[0]->id);
        self::assertSame('2.0', $responses[1]->jsonrpc);
        self::assertSame(2, $responses[1]->id);
        $tools = $responses[1]->result->tools;
        $names = array_map(fn ($tool) => $tool->name, $tools);
        sort($names);
        self::assertSame(['local_theme_disconnect', 'local_theme_export', 'local_theme_import_preview',
            'local_theme_import_status', 'local_theme_list', 'local_theme_operation_status', 'local_theme_pair'], $names);
        foreach ($tools as $tool) {
            self::assertFalse($tool->inputSchema->additionalProperties, $tool->name);
            self::assertSame([], array_intersect(['owner_id', 'process_id', 'session_id', 'confirmed', 'force', 'apply'],
                array_keys((array) $tool->inputSchema->properties)));
        }
        $operationStatus = collect($tools)->firstWhere('name', 'local_theme_operation_status');
        self::assertSame(['operation_id'], array_keys((array) $operationStatus->inputSchema->properties));
        self::assertFalse($operationStatus->inputSchema->additionalProperties);
        self::assertSame(3, $responses[2]->id);
        self::assertSame(['error' => 'pairing_required'], (array) $responses[2]->result->structuredContent);
    }

    private function runArtisan(array $arguments, array $environment, ?string $input = null): Process
    {
        $process = new Process([PHP_BINARY, base_path('artisan'), ...$arguments], base_path(), $environment);
        if ($input !== null) {
            $process->setInput($input);
        }
        $process->run();

        return $process;
    }
}
