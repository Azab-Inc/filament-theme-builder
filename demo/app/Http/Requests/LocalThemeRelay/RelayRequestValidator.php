<?php

declare(strict_types=1);

namespace App\Http\Requests\LocalThemeRelay;

use Illuminate\Http\Request;

final class RelayRequestValidator
{
    /**
     * @param  list<string>  $fields
     * @return array<string, mixed>|null
     */
    public static function exact(Request $request, array $fields): ?array
    {
        $body = $request->json()->all();
        $actual = array_keys($body);
        sort($actual);
        sort($fields);

        return $actual === $fields && ($body['version'] ?? null) === 1 ? $body : null;
    }

    public static function id(string $id): bool
    {
        return preg_match('/\A[a-f0-9]{64}\z/', $id) === 1;
    }
}
