<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final readonly class SessionRecord
{
    public function __construct(
        public string $sessionId,
        public string $pairingId,
        public string $tabKeyHash,
        public string $processId,
        public int $createdAt,
        public int $lastActivityAt,
        public int $leaseExpiresAt,
        public string $status = 'approved',
    ) {}
}
