<?php

namespace App\Filament\Support;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

final class DashboardMetrics
{
    private const REFERENCE_DATE = '2026-10-10 12:00:00';

    /** Dashboard presentation contract; this threshold is not persisted domain data. */
    public const LOW_STOCK_THRESHOLD = 10;

    /** @return array{revenue_cents: int, orders_count: int, customers_count: int, products_count: int, low_stock_count: int} */
    public function summary(): array
    {
        return [
            'revenue_cents' => (int) Order::query()->showcaseFixture()->sum('total_cents'),
            'orders_count' => Order::query()->showcaseFixture()->count(),
            'customers_count' => Customer::query()->showcaseFixture()->count(),
            'products_count' => Product::query()->showcaseFixture()->count(),
            'low_stock_count' => $this->lowStockProducts()->count(),
        ];
    }

    /** @return array{labels: array<int, string>, revenue_cents: array<int, int>, orders: array<int, int>, period: array{from: string, to: string}} */
    public function revenueAndOrdersSeries(): array
    {
        $to = Carbon::parse(self::REFERENCE_DATE);
        $from = $to->copy()->subDays(6);
        $days = collect(range(0, 6))->map(fn (int $offset): Carbon => $from->copy()->addDays($offset));
        $orders = Order::query()
            ->showcaseFixture()
            ->whereBetween('placed_at', [$from, $to])
            ->get(['number', 'total_cents', 'placed_at']);

        return [
            'labels' => $days->map(fn (Carbon $day): string => $day->format('M j'))->all(),
            'revenue_cents' => $days->map(fn (Carbon $day): int => (int) $orders->filter(fn (Order $order): bool => $order->placed_at !== null && Carbon::parse($order->placed_at)->isSameDay($day))->sum('total_cents'))->all(),
            'orders' => $days->map(fn (Carbon $day): int => $orders->filter(fn (Order $order): bool => $order->placed_at !== null && Carbon::parse($order->placed_at)->isSameDay($day))->count())->all(),
            'period' => ['from' => $from->format('Y-m-d H:i:s'), 'to' => $to->format('Y-m-d H:i:s')],
        ];
    }

    /** @return Collection<int, Order> */
    public function recentOrders(): Collection
    {
        return Order::query()
            ->showcaseFixture()
            ->with('customer')
            ->orderByDesc('placed_at')
            ->orderByDesc('number')
            ->limit(5)
            ->get();
    }

    /** @return Collection<int, Product> */
    public function lowStockProducts(): Collection
    {
        return Product::query()
            ->showcaseFixture()
            ->with(['inventories' => fn ($query) => $query->orderBy('location')->orderBy('id')])
            ->orderBy('sku')
            ->get()
            ->map(function (Product $product): Product {
                return $product->setAttribute(
                    'dashboard_inventory_quantity',
                    (int) $product->inventories->sum('quantity'),
                );
            })
            ->filter(fn (Product $product): bool => (int) $product->getAttribute('dashboard_inventory_quantity') <= self::LOW_STOCK_THRESHOLD)
            ->values()
            ->take(5);
    }
}
