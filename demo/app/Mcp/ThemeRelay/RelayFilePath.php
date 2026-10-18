<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class RelayFilePath
{
    public static function for(string $directory, string $key): string
    {
        if (! preg_match('/\A[a-zA-Z0-9_-]{1,128}\z/', $key)) {
            throw new \InvalidArgumentException('Invalid relay record key.');
        }

        return $directory.'/'.$key.'.json';
    }
}
