<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final readonly class ImportGrantRecord
{
    public function __construct(
        public string $grantId,
        public string $operationId,
        public string $digest,
        public string $displayName,
        public int $revision,
        public string $sessionId,
        public int $expiresAt,
        public string $status = 'pending',
    ) {}
}
