<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use JsonException;

final class SessionCleanup
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly FileRelayStore $store, private readonly RelayClock $clock)
    {
        $this->reader = new RelayRecordReader($store);
    }

    public function removeStale(): void
    {
        $lock = $this->store->lock('session-index');
        try {
            $index = $this->reader->read('session-index') ?? ['sessions' => []];
            $sessions = is_array($index['sessions'] ?? null) ? $index['sessions'] : [];
            foreach ($sessions as $sessionId) {
                if (! is_string($sessionId) || ! preg_match('/\A[a-zA-Z0-9_-]{1,128}\z/', $sessionId)) {
                    continue;
                }
                $key = 'session-'.$sessionId;
                $sessionLock = $this->store->lock($key);
                try {
                    $session = $this->reader->read($key);
                    if (! RelaySessionPolicy::isLive($session, (string) ($session['processId'] ?? ''), $this->clock->now())) {
                        $this->remove($sessionId, $session);
                    }
                } finally {
                    $sessionLock->release();
                }
            }
            $index['sessions'] = array_values(array_filter($sessions, fn (mixed $id): bool => is_string($id) && preg_match('/\A[a-zA-Z0-9_-]{1,128}\z/', $id)
                && $this->reader->read('session-'.$id) !== null));
            $this->store->atomicWrite('session-index', json_encode($index, JSON_THROW_ON_ERROR));
            $this->removeExpiredPairings();
        } catch (JsonException) {
            throw new \RuntimeException('Relay state unavailable.');
        } finally {
            $lock->release();
        }
    }

    /** @param array<string, mixed>|null $session */
    private function remove(string $id, ?array $session): void
    {
        $this->store->delete('session-'.$id);
        if ($session === null) {
            return;
        }
        $pairingId = $session['pairingId'] ?? null;
        if (! is_string($pairingId) || ! preg_match('/\A[a-zA-Z0-9_-]{1,128}\z/', $pairingId)) {
            return;
        }
        $this->store->delete('pairing-'.$pairingId);
        $this->store->delete('claim-'.$pairingId);
        foreach ($this->store->keys('operation-') as $key) {
            $lock = $this->store->lock($key);
            try {
                $operation = $this->store->readJson($key);
                if (($operation['pairingId'] ?? null) === $pairingId) {
                    $this->store->delete('payload-'.substr($key, 10));
                    $this->store->delete($key);
                }
            } finally {
                $lock->release();
            }
        }
    }

    private function removeExpiredPairings(): void
    {
        foreach ($this->store->keys('pairing-') as $key) {
            $pair = $this->reader->read($key);
            if (($pair['status'] ?? null) === 'pending' && ($pair['expiresAt'] ?? 0) <= $this->clock->now()) {
                $this->store->delete($key);
                $this->store->delete('claim-'.substr($key, 8));
            }
        }
    }
}
