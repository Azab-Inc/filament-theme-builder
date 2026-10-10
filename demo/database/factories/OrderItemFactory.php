<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OrderItem> */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        $price = fake()->numberBetween(100, 100000);

        return ['order_id' => Order::factory(), 'product_id' => null, 'product_variant_id' => null, 'product_name' => fake()->words(3, true), 'variant_name' => null, 'sku' => fake()->unique()->bothify('SKU-####??'), 'quantity' => 1, 'unit_price_cents' => $price, 'total_cents' => $price];
    }
}
