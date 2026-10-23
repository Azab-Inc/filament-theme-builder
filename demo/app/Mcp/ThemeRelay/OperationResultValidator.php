<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationResultValidator
{
    /** @param array<string, mixed> $result */
    public static function valid(string $kind, array $result): bool
    {
        if ($kind === 'list') {
            if (! self::hasKeys($result, ['version', 'themes']) || $result['version'] !== 1
                || ! is_array($result['themes']) || count($result['themes']) > 1000) {
                return false;
            }
            foreach ($result['themes'] as $theme) {
                if (! is_array($theme) || ! self::hasKeys($theme, ['id', 'name', 'updatedAt', 'active'])
                    || ! is_string($theme['id']) || ! is_string($theme['name']) || mb_strlen($theme['name']) > 120
                    || ! mb_check_encoding($theme['id'], 'UTF-8') || ! mb_check_encoding($theme['name'], 'UTF-8')
                    || ! is_int($theme['updatedAt']) || ! is_bool($theme['active'])) {
                    return false;
                }
            }

            return true;
        }

        return $kind === 'export' && self::hasKeys($result, ['version', 'filename', 'schemaVersion', 'json'])
            && $result['version'] === 1
            && $result['filename'] === 'filament-theme.json' && in_array($result['schemaVersion'], [4, 5], true)
            && is_string($result['json']) && strlen($result['json']) <= RelayLimits::MAX_THEME_BYTES
            && mb_check_encoding($result['json'], 'UTF-8');
    }

    /**
     * @param  array<string, mixed>  $result
     * @param  list<string>  $keys
     */
    private static function hasKeys(array $result, array $keys): bool
    {
        $actual = array_keys($result);
        sort($actual);
        sort($keys);

        return $actual === $keys;
    }
}
