<?php

declare(strict_types=1);

namespace App\Mcp\Transport;

use RuntimeException;
use TypeError;
use ValueError;

final class StdioReadinessWaiter
{
    public static function wait(mixed $stream, int $remainingNanoseconds): void
    {
        if ($remainingNanoseconds <= 0) {
            throw new RuntimeException('stdio_read_timeout');
        }
        $read = [$stream];
        $write = null;
        $except = null;
        try {
            $ready = @stream_select($read, $write, $except, intdiv($remainingNanoseconds, 1_000_000_000), intdiv($remainingNanoseconds % 1_000_000_000, 1000));
        } catch (ValueError|TypeError) {
            throw new RuntimeException('stdio_stream_not_selectable');
        }
        if ($ready === false) {
            throw new RuntimeException('stdio_stream_not_selectable');
        }
        if ($ready === 0) {
            throw new RuntimeException('stdio_read_timeout');
        }
    }
}
