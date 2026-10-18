<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class ImportGrantResultLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function acknowledge(string $grantId, string $operationId, string $digest,
        string $recordId, string $sessionId): bool
    {
        if (! preg_match('/\A[a-f0-9]{64}\z/', $grantId) || ! preg_match('/\A[a-zA-Z0-9_-]{1,128}\z/', $recordId)) {
            return false;
        }
        $lock = RelayRecordLock::acquire($this->store, 'grant-'.$grantId);
        try {
            $record = $this->reader->read('grant-'.$grantId);
            if (! $record || ($record['operationId'] ?? null) !== $operationId
                || ($record['digest'] ?? null) !== $digest || ($record['sessionId'] ?? null) !== $sessionId
                || ($record['expiresAt'] ?? 0) <= $this->clock->now()) {
                return false;
            }
            if (($record['status'] ?? null) === 'approved') {
                return ($record['recordId'] ?? null) === $recordId;
            }
            if (($record['status'] ?? null) !== 'pending') {
                return false;
            }
            $record['recordId'] = $recordId;
            $record['status'] = 'approved';
            $this->store->atomicWrite('grant-'.$grantId, json_encode($record, JSON_THROW_ON_ERROR));

            return true;
        } finally {
            $lock->release();
        }
    }
}
