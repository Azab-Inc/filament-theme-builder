<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Refund;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Refund> */
class RefundFactory extends Factory
{
    public function definition(): array
    {
        return ['payment_id' => Payment::factory(), 'amount_cents' => fake()->numberBetween(1, 10000), 'reason' => 'Demo refund', 'status' => 'pending', 'refunded_at' => null];
    }
}
