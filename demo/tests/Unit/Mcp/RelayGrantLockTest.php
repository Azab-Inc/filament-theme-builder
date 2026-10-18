<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\ImportGrantStore;
use Tests\TestCase;

class RelayGrantLockTest extends TestCase
{
    public function test_grant_issue_approval_and_consumption_are_globally_serialized(): void
    {
        $path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $store = new ObservedRelayStore(new FileRelayStore($path));
        try {
            $grants = new ImportGrantStore($store, new MutableRelayClock);
            $id = $grants->issue('operation-a', 'digest', 'name', 1, 'session-a');
            self::assertTrue($grants->approve($id, 'operation-a', 'digest', 'name', 1, 'session-a'));
            self::assertTrue($grants->consume($id, 'operation-a', 'digest', 'name', 1, 'session-a'));
            self::assertSame(3, count(array_filter($store->lockedKeys,
                fn (string $key): bool => $key === 'session-index')));
        } finally {
            RelayTestDirectory::remove($path);
        }
    }
}
