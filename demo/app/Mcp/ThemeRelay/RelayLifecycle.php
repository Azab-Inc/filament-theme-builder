<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class RelayLifecycle implements RelayLifecycleContract
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function createPairing(string $id, string $session, string $hash, string $process): void
    {
        (new PairingStore($this->store, $this->clock))->create($id, $session, $hash, $process);
    }

    public function createPendingPairing(string $id, string $session, string $hash): void
    {
        (new PairingStore($this->store, $this->clock))->createPending($id, $session, $hash);
    }

    public function bindPairing(string $id, string $process, string $session): bool
    {
        return (new PairingBindingLifecycle($this->store, $this->clock))->bind($id, $process, $session);
    }

    /** @return array{claimId:string,expiresAt:int}|null */
    public function issuePairingClaim(string $id, string $hash, string $session): ?array
    {
        return (new PairingClaimLifecycle($this->store, $this->clock))->issue($id, $hash, $session);
    }

    public function approveClaim(string $id, string $claimId, string $hash, string $session): ?string
    {
        return (new PairingClaimLifecycle($this->store, $this->clock))->approve($id, $claimId, $hash, $session);
    }

    public function approve(string $id, string $hash, string $process): void
    {
        (new PairingStore($this->store, $this->clock))->approve($id, $hash, $process);
    }

    public function heartbeat(string $pairingId, string $processId): void
    {
        $indexLock = $this->store->lock('session-index');
        try {
            $pair = $this->reader->read('pairing-'.$pairingId);
            if (! RelayRecordReader::isPairing($pair) || $pair['processId'] !== $processId || $pair['status'] !== 'approved') {
                throw new \RuntimeException('Pairing unavailable.');
            }
            $key = 'session-'.$pair['sessionId'];
            $lock = $this->store->lock($key);
            try {
                $session = $this->reader->read($key);
                if (! RelaySessionPolicy::isLive($session, $processId, $this->clock->now())) {
                    throw new \RuntimeException('Pairing unavailable.');
                }
                $session['leaseExpiresAt'] = $this->clock->now() + (int) config('local-theme-relay.lease_seconds', 45);
                $this->store->atomicWrite($key, json_encode($session, JSON_THROW_ON_ERROR));
            } finally {
                $lock->release();
            }
        } finally {
            $indexLock->release();
        }
    }

    public function authorize(string $pairingId, string $processId, int $at): AuthorizationResult
    {
        $indexLock = $this->store->lock('session-index');
        try {
            $pair = $this->reader->read('pairing-'.$pairingId);
            if (! RelayRecordReader::isPairing($pair) || $pair['processId'] !== $processId || $pair['status'] !== 'approved') {
                return new AuthorizationResult(false, 'pairing_required');
            }
            $key = 'session-'.$pair['sessionId'];
            $lock = $this->store->lock($key);
            try {
                $session = $this->reader->read($key);
                if (! RelaySessionPolicy::isLive($session, $processId, $at)) {
                    return new AuthorizationResult(false, 'pairing_required');
                }
                $session['lastActivityAt'] = $at;
                $this->store->atomicWrite($key, json_encode($session, JSON_THROW_ON_ERROR));

                return new AuthorizationResult(true);
            } finally {
                $lock->release();
            }
        } finally {
            $indexLock->release();
        }
    }
}
