<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

interface RelayStore
{
    public function read(string $key): ?string;

    public function atomicWrite(string $key, string $value): void;

    public function delete(string $key): void;

    public function lock(string $key): LockHandle;
}
