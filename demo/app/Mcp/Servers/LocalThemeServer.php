<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Tools\LocalThemeDisconnect;
use App\Mcp\Tools\LocalThemeExport;
use App\Mcp\Tools\LocalThemeImportPreview;
use App\Mcp\Tools\LocalThemeImportStatus;
use App\Mcp\Tools\LocalThemeList;
use App\Mcp\Tools\LocalThemeOperationStatus;
use App\Mcp\Tools\LocalThemePair;
use Laravel\Mcp\Server;

final class LocalThemeServer extends Server
{
    protected string $name = 'Filament Theme Builder Local';

    protected string $version = '1.0.0';

    protected array $tools = [
        LocalThemePair::class,
        LocalThemeList::class,
        LocalThemeExport::class,
        LocalThemeImportPreview::class,
        LocalThemeImportStatus::class,
        LocalThemeOperationStatus::class,
        LocalThemeDisconnect::class,
    ];
}
