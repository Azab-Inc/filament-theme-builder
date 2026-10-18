<?php

namespace Tests\Unit\Mcp;

final class RelayTestDirectory
{
    public static function remove(string $path): void
    {
        foreach (glob($path.'/*') ?: [] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        foreach (glob($path.'/.??*') ?: [] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir($path);
    }
}
