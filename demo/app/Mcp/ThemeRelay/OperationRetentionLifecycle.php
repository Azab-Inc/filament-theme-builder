<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationRetentionLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /** @param array<string, mixed> $session */
    public function expire(string $id, array $session): void
    {
        if (! preg_match('/\A[a-f0-9]{64}\z/', $id)) {
            return;
        }
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            if (! $record || ($record['pairingId'] ?? null) !== $session['pairingId']
                || ($record['processId'] ?? null) !== $session['processId']
                || ($record['status'] ?? null) !== 'pending' || ($record['expiresAt'] ?? PHP_INT_MAX) > $this->clock->now()) {
                return;
            }
            $record['status'] = 'expired';
            $record['result'] = null;
            $record['payloadAvailable'] = false;
            unset($record['preview']);
            $this->store->delete('payload-'.$id);
            $this->store->delete('result-'.$id);
            $this->store->atomicWrite('operation-'.$id, json_encode($record, JSON_THROW_ON_ERROR));
        } finally {
            $lock->release();
        }
    }
}
