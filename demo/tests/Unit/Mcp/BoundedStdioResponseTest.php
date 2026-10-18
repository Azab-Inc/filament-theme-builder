<?php

namespace Tests\Unit\Mcp;

use App\Mcp\Transport\BoundedStdioTransport;
use Tests\Support\Mcp\InstrumentedStdioStream;
use Tests\TestCase;

class BoundedStdioResponseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        InstrumentedStdioStream::register();
        InstrumentedStdioStream::$output = '';
        InstrumentedStdioStream::$maxWriteBytes = 2;
    }

    public function test_partial_writes_drain_a_json_rpc_frame_without_extra_stdout(): void
    {
        $transport = $this->transport();
        $transport->send('{"jsonrpc":"2.0","id":1}');
        self::assertSame("{\"jsonrpc\":\"2.0\",\"id\":1}\n", InstrumentedStdioStream::$output);
    }

    public function test_response_boundary_includes_newline_and_rejects_before_writing(): void
    {
        InstrumentedStdioStream::$maxWriteBytes = 0;
        $transport = $this->transport();
        $prefix = '{"jsonrpc":"2.0","id":1,"result":{"x":"';
        $suffix = '"}}';
        $exact = $prefix.str_repeat('x', BoundedStdioTransport::MAX_RESPONSE_BYTES - 1 - strlen($prefix) - strlen($suffix)).$suffix;
        $transport->send($exact);
        self::assertSame(BoundedStdioTransport::MAX_RESPONSE_BYTES, strlen(InstrumentedStdioStream::$output));
        InstrumentedStdioStream::$output = '';
        try {
            $transport->send($exact.' ');
            self::fail('Expected the oversized response to be rejected.');
        } catch (\RuntimeException $exception) {
            self::assertSame('stdio_response_invalid_or_too_large', $exception->getMessage());
        }
        self::assertSame('', InstrumentedStdioStream::$output);
    }

    private function transport(): BoundedStdioTransport
    {
        return BoundedStdioTransport::fromStreams(fopen('php://memory', 'r+'), fopen('ftbtest://output', 'w'));
    }
}
