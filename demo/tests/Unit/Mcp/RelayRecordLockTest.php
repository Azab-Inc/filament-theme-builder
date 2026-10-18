<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\LockHandle;
use App\Mcp\ThemeRelay\RelayRecordLock;
use App\Mcp\ThemeRelay\RelayStore;
use Tests\TestCase;

class RelayRecordLockTest extends TestCase
{
    public function test_index_lock_is_released_when_record_lock_release_throws(): void
    {
        $store = new class implements RelayStore
        {
            /** @var list<object{released: bool}> */
            public array $handles = [];

            public function read(string $key): ?string
            {
                return null;
            }

            public function atomicWrite(string $key, string $value): void {}

            public function delete(string $key): void {}

            public function lock(string $key): LockHandle
            {
                $handle = new class($key) implements LockHandle
                {
                    public bool $released = false;

                    public function __construct(private string $key) {}

                    public function release(): void
                    {
                        $this->released = true;
                        if ($this->key !== 'session-index') {
                            throw new \RuntimeException('record release failed');
                        }
                    }
                };
                $this->handles[] = $handle;

                return $handle;
            }
        };
        $guard = RelayRecordLock::acquire($store, 'operation-a');
        try {
            $guard->release();
            self::fail('Record lock release did not throw.');
        } catch (\RuntimeException $error) {
            self::assertSame('record release failed', $error->getMessage());
        }
        self::assertTrue($store->handles[0]->released);
    }
}
