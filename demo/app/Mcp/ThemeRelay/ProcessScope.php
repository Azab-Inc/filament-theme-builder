<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final readonly class ProcessScope
{
    public function __construct(public string $processId) {}
}
