<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use JsonException;

final class ImportGrantStore
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function issue(string $operationId, string $digest, string $name, int $revision, string $sessionId): string
    {
        $id = bin2hex(random_bytes(32));
        $lock = RelayRecordLock::acquire($this->store, 'grant-'.$id);
        try {
            $record = new ImportGrantRecord($id, $operationId, $digest, $name, $revision, $sessionId,
                $this->clock->now() + 5);
            $this->store->atomicWrite('grant-'.$id, json_encode($record, JSON_THROW_ON_ERROR));

            return $id;
        } finally {
            $lock->release();
        }
    }

    public function approve(string $id, string $operationId, string $digest, string $name, int $revision, string $sessionId): bool
    {
        return $this->update($id, function (array $r) use ($operationId, $digest, $name, $revision, $sessionId): ?array {
            if (! $this->matches($r, $operationId, $digest, $name, $revision, $sessionId) || $r['status'] !== 'pending') {
                return null;
            }
            $r['status'] = 'approved';

            return $r;
        });
    }

    public function consume(string $id, string $operationId, string $digest, string $name, int $revision, string $sessionId): bool
    {
        return $this->update($id, function (array $r) use ($operationId, $digest, $name, $revision, $sessionId): ?array {
            if (! $this->matches($r, $operationId, $digest, $name, $revision, $sessionId) || $r['status'] !== 'approved') {
                return null;
            }
            $r['status'] = 'consumed';

            return $r;
        });
    }

    /** @param array<string, mixed> $r */
    private function matches(array $r, string $op, string $digest, string $name, int $revision, string $session): bool
    {
        return ($r['operationId'] ?? null) === $op && ($r['digest'] ?? null) === $digest
            && ($r['displayName'] ?? null) === $name && ($r['revision'] ?? null) === $revision
            && ($r['sessionId'] ?? null) === $session && ($r['expiresAt'] ?? 0) > $this->clock->now();
    }

    private function update(string $id, callable $change): bool
    {
        $key = 'grant-'.$id;
        $lock = RelayRecordLock::acquire($this->store, $key);
        try {
            $record = $this->reader->read($key);
            $updated = $record ? $change($record) : null;
            if ($updated === null) {
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
