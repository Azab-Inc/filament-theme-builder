<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationPayloadLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock,
        private readonly OperationRetentionLifecycle $retention)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function publish(string $id, string $pairingId, string $processId, string $payload,
        string $filename, string $proposedName): bool
    {
        $bytes = strlen($payload);
        if (! preg_match('/\A[a-f0-9]{64}\z/', $id) || $bytes > RelayLimits::MAX_THEME_BYTES || ! mb_check_encoding($payload, 'UTF-8')
            || $filename !== 'filament-theme.json' || mb_strlen($proposedName) > 120) {
            return false;
        }
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            if (! $record || ($record['kind'] ?? null) !== 'import' || ($record['pairingId'] ?? null) !== $pairingId
                || ($record['processId'] ?? null) !== $processId || ($record['status'] ?? null) !== 'pending'
                || ($record['expiresAt'] ?? 0) <= $this->clock->now()
                || ! hash_equals((string) ($record['digest'] ?? ''), hash('sha256', $payload))) {
                return false;
            }
            $this->store->atomicWrite('payload-'.$id, $payload);
            $record['filename'] = $filename;
            $record['proposedName'] = $proposedName;
            $record['byteLength'] = $bytes;
            $record['payloadAvailable'] = true;
            $this->store->atomicWrite('operation-'.$id, json_encode($record, JSON_THROW_ON_ERROR));

            return true;
        } finally {
            $lock->release();
        }
    }

    /**
     * @param  array<string, mixed>  $session
     * @return array<string, mixed>|null
     */
    public function read(string $id, array $session): ?array
    {
        if (! preg_match('/\A[a-f0-9]{64}\z/', $id)) {
            return null;
        }
        $this->retention->expire($id, $session);
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            if (! $record || ($record['kind'] ?? null) !== 'import'
                || ($record['status'] ?? null) !== 'pending' || ! $this->matches($record, $session) || ($record['payloadAvailable'] ?? false) !== true
                || ($record['expiresAt'] ?? 0) <= $this->clock->now()) {
                return null;
            }
            $payload = $this->store->read('payload-'.$id);
            if ($payload === null || strlen($payload) > RelayLimits::MAX_THEME_BYTES) {
                return null;
            }

            return ['version' => 1, 'operationId' => $id, 'payload' => $payload,
                'filename' => $record['filename'], 'proposedName' => $record['proposedName'],
                'digest' => $record['digest'], 'byteLength' => strlen($payload)];
        } finally {
            $lock->release();
        }
    }

    /**
     * @param  array<string, mixed>  $record
     * @param  array<string, mixed>  $session
     */
    private function matches(array $record, array $session): bool
    {
        return ($record['pairingId'] ?? null) === $session['pairingId']
            && ($record['processId'] ?? null) === $session['processId'];
    }
}
