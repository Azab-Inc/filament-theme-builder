<?php

declare(strict_types=1);

namespace App\Mcp\Transport;

use InvalidArgumentException;
use RuntimeException;

final class StdioFrameReader
{
    private string $buffer = '';

    private int|float|null $deadline = null;

    public function __construct(private mixed $input, private int $maxBytes, private int $chunkBytes = 8192)
    {
        if (! is_resource($input) || $maxBytes < 1 || $chunkBytes < 1) {
            throw new InvalidArgumentException('stdio_reader_configuration_invalid');
        }
    }

    public function next(): ?string
    {
        while (true) {
            if (($newline = strpos($this->buffer, "\n")) !== false) {
                $this->deadline = null;

                return $this->takeLine($newline);
            }
            $this->deadline ??= hrtime(true) + 30_000_000_000;
            $chunk = $this->readChunk();
            if ($chunk === null) {
                if ($this->buffer !== '') {
                    throw new RuntimeException('stdio_truncated_message');
                }

                return null;
            }
            $this->buffer .= $chunk;
            if (! str_contains($this->buffer, "\n") && strlen($this->buffer) > $this->maxBytes) {
                throw new RuntimeException('stdio_message_too_large');
            }
        }
    }

    private function takeLine(int $newline): string
    {
        if ($newline > $this->maxBytes) {
            throw new RuntimeException('stdio_message_too_large');
        }
        $line = substr($this->buffer, 0, $newline);
        $this->buffer = substr($this->buffer, $newline + 1);
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

    private function readChunk(): ?string
    {
        $type = stream_get_meta_data($this->input)['stream_type'];
        if (in_array($type, ['STDIO', 'pipe', 'tcp_socket', 'unix_socket'], true)) {
            $read = [$this->input];
            $write = null;
            $except = null;
            $remaining = (int) ($this->deadline - hrtime(true));
            if ($remaining <= 0) {
                throw new RuntimeException('stdio_read_timeout');
            }
            $changed = stream_select($read, $write, $except, intdiv($remaining, 1_000_000_000), intdiv($remaining % 1_000_000_000, 1000));
            if ($changed === false) {
                throw new RuntimeException('stdio_read_failed');
            }
            if ($changed === 0) {
                throw new RuntimeException('stdio_read_timeout');
            }
        }
        $chunk = fread($this->input, max(1, $this->chunkBytes));
        if ($chunk === false) {
            throw new RuntimeException('stdio_read_failed');
        }

        return $chunk === '' && feof($this->input) ? null : $chunk;
    }
}
