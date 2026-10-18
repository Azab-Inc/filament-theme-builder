<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationCleanup
{
    public function __construct(private readonly FileRelayStore $store, private readonly RelayClock $clock) {}

    public function expireUndelivered(): void
    {
        foreach ($this->store->keys('operation-') as $key) {
            $lock = $this->store->lock($key);
            try {
                $record = $this->store->readJson($key);
                if (! $record || ($record['expiresAt'] ?? PHP_INT_MAX) > $this->clock->now()) {
                    continue;
                }
                $id = substr($key, 10);
                $this->store->delete('payload-'.$id);
                if (($record['status'] ?? null) === 'pending') {
                    $record['status'] = 'expired';
                    $this->store->atomicWrite($key, json_encode($record, JSON_THROW_ON_ERROR));
                }
            } finally {
                $lock->release();
            }
        }
    }
}
