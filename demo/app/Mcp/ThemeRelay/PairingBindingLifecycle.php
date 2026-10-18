<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class PairingBindingLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function bind(string $pairingId, string $processId, string $sessionId): bool
    {
        if (! preg_match('/\A[a-zA-Z0-9_-]{1,120}\z/', $pairingId)
            || ! preg_match('/\A[a-zA-Z0-9_-]{1,112}\z/', $sessionId) || $processId === '' || strlen($processId) > 128) {
            return false;
        }
        $lock = $this->store->lock('session-index');
        try {
            $pair = $this->reader->read('pairing-'.$pairingId);
            if (! RelayRecordReader::isPairing($pair) || $pair['sessionId'] !== $sessionId
                || $pair['expiresAt'] <= $this->clock->now() || ! in_array($pair['status'], ['pending', 'approved'], true)) {
                return false;
            }
            if ($pair['processId'] !== null && $pair['processId'] !== $processId) {
                return false;
            }
            if ($pair['processId'] === $processId) {
                return true;
            }
            $pair['processId'] = $processId;
            $this->store->atomicWrite('pairing-'.$pairingId, json_encode($pair, JSON_THROW_ON_ERROR));
            $this->store->delete('claim-'.$pairingId);

            return true;
        } finally {
            $lock->release();
        }
    }
}
