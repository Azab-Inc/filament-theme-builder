<?php

namespace Tests\Feature\Mcp;

use Symfony\Component\Process\Process;
use Tests\TestCase;

class ServeLocalThemeMcpTest extends TestCase
{
    public function test_command_is_not_registered_when_the_local_flag_is_disabled(): void
    {
        $process = new Process([PHP_BINARY, base_path('artisan'), 'list', '--raw'], base_path(), [
            'APP_ENV' => 'local', 'FTB_LOCAL_MCP_ENABLED' => 'false',
        ]);
        $process->run();
        self::assertStringNotContainsString("\nftb:mcp ", "\n".$process->getOutput());
    }

    public function test_command_is_not_registered_in_production_even_when_enabled(): void
    {
        $process = new Process([PHP_BINARY, base_path('artisan'), 'list', '--raw'], base_path(), [
            'APP_ENV' => 'production', 'FTB_LOCAL_MCP_ENABLED' => 'true',
        ]);
        $process->run();
        self::assertStringNotContainsString("\nftb:mcp ", "\n".$process->getOutput());
    }

    public function test_command_serves_initialize_and_empty_tools_list_over_clean_stdio(): void
    {
        $input = implode("\n", [
            '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}',
            '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}',
            '',
        ]);
        $process = new Process([PHP_BINARY, base_path('artisan'), 'ftb:mcp'], base_path(), [
            'APP_ENV' => 'testing', 'FTB_LOCAL_MCP_ENABLED' => 'true',
        ]);
        $process->setInput($input);
        $process->run();
        self::assertSame(0, $process->getExitCode(), $process->getErrorOutput());
        self::assertSame('', $process->getErrorOutput());
        $responses = array_map(json_decode(...), array_filter(explode("\n", trim($process->getOutput()))));
        self::assertCount(2, $responses);
        self::assertSame(1, $responses[0]->id);
        self::assertSame(2, $responses[1]->id);
        self::assertSame([], $responses[1]->result->tools);
    }
}
