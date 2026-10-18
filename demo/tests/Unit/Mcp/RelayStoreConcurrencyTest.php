<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use Tests\TestCase;

class RelayStoreConcurrencyTest extends TestCase
{
    public function test_global_and_operation_locks_prevent_parallel_writes(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new FileRelayStore($path);
        try {
            foreach (['session-index', 'operation-test'] as $name) {
                $lock = $store->lock($name);
                $file = fopen($path.'/lock-'.$name.'.json', 'c');
                self::assertIsResource($file);
                self::assertFalse(flock($file, LOCK_EX | LOCK_NB));
                fclose($file);
                $lock->release();
            }
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
