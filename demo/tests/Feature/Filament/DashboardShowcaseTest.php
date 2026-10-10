<?php

namespace Tests\Feature\Filament;

use App\Filament\Support\DashboardMetrics;
use App\Filament\Widgets\CommerceStatsOverview;
use App\Filament\Widgets\LowStockProductsTable;
use App\Filament\Widgets\RecentOrdersTable;
use App\Filament\Widgets\RevenueOrdersChart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class DashboardShowcaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_metrics_return_deterministic_seeded_summary_and_series(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $metrics = app(DashboardMetrics::class);

        $this->assertSame([
            'revenue_cents' => 40600,
            'orders_count' => 2,
            'customers_count' => 2,
            'products_count' => 2,
            'low_stock_count' => 1,
        ], $metrics->summary());

        $this->assertSame([
            'labels' => ['Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10'],
            'revenue_cents' => [0, 0, 0, 32700, 7900, 0, 0],
            'orders' => [0, 0, 0, 1, 1, 0, 0],
            'period' => [
                'from' => '2026-10-04 12:00:00',
                'to' => '2026-10-10 12:00:00',
            ],
        ], $metrics->revenueAndOrdersSeries());

        $this->assertSame(['DEMO-ORDER-1002', 'DEMO-ORDER-1001'], $metrics->recentOrders()->pluck('number')->all());
        $this->assertSame(['DEMO-LAMP-001'], $metrics->lowStockProducts()->pluck('sku')->all());

        $this->assertSame($metrics->summary(), app(DashboardMetrics::class)->summary());
        $this->assertSame($metrics->revenueAndOrdersSeries(), app(DashboardMetrics::class)->revenueAndOrdersSeries());
    }

    public function test_dashboard_widgets_render_four_stats_chart_and_tables_from_real_records(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin')->assertOk();

        $stats = Livewire::test(CommerceStatsOverview::class)
            ->assertSee('Total revenue')->assertSee('Orders')->assertSee('Customers')->assertSee('Products');
        $this->assertSame(4, substr_count($stats->html(), 'fi-wi-stats-overview-stat-content'));
        Livewire::test(RevenueOrdersChart::class)->assertSee('Revenue and orders')->assertSee('Oct 10');
        Livewire::test(RecentOrdersTable::class)->assertSee('Recent orders')->assertSee('DEMO-ORDER-1002')->assertSee('/demo/admin/orders/');
        Livewire::test(LowStockProductsTable::class)->assertSee('Low-stock products')->assertSee('DEMO-LAMP-001')->assertSee('/demo/admin/products/');
    }

    public function test_dashboard_metrics_are_safe_with_no_related_records(): void
    {
        $metrics = app(DashboardMetrics::class);

        $this->assertSame([
            'revenue_cents' => 0,
            'orders_count' => 0,
            'customers_count' => 0,
            'products_count' => 0,
            'low_stock_count' => 0,
        ], $metrics->summary());
        $this->assertCount(0, $metrics->recentOrders());
        $this->assertCount(0, $metrics->lowStockProducts());
        $this->assertSame([0, 0, 0, 0, 0, 0, 0], $metrics->revenueAndOrdersSeries()['revenue_cents']);
        $this->assertSame([0, 0, 0, 0, 0, 0, 0], $metrics->revenueAndOrdersSeries()['orders']);
    }

    public function test_dashboard_tables_show_accessible_empty_states_without_related_records(): void
    {
        Livewire::test(RecentOrdersTable::class)->assertSee('No recent orders');
        Livewire::test(LowStockProductsTable::class)->assertSee('No low-stock products');
    }
}
