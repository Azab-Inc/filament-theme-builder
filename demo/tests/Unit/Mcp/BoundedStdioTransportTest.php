<?php

namespace Tests\Unit\Mcp;

use App\Mcp\Transport\BoundedStdioTransport;
use RuntimeException;
use Tests\TestCase;

class BoundedStdioTransportTest extends TestCase
{
    public function test_it_drains_multiple_newline_messages_and_stdout_contains_only_frames(): void
    {
        [$transport, $output] = $this->transport("{\"x\":1}\n{\"x\":2}\n");
        $received = [];
        $transport->onReceive(static function (string $message) use (&$received, $transport): void {
            $received[] = $message;
            $transport->send('{"jsonrpc":"2.0","id":1}');
        });
        $transport->run();
        rewind($output);
        self::assertSame(['{"x":1}', '{"x":2}'], $received);
        self::assertSame("{\"jsonrpc\":\"2.0\",\"id\":1}\n{\"jsonrpc\":\"2.0\",\"id\":1}\n", stream_get_contents($output));
    }

    public function test_it_accepts_partial_reads_and_utf8_split_across_chunks(): void
    {
        [$transport] = $this->transport("{\"value\":\"café\"}\n", 1);
        $messages = [];
        $transport->onReceive(static function (string $message) use (&$messages): void {
            $messages[] = $message;
        });
        $transport->run();
        self::assertSame(['{"value":"café"}'], $messages);
    }

    public function test_it_rejects_oversized_and_malformed_frames(): void
    {
        $this->expectException(RuntimeException::class);
        $transport = new BoundedStdioTransport(maxLineBytes: 2);
        self::assertSame('{}', $transport->readLine('{}'));
        $transport->readLine('{"x":1}');
    }

    public function test_newline_at_the_exact_limit_is_accepted(): void
    {
        $in = tmpfile();
        fwrite($in, "{}\n");
        rewind($in);
        $transport = BoundedStdioTransport::fromStreams($in, fopen('php://memory', 'w+'), 2);
        $lines = [];
        $transport->onReceive(static function (string $line) use (&$lines): void {
            $lines[] = $line;
        });
        $transport->run();
        self::assertSame(['{}'], $lines);
    }

    public function test_message_above_the_configured_stream_limit_is_rejected(): void
    {
        $in = tmpfile();
        fwrite($in, "12\n");
        rewind($in);
        $transport = BoundedStdioTransport::fromStreams($in, fopen('php://memory', 'w+'), 1);
        $transport->onReceive(static fn (string $line) => null);
        $this->expectExceptionMessage('stdio_message_too_large');
        $transport->run();
    }

    public function test_malformed_and_truncated_messages_have_safe_errors(): void
    {
        foreach (["{bad}\n" => 'stdio_malformed_json', '{"x":1}' => 'stdio_truncated_message', "\xFF\n" => 'stdio_invalid_encoding'] as $input => $error) {
            [$transport] = $this->transport($input);
            $transport->onReceive(static fn (string $message) => null);
            try {
                $transport->run();
                self::fail('Expected '.$error);
            } catch (RuntimeException $exception) {
                self::assertSame($error, $exception->getMessage());
            }
        }
    }

    public function test_line_limit_matches_the_approved_envelope_bound(): void
    {
        self::assertSame(6_291_456 + 65_536, BoundedStdioTransport::MAX_LINE_BYTES);
        self::assertSame(6_291_456 + 65_536, BoundedStdioTransport::MAX_RESPONSE_BYTES);
    }

    private function transport(string $input, int $chunkSize = 8192): array
    {
        $in = tmpfile();
        fwrite($in, $input);
        rewind($in);
        $out = fopen('php://memory', 'w+');
        $transport = BoundedStdioTransport::fromStreams($in, $out, readChunkBytes: $chunkSize);
        $transport->onReceive(static fn (string $message) => $transport->send('reply'));

        return [$transport, $out];
    }
}
