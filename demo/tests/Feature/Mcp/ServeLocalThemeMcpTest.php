<?php

namespace Tests\Feature\Mcp;

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

    public function test_command_serves_initialize_and_empty_tools_list_over_clean_stdio(): void
    {
        $input = implode("\n", [
            '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}',
            '{"jsonrpc":"2.0","method":"notifications/initialized"}',
            '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}',
            '',
        ]);
        $process = $this->runArtisan(['ftb:mcp'], ['APP_ENV' => 'testing', 'FTB_LOCAL_MCP_ENABLED' => 'true'], $input);
        self::assertSame(0, $process->getExitCode(), $process->getErrorOutput());
        self::assertSame('', $process->getErrorOutput());
        $responses = array_map(json_decode(...), array_filter(explode("\n", trim($process->getOutput()))));
        self::assertCount(2, $responses);
        self::assertSame('2.0', $responses[0]->jsonrpc);
        self::assertSame(1, $responses[0]->id);
        self::assertSame('2.0', $responses[1]->jsonrpc);
        self::assertSame(2, $responses[1]->id);
        self::assertSame([], $responses[1]->result->tools);
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
