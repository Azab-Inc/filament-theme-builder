<?php

namespace Database\Factories;

use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Inventory> */
class InventoryFactory extends Factory
{
    public function definition(): array
    {
        return ['product_id' => Product::factory(), 'product_variant_id' => null, 'quantity' => fake()->numberBetween(0, 100), 'location' => 'Demo warehouse'];
    }
}
