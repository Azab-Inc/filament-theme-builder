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
        InstrumentedStdioStream::$delayMicroseconds = 0;
        InstrumentedStdioStream::$output = '';
    }

    public function test_actual_limit_plus_one_is_rejected_without_a_frame_buffer_overrun(): void
    {
        InstrumentedStdioStream::$input = str_repeat('1', BoundedStdioTransport::MAX_LINE_BYTES + 1)."\n";
        $reader = $this->reader(BoundedStdioTransport::MAX_LINE_BYTES);
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
        InstrumentedStdioStream::$input = "{\"x\":1}\n";
        $reader = $this->reader(3, 8192);
        try {
            $reader->next();
            self::fail('Expected an oversized frame rejection.');
        } catch (RuntimeException $exception) {
            self::assertSame('stdio_message_too_large', $exception->getMessage());
        }
        self::assertSame('', $this->buffer($reader));
    }

    public function test_deadline_applies_to_delayed_custom_streams(): void
    {
        InstrumentedStdioStream::$input = "{\"jsonrpc\":\"2.0\"}\n";
        InstrumentedStdioStream::$emptyReads = 1;
        InstrumentedStdioStream::$delayMicroseconds = 20_000;
        $input = fopen('ftbtest://delayed', 'r');
        $transport = BoundedStdioTransport::fromStreams($input, fopen('php://memory', 'w+'), readTimeoutMilliseconds: 5);
        $transport->onReceive(static fn (string $message) => null);
        $this->expectExceptionMessage('stdio_read_timeout');
        $transport->run();
    }

    private function reader(int $maxBytes, int $chunk = 8192): StdioFrameReader
    {
        return new StdioFrameReader(fopen('ftbtest://input', 'r'), $maxBytes, $chunk);
    }

    private function buffer(StdioFrameReader $reader): string
    {
        $property = new \ReflectionProperty($reader, 'buffer');

        return $property->getValue($reader);
    }
}
