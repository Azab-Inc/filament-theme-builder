<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use Laravel\Mcp\Server;

final class LocalThemeServer extends Server
{
    protected string $name = 'Filament Theme Builder Local';

    protected string $version = '1.0.0';

    protected array $tools = [];
}
