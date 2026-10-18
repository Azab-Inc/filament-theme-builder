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

    private ?Closure $handler = null;

    private int $maxLineBytes;

    public static function fromStreams(mixed $input, mixed $output, int $maxLineBytes = self::MAX_LINE_BYTES, int $readChunkBytes = 8192): self
    {
        return new self($maxLineBytes, $input, $output, $readChunkBytes);
    }

    private mixed $input;

    private mixed $output;

    private int $readChunkBytes = 8192;

    public function __construct(int $maxLineBytes = self::MAX_LINE_BYTES, mixed $input = null, mixed $output = null, int $readChunkBytes = 8192)
    {
        $this->maxLineBytes = $maxLineBytes;
        $this->input = $input ?? STDIN;
        $this->output = $output ?? STDOUT;
        $this->readChunkBytes = $readChunkBytes;
    }

    public function readLine(string $line): string
    {
        if (strlen($line) > $this->maxLineBytes) {
            throw new RuntimeException('stdio_message_too_large');
        }
        if ($line === '' || preg_match('//u', $line) !== 1) {
            throw new RuntimeException('stdio_invalid_encoding');
        }
        try {
            json_decode($line, false, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new RuntimeException('stdio_malformed_json');
        }

        return $line;
    }

    public function onReceive(Closure $handler): void
    {
        $this->handler = $handler;
    }

    public function run(): void
    {
        $reader = new StdioFrameReader($this->input, $this->maxLineBytes, $this->readChunkBytes);
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
        while ($message !== '') {
            $written = fwrite($this->output, $message);
            if ($written === false || $written === 0) {
                throw new RuntimeException('stdio_write_failed');
            }
            $message = substr($message, $written);
        }
        fflush($this->output);
    }
}
