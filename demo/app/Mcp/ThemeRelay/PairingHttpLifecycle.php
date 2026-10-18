<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class PairingHttpLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock,
        private readonly RelayLifecycle $lifecycle)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /** @return array{version:int, pairingId:string, status:string, expiresAt:int} */
    public function create(string $id, string $hash, string $session): array
    {
        $this->lifecycle->createPendingPairing($id, $session, $hash);
        $created = $this->reader->read('pairing-'.$id);

        return ['version' => 1, 'pairingId' => $id, 'status' => 'pending',
            'expiresAt' => $created['expiresAt'] ?? $this->clock->now()];
    }

    /** @return array<string, mixed>|null */
    public function status(string $id, string $hash, string $session): ?array
    {
        $pair = $this->reader->read('pairing-'.$id);
        if (! RelayRecordReader::isPairing($pair) || $pair['sessionId'] !== $session
            || ! hash_equals($pair['tabKeyHash'], $hash)) {
            return null;
        }
        $status = $pair['expiresAt'] <= $this->clock->now() && $pair['status'] === 'pending' ? 'expired' : $pair['status'];
        $result = ['version' => 1, 'pairingId' => $id, 'status' => $status, 'expiresAt' => $pair['expiresAt']];
        if ($status === 'pending') {
            $claim = $this->lifecycle->issuePairingClaim($id, $hash, $session);
            if ($claim !== null) {
                $result['claimId'] = $claim['claimId'];
            }
        }

        return $result;
    }

    /** @return array<string, mixed>|null */
    public function approve(string $id, string $claim, string $hash, string $session): ?array
    {
        $approved = $this->lifecycle->approveClaim($id, $claim, $hash, $session);
        if ($approved === null) {
            return null;
        }

        return ['version' => 1, 'status' => 'approved', 'sessionId' => $approved,
            'sessionExpiresAt' => $this->clock->now() + (int) config('local-theme-relay.session_seconds', 28800)];
    }
}
