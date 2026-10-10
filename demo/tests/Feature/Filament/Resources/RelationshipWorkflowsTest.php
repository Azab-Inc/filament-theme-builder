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
use Tests\TestCase;

class RelationshipWorkflowsTest extends TestCase
{
    use RefreshDatabase;

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

        Livewire::test('App\\Filament\\Resources\\Customers\\RelationManagers\\AddressesRelationManager', ['ownerRecord' => $customer, 'pageClass' => 'App\\Filament\\Resources\\Customers\\Pages\\EditCustomer'])
            ->call('loadTable')
            ->assertSee('Avery home');

        Livewire::test(ProductResource::getPages()['edit']->getPage(), ['record' => $product->getRouteKey()])
            ->assertSee('Variants')
            ->assertSee('Categories')
            ->assertSee('Tags');

        Livewire::test('App\\Filament\\Resources\\Products\\RelationManagers\\CategoriesRelationManager', ['ownerRecord' => $product, 'pageClass' => 'App\\Filament\\Resources\\Products\\Pages\\EditProduct'])
            ->call('loadTable')
            ->assertSee('Demo Chairs');
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

    public function test_customer_addresses_and_orders_are_parent_scoped_and_order_association_can_be_dissociated(): void
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

        $order->update(['customer_id' => $customer->getKey()]);
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
            ->fillForm(OrderItem::factory()->make(['order_id' => $order->getKey()])->getAttributes())
            ->call('create')
            ->assertHasNoFormErrors();

        $created = OrderItem::query()->latest('id')->firstOrFail();
        $this->assertSame($order->getKey(), $created->order_id);

        Livewire::test($pages['edit']->getPage(), ['parentRecord' => $order, 'record' => $created->getRouteKey()])
            ->fillForm(['product_name' => 'Nested updated item'])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('order_items', ['id' => $created->getKey(), 'order_id' => $order->getKey(), 'product_name' => 'Nested updated item']);

        Livewire::test($pages['edit']->getPage(), ['parentRecord' => $order, 'record' => $created->getRouteKey()])
            ->callAction('delete');

        $this->assertDatabaseMissing('order_items', ['id' => $created->getKey()]);

        $foreignItem = OrderItem::factory()->create(['order_id' => $order->getKey()]);

        $this->get('/demo/admin/orders/'.$otherOrder->getRouteKey().'/order-items/'.$foreignItem->getRouteKey().'/edit')
            ->assertNotFound();
    }
}
