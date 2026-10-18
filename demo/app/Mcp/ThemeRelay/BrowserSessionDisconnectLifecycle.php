<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class BrowserSessionDisconnectLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /** @param array<string, mixed> $session */
    public function disconnect(array $session): void
    {
        $index = $this->store->lock('session-index');
        try {
            $session['status'] = 'disconnected';
            $this->store->atomicWrite('session-'.$session['sessionId'], json_encode($session, JSON_THROW_ON_ERROR));
            $pair = $this->reader->read('pairing-'.$session['pairingId']);
            if ($pair !== null) {
                $pair['status'] = 'disconnected';
                $this->store->atomicWrite('pairing-'.$session['pairingId'], json_encode($pair, JSON_THROW_ON_ERROR));
            }
            $this->disconnectOperations($session['pairingId']);
        } finally {
            $index->release();
        }
    }

    private function disconnectOperations(string $pairingId): void
    {
        foreach ($this->store->keys('operation-') as $key) {
            $lock = $this->store->lock($key);
            try {
                $record = $this->reader->read($key);
                if (! $record || ($record['pairingId'] ?? null) !== $pairingId || ($record['status'] ?? null) !== 'pending') {
                    continue;
                }
                $record['status'] = 'disconnected';
                $record['result'] = null;
                $this->store->atomicWrite($key, json_encode($record, JSON_THROW_ON_ERROR));
                $this->store->delete('payload-'.substr($key, 10));
                $this->store->delete('result-'.substr($key, 10));
            } finally {
                $lock->release();
            }
        }
    }
}
