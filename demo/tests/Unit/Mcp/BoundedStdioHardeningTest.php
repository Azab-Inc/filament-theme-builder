<?php

namespace Tests\Unit\Mcp;

use App\Mcp\Transport\BoundedStdioTransport;
use App\Mcp\Transport\StdioFrameReader;
use RuntimeException;
use Tests\Support\Mcp\InstrumentedStdioStream;
use Tests\TestCase;

class BoundedStdioHardeningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        InstrumentedStdioStream::register();
        InstrumentedStdioStream::$maxWriteBytes = 0;
        InstrumentedStdioStream::$emptyReads = 0;
        InstrumentedStdioStream::$readCalls = 0;
        InstrumentedStdioStream::$delayMicroseconds = 0;
        InstrumentedStdioStream::$output = '';
    }

    public function test_actual_limit_plus_one_is_rejected_without_a_frame_buffer_overrun(): void
    {
        $reader = $this->reader(str_repeat('1', BoundedStdioTransport::MAX_LINE_BYTES + 1)."\n", BoundedStdioTransport::MAX_LINE_BYTES);
        try {
            $reader->next();
            self::fail('Expected an oversized frame rejection.');
        } catch (RuntimeException $exception) {
            self::assertSame('stdio_message_too_large', $exception->getMessage());
        }
        self::assertSame(BoundedStdioTransport::MAX_LINE_BYTES, strlen($this->buffer($reader)));
    }

    public function test_over_limit_line_in_one_available_chunk_is_rejected_at_max_plus_one(): void
    {
        $reader = $this->reader("{\"x\":1}\n", 3, 8192);
        try {
            $reader->next();
            self::fail('Expected an oversized frame rejection.');
        } catch (RuntimeException $exception) {
            self::assertSame('stdio_message_too_large', $exception->getMessage());
        }
        self::assertSame('', $this->buffer($reader));
    }

    public function test_unselectable_blocking_custom_stream_is_rejected_before_read(): void
    {
        InstrumentedStdioStream::$input = "{\"jsonrpc\":\"2.0\"}\n";
        InstrumentedStdioStream::$emptyReads = 1;
        InstrumentedStdioStream::$delayMicroseconds = 200_000;
        $input = fopen('ftbtest://delayed', 'r');
        $reader = new StdioFrameReader($input, 1024, 8192, 10);
        $started = hrtime(true);
        try {
            $reader->next();
            self::fail('Expected an unsupported blocking stream rejection.');
        } catch (RuntimeException $exception) {
            self::assertSame('stdio_stream_not_selectable', $exception->getMessage());
        }
        self::assertSame(0, InstrumentedStdioStream::$readCalls);
        self::assertLessThan(100_000_000, hrtime(true) - $started);
    }

    public function test_selectable_stream_wait_is_interrupted_by_the_message_deadline(): void
    {
        [$input, $peer] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        $reader = new StdioFrameReader($input, 1024, 8192, 10);
        $started = hrtime(true);
        try {
            $reader->next();
            self::fail('Expected the readiness wait to time out.');
        } catch (RuntimeException $exception) {
            self::assertSame('stdio_read_timeout', $exception->getMessage());
        }
        self::assertGreaterThanOrEqual(5_000_000, hrtime(true) - $started);
        self::assertLessThan(100_000_000, hrtime(true) - $started);
        fclose($input);
        fclose($peer);
    }

    private function reader(string $input, int $maxBytes, int $chunk = 8192): StdioFrameReader
    {
        $stream = tmpfile();
        fwrite($stream, $input);
        rewind($stream);

        return new StdioFrameReader($stream, $maxBytes, $chunk);
    }

    private function buffer(StdioFrameReader $reader): string
    {
        $property = new \ReflectionProperty($reader, 'buffer');

        return $property->getValue($reader);
    }
}
