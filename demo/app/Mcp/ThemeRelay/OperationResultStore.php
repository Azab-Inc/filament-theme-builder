<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use JsonException;

final class OperationResultStore
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function publish(string $id, string $pairingId, string $processId, string $digest, string $result): bool
    {
        return $this->mutate($id, function (array $r) use ($pairingId, $processId, $digest, $result): ?array {
            if (($r['kind'] ?? null) === 'import' || ($r['pairingId'] ?? null) !== $pairingId || ($r['processId'] ?? null) !== $processId
                || ($r['digest'] ?? null) !== $digest || ($r['status'] ?? null) !== 'pending'
                || ($r['expiresAt'] ?? 0) <= $this->clock->now()) {
                return null;
            }
            $r['status'] = 'approved';
            $r['result'] = $result;

            return $r;
        });
    }

    public function consume(string $id, string $pairingId, string $processId): ?string
    {
        $result = null;
        $this->mutate($id, function (array $r) use ($pairingId, $processId, &$result): ?array {
            if (($r['pairingId'] ?? null) !== $pairingId || ($r['processId'] ?? null) !== $processId
                || ($r['status'] ?? null) !== 'approved' || ($r['expiresAt'] ?? 0) <= $this->clock->now()
                || ! is_string($r['result'] ?? null)) {
                return null;
            }
            $result = $r['result'];
            $r['result'] = null;
            $r['status'] = 'consumed';

            return $r;
        });

        return $result;
    }

    public function receipt(string $id, string $digest): bool
    {
        $key = 'operation-'.$id;
        $lock = $this->store->lock($key);
        try {
            $r = $this->reader->read($key);
            if (! $r || ($r['digest'] ?? null) !== $digest || ($r['status'] ?? null) !== 'pending'
                || ($r['received'] ?? false) === true) {
                return false;
            }
            $this->store->delete('payload-'.$id);
            $r['received'] = true;
            $this->store->atomicWrite($key, json_encode($r, JSON_THROW_ON_ERROR));

            return true;
        } catch (JsonException) {
            return false;
        } finally {
            $lock->release();
        }
    }

    private function mutate(string $id, callable $callback): bool
    {
        $key = 'operation-'.$id;
        $lock = $this->store->lock($key);
        try {
            $r = $this->reader->read($key);
            $updated = $r ? $callback($r) : null;
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
}
