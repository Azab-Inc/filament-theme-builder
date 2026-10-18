<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final readonly class OperationRecord
{
    public function __construct(
        public string $operationId,
        public string $kind,
        public string $pairingId,
        public string $processId,
        public string $digest,
        public string $status,
        public int $expiresAt,
        public ?string $result = null,
    ) {}
}
