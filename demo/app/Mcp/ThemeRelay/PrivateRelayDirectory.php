<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class PrivateRelayDirectory
{
    public function __construct(public readonly string $path)
    {
        $tmp = realpath(sys_get_temp_dir());
        $repository = realpath(base_path());
        if ($tmp === false || dirname($path) !== $tmp || (fileperms($tmp) & 01000) !== 01000
            || $repository === false || $path === $repository
            || str_starts_with($path, $repository.DIRECTORY_SEPARATOR)) {
            throw new \InvalidArgumentException('Unsafe relay storage path.');
        }
        if (! is_dir($path) && ! mkdir($path, 0700) && ! is_dir($path)) {
            throw new \RuntimeException('Relay storage unavailable.');
        }
        if (! function_exists('posix_geteuid')) {
            throw new \InvalidArgumentException('Relay runtime identity is unavailable.');
        }
        $runtimeUser = posix_geteuid();
        if (realpath($path) !== $path || fileowner($path) !== $runtimeUser) {
            throw new \InvalidArgumentException('Unsafe relay storage path.');
        }
        chmod($path, 0700);
        if ((fileperms($path) & 0777) !== 0700) {
            throw new \RuntimeException('Relay storage unavailable.');
        }
    }
}
