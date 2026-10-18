<?php

declare(strict_types=1);

namespace App\Mcp\Transport;

use Closure;
use Laravel\Mcp\Server\Contracts\Transport;
use RuntimeException;

final class BoundedStdioTransport implements Transport
{
    public const MAX_LINE_BYTES = 6_291_456 + 65_536;

    public const MAX_RESPONSE_BYTES = 6_291_456 + 65_536;

    public const READ_TIMEOUT_MILLISECONDS = 30_000;

    private ?Closure $handler = null;

    public static function fromStreams(mixed $input, mixed $output, int $maxLineBytes = self::MAX_LINE_BYTES, int $readChunkBytes = 8192, int $readTimeoutMilliseconds = self::READ_TIMEOUT_MILLISECONDS): self
    {
        return new self($maxLineBytes, $input, $output, $readChunkBytes, $readTimeoutMilliseconds);
    }

    private mixed $input;

    private mixed $output;

    public function __construct(private int $maxLineBytes = self::MAX_LINE_BYTES, mixed $input = null, mixed $output = null, private int $readChunkBytes = 8192, private int $readTimeoutMilliseconds = self::READ_TIMEOUT_MILLISECONDS)
    {
        $this->input = $input ?? STDIN;
        $this->output = $output ?? STDOUT;
        if (! is_resource($this->output) || ! stream_set_blocking($this->output, false)) {
            throw new RuntimeException('stdio_output_not_nonblocking');
        }
    }

    public function readLine(string $line): string
    {
        return StdioJsonRpcFrame::validate($line, $this->maxLineBytes);
    }

    public function onReceive(Closure $handler): void
    {
        $this->handler = $handler;
    }

    public function run(): void
    {
        $reader = new StdioFrameReader($this->input, $this->maxLineBytes, $this->readChunkBytes, $this->readTimeoutMilliseconds);
        while (($line = $reader->next()) !== null) {
            ($this->handler ?? throw new RuntimeException('stdio_handler_missing'))($this->readLine($line));
        }
    }

    public function send(string $message): void
    {
        if (strlen($message) + 1 > self::MAX_RESPONSE_BYTES || preg_match('//u', $message) !== 1) {
            throw new RuntimeException('stdio_response_invalid_or_too_large');
        }
        $this->writeAll($message."\n");
    }

    public function stream(Closure $stream): void
    {
        $stream();
    }

    private function writeAll(string $message): void
    {
        $offset = 0;
        $length = strlen($message);
        $deadline = hrtime(true) + $this->readTimeoutMilliseconds * 1_000_000;
        while ($offset < $length) {
            if (hrtime(true) >= $deadline) {
                throw new RuntimeException('stdio_write_timeout');
            }
            $written = fwrite($this->output, substr($message, $offset, min(8192, $length - $offset)));
            if ($written === false) {
                throw new RuntimeException('stdio_write_failed');
            }
            if ($written === 0) {
                usleep(1000);

                continue;
            }
            $offset += $written;
        }
        if (! fflush($this->output)) {
            throw new RuntimeException('stdio_write_failed');
        }
    }
}
