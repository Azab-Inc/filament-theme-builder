<?php

declare(strict_types=1);

namespace App\Mcp\Transport;

use JsonException;
use RuntimeException;

final class StdioJsonRpcFrame
{
    public static function validate(string $line, int $maxBytes): string
    {
        if (strlen($line) > $maxBytes) {
            throw new RuntimeException('stdio_message_too_large');
        }
        if ($line === '' || preg_match('//u', $line) !== 1) {
            throw new RuntimeException('stdio_invalid_encoding');
        }
        try {
            $message = json_decode($line, false, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new RuntimeException('stdio_malformed_json');
        }
        if (! is_object($message)) {
            throw new RuntimeException('stdio_malformed_json');
        }

        return $line;
    }
}
