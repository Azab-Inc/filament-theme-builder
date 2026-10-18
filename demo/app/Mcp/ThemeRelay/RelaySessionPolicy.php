<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class RelaySessionPolicy
{
    /** @param array<string, mixed>|null $session */
    public static function isLive(?array $session, ?string $processId, int $at): bool
    {
        return $session !== null && ($session['status'] ?? null) === 'approved'
            && ($session['processId'] ?? null) === $processId
            && $at < ($session['createdAt'] ?? 0) + (int) config('local-theme-relay.session_seconds', 28800)
            && $at < ($session['lastActivityAt'] ?? 0) + (int) config('local-theme-relay.idle_seconds', 1800)
            && $at < ($session['leaseExpiresAt'] ?? 0);
    }
}
