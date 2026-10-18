<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use JsonException;

final class FileRelayStore implements RelayStore
{
    private readonly string $directory;

    public function __construct(string $directory)
    {
        $this->directory = (new PrivateRelayDirectory($directory))->path;
    }

    /** @return list<string> */
    public function keys(string $prefix): array
    {
        return array_map(static fn (string $file): string => basename($file, '.json'),
            glob($this->directory.'/'.$prefix.'*.json') ?: []);
    }

    public function read(string $key): ?string
    {
        $path = RelayFilePath::for($this->directory, $key);
        if (! is_file($path)) {
            return null;
        }
        $value = file_get_contents($path);

        return is_string($value) && strlen($value) <= RelayLimits::MAX_RECORD_BYTES ? $value : null;
    }

    /** @return array<string, mixed>|null */
    public function readJson(string $key): ?array
    {
        try {
            $value = $this->read($key);
            if ($value === null) {
                return null;
            }
            $decoded = json_decode($value, true, 32, JSON_THROW_ON_ERROR);

            return is_array($decoded) ? $decoded : null;
        } catch (JsonException) {
            return null;
        }
    }

    public function atomicWrite(string $key, string $value): void
    {
        if (str_starts_with($key, 'payload-') && strlen($value) > RelayLimits::MAX_THEME_BYTES) {
            throw new \InvalidArgumentException('Relay payload exceeds the theme limit.');
        }
        if (strlen($value) > RelayLimits::MAX_RECORD_BYTES) {
            throw new \InvalidArgumentException('Relay record exceeds the protocol limit.');
        }
        $path = RelayFilePath::for($this->directory, $key);
        $tmp = tempnam($this->directory, '.tmp-');
        if ($tmp === false) {
            throw new \RuntimeException('Relay storage unavailable.');
        }
        try {
            chmod($tmp, 0600);
            if (file_put_contents($tmp, $value, LOCK_EX) !== strlen($value) || ! rename($tmp, $path)) {
                throw new \RuntimeException('Relay storage unavailable.');
            }
        } finally {
            if (is_file($tmp)) {
                unlink($tmp);
            }
        }
    }

    public function delete(string $key): void
    {
        $path = RelayFilePath::for($this->directory, $key);
        if (is_file($path)) {
            unlink($path);
        }
    }

    public function lock(string $key): LockHandle
    {
        $handle = fopen(RelayFilePath::for($this->directory, 'lock-'.$key), 'c');
        if ($handle === false || ! flock($handle, LOCK_EX)) {
            throw new \RuntimeException('Relay storage unavailable.');
        }

        return new FileLockHandle($handle);
    }
}
