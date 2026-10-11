<?php

namespace Tests\Feature\Maintenance;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Share;
use App\Models\User;
use App\Support\Demo\DemoResetService;
use App\Support\Uploads\TemporaryUploadStorage;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DemoResetTest extends TestCase
{
    private string $database;

    private string $snapshot;

    private string $uploads;

    private string $lock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->database = tempnam(sys_get_temp_dir(), 'demo-db-');
        $this->snapshot = tempnam(sys_get_temp_dir(), 'demo-snapshot-');
        $this->uploads = sys_get_temp_dir().'/demo-uploads-'.bin2hex(random_bytes(6));
        $this->lock = tempnam(sys_get_temp_dir(), 'demo-lock-');

        file_put_contents($this->snapshot, "snapshot\n");
        file_put_contents($this->database, "mutated\n");
        mkdir($this->uploads);
        file_put_contents($this->uploads.'/temporary-upload.pdf', 'temporary');

        Config::set('database.connections.sqlite.database', $this->database);
        Config::set('database.default', 'sqlite');
        Config::set('maintenance.demo_snapshot_path', $this->snapshot);
        Config::set('maintenance.demo_reset_lock_path', $this->lock);
        Config::set('maintenance.temporary_uploads_path', $this->uploads);
    }

    protected function tearDown(): void
    {
        foreach ([$this->database, $this->snapshot, $this->lock] as $path) {
            @unlink($path);
        }

        @unlink($this->uploads.'/temporary-upload.pdf');
        @rmdir($this->uploads);

        parent::tearDown();
    }

    public function test_reset_atomically_restores_the_snapshot_and_cleans_temporary_uploads(): void
    {
        $this->artisan('demo:reset')
            ->expectsOutputToContain('Demo database reset from the configured snapshot.')
            ->expectsOutputToContain('Temporary demo upload cleanup removed 1 file(s).')
            ->assertExitCode(0);

        $this->assertSame("snapshot\n", file_get_contents($this->database));
        $this->assertFileDoesNotExist($this->uploads.'/temporary-upload.pdf');
    }

    public function test_repeated_reset_is_deterministic_and_does_not_touch_persistent_shares(): void
    {
        $committedSnapshot = base_path('database/demo-snapshot.sqlite');
        copy($committedSnapshot, $this->database);
        Config::set('maintenance.demo_snapshot_path', $committedSnapshot);

        $shares = tempnam(sys_get_temp_dir(), 'shares-');
        Config::set('maintenance.shares_database', $shares);
        Config::set('database.connections.shares', ['driver' => 'sqlite', 'database' => $shares]);
        Schema::connection('shares')->create('shares', function (Blueprint $table): void {
            $table->id();
            $table->string('public_id');
            $table->timestamp('expires_at')->nullable();
        });
        Share::on('shares')->create(['public_id' => 'persistent-share', 'expires_at' => now()->addDay()]);

        try {
            $this->artisan('demo:reset')->assertExitCode(0);
            $first = Share::on('shares')->where('public_id', 'persistent-share')->value('public_id');

            DB::purge('sqlite');
            Product::query()->where('sku', 'DEMO-CHAIR-001')->update(['name' => 'Different mutation']);
            $this->artisan('demo:reset')->assertExitCode(0);

            $this->assertSame($first, Share::on('shares')->where('public_id', 'persistent-share')->value('public_id'));
        } finally {
            @unlink($shares);
        }
    }

    public function test_committed_snapshot_restores_schema_and_deterministic_eloquent_aggregates_twice(): void
    {
        $committedSnapshot = base_path('database/demo-snapshot.sqlite');
        copy($committedSnapshot, $this->database);
        Config::set('maintenance.demo_snapshot_path', $committedSnapshot);

        foreach (['users', 'customers', 'products', 'orders', 'order_items'] as $table) {
            $this->assertTrue(Schema::hasTable($table), $table);
        }

        $expected = [
            'users' => 1,
            'customers' => 2,
            'products' => 2,
            'orders' => 2,
            'order_items' => 3,
        ];

        $this->assertSame($expected['users'], User::query()->count());
        $this->assertSame($expected['customers'], Customer::query()->showcaseFixture()->count());
        $this->assertSame($expected['products'], Product::query()->showcaseFixture()->count());
        $this->assertSame($expected['orders'], Order::query()->showcaseFixture()->count());
        $this->assertSame($expected['order_items'], OrderItem::query()->count());

        Product::query()->where('sku', 'DEMO-CHAIR-001')->update(['name' => 'Mutated product']);
        $this->artisan('demo:reset')->assertExitCode(0);
        DB::purge('sqlite');
        $first = $this->snapshotAggregate();

        Product::query()->where('sku', 'DEMO-CHAIR-001')->update(['name' => 'Mutated again']);
        $this->artisan('demo:reset')->assertExitCode(0);
        DB::purge('sqlite');
        $second = $this->snapshotAggregate();

        $this->assertSame($first, $second);
        $this->assertSame('Demo Oak Chair', $first['product_name']);
        $this->assertSame([], glob(dirname($this->database).'/*.reset-*') ?: []);
    }

    public function test_reset_refuses_to_run_while_another_reset_holds_the_lock(): void
    {
        $handle = fopen($this->lock, 'c');
        $this->assertNotFalse($handle);
        $this->assertTrue(flock($handle, LOCK_EX | LOCK_NB));

        try {
            $this->artisan('demo:reset')
                ->expectsOutputToContain('Demo reset failed: The demo reset lock could not be acquired.')
                ->assertExitCode(1);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    public function test_reset_reports_failed_upload_removals_instead_of_claiming_success(): void
    {
        $storage = new TemporaryUploadStorage(static fn (string $path): bool => false);
        $service = new DemoResetService($storage);

        $this->expectExceptionMessage('Temporary demo upload cleanup failed for:');

        $service->reset($this->snapshot, $this->database, $this->lock);
    }

    /** @return array{customers: int, products: int, orders: int, order_items: int, product_name: string} */
    private function snapshotAggregate(): array
    {
        return [
            'customers' => Customer::query()->showcaseFixture()->count(),
            'products' => Product::query()->showcaseFixture()->count(),
            'orders' => Order::query()->showcaseFixture()->count(),
            'order_items' => OrderItem::query()->count(),
            'product_name' => Product::query()->where('sku', 'DEMO-CHAIR-001')->value('name'),
        ];
    }
}
