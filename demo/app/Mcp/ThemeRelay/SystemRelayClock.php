<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class SystemRelayClock implements RelayClock
{
    public function now(): int
    {
        return time();
    }
}
