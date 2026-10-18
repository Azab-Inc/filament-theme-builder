<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\LockHandle;

final class LockObservingFileRelayStore extends FileRelayStore
{
    public array $lockedKeys = [];

    public function lock(string $key): LockHandle
    {
        $this->lockedKeys[] = $key;

        return parent::lock($key);
    }
}
