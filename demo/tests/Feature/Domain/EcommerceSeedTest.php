<?php

namespace Tests\Feature\Domain;

use App\Models\Address;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Inventory;
use App\Models\Note;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Refund;
use App\Models\Review;
use App\Models\Shipment;
use App\Models\Supplier;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EcommerceSeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_domain_factory_creates_a_schema_valid_record(): void
    {
        foreach ([
            Customer::class, Address::class, Product::class, Category::class, ProductVariant::class,
            Tag::class, Review::class, Order::class, OrderItem::class, Payment::class, Refund::class,
            Shipment::class, OrderStatusHistory::class, Inventory::class, Supplier::class,
            Discount::class, Note::class,
        ] as $model) {
            $this->assertInstanceOf($model, $model::factory()->create());
        }
    }

    public function test_demo_seed_is_stable_idempotent_and_preserves_only_the_login_user(): void
    {
        Artisan::call('db:seed', ['--force' => true]);

        $firstSnapshot = $this->seedSnapshot();

        Artisan::call('db:seed', ['--force' => true]);

        $this->assertSame($firstSnapshot, $this->seedSnapshot());
        $this->assertSame(['DEMO-CHAIR-001', 'DEMO-LAMP-001'], Product::query()->orderBy('sku')->pluck('sku')->all());
        $this->assertSame(['DEMO-ORDER-1001', 'DEMO-ORDER-1002'], Order::query()->orderBy('number')->pluck('number')->all());
        $this->assertSame(['user'], User::query()->pluck('email')->all());
        $this->assertSame('Demo User', User::query()->where('email', 'user')->value('name'));
        $this->assertTrue(Hash::check('password', User::query()->where('email', 'user')->value('password')));
        $this->assertSame(2, Customer::count());
        $this->assertGreaterThanOrEqual(2, Address::count());
        $this->assertGreaterThanOrEqual(2, Category::count());
        $this->assertGreaterThanOrEqual(2, Tag::count());
        $this->assertGreaterThanOrEqual(2, ProductVariant::count());
        $this->assertGreaterThanOrEqual(2, Review::count());
        $this->assertGreaterThanOrEqual(2, OrderItem::count());
        $this->assertGreaterThanOrEqual(1, Payment::count());
        $this->assertGreaterThanOrEqual(1, Refund::count());
        $this->assertGreaterThanOrEqual(1, Shipment::count());
        $this->assertGreaterThanOrEqual(2, OrderStatusHistory::count());
        $this->assertGreaterThanOrEqual(1, Inventory::count());
        $this->assertGreaterThanOrEqual(1, Supplier::count());
        $this->assertGreaterThanOrEqual(1, Discount::count());
        $this->assertGreaterThanOrEqual(2, Note::count());

        $this->assertDatabaseHas('notes', ['noteable_type' => Product::class]);
        $this->assertDatabaseHas('notes', ['noteable_type' => Order::class]);
        $this->assertDatabaseHas('product_category', ['product_id' => Product::where('sku', 'DEMO-CHAIR-001')->value('id')]);
        $this->assertDatabaseHas('product_tag', ['product_id' => Product::where('sku', 'DEMO-LAMP-001')->value('id')]);
        $this->assertSame('2026-10-07 12:00:00', Order::where('number', 'DEMO-ORDER-1001')->firstOrFail()->placed_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-10-08 12:00:00', Order::where('number', 'DEMO-ORDER-1002')->firstOrFail()->placed_at->format('Y-m-d H:i:s'));

        $this->assertSame(3, Customer::withCount('addresses')->get()->sum('addresses_count'));
        $this->assertSame(2, Customer::withCount('orders')->get()->sum('orders_count'));
        $this->assertSame(2, Product::withCount('categories')->get()->sum('categories_count'));
        $this->assertSame(4, Product::withCount('tags')->get()->sum('tags_count'));
        $this->assertSame(2, Product::withCount('variants')->get()->sum('variants_count'));
        $this->assertSame(2, Product::withCount('reviews')->get()->sum('reviews_count'));
        $this->assertSame(2, Product::withCount('inventories')->get()->sum('inventories_count'));
        $this->assertSame(1, Payment::withCount('refunds')->get()->sum('refunds_count'));
        $this->assertSame(1, Order::withCount('shipments')->get()->sum('shipments_count'));
        $this->assertSame(6, Order::withCount('statusHistories')->get()->sum('status_histories_count'));

        $order = Order::query()->where('number', 'DEMO-ORDER-1001')->with('items.product', 'items.variant')->firstOrFail();
        $this->assertGreaterThanOrEqual(2, $order->items->count());
        foreach ($order->items as $item) {
            $this->assertNotEmpty($item->product_name);
            $this->assertNotEmpty($item->variant_name);
            $this->assertNotEmpty($item->sku);
            $this->assertSame($item->product->name, $item->product_name);
            $this->assertSame($item->variant->name, $item->variant_name);
            $this->assertGreaterThan(0, $item->unit_price_cents);
            $this->assertSame($item->quantity * $item->unit_price_cents, $item->total_cents);
        }
        $this->assertSame('DEMO-CHAIR-001', $order->items->first()->sku);
        $this->assertSame('Demo Oak Chair', $order->items->first()->product_name);
    }

    /** @return array<string, mixed> */
    private function seedSnapshot(): array
    {
        $tables = [
            'customers', 'addresses', 'products', 'categories', 'tags', 'product_variants', 'reviews', 'orders',
            'order_items', 'payments', 'refunds', 'shipments', 'order_status_histories', 'inventories', 'suppliers',
            'discounts', 'notes', 'product_category', 'product_tag', 'users',
        ];
        $counts = [];
        foreach ($tables as $table) {
            $counts[$table] = \DB::table($table)->count();
        }

        return [
            'counts' => $counts,
            'products' => Product::query()->orderBy('sku')->get(['sku', 'slug', 'name', 'price_cents', 'status'])->toArray(),
            'orders' => Order::query()->orderBy('number')->get(['number', 'status', 'subtotal_cents', 'discount_cents', 'total_cents', 'placed_at'])->toArray(),
            'items' => OrderItem::query()->orderBy('id')->get(['product_name', 'variant_name', 'sku', 'quantity', 'unit_price_cents', 'total_cents'])->toArray(),
        ];
    }
}
