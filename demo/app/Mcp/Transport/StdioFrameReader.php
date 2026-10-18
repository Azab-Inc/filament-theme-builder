<?php

declare(strict_types=1);

namespace App\Mcp\Transport;

use RuntimeException;

final class StdioFrameReader
{
    private string $buffer = '';

    private int|float|null $deadline = null;

    public function __construct(private mixed $input, private int $maxBytes, private int $chunkBytes = 8192, private int $timeoutMilliseconds = 30_000)
    {
        if (! is_resource($input) || $maxBytes < 1 || $chunkBytes < 1 || $timeoutMilliseconds < 1 || ! stream_set_blocking($input, false)) {
            throw new RuntimeException('stdio_reader_configuration_invalid');
        }
    }

    public function next(): ?string
    {
        while (true) {
            if (($newline = strpos($this->buffer, "\n")) !== false) {
                $this->deadline = null;

                return $this->takeLine($newline);
            }
            $this->deadline ??= hrtime(true) + $this->timeoutMilliseconds * 1_000_000;
            $readBytes = min($this->chunkBytes, max(1, $this->maxBytes - strlen($this->buffer) + 1));
            $chunk = $this->readChunk($readBytes);
            if ($chunk === null) {
                if ($this->buffer !== '') {
                    throw new RuntimeException('stdio_truncated_message');
                }

                return null;
            }
            if ($chunk === '') {
                continue;
            }
            $newline = strpos($chunk, "\n");
            if ($newline !== false) {
                if (strlen($this->buffer) + $newline > $this->maxBytes) {
                    throw new RuntimeException('stdio_message_too_large');
                }
                $line = $this->buffer.substr($chunk, 0, $newline);
                $this->buffer = substr($chunk, $newline + 1);
                $this->deadline = null;

                return $line;
            }
            if (strlen($this->buffer) + strlen($chunk) > $this->maxBytes) {
                throw new RuntimeException('stdio_message_too_large');
            }
            $this->buffer .= $chunk;
        }
    }

    private function takeLine(int $newline): string
    {
        if ($newline > $this->maxBytes) {
            throw new RuntimeException('stdio_message_too_large');
        }
        $line = substr($this->buffer, 0, $newline);
        $this->buffer = substr($this->buffer, $newline + 1);
        $this->deadline = null;

        return $line;
    }

    private function readChunk(int $readBytes): ?string
    {
        $remaining = (int) ($this->deadline - hrtime(true));
        if ($remaining <= 0) {
            throw new RuntimeException('stdio_read_timeout');
        }
        $chunk = fread($this->input, max(1, $readBytes));
        if ($chunk === false) {
            throw new RuntimeException('stdio_read_failed');
        }
        if (hrtime(true) >= $this->deadline) {
            throw new RuntimeException('stdio_read_timeout');
        }
        if ($chunk === '' && ! feof($this->input)) {
            usleep(min(1000, max(1, intdiv($remaining, 1000))));
        }

        return $chunk === '' && feof($this->input) ? null : $chunk;
    }
}
