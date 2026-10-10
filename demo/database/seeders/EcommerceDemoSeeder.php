<?php

namespace Database\Seeders;

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
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class EcommerceDemoSeeder extends Seeder
{
    private const DATE = '2026-10-10 12:00:00';

    public function run(): void
    {
        fake()->seed(20261010);
        $date = Carbon::parse(self::DATE);

        $supplier = Supplier::query()->updateOrCreate(['name' => 'Demo Workshop Supply'], [
            'email' => 'supply@example.test', 'phone' => '555-0100', 'notes' => 'Demo supplier only; not a real vendor.',
        ]);
        $customers = collect([
            ['name' => 'Avery Demo', 'email' => 'avery@example.test', 'phone' => '555-0101'],
            ['name' => 'Jordan Sample', 'email' => 'jordan@example.test', 'phone' => '555-0102'],
        ])->mapWithKeys(fn (array $attributes) => [$attributes['email'] => Customer::query()->updateOrCreate(['email' => $attributes['email']], $attributes)]);

        $addresses = [];
        foreach ([
            ['email' => 'avery@example.test', 'key' => 'Avery home', 'line' => '100 Demo Lane', 'city' => 'Portland'],
            ['email' => 'avery@example.test', 'key' => 'Avery studio', 'line' => '200 Sample Avenue', 'city' => 'Portland'],
            ['email' => 'jordan@example.test', 'key' => 'Jordan home', 'line' => '300 Example Street', 'city' => 'Seattle'],
        ] as $fixture) {
            $customer = $customers[$fixture['email']];
            $addresses[$fixture['key']] = Address::query()->updateOrCreate(
                ['customer_id' => $customer->id, 'name' => $fixture['key']],
                ['line_1' => $fixture['line'], 'city' => $fixture['city'], 'state' => 'OR', 'postal_code' => '97201', 'country' => 'US', 'phone' => $customer->phone],
            );
        }

        $parent = Category::query()->updateOrCreate(['slug' => 'demo-home'], ['name' => 'Demo Home', 'description' => 'Sample category for demonstration.']);
        $categories = [
            'chairs' => Category::query()->updateOrCreate(['slug' => 'demo-chairs'], ['name' => 'Demo Chairs', 'description' => 'Sample chairs.', 'parent_id' => $parent->id]),
            'lighting' => Category::query()->updateOrCreate(['slug' => 'demo-lighting'], ['name' => 'Demo Lighting', 'description' => 'Sample lighting.', 'parent_id' => $parent->id]),
        ];
        $tags = collect([
            ['name' => 'Demo bestseller', 'slug' => 'demo-bestseller'],
            ['name' => 'Demo sustainable', 'slug' => 'demo-sustainable'],
        ])->mapWithKeys(fn (array $attributes) => [$attributes['slug'] => Tag::query()->updateOrCreate(['slug' => $attributes['slug']], ['name' => $attributes['name']])]);

        $products = [];
        foreach ([
            ['sku' => 'DEMO-CHAIR-001', 'slug' => 'demo-oak-chair', 'name' => 'Demo Oak Chair', 'price_cents' => 12900, 'category' => 'chairs'],
            ['sku' => 'DEMO-LAMP-001', 'slug' => 'demo-brass-lamp', 'name' => 'Demo Brass Lamp', 'price_cents' => 7900, 'category' => 'lighting'],
        ] as $fixture) {
            $product = Product::query()->updateOrCreate(['sku' => $fixture['sku']], [
                'name' => $fixture['name'], 'slug' => $fixture['slug'], 'description' => 'Demonstration product; not available for purchase.',
                'price_cents' => $fixture['price_cents'], 'status' => 'active', 'supplier_id' => $supplier->id,
                'image_url' => $fixture['sku'] === 'DEMO-CHAIR-001'
                    ? config('app.url').'/demo-images/demo-oak-chair.svg'
                    : config('app.url').'/demo-images/demo-brass-lamp.svg',
            ]);
            $product->categories()->sync([$categories[$fixture['category']]->id]);
            $product->tags()->sync($tags->pluck('id')->all());
            $products[$fixture['sku']] = $product;
        }

        $variants = [];
        foreach ([
            ['sku' => 'DEMO-CHAIR-001-NAT', 'product' => 'DEMO-CHAIR-001', 'name' => 'Natural finish'],
            ['sku' => 'DEMO-LAMP-001-BRS', 'product' => 'DEMO-LAMP-001', 'name' => 'Brushed brass'],
        ] as $fixture) {
            $variants[$fixture['sku']] = ProductVariant::query()->updateOrCreate(['sku' => $fixture['sku']], [
                'product_id' => $products[$fixture['product']]->id, 'name' => $fixture['name'], 'price_cents' => null,
                'options' => ['finish' => strtolower($fixture['name'])], 'is_active' => true,
            ]);
        }
        foreach ($variants as $sku => $variant) {
            Inventory::query()->updateOrCreate(['product_id' => $variant->product_id, 'product_variant_id' => $variant->id, 'location' => 'Demo warehouse'], ['quantity' => $sku === 'DEMO-CHAIR-001-NAT' ? 12 : 8]);
        }

        $discount = Discount::query()->updateOrCreate(['code' => 'DEMO-WELCOME'], [
            'name' => 'Demo welcome discount', 'type' => 'fixed', 'amount_cents' => 1000,
            'starts_at' => $date->copy()->subDays(30), 'ends_at' => $date->copy()->addDays(30), 'is_active' => true,
        ]);

        foreach ([
            ['email' => 'avery@example.test', 'number' => 'DEMO-ORDER-1001', 'status' => 'refunded', 'lines' => [['DEMO-CHAIR-001', 'DEMO-CHAIR-001-NAT', 2], ['DEMO-LAMP-001', 'DEMO-LAMP-001-BRS', 1]], 'discount' => true],
            ['email' => 'jordan@example.test', 'number' => 'DEMO-ORDER-1002', 'status' => 'shipped', 'lines' => [['DEMO-LAMP-001', 'DEMO-LAMP-001-BRS', 1]], 'discount' => false],
        ] as $index => $fixture) {
            $customer = $customers[$fixture['email']];
            $address = $addresses[$fixture['email'] === 'avery@example.test' ? 'Avery home' : 'Jordan home'];
            $lines = [];
            $subtotal = 0;
            foreach ($fixture['lines'] as [$productSku, $variantSku, $quantity]) {
                $product = $products[$productSku];
                $variant = $variants[$variantSku];
                $lineTotal = $product->price_cents * $quantity;
                $subtotal += $lineTotal;
                $lines[] = compact('product', 'variant', 'quantity', 'lineTotal');
            }
            $discountCents = $fixture['discount'] ? $discount->amount_cents : 0;
            $order = Order::query()->updateOrCreate(['number' => $fixture['number']], [
                'customer_id' => $customer->id, 'billing_address_id' => $address->id, 'shipping_address_id' => $address->id,
                'discount_id' => $fixture['discount'] ? $discount->id : null, 'status' => $fixture['status'], 'currency' => 'USD',
                'subtotal_cents' => $subtotal, 'discount_cents' => $discountCents, 'tax_cents' => 0, 'shipping_cents' => 0,
                'total_cents' => $subtotal - $discountCents, 'placed_at' => $date->copy()->subDays(3 - $index),
            ]);
            foreach ($lines as $line) {
                OrderItem::query()->updateOrCreate(['order_id' => $order->id, 'sku' => $line['product']->sku], [
                    'product_id' => $line['product']->id, 'product_variant_id' => $line['variant']->id,
                    'product_name' => $line['product']->name, 'variant_name' => $line['variant']->name,
                    'quantity' => $line['quantity'], 'unit_price_cents' => $line['product']->price_cents, 'total_cents' => $line['lineTotal'],
                ]);
            }
            $payment = Payment::query()->updateOrCreate(['transaction_id' => 'DEMO-TXN-'.$fixture['number']], [
                'order_id' => $order->id, 'provider' => 'Demo Gateway', 'amount_cents' => $order->total_cents,
                'currency' => 'USD', 'status' => 'succeeded', 'paid_at' => $date->copy()->subDays(3 - $index)->addHours(1),
            ]);
            if ($index === 0) {
                Refund::query()->updateOrCreate(['payment_id' => $payment->id, 'reason' => 'Demo partial refund'], [
                    'amount_cents' => 500, 'status' => 'succeeded', 'refunded_at' => $date->copy()->subDays(2),
                ]);
            }
            if ($index === 1) {
                Shipment::query()->updateOrCreate(['tracking_number' => 'DEMO-TRACK-1002'], [
                    'order_id' => $order->id, 'carrier' => 'Demo Parcel', 'status' => 'shipped', 'shipped_at' => $date->copy()->subDay(), 'delivered_at' => null,
                ]);
            }
            foreach ([['pending', 'Demo order created'], ['paid', 'Demo payment recorded'], [$fixture['status'], 'Demo order status updated']] as $historyIndex => [$status, $comment]) {
                OrderStatusHistory::query()->updateOrCreate(['order_id' => $order->id, 'status' => $status, 'comment' => $comment], [
                    'created_at' => $date->copy()->subDays(3 - $index)->addHours($historyIndex), 'updated_at' => $date->copy()->subDays(3 - $index)->addHours($historyIndex),
                ]);
            }
        }

        foreach ([
            [$products['DEMO-CHAIR-001'], 'Demo product note: sample inventory for preview only.'],
            [Order::query()->where('number', 'DEMO-ORDER-1001')->firstOrFail(), 'Demo order note: sample transaction, no real payment.'],
        ] as [$model, $body]) {
            Note::query()->updateOrCreate(['noteable_type' => $model::class, 'noteable_id' => $model->id, 'body' => $body]);
        }

        foreach ([
            ['DEMO-CHAIR-001', 'avery@example.test', 5, 'Demo review: excellent sample chair.'],
            ['DEMO-LAMP-001', 'jordan@example.test', 4, 'Demo review: attractive sample lamp.'],
        ] as [$sku, $email, $rating, $body]) {
            Review::query()->updateOrCreate(['product_id' => $products[$sku]->id, 'customer_id' => $customers[$email]->id], [
                'rating' => $rating, 'title' => 'Demo customer review', 'body' => $body, 'status' => 'approved',
            ]);
        }
    }
}
