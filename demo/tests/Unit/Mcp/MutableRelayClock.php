<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\RelayClock;

final class MutableRelayClock implements RelayClock
{
    public function __construct(public int $time = 1_000) {}

    public function now(): int
    {
        return $this->time;
    }
}
