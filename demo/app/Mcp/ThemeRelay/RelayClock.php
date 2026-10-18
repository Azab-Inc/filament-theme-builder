<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

interface RelayClock
{
    public function now(): int;
}
