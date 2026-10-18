<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class BrowserSessionLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock,
        private readonly OperationStore $operations, private readonly OperationRetentionLifecycle $retention)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /** @return array<string, mixed>|null */
    public function authorize(string $sessionId, string $hash, string $cookieSessionId): ?array
    {
        if ($sessionId !== $cookieSessionId) {
            return null;
        }
        $lock = RelayRecordLock::acquire($this->store, 'session-'.$sessionId);
        try {
            $session = $this->reader->read('session-'.$sessionId);
            if (! is_array($session) || ! is_string($session['pairingId'] ?? null)
                || ! is_string($session['processId'] ?? null) || ! is_string($session['tabKeyHash'] ?? null)
                || ! hash_equals($session['tabKeyHash'], $hash)
                || ! RelaySessionPolicy::isLive($session, $session['processId'], $this->clock->now())) {
                return null;
            }

            return $session;
        } finally {
            $lock->release();
        }
    }

    /**
     * @param  array<string, mixed>  $session
     * @return list<array<string, mixed>>
     */
    public function poll(array $session): array
    {
        $notices = [];
        foreach ($this->store->keys('operation-') as $key) {
            $operationId = substr($key, 10);
            $this->retention->expire($operationId, $session);
            $record = $this->operations->read($operationId);
            if (! $record || ($record['pairingId'] ?? null) !== $session['pairingId']
                || ($record['processId'] ?? null) !== $session['processId']) {
                continue;
            }
            $notice = ['operationId' => $record['operationId'], 'kind' => $record['kind'],
                'status' => $this->status($record)];
            if ($record['kind'] === 'export' && is_string($record['themeId'] ?? null)) {
                $notice['themeId'] = $record['themeId'];
            }
            $notices[] = $notice;
        }

        return $notices;
    }

    /** @param array<string, mixed> $record */
    private function status(array $record): string
    {
        $status = ($record['expiresAt'] ?? 0) <= $this->clock->now() && $record['status'] === 'pending'
            ? 'expired' : $record['status'];

        return $status === 'consumed' ? 'approved' : $status;
    }
}
