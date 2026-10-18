<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use JsonException;

final class OperationStore
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function create(string $kind, string $pairingId, string $processId, string $digest): string
    {
        if (! in_array($kind, ['list', 'export', 'import'], true) || ! preg_match('/\A[a-f0-9]{64}\z/', $digest)) {
            throw new \InvalidArgumentException('Invalid relay operation.');
        }
        $lock = $this->store->lock('session-index');
        try {
            $id = bin2hex(random_bytes(32));
            $this->write($id, ['operationId' => $id, 'kind' => $kind, 'pairingId' => $pairingId,
                'processId' => $processId, 'digest' => $digest, 'status' => 'pending',
                'expiresAt' => $this->clock->now() + (int) config('local-theme-relay.operation_seconds', 300), 'result' => null]);

            return $id;
        } finally {
            $lock->release();
        }
    }

    public function transition(string $id, string $pairingId, string $processId, string $status): bool
    {
        if (! in_array($status, ['rejected', 'expired', 'disconnected'], true)) {
            return false;
        }

        return $this->mutate($id, function (array $record) use ($pairingId, $processId, $status): ?array {
            if (($record['pairingId'] ?? null) !== $pairingId || ($record['processId'] ?? null) !== $processId
                || ($record['status'] ?? null) !== 'pending'
                || ! is_int($record['expiresAt'] ?? null) || $record['expiresAt'] <= $this->clock->now()) {
                return null;
            }
            $record['status'] = $status;

            return $record;
        });
    }

    private function mutate(string $id, callable $callback): bool
    {
        $key = 'operation-'.$id;
        $lock = RelayRecordLock::acquire($this->store, $key);
        try {
            $record = $this->reader->read($key);
            if (! $record) {
                return false;
            }
            $updated = $callback($record);
            if (! $updated) {
                return false;
            }
            $this->store->atomicWrite($key, json_encode($updated, JSON_THROW_ON_ERROR));

            return true;
        } catch (JsonException) {
            return false;
        } finally {
            $lock->release();
        }
    }

    /** @param array<string, mixed> $record */
    private function write(string $id, array $record): void
    {
        $this->store->atomicWrite('operation-'.$id, json_encode($record, JSON_THROW_ON_ERROR));
    }
}
