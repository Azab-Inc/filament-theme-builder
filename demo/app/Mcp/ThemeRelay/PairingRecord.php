<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final readonly class PairingRecord
{
    public function __construct(
        public string $pairingId,
        public string $tabKeyHash,
        public ?string $processId,
        public string $sessionId,
        public int $expiresAt,
        public string $status = 'pending',
    ) {}
}
