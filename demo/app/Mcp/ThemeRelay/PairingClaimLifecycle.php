<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class PairingClaimLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /** @return array{claimId:string,expiresAt:int}|null */
    public function issue(string $id, string $hash, string $sessionId): ?array
    {
        $lock = $this->store->lock('session-index');
        try {
            $pair = $this->reader->read('pairing-'.$id);
            if (! RelayRecordReader::isPairing($pair) || $pair['status'] !== 'pending' || $pair['sessionId'] !== $sessionId
                || ! hash_equals($pair['tabKeyHash'], $hash) || $pair['expiresAt'] <= $this->clock->now()) {
                return null;
            }
            $claimId = bin2hex(random_bytes(32));
            $expires = $pair['expiresAt'];
            $claim = ['claimId' => $claimId, 'pairingId' => $id, 'processId' => $pair['processId'],
                'sessionId' => $sessionId, 'expiresAt' => $expires];
            $this->store->atomicWrite('claim-'.$id, json_encode($claim, JSON_THROW_ON_ERROR));

            return ['claimId' => $claimId, 'expiresAt' => $expires];
        } finally {
            $lock->release();
        }
    }

    public function approve(string $id, string $claimId, string $hash, string $sessionId): ?string
    {
        $lock = $this->store->lock('session-index');
        try {
            $pair = $this->reader->read('pairing-'.$id);
            $claim = $this->reader->read('claim-'.$id);
            if (! RelayRecordReader::isPairing($pair) || ! $claim || $pair['status'] !== 'pending'
                || $pair['sessionId'] !== $sessionId || ($claim['processId'] ?? null) !== $pair['processId']
                || $claim['sessionId'] !== $sessionId || $claim['expiresAt'] <= $this->clock->now()
                || ! hash_equals($pair['tabKeyHash'], $hash) || ! hash_equals($claim['claimId'], $claimId)) {
                return null;
            }
            $this->store->delete('claim-'.$id);
            $pair['status'] = 'approved';
            $sessionExpiresAt = $this->clock->now() + (int) config('local-theme-relay.session_seconds', 28800);
            $pair['expiresAt'] = $sessionExpiresAt;
            $this->store->atomicWrite('pairing-'.$id, json_encode($pair, JSON_THROW_ON_ERROR));
            $now = $this->clock->now();
            $this->store->atomicWrite('session-'.$sessionId, json_encode([
                'sessionId' => $sessionId, 'pairingId' => $id, 'tabKeyHash' => $hash,
                'processId' => null, 'createdAt' => $now, 'lastActivityAt' => $now,
                'leaseExpiresAt' => $sessionExpiresAt, 'status' => 'approved',
            ], JSON_THROW_ON_ERROR));
            $index = $this->reader->read('session-index') ?? ['sessions' => []];
            if (! in_array($sessionId, $index['sessions'] ?? [], true)) {
                $index['sessions'][] = $sessionId;
                $this->store->atomicWrite('session-index', json_encode($index, JSON_THROW_ON_ERROR));
            }
        } finally {
            $lock->release();
        }

        return $sessionId;
    }
}
