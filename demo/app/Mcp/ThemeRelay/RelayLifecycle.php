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
