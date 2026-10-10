<?php

namespace Tests\Feature\Filament\Resources;

use App\Filament\Support\EntityResourceTable;
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
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EntityResourcesTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{class-string, class-string, string}> */
    public static function resourceCases(): array
    {
        return [
            'customers' => [Customer::class, 'App\\Filament\\Resources\\Customers\\CustomerResource', 'Avery Demo'],
            'addresses' => [Address::class, 'App\\Filament\\Resources\\Addresses\\AddressResource', 'Avery home'],
            'products' => [Product::class, 'App\\Filament\\Resources\\Products\\ProductResource', 'Demo Oak Chair'],
            'categories' => [Category::class, 'App\\Filament\\Resources\\Categories\\CategoryResource', 'Demo Home'],
            'variants' => [ProductVariant::class, 'App\\Filament\\Resources\\ProductVariants\\ProductVariantResource', 'Natural finish'],
            'tags' => [Tag::class, 'App\\Filament\\Resources\\Tags\\TagResource', 'Demo bestseller'],
            'reviews' => [Review::class, 'App\\Filament\\Resources\\Reviews\\ReviewResource', 'Demo customer review'],
            'orders' => [Order::class, 'App\\Filament\\Resources\\Orders\\OrderResource', 'DEMO-ORDER-1001'],
            'order-items' => [OrderItem::class, 'App\\Filament\\Resources\\OrderItems\\OrderItemResource', 'Demo Oak Chair'],
            'payments' => [Payment::class, 'App\\Filament\\Resources\\Payments\\PaymentResource', 'DEMO-TXN-DEMO-ORDER-1001'],
            'refunds' => [Refund::class, 'App\\Filament\\Resources\\Refunds\\RefundResource', 'Demo partial refund'],
            'shipments' => [Shipment::class, 'App\\Filament\\Resources\\Shipments\\ShipmentResource', 'DEMO-TRACK-1002'],
            'status-history' => [OrderStatusHistory::class, 'App\\Filament\\Resources\\OrderStatusHistories\\OrderStatusHistoryResource', 'Demo order created'],
            'inventory' => [Inventory::class, 'App\\Filament\\Resources\\Inventories\\InventoryResource', 'Demo warehouse'],
            'suppliers' => [Supplier::class, 'App\\Filament\\Resources\\Suppliers\\SupplierResource', 'Demo Workshop Supply'],
            'discounts' => [Discount::class, 'App\\Filament\\Resources\\Discounts\\DiscountResource', 'DEMO-WELCOME'],
            'notes' => [Note::class, 'App\\Filament\\Resources\\Notes\\NoteResource', 'Demo product note'],
        ];
    }

    #[DataProvider('resourceCases')]
    public function test_each_entity_has_list_create_edit_and_view_surfaces(string $model, string $resource, string $visibleValue): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $record = $model::query()->firstOrFail();
        $pages = $resource::getPages();

        Livewire::test($pages['index']->getPage())
            ->assertSee($visibleValue);

        Livewire::test($pages['view']->getPage(), ['record' => $record->getRouteKey()])
            ->assertSee($visibleValue);

        $formData = $this->factoryFormData($model);
        $beforeCreateCount = $model::query()->count();
        Livewire::test($pages['create']->getPage())
            ->fillForm($formData)
            ->call('create')
            ->assertHasNoFormErrors();
        $this->assertSame($beforeCreateCount + 1, $model::query()->count());
        $this->assertDatabaseHas($model::query()->getModel()->getTable(), $this->persistedCreateAssertions($model, $formData));

        $editable = $model::query()->firstOrFail();
        $updatedValue = $visibleValue.' updated';
        $field = match ($model) {
            Product::class, Category::class, Customer::class, Supplier::class, Note::class => 'name',
            Address::class, ProductVariant::class, Tag::class => 'name',
            Review::class => 'title', Order::class => 'number', OrderItem::class => 'product_name',
            Payment::class => 'provider', Refund::class => 'reason', Shipment::class => 'carrier',
            OrderStatusHistory::class => 'comment', Inventory::class => 'location', Discount::class => 'name',
            default => array_key_first($formData),
        };
        if ($model === Note::class) {
            $field = 'body';
        }

        $editData = $editable->getAttributes();
        if ($model === Note::class) {
            $editData['noteable_type'] = Product::class;
            $editData['noteable_id'] = Product::query()->firstOrFail()->getKey();
        }

        Livewire::test($pages['edit']->getPage(), ['record' => $editable->getRouteKey()])
            ->fillForm([...$editData, $field => $updatedValue])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas($editable->getTable(), [$field => $updatedValue]);
    }

    public function test_navigation_groups_and_public_dashboard_contract_are_preserved(): void
    {
        $this->seed();

        $this->get('/demo/admin')
            ->assertOk()
            ->assertSee('Dashboard')
            ->assertSee('Catalog')
            ->assertSee('Sales')
            ->assertSee('Customers')
            ->assertSee('Operations');

        $this->assertGuest();
    }

    public function test_product_table_presents_status_money_and_public_image(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $pages = 'App\\Filament\\Resources\\Products\\ProductResource'::getPages();

        Livewire::test($pages['index']->getPage())
            ->assertSee('Active')
            ->assertSee('$129.00')
            ->assertSee('Demo Oak Chair');

        $order = Order::query()->firstOrFail();
        $order->update(['currency' => 'EUR', 'total_cents' => 12900]);
        $orderPages = 'App\Filament\Resources\Orders\OrderResource'::getPages();

        Livewire::test($orderPages['index']->getPage())
            ->assertSee('€129.00');
    }

    public function test_resource_tables_define_filters_and_relationship_queries_eager_load_columns(): void
    {
        foreach ([
            'product' => ['supplier'], 'address' => ['customer'], 'category' => ['parent'], 'product-variant' => ['product'],
            'review' => ['product', 'customer'], 'order' => ['customer', 'billingAddress', 'shippingAddress', 'discount'],
            'order-item' => ['order', 'product', 'variant'], 'payment' => ['order'], 'refund' => ['payment'],
            'shipment' => ['order'], 'order-status-history' => ['order'], 'inventory' => ['product', 'variant'],
        ] as $entity => $relationships) {
            $this->assertNotEmpty(EntityResourceTable::filtersFor($entity), $entity.' must define meaningful filters.');

            $resource = match ($entity) {
                'product' => 'App\\Filament\\Resources\\Products\\ProductResource',
                'address' => 'App\\Filament\\Resources\\Addresses\\AddressResource',
                'category' => 'App\\Filament\\Resources\\Categories\\CategoryResource',
                'product-variant' => 'App\\Filament\\Resources\\ProductVariants\\ProductVariantResource',
                'review' => 'App\\Filament\\Resources\\Reviews\\ReviewResource',
                'order' => 'App\\Filament\\Resources\\Orders\\OrderResource',
                'order-item' => 'App\\Filament\\Resources\\OrderItems\\OrderItemResource',
                'payment' => 'App\\Filament\\Resources\\Payments\\PaymentResource',
                'refund' => 'App\\Filament\\Resources\\Refunds\\RefundResource',
                'shipment' => 'App\\Filament\\Resources\\Shipments\\ShipmentResource',
                'order-status-history' => 'App\\Filament\\Resources\\OrderStatusHistories\\OrderStatusHistoryResource',
                'inventory' => 'App\\Filament\\Resources\\Inventories\\InventoryResource',
                default => null,
            };
            if ($resource !== null) {
                $this->assertSame($relationships, array_keys($resource::getEloquentQuery()->getEagerLoads()));
            }
        }
    }

    public function test_invalid_product_input_reports_required_numeric_status_and_url_errors(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $pages = 'App\Filament\Resources\Products\ProductResource'::getPages();

        Livewire::test($pages['create']->getPage())
            ->fillForm(['name' => '', 'price_cents' => 'not-money', 'status' => 'unknown', 'image_url' => 'not-a-url'])
            ->call('create')
            ->assertHasFormErrors(['name', 'price_cents', 'status', 'image_url']);
    }

    public function test_seeded_product_image_is_served_locally_without_external_dependency(): void
    {
        $this->seed();

        $this->assertFileExists(public_path('demo-images/demo-oak-chair.svg'));
        $this->assertStringContainsString('<svg', file_get_contents(public_path('demo-images/demo-oak-chair.svg')));
    }

    public function test_nullable_historical_relationships_can_be_saved(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $pages = 'App\\Filament\\Resources\\Reviews\\ReviewResource'::getPages();

        Livewire::test($pages['create']->getPage())
            ->fillForm($this->factoryFormData(Review::class, ['customer_id' => null]))
            ->call('create')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('reviews', ['customer_id' => null]);
    }

    /** @param array<string, mixed> $overrides */
    private function factoryFormData(string $model, array $overrides = []): array
    {
        $attributes = $model::factory()->make($overrides)->getAttributes();

        foreach ([
            'customer_id' => Customer::class, 'product_id' => Product::class, 'product_variant_id' => ProductVariant::class,
            'order_id' => Order::class, 'payment_id' => Payment::class, 'supplier_id' => Supplier::class,
            'discount_id' => Discount::class, 'billing_address_id' => Address::class, 'shipping_address_id' => Address::class,
        ] as $field => $relatedModel) {
            if (array_key_exists($field, $attributes) && $attributes[$field] !== null) {
                $attributes[$field] = $relatedModel::query()->firstOrFail()->getKey();
            }
        }

        if ($model === Note::class) {
            $attributes['noteable_type'] = Product::class;
            $attributes['noteable_id'] = Product::query()->firstOrFail()->getKey();
        }

        return array_map(
            fn (mixed $value): mixed => $value instanceof Model ? $value::query()->firstOrFail()->getKey() : $value,
            $attributes,
        );
    }

    /** @param array<string, mixed> $formData */
    private function persistedCreateAssertions(string $model, array $formData): array
    {
        return match ($model) {
            Customer::class, Category::class, Product::class, ProductVariant::class, Tag::class, Supplier::class => ['name' => $formData['name']],
            Address::class => ['line_1' => $formData['line_1']],
            Review::class => ['title' => $formData['title']],
            Order::class => ['number' => $formData['number']],
            OrderItem::class => ['product_name' => $formData['product_name']],
            Payment::class => ['transaction_id' => $formData['transaction_id']],
            Refund::class => ['reason' => $formData['reason']],
            Shipment::class => ['tracking_number' => $formData['tracking_number']],
            OrderStatusHistory::class => ['status' => $formData['status']],
            Inventory::class => ['location' => $formData['location']],
            Discount::class => ['code' => $formData['code']],
            Note::class => ['body' => $formData['body']],
            default => [],
        };
    }
}
