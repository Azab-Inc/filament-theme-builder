<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Review> */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return ['product_id' => Product::factory(), 'customer_id' => Customer::factory(), 'rating' => fake()->numberBetween(1, 5), 'title' => fake()->sentence(3), 'body' => fake()->paragraph(), 'status' => 'approved'];
    }
}
