<?php

namespace Tests\Support\Mcp;

final class InstrumentedStdioStream
{
    public $context;

    public static string $input = '';

    public static string $output = '';

    public static int $maxWriteBytes = 0;

    public static int $emptyReads = 0;

    public static int $delayMicroseconds = 0;

    private int $position = 0;

    private string $mode = '';

    public static function register(): void
    {
        if (! in_array('ftbtest', stream_get_wrappers(), true)) {
            stream_wrapper_register('ftbtest', self::class);
        }
    }

    public function stream_open(string $path, string $mode, int $options, ?string &$openedPath): bool
    {
        $this->mode = $mode;
        $this->position = 0;

        return true;
    }

    public function stream_read(int $count): string
    {
        if (self::$emptyReads > 0) {
            self::$emptyReads--;
            usleep(self::$delayMicroseconds);

            return '';
        }
        $chunk = substr(self::$input, $this->position, $count);
        $this->position += strlen($chunk);

        return $chunk;
    }

    public function stream_eof(): bool
    {
        return $this->position >= strlen(self::$input);
    }

    public function stream_stat(): array
    {
        return [];
    }

    public function stream_set_option(int $option, int $arg1, mixed $arg2): bool
    {
        return true;
    }

    public function stream_write(string $data): int
    {
        $length = self::$maxWriteBytes > 0 ? min(strlen($data), self::$maxWriteBytes) : strlen($data);
        self::$output .= substr($data, 0, $length);

        return $length;
    }

    public function stream_flush(): bool
    {
        return true;
    }
}
