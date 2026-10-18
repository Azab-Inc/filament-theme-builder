<?php

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\ImportGrantStore;
use App\Mcp\ThemeRelay\OperationCleanup;
use App\Mcp\ThemeRelay\OperationResultStore;
use App\Mcp\ThemeRelay\OperationStore;
use Tests\TestCase;

class RelayOperationTest extends TestCase
{
    private FileRelayStore $store;

    private string $path;

    protected function setUp(): void
    {
        parent::setUp();
        $this->path = '/tmp/ftb-relay-test-'.bin2hex(random_bytes(8));
        $this->store = new FileRelayStore($this->path);
    }

    protected function tearDown(): void
    {
        RelayTestDirectory::remove($this->path);
        parent::tearDown();
    }

    public function test_operation_result_is_scoped_single_use_and_expiry_removes_all_records(): void
    {
        $clock = new MutableRelayClock;
        $ops = new OperationStore($this->store, $clock);
        $results = new OperationResultStore($this->store, $clock);
        $id = $ops->create('export', 'pair-a', 'process-a', hash('sha256', 'payload'));
        self::assertFalse($ops->transition($id, 'pair-a', 'process-a', 'approved'));
        self::assertSame(64, strlen($id));
        self::assertFalse($results->publish($id, 'pair-b', 'process-a', hash('sha256', 'payload'), 'result'));
        self::assertTrue($results->publish($id, 'pair-a', 'process-a', hash('sha256', 'payload'), 'result'));
        self::assertNull($results->consume($id, 'pair-b', 'process-a'));
        self::assertSame('result', $results->consume($id, 'pair-a', 'process-a'));
        self::assertNull($results->consume($id, 'pair-a', 'process-a'));

        $expired = $ops->create('import', 'pair-a', 'process-a', hash('sha256', 'payload'));
        $clock->time += 300;
        (new OperationCleanup($this->store, $clock))->expireUndelivered();
        self::assertNull($this->store->read('operation-'.$expired));
        self::assertNull($this->store->read('result-'.$expired));
        self::assertNull($this->store->read('payload-'.$expired));
    }

    public function test_receipt_deletes_payload_once_for_matching_digest(): void
    {
        $clock = new MutableRelayClock;
        $ops = new OperationStore($this->store, $clock);
        $results = new OperationResultStore($this->store, $clock);
        $digest = hash('sha256', 'raw-theme-bytes');
        $id = $ops->create('import', 'pair-a', 'process-a', $digest);
        $this->store->atomicWrite('payload-'.$id, 'raw-theme-bytes');
        self::assertFalse($results->receipt($id, 'wrong'));
        self::assertTrue($results->receipt($id, $digest));
        self::assertNull($this->store->read('payload-'.$id));
        self::assertNull($this->store->read('operation-'.$id));
        self::assertNull($this->store->read('result-'.$id));
        self::assertFalse($results->receipt($id, $digest));
    }

    public function test_export_operation_publishes_its_selected_theme_id_to_the_browser(): void
    {
        $clock = new MutableRelayClock;
        $ops = new OperationStore($this->store, $clock);
        $id = $ops->create('export', 'pair-a', 'process-a', hash('sha256', 'request'), 'theme-a');

        self::assertSame('theme-a', $ops->read($id)['themeId']);
    }

    public function test_import_grant_is_bound_to_session_and_consumable_only_once_within_five_seconds(): void
    {
        $clock = new MutableRelayClock;
        $grants = new ImportGrantStore($this->store, $clock);
        $id = $grants->issue('operation-a', 'digest', 'New theme', 17, 'session-a');
        self::assertFalse($grants->approve($id, 'operation-a', 'digest', 'New theme', 17, 'session-b'));
        self::assertTrue($grants->approve($id, 'operation-a', 'digest', 'New theme', 17, 'session-a'));
        self::assertFalse($grants->consume($id, 'operation-a', 'digest', 'New theme', 18, 'session-a'));
        self::assertTrue($grants->consume($id, 'operation-a', 'digest', 'New theme', 17, 'session-a'));
        self::assertFalse($grants->consume($id, 'operation-a', 'digest', 'New theme', 17, 'session-a'));

        $expired = $grants->issue('operation-b', 'digest', 'Name', 1, 'session-a');
        $clock->time += 5;
        self::assertFalse($grants->approve($expired, 'operation-b', 'digest', 'Name', 1, 'session-a'));
    }
}
