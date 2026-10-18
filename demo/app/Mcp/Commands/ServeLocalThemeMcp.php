<?php

declare(strict_types=1);

namespace App\Mcp\Commands;

use App\Mcp\Servers\LocalThemeServer;
use App\Mcp\ThemeRelay\ProcessScope;
use App\Mcp\Transport\BoundedStdioTransport;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Throwable;

final class ServeLocalThemeMcp extends Command
{
    protected $signature = 'ftb:mcp';

    protected $description = 'Serve the local bounded theme MCP endpoint over stdio';

    public function handle(): int
    {
        $scope = new ProcessScope((string) Str::uuid());
        app()->instance(ProcessScope::class, $scope);
        $transport = BoundedStdioTransport::fromStreams(STDIN, STDOUT);
        try {
            $server = app()->makeWith(LocalThemeServer::class, ['transport' => $transport]);
            $server->start();
            $transport->run();

            return self::SUCCESS;
        } catch (Throwable) {
            fwrite(STDERR, "ftb:mcp: stdio_server_error\n");

            return self::FAILURE;
        }
    }
}
