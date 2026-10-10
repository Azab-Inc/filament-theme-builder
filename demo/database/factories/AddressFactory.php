<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Address> */
class AddressFactory extends Factory
{
    public function definition(): array
    {
        return ['customer_id' => Customer::factory(), 'name' => fake()->name(), 'line_1' => fake()->streetAddress(), 'line_2' => null, 'city' => fake()->city(), 'state' => fake()->state(), 'postal_code' => fake()->postcode(), 'country' => 'US', 'phone' => fake()->phoneNumber()];
    }
}
