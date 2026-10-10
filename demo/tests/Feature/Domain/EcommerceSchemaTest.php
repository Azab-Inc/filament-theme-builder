<?php

namespace Tests\Feature\Domain;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EcommerceSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_ecommerce_domain_tables_exist(): void
    {
        foreach ([
            'customers', 'addresses', 'products', 'categories', 'product_category',
            'product_variants', 'tags', 'product_tag', 'reviews', 'orders', 'order_items',
            'payments', 'refunds', 'shipments', 'order_status_histories', 'inventories',
            'suppliers', 'discounts', 'notes',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Expected {$table} table to exist.");
        }
    }

    public function test_domain_foreign_keys_allow_related_records_to_persist(): void
    {
        $now = now();
        $customerId = DB::table('customers')->insertGetId([
            'name' => 'Ada Lovelace', 'email' => 'ada@example.test', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $supplierId = DB::table('suppliers')->insertGetId([
            'name' => 'Example Supply', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $productId = DB::table('products')->insertGetId([
            'name' => 'Test product', 'slug' => 'test-product', 'sku' => 'TEST-1', 'price_cents' => 1250,
            'supplier_id' => $supplierId, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Test category', 'slug' => 'test-category', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $tagId = DB::table('tags')->insertGetId([
            'name' => 'Featured', 'slug' => 'featured', 'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('product_category')->insert(['product_id' => $productId, 'category_id' => $categoryId]);
        DB::table('product_tag')->insert(['product_id' => $productId, 'tag_id' => $tagId]);
        $variantId = DB::table('product_variants')->insertGetId([
            'product_id' => $productId, 'name' => 'Default', 'sku' => 'TEST-1-DEFAULT',
            'price_cents' => 1250, 'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('inventories')->insert([
            'product_id' => $productId, 'product_variant_id' => $variantId, 'quantity' => 7,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $addressId = DB::table('addresses')->insertGetId([
            'customer_id' => $customerId, 'name' => 'Home', 'line_1' => '1 Main St', 'city' => 'London',
            'country' => 'GB', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $orderId = DB::table('orders')->insertGetId([
            'customer_id' => $customerId, 'billing_address_id' => $addressId, 'shipping_address_id' => $addressId,
            'number' => 'ORDER-1', 'status' => 'pending', 'subtotal_cents' => 1250,
            'total_cents' => 1250, 'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('order_items')->insert([
            'order_id' => $orderId, 'product_id' => $productId, 'product_variant_id' => $variantId,
            'product_name' => 'Test product', 'variant_name' => 'Default', 'quantity' => 1,
            'unit_price_cents' => 1250, 'total_cents' => 1250, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $reviewId = DB::table('reviews')->insertGetId([
            'product_id' => $productId, 'customer_id' => $customerId, 'rating' => 5,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $discountId = DB::table('discounts')->insertGetId([
            'name' => 'Welcome', 'code' => 'WELCOME', 'type' => 'fixed', 'amount_cents' => 100,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $paymentId = DB::table('payments')->insertGetId([
            'order_id' => $orderId, 'amount_cents' => 1250, 'status' => 'paid',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('refunds')->insert([
            'payment_id' => $paymentId, 'amount_cents' => 100, 'status' => 'completed',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('shipments')->insert([
            'order_id' => $orderId, 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('order_status_histories')->insert([
            'order_id' => $orderId, 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->assertDatabaseHas('reviews', ['id' => $reviewId, 'product_id' => $productId]);
        $this->assertDatabaseHas('discounts', ['id' => $discountId, 'code' => 'WELCOME']);
        $this->assertDatabaseHas('inventories', ['product_id' => $productId, 'quantity' => 7]);
    }

    public function test_product_category_and_tag_pivots_are_unique(): void
    {
        $now = now();
        $productId = DB::table('products')->insertGetId([
            'name' => 'Test product', 'slug' => 'test-product', 'sku' => 'TEST-1', 'price_cents' => 1250,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Test category', 'slug' => 'test-category', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $tagId = DB::table('tags')->insertGetId([
            'name' => 'Featured', 'slug' => 'featured', 'created_at' => $now, 'updated_at' => $now,
        ]);

        DB::table('product_category')->insert(['product_id' => $productId, 'category_id' => $categoryId]);
        DB::table('product_tag')->insert(['product_id' => $productId, 'tag_id' => $tagId]);

        try {
            DB::table('product_category')->insert(['product_id' => $productId, 'category_id' => $categoryId]);
            $this->fail('Duplicate product/category pair should violate a unique constraint.');
        } catch (QueryException) {
            $this->assertDatabaseCount('product_category', 1);
        }

        try {
            DB::table('product_tag')->insert(['product_id' => $productId, 'tag_id' => $tagId]);
            $this->fail('Duplicate product/tag pair should violate a unique constraint.');
        } catch (QueryException) {
            $this->assertDatabaseCount('product_tag', 1);
        }
    }

    public function test_foreign_keys_reject_orphaned_relationships(): void
    {
        $this->expectException(QueryException::class);

        DB::table('product_category')->insert(['product_id' => 999, 'category_id' => 999]);
    }

    public function test_notes_can_be_attached_to_products_polymorphically(): void
    {
        $now = now();
        $productId = DB::table('products')->insertGetId([
            'name' => 'Test product', 'slug' => 'test-product', 'sku' => 'TEST-1', 'price_cents' => 1250,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        DB::table('notes')->insert([
            'noteable_type' => 'App\\Models\\Product', 'noteable_id' => $productId,
            'body' => 'Supplier confirmed stock.', 'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->assertDatabaseHas('notes', [
            'noteable_type' => 'App\\Models\\Product', 'noteable_id' => $productId,
            'body' => 'Supplier confirmed stock.',
        ]);
    }

    public function test_guest_orders_can_retain_nullable_historical_references(): void
    {
        $now = now();
        $customerId = DB::table('customers')->insertGetId([
            'name' => 'Ada Lovelace', 'email' => 'ada@example.test', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $addressId = DB::table('addresses')->insertGetId([
            'customer_id' => $customerId, 'line_1' => '1 Main St', 'city' => 'London', 'country' => 'GB',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $orderId = DB::table('orders')->insertGetId([
            'customer_id' => $customerId, 'billing_address_id' => $addressId, 'shipping_address_id' => $addressId,
            'number' => 'GUEST-1', 'status' => 'pending', 'subtotal_cents' => 0,
            'total_cents' => 0, 'created_at' => $now, 'updated_at' => $now,
        ]);

        DB::table('customers')->where('id', $customerId)->delete();

        $this->assertDatabaseHas('orders', [
            'id' => $orderId, 'customer_id' => null, 'billing_address_id' => null, 'shipping_address_id' => null,
        ]);
    }
}
