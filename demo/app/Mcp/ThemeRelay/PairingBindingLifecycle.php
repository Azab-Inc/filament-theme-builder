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
                || $pair['expiresAt'] <= $this->clock->now() || $pair['status'] !== 'approved') {
                return false;
            }
            $sessionLock = $this->store->lock('session-'.$sessionId);
            try {
                $session = $this->reader->read('session-'.$sessionId);
                if (! $session || ($session['pairingId'] ?? null) !== $pairingId
                    || ($session['sessionId'] ?? null) !== $sessionId || ($session['tabKeyHash'] ?? null) !== $pair['tabKeyHash']
                    || ($session['status'] ?? null) !== 'approved'
                    || ! RelaySessionPolicy::isLive($session, $session['processId'] ?? null, $this->clock->now())) {
                    return false;
                }
                if ($pair['processId'] !== null || ($session['processId'] ?? null) !== null) {
                    return $pair['processId'] === $processId && $session['processId'] === $processId;
                }
                $pair['processId'] = $processId;
                $session['processId'] = $processId;
                $session['leaseExpiresAt'] = $this->clock->now() + (int) config('local-theme-relay.lease_seconds', 45);
                $this->store->atomicWrite('pairing-'.$pairingId, json_encode($pair, JSON_THROW_ON_ERROR));
                $this->store->atomicWrite('session-'.$sessionId, json_encode($session, JSON_THROW_ON_ERROR));
            } finally {
                $sessionLock->release();
            }

            return true;
        } finally {
            $lock->release();
        }
    }
}
