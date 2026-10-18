<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use JsonException;

final class RelayRecordReader
{
    public function __construct(private readonly RelayStore $store) {}

    /** @return array<string, mixed>|null */
    public function read(string $key): ?array
    {
        $raw = $this->store->read($key);
        if ($raw === null || strlen($raw) > RelayLimits::MAX_RECORD_BYTES) {
            return null;
        }
        try {
            $value = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);

            return is_array($value) ? $value : null;
        } catch (JsonException) {
            return null;
        }
    }

    /** @param array<string, mixed>|null $pair */
    public static function isPairing(?array $pair): bool
    {
        return $pair !== null && is_string($pair['tabKeyHash'] ?? null)
            && (is_string($pair['processId'] ?? null) || ($pair['processId'] ?? null) === null)
            && is_string($pair['sessionId'] ?? null) && is_int($pair['expiresAt'] ?? null)
            && is_string($pair['status'] ?? null);
    }
}
