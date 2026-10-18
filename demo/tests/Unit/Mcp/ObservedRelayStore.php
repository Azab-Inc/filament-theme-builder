<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\LockHandle;
use App\Mcp\ThemeRelay\RelayStore;

final class ObservedRelayStore implements RelayStore
{
    public array $lockedKeys = [];

    public ?\Closure $beforeLock = null;

    public function __construct(private FileRelayStore $inner) {}

    public function read(string $key): ?string
    {
        return $this->inner->read($key);
    }

    public function atomicWrite(string $key, string $value): void
    {
        $this->inner->atomicWrite($key, $value);
    }

    public function delete(string $key): void
    {
        $this->inner->delete($key);
    }

    public function lock(string $key): LockHandle
    {
        $this->lockedKeys[] = $key;
        if ($this->beforeLock !== null) {
            ($this->beforeLock)($key);
        }

        return $this->inner->lock($key);
    }
}
