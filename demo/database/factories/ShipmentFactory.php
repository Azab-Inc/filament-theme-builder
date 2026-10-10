<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Shipment> */
class ShipmentFactory extends Factory
{
    public function definition(): array
    {
        return ['order_id' => Order::factory(), 'carrier' => 'Demo Parcel', 'tracking_number' => fake()->unique()->bothify('DEMO-########'), 'status' => 'pending', 'shipped_at' => null, 'delivered_at' => null];
    }
}
