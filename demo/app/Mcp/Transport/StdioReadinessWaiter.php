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
        [$seconds, $microseconds] = self::timeoutParts($remainingNanoseconds);
        try {
            $ready = @stream_select($read, $write, $except, $seconds, $microseconds);
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

    /** @return array{int, int} */
    public static function timeoutParts(int $remainingNanoseconds): array
    {
        $seconds = intdiv($remainingNanoseconds, 1_000_000_000);
        $microseconds = intdiv($remainingNanoseconds % 1_000_000_000 + 999, 1000);
        if ($microseconds === 1_000_000) {
            $seconds++;
            $microseconds = 0;
        }

        return [$seconds, $microseconds];
    }
}
