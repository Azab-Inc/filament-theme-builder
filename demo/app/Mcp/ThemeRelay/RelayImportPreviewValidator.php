<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class RelayImportPreviewValidator
{
    /** @param array<string, mixed> $preview */
    public static function valid(array $preview): bool
    {
        $keys = ['sourceVersion', 'targetVersion', 'migrationPath', 'displayName', 'summary', 'payloadDigest', 'byteLength'];
        $actual = array_keys($preview);
        $allowed = [$keys, [...$keys, 'candidateDigest']];
        sort($actual);
        sort($keys);

        return in_array($actual, array_map(static function (array $item): array {
            sort($item);

            return $item;
        }, $allowed), true)
            && in_array($preview['sourceVersion'], [1, 2, 3, 4, 5, 6, 7], true)
            && in_array($preview['targetVersion'], [4, 5, 6, 7], true) && is_array($preview['migrationPath'])
           && array_filter($preview['migrationPath'], static fn (mixed $version): bool => ! is_int($version)) === []
           && is_string($preview['displayName']) && mb_strlen($preview['displayName']) <= 120
           && is_array($preview['summary']) && count($preview['summary']) <= 32
           && array_filter($preview['summary'], static fn (mixed $line): bool => ! is_string($line) || mb_strlen($line) > 256) === []
           && is_string($preview['payloadDigest']) && preg_match('/\A[a-f0-9]{64}\z/', $preview['payloadDigest']) === 1
            && (! array_key_exists('candidateDigest', $preview) || (is_string($preview['candidateDigest']) && preg_match('/\A[a-f0-9]{64}\z/', $preview['candidateDigest']) === 1))
            && is_int($preview['byteLength']) && $preview['byteLength'] >= 0
           && $preview['byteLength'] <= RelayLimits::MAX_THEME_BYTES;
    }
}
