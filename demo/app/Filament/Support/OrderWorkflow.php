<?php

namespace App\Filament\Support;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class OrderWorkflow
{
    public const FULFILLED_STATUS = 'shipped';

    public function markFulfilled(Order $order): Order
    {
        if (! auth()->check()) {
            throw new AuthorizationException('An authenticated panel user is required to fulfill an order.');
        }

        $order = $order->fresh();

        if ($order === null) {
            throw ValidationException::withMessages(['order' => 'The order is no longer available.']);
        }

        if (! in_array($order->status, ['paid', self::FULFILLED_STATUS], true)) {
            throw ValidationException::withMessages([
                'fulfillment' => 'Only paid orders can be marked as fulfilled.',
            ]);
        }

        if ($order->status === self::FULFILLED_STATUS) {
            return $order;
        }

        return DB::transaction(function () use ($order): Order {
            $order->update(['status' => self::FULFILLED_STATUS]);
            OrderStatusHistory::query()->create([
                'order_id' => $order->getKey(),
                'status' => self::FULFILLED_STATUS,
                'comment' => 'Order marked as fulfilled from the order view.',
            ]);

            return $order->refresh();
        });
    }
}
