<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LocalThemeServer;
use Laravel\Mcp\Server\Transport\FakeTransporter;

final class ServerLocalThemeToolRegistry implements LocalThemeToolRegistry
{
    public function tool(string $name): ?array
    {
        $server = app()->make(LocalThemeServer::class, ['transport' => new FakeTransporter]);
        foreach ($server->createContext()->tools() as $tool) {
            if ($tool->name() === $name) {
                return $tool->toArray();
            }
        }

        return null;
    }
}
