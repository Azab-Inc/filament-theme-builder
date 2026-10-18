<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

interface RelayLifecycleContract
{
    public function approve(string $pairingId, string $tabKeyHash, string $processId): void;

    public function heartbeat(string $pairingId, string $processId): void;

    public function authorize(string $pairingId, string $processId, int $at): AuthorizationResult;
}
