<?php

namespace Tests\Feature\Domain;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EcommerceRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    public function test_ecommerce_relations_persist_and_resolve_on_both_sides(): void
    {
        $customer = Customer::create(['name' => 'Ada Lovelace', 'email' => 'ada@example.test']);
        $address = $customer->addresses()->create([
            'line_1' => '1 Main St', 'city' => 'London', 'country' => 'GB',
        ]);
        $supplier = Supplier::create(['name' => 'Example Supply']);
        $product = $supplier->products()->create([
            'name' => 'Test product', 'slug' => 'test-product', 'sku' => 'TEST-1', 'price_cents' => 1250,
        ]);
        $parentCategory = Category::create(['name' => 'Parent', 'slug' => 'parent']);
        $category = $parentCategory->children()->create(['name' => 'Test category', 'slug' => 'test-category']);
        $tag = Tag::create(['name' => 'Featured', 'slug' => 'featured']);
        $product->categories()->attach($category);
        $product->tags()->attach($tag);
        $variant = $product->variants()->create(['name' => 'Default', 'sku' => 'TEST-1-DEFAULT']);
        $inventory = $product->inventories()->create([
            'product_variant_id' => $variant->id, 'quantity' => 7,
        ]);
        $review = $product->reviews()->create([
            'customer_id' => $customer->id, 'rating' => 5,
        ]);
        $discount = Discount::create([
            'name' => 'Welcome', 'code' => 'WELCOME', 'type' => 'fixed', 'amount_cents' => 100,
        ]);
        $order = $customer->orders()->create([
            'number' => 'ORDER-1', 'billing_address_id' => $address->id, 'shipping_address_id' => $address->id,
            'discount_id' => $discount->id, 'subtotal_cents' => 1250, 'total_cents' => 1250,
        ]);
        $item = $order->items()->create([
            'product_id' => $product->id, 'product_variant_id' => $variant->id, 'product_name' => $product->name,
            'variant_name' => $variant->name, 'quantity' => 1, 'unit_price_cents' => 1250, 'total_cents' => 1250,
        ]);
        $payment = $order->payments()->create(['amount_cents' => 1250]);
        $refund = $payment->refunds()->create(['amount_cents' => 100]);
        $shipment = $order->shipments()->create([]);
        $history = $order->statusHistories()->create(['status' => 'pending']);
        $productNote = $product->notes()->create(['body' => 'Product note']);
        $orderNote = $order->notes()->create(['body' => 'Order note']);

        $this->assertTrue($customer->addresses->contains($address));
        $this->assertTrue($address->customer->is($customer));
        $this->assertTrue($customer->orders->contains($order));
        $this->assertTrue($customer->reviews->contains($review));
        $this->assertTrue($order->customer->is($customer));
        $this->assertTrue($address->billingOrders->contains($order));
        $this->assertTrue($address->shippingOrders->contains($order));
        $this->assertTrue($order->billingAddress->is($address));
        $this->assertTrue($order->shippingAddress->is($address));
        $this->assertTrue($supplier->products->contains($product));
        $this->assertTrue($product->supplier->is($supplier));
        $this->assertTrue($product->categories->contains($category));
        $this->assertTrue($category->products->contains($product));
        $this->assertTrue($product->tags->contains($tag));
        $this->assertTrue($tag->products->contains($product));
        $this->assertTrue($parentCategory->children->contains($category));
        $this->assertTrue($category->parent->is($parentCategory));
        $this->assertTrue($product->variants->contains($variant));
        $this->assertTrue($variant->product->is($product));
        $this->assertTrue($product->reviews->contains($review));
        $this->assertTrue($review->product->is($product));
        $this->assertTrue($review->customer->is($customer));
        $this->assertTrue($product->inventories->contains($inventory));
        $this->assertTrue($product->orderItems->contains($item));
        $this->assertTrue($inventory->product->is($product));
        $this->assertTrue($inventory->variant->is($variant));
        $this->assertTrue($variant->inventories->contains($inventory));
        $this->assertTrue($variant->orderItems->contains($item));
        $this->assertTrue($discount->orders->contains($order));
        $this->assertTrue($order->discount->is($discount));
        $this->assertTrue($order->items->contains($item));
        $this->assertTrue($item->order->is($order));
        $this->assertTrue($item->product->is($product));
        $this->assertTrue($item->variant->is($variant));
        $this->assertTrue($order->payments->contains($payment));
        $this->assertTrue($payment->order->is($order));
        $this->assertTrue($payment->refunds->contains($refund));
        $this->assertTrue($refund->payment->is($payment));
        $this->assertTrue($order->shipments->contains($shipment));
        $this->assertTrue($shipment->order->is($order));
        $this->assertTrue($order->statusHistories->contains($history));
        $this->assertTrue($history->order->is($order));
        $this->assertTrue($product->notes->contains($productNote));
        $this->assertTrue($order->notes->contains($orderNote));
        $this->assertTrue($productNote->noteable->is($product));
        $this->assertTrue($orderNote->noteable->is($order));
    }

    public function test_detaching_or_deleting_a_category_preserves_products(): void
    {
        $product = Product::create([
            'name' => 'Test product', 'slug' => 'test-product', 'sku' => 'TEST-1', 'price_cents' => 1250,
        ]);
        $category = Category::create(['name' => 'Test category', 'slug' => 'test-category']);
        $product->categories()->attach($category);

        $product->categories()->detach($category);

        $this->assertDatabaseMissing('product_category', ['product_id' => $product->id, 'category_id' => $category->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $product->categories()->attach($category);

        $category->delete();

        $this->assertDatabaseMissing('product_category', ['product_id' => $product->id, 'category_id' => $category->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_deleting_an_order_cascades_its_items_but_preserves_products(): void
    {
        $product = Product::create([
            'name' => 'Test product', 'slug' => 'test-product', 'sku' => 'TEST-1', 'price_cents' => 1250,
        ]);
        $order = Order::create(['number' => 'ORDER-1', 'subtotal_cents' => 1250, 'total_cents' => 1250]);
        $item = $order->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'quantity' => 1, 'unit_price_cents' => 1250, 'total_cents' => 1250,
        ]);

        $order->delete();

        $this->assertDatabaseMissing('order_items', ['id' => $item->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}
