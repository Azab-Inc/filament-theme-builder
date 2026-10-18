<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

interface LockHandle
{
    public function release(): void;
}
