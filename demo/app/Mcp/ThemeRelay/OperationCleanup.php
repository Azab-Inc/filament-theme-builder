<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationCleanup
{
    public function __construct(private readonly FileRelayStore $store, private readonly RelayClock $clock) {}

    public function expireUndelivered(): void
    {
        $indexLock = $this->store->lock('session-index');
        try {
            foreach ($this->store->keys('operation-') as $key) {
                $lock = $this->store->lock($key);
                try {
                    $record = $this->store->readJson($key);
                    if (! $record || ($record['expiresAt'] ?? PHP_INT_MAX) > $this->clock->now()) {
                        continue;
                    }
                    $id = substr($key, 10);
                    $this->store->delete('payload-'.$id);
                    $this->store->delete('result-'.$id);
                    $this->store->delete($key);
                } finally {
                    $lock->release();
                }
            }
        } finally {
            $indexLock->release();
        }
    }
}
