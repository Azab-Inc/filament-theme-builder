<?php

namespace Database\Factories;

use App\Models\Discount;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Discount> */
class DiscountFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Demo discount', 'code' => fake()->unique()->bothify('DEMO-####'), 'type' => 'fixed', 'amount_cents' => 500, 'starts_at' => null, 'ends_at' => null, 'is_active' => true];
    }
}
