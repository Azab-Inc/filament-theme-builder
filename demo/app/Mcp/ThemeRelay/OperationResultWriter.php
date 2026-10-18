<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationResultWriter
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock,
        private readonly ImportGrantResultLifecycle $grants)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /**
     * @param  array<string, mixed>  $session
     * @param  array<string, mixed>  $operation
     * @param  array<string, mixed>  $result
     */
    public function completeImport(string $id, array $operation, array $result, array $session): bool
    {
        $keys = array_keys($result);
        sort($keys);
        if ($keys !== ['digest', 'grantId', 'recordId', 'version'] || ($result['version'] ?? null) !== 1
            || ! is_string($result['grantId']) || ! preg_match('/\A[a-f0-9]{64}\z/', $result['grantId']) || ! is_string($result['recordId'])
            || ($result['digest'] ?? null) !== $operation['digest']
            || ! $this->grants->acknowledge($result['grantId'], $id, $operation['digest'], $result['recordId'], $session['sessionId'])) {
            return false;
        }

        return $this->mutate($id, function (array $record) use ($result, $session): ?array {
            if (($record['pairingId'] ?? null) !== $session['pairingId'] || ($record['processId'] ?? null) !== $session['processId']) {
                return null;
            }
            if (($record['status'] ?? null) === 'approved') {
                return ($record['recordId'] ?? null) === $result['recordId'] ? $record : null;
            }
            if (($record['status'] ?? null) !== 'pending' || ($record['expiresAt'] ?? 0) <= $this->clock->now()) {
                return null;
            }
            $record['status'] = 'approved';
            $record['recordId'] = $result['recordId'];

            return $record;
        });
    }

    /** @param array<string, mixed> $session */
    public function reject(string $id, mixed $category, array $session): bool
    {
        if (! is_string($category) || ! in_array($category,
            ['invalid_theme', 'theme_unavailable', 'operation_failed', 'stale_revision', 'apply_failed'], true)) {
            return false;
        }

        return $this->mutate($id, function (array $record) use ($category, $session): ?array {
            if (($record['pairingId'] ?? null) !== $session['pairingId'] || ($record['processId'] ?? null) !== $session['processId']
                || ($record['status'] ?? null) !== 'pending' || ($record['expiresAt'] ?? 0) <= $this->clock->now()) {
                return null;
            }
            $record['status'] = 'rejected';
            $record['errorCategory'] = $category;
            $this->store->delete('payload-'.$record['operationId']);

            return $record;
        });
    }

    private function mutate(string $id, callable $change): bool
    {
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            $updated = $record ? $change($record) : null;
            if ($updated === null) {
                return false;
            }
            $this->store->atomicWrite('operation-'.$id, json_encode($updated, JSON_THROW_ON_ERROR));

            return true;
        } finally {
            $lock->release();
        }
    }
}
