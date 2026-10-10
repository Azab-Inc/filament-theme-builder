<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OrderStatusHistory> */
class OrderStatusHistoryFactory extends Factory
{
    public function definition(): array
    {
        return ['order_id' => Order::factory(), 'status' => 'pending', 'comment' => 'Demo status update'];
    }
}
