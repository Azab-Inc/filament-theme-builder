<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class RelayRecordLock implements LockHandle
{
    private function __construct(private LockHandle $recordLock, private LockHandle $indexLock) {}

    public static function acquire(RelayStore $store, string $recordKey): self
    {
        $index = $store->lock('session-index');
        try {
            return new self($store->lock($recordKey), $index);
        } catch (\Throwable $error) {
            $index->release();
            throw $error;
        }
    }

    public function release(): void
    {
        try {
            $this->recordLock->release();
        } finally {
            $this->indexLock->release();
        }
    }
}
