<?php

namespace Tests\Feature\Filament\Resources;

use App\Filament\Resources\Customers\CustomerResource;
use App\Filament\Resources\Products\ProductResource;
use App\Models\Address;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RelationshipWorkflowsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{string, string, string}> */
    public static function relationManagerRecords(): array
    {
        return [
            'addresses' => ['App\\Filament\\Resources\\Customers\\RelationManagers\\AddressesRelationManager', 'Avery home', 'App\\Models\\Customer'],
            'orders' => ['App\\Filament\\Resources\\Customers\\RelationManagers\\OrdersRelationManager', 'DEMO-ORDER-1001', 'App\\Models\\Customer'],
            'reviews' => ['App\\Filament\\Resources\\Customers\\RelationManagers\\ReviewsRelationManager', 'Demo customer review', 'App\\Models\\Customer'],
            'variants' => ['App\\Filament\\Resources\\Products\\RelationManagers\\VariantsRelationManager', 'Natural finish', 'App\\Models\\Product'],
            'categories' => ['App\\Filament\\Resources\\Products\\RelationManagers\\CategoriesRelationManager', 'Demo Chairs', 'App\\Models\\Product'],
            'tags' => ['App\\Filament\\Resources\\Products\\RelationManagers\\TagsRelationManager', 'Demo bestseller', 'App\\Models\\Product'],
        ];
    }

    public function test_customer_and_product_relation_managers_render_with_seeded_records(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $customer = Customer::query()->firstOrFail();
        $product = Product::query()->firstOrFail();

        Livewire::test(CustomerResource::getPages()['edit']->getPage(), ['record' => $customer->getRouteKey()])
            ->assertSee('Addresses')
            ->assertSee('Orders')
            ->assertSee('Reviews');

        Livewire::test(ProductResource::getPages()['edit']->getPage(), ['record' => $product->getRouteKey()])
            ->assertSee('Variants')
            ->assertSee('Categories')
            ->assertSee('Tags');

    }

    #[DataProvider('relationManagerRecords')]
    public function test_each_relation_manager_renders_its_seeded_relationship_table(string $manager, string $recordTitle, string $ownerModel): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $owner = $ownerModel::query()->firstOrFail();
        $pageClass = str_contains($ownerModel, 'Customer')
            ? 'App\\Filament\\Resources\\Customers\\Pages\\EditCustomer'
            : 'App\\Filament\\Resources\\Products\\Pages\\EditProduct';

        Livewire::test($manager, ['ownerRecord' => $owner, 'pageClass' => $pageClass])
            ->call('loadTable')
            ->assertSee($recordTitle);
    }

    public function test_product_categories_can_attach_and_detach_without_deleting_records(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $product = Product::query()->firstOrFail();
        $category = Category::factory()->create(['name' => 'Demo attached category']);
        $manager = 'App\\Filament\\Resources\\Products\\RelationManagers\\CategoriesRelationManager';

        Livewire::test($manager, ['ownerRecord' => $product, 'pageClass' => 'App\\Filament\\Resources\\Products\\Pages\\EditProduct'])
            ->mountTableAction('attach')
            ->setTableActionData(['recordId' => $category->getKey()])
            ->callMountedTableAction();

        $this->assertTrue($product->fresh()->categories->contains($category));

        Livewire::test($manager, ['ownerRecord' => $product->fresh(), 'pageClass' => 'App\\Filament\\Resources\\Products\\Pages\\EditProduct'])
            ->mountTableAction('detach', $category->getKey())
            ->callMountedTableAction();

        $this->assertDatabaseMissing('product_category', ['product_id' => $product->getKey(), 'category_id' => $category->getKey()]);
        $this->assertDatabaseHas('products', ['id' => $product->getKey()]);
        $this->assertDatabaseHas('categories', ['id' => $category->getKey()]);
    }

    public function test_product_tags_can_attach_and_detach_without_deleting_records(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $product = Product::query()->firstOrFail();
        $tag = Tag::factory()->create(['name' => 'Demo attached tag']);
        $manager = 'App\\Filament\\Resources\\Products\\RelationManagers\\TagsRelationManager';

        Livewire::test($manager, ['ownerRecord' => $product, 'pageClass' => 'App\\Filament\\Resources\\Products\\Pages\\EditProduct'])
            ->mountTableAction('attach')
            ->setTableActionData(['recordId' => $tag->getKey()])
            ->callMountedTableAction();

        $this->assertTrue($product->fresh()->tags->contains($tag));

        Livewire::test($manager, ['ownerRecord' => $product->fresh(), 'pageClass' => 'App\\Filament\\Resources\\Products\\Pages\\EditProduct'])
            ->mountTableAction('detach', $tag->getKey())
            ->callMountedTableAction();

        $this->assertDatabaseMissing('product_tag', ['product_id' => $product->getKey(), 'tag_id' => $tag->getKey()]);
        $this->assertDatabaseHas('products', ['id' => $product->getKey()]);
        $this->assertDatabaseHas('tags', ['id' => $tag->getKey()]);
    }

    public function test_order_can_be_associated_and_dissociated_through_customer_manager_without_deleting_parent_records(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $customer = Customer::query()->firstOrFail();
        $otherCustomer = Customer::query()->whereKeyNot($customer->getKey())->firstOrFail();
        $address = Address::factory()->create(['customer_id' => $otherCustomer->getKey()]);
        $order = Order::factory()->create(['customer_id' => $otherCustomer->getKey()]);
        $manager = 'App\\Filament\\Resources\\Customers\\RelationManagers\\OrdersRelationManager';

        Livewire::test($manager, ['ownerRecord' => $customer, 'pageClass' => 'App\\Filament\\Resources\\Customers\\Pages\\EditCustomer'])
            ->assertDontSee($order->number);

        Livewire::test($manager, ['ownerRecord' => $customer, 'pageClass' => 'App\\Filament\\Resources\\Customers\\Pages\\EditCustomer'])
            ->mountTableAction('associate')
            ->setTableActionData(['recordId' => $order->getKey()])
            ->callMountedTableAction();

        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'customer_id' => $customer->getKey()]);

        Livewire::test($manager, ['ownerRecord' => $customer->fresh(), 'pageClass' => 'App\\Filament\\Resources\\Customers\\Pages\\EditCustomer'])
            ->mountTableAction('dissociate', $order->getKey())
            ->callMountedTableAction();

        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'customer_id' => null]);
        $this->assertDatabaseHas('customers', ['id' => $customer->getKey()]);
        $this->assertDatabaseHas('addresses', ['id' => $address->getKey(), 'customer_id' => $otherCustomer->getKey()]);
    }

    public function test_nested_order_items_are_scoped_to_the_parent_order_for_full_crud(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $order = Order::query()->firstOrFail();
        $otherOrder = Order::query()->whereKeyNot($order->getKey())->firstOrFail();
        $pages = 'App\\Filament\\Resources\\Orders\\Resources\\OrderItems\\OrderItemResource'::getPages();

        Livewire::test($pages['create']->getPage(), ['parentRecord' => $order])
            ->assertFormFieldDoesNotExist('order_id')
            ->fillForm(OrderItem::factory()->make(['order_id' => $otherOrder->getKey()])->getAttributes())
            ->call('create')
            ->assertHasNoFormErrors();

        $created = OrderItem::query()->latest('id')->firstOrFail();
        $this->assertSame($order->getKey(), $created->order_id);

        Livewire::test($pages['edit']->getPage(), ['parentRecord' => $order, 'record' => $created->getRouteKey()])
            ->assertFormFieldDoesNotExist('order_id')
            ->fillForm(['order_id' => $otherOrder->getKey(), 'product_name' => 'Nested updated item'])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('order_items', ['id' => $created->getKey(), 'order_id' => $order->getKey(), 'product_name' => 'Nested updated item']);

        Livewire::test($pages['view']->getPage(), ['parentRecord' => $order, 'record' => $created->getRouteKey()])
            ->assertSee('Nested updated item');

        Livewire::test($pages['edit']->getPage(), ['parentRecord' => $order, 'record' => $created->getRouteKey()])
            ->callAction('delete');

        $this->assertDatabaseMissing('order_items', ['id' => $created->getKey()]);

        $foreignItem = OrderItem::factory()->create(['order_id' => $order->getKey()]);

        $this->get('/demo/admin/orders/'.$otherOrder->getRouteKey().'/order-items/'.$foreignItem->getRouteKey().'/edit')
            ->assertNotFound();
    }
}
