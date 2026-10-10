<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->words(3, true);

        return ['name' => $name, 'slug' => Str::slug($name).'-'.fake()->unique()->numerify('####'), 'sku' => fake()->unique()->bothify('SKU-####??'), 'description' => fake()->sentence(), 'price_cents' => fake()->numberBetween(100, 100000), 'status' => 'active', 'image_url' => null, 'supplier_id' => null];
    }
}
