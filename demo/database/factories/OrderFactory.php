<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $amount = fake()->numberBetween(100, 100000);

        return ['customer_id' => Customer::factory(), 'billing_address_id' => null, 'shipping_address_id' => null, 'discount_id' => null, 'number' => fake()->unique()->bothify('ORD-########'), 'status' => 'pending', 'currency' => 'USD', 'subtotal_cents' => $amount, 'discount_cents' => 0, 'tax_cents' => 0, 'shipping_cents' => 0, 'total_cents' => $amount, 'placed_at' => null];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => 'paid']);
    }
}
