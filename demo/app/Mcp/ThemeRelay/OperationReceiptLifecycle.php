<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationReceiptLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /** @param array<string, mixed> $session */
    public function acknowledgePayload(string $id, string $digest, array $session): bool
    {
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            if (! $record || ($record['pairingId'] ?? null) !== $session['pairingId']
                || ($record['processId'] ?? null) !== $session['processId']
                || ($record['status'] ?? null) !== 'pending' || ($record['expiresAt'] ?? 0) <= $this->clock->now()
                || ($record['payloadAvailable'] ?? false) !== true || ! hash_equals((string) $record['digest'], $digest)) {
                return false;
            }
            $this->store->delete('payload-'.$id);
            $record['payloadAvailable'] = false;
            $record['received'] = true;
            $this->store->atomicWrite('operation-'.$id, json_encode($record, JSON_THROW_ON_ERROR));

            return true;
        } finally {
            $lock->release();
        }
    }
}
