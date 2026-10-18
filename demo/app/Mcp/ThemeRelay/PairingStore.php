<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class PairingStore
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function create(string $pairingId, string $sessionId, string $tabKeyHash, string $processId): void
    {
        $lock = $this->store->lock('session-index');
        try {
            if (! preg_match('/\A[a-f0-9]{64}\z/', $tabKeyHash)) {
                throw new \InvalidArgumentException('Invalid tab credential hash.');
            }
            $record = new PairingRecord($pairingId, $tabKeyHash, $processId, $sessionId,
                $this->clock->now() + (int) config('local-theme-relay.pairing_seconds', 300));
            $this->store->atomicWrite('pairing-'.$pairingId, json_encode($record, JSON_THROW_ON_ERROR));
        } finally {
            $lock->release();
        }
    }

    public function approve(string $pairingId, string $tabKeyHash, string $processId): void
    {
        $lock = $this->store->lock('session-index');
        try {
            $pair = $this->reader->read('pairing-'.$pairingId);
            if (! RelayRecordReader::isPairing($pair) || $pair['expiresAt'] <= $this->clock->now()
                || $pair['processId'] !== $processId || ! hash_equals($pair['tabKeyHash'], $tabKeyHash)
                || $pair['status'] !== 'pending') {
                throw new \RuntimeException('Pairing unavailable.');
            }
            $pair['status'] = 'approved';
            $this->store->atomicWrite('pairing-'.$pairingId, json_encode($pair, JSON_THROW_ON_ERROR));
            $now = $this->clock->now();
            $this->store->atomicWrite('session-'.$pair['sessionId'], json_encode([
                'sessionId' => $pair['sessionId'], 'pairingId' => $pairingId, 'tabKeyHash' => $tabKeyHash,
                'processId' => $processId, 'createdAt' => $now, 'lastActivityAt' => $now,
                'leaseExpiresAt' => $now + (int) config('local-theme-relay.lease_seconds', 45), 'status' => 'approved',
            ], JSON_THROW_ON_ERROR));
            $index = $this->reader->read('session-index') ?? ['sessions' => []];
            $index['sessions'][] = $pair['sessionId'];
            $this->store->atomicWrite('session-index', json_encode($index, JSON_THROW_ON_ERROR));
        } finally {
            $lock->release();
        }
    }
}
