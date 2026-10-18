<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

interface RelayStore
{
    public function read(string $key): ?string;

    public function atomicWrite(string $key, string $value): void;

    public function delete(string $key): void;

    /** @return list<string> */
    public function keys(string $prefix): array;

    public function lock(string $key): LockHandle;
}
