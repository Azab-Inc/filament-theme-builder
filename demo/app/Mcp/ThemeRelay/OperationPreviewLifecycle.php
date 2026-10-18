<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationPreviewLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock,
        private readonly ImportGrantStore $grants)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /**
     * @param  array<string, mixed>  $preview
     * @param  array<string, mixed>  $session
     */
    public function record(string $id, array $preview, array $session): ?string
    {
        if (! RelayImportPreviewValidator::valid($preview)) {
            return $this->rejectPreview($id, $session) ? 'rejected' : null;
        }
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            if (! $record || ($record['kind'] ?? null) !== 'import' || ($record['pairingId'] ?? null) !== $session['pairingId']
                || ($record['processId'] ?? null) !== $session['processId'] || ($record['status'] ?? null) !== 'pending'
                || ($record['expiresAt'] ?? 0) <= $this->clock->now() || ($record['digest'] ?? null) !== $preview['payloadDigest']) {
                return null;
            }
            $record['preview'] = $preview;
            $this->store->atomicWrite('operation-'.$id, json_encode($record, JSON_THROW_ON_ERROR));

            return 'pending';
        } finally {
            $lock->release();
        }
    }

    /** @param array<string, mixed> $session */
    private function rejectPreview(string $id, array $session): bool
    {
        $lock = RelayRecordLock::acquire($this->store, 'operation-'.$id);
        try {
            $record = $this->reader->read('operation-'.$id);
            if (! $record || ($record['pairingId'] ?? null) !== $session['pairingId']
                || ($record['processId'] ?? null) !== $session['processId'] || ($record['status'] ?? null) !== 'pending') {
                return false;
            }
            $record['status'] = 'rejected';
            $record['errorCategory'] = 'invalid_theme';
            $this->store->delete('payload-'.$id);
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
    public function authorizeApply(string $id, string $digest, int $revision, string $name, array $session): ?array
    {
        $record = $this->operationsRecord($id, $session);
        if (! $record || ($record['kind'] ?? null) !== 'import' || ($record['status'] ?? null) !== 'pending'
            || ($record['digest'] ?? null) !== $digest || ! is_array($record['preview'] ?? null)) {
            return null;
        }
        $grant = $this->grants->issue($id, $digest, $name, $revision, $session['sessionId']);

        return ['version' => 1, 'status' => 'pending', 'grantId' => $grant,
            'grantExpiresAt' => $this->clock->now() + 5];
    }

    /**
     * @param  array<string, mixed>  $session
     * @return array<string, mixed>|null
     */
    private function operationsRecord(string $id, array $session): ?array
    {
        $record = $this->reader->read('operation-'.$id);

        return $record && ($record['pairingId'] ?? null) === $session['pairingId']
            && ($record['processId'] ?? null) === $session['processId'] ? $record : null;
    }
}
