<?php

namespace Tests\Feature\Filament;

use App\Filament\Support\DashboardMetrics;
use App\Filament\Widgets\CommerceStatsOverview;
use App\Filament\Widgets\LowStockProductsTable;
use App\Filament\Widgets\RecentOrdersTable;
use App\Filament\Widgets\RevenueOrdersChart;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Providers\Filament\AdminPanelProvider;
use Filament\Panel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use ReflectionClass;
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
            ->assertSeeInOrder(['Total revenue', '$406.00', 'Orders', '2', 'Customers', '2', 'Products', '2', '1 low-stock item']);
        $this->assertSame(4, substr_count($stats->html(), 'fi-wi-stats-overview-stat-content'));
        $chart = Livewire::test(RevenueOrdersChart::class)->assertSee('Revenue and orders')->assertSee('Oct 10');
        $chartData = (new ReflectionClass(RevenueOrdersChart::class))->getMethod('getData');
        $chartData->setAccessible(true);
        $data = $chartData->invoke($chart->instance());
        $this->assertSame(['Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10'], $data['labels']);
        $this->assertSame([0, 0, 0, 32700, 7900, 0, 0], $data['datasets'][0]['data']);
        $this->assertSame([0, 0, 0, 1, 1, 0, 0], $data['datasets'][1]['data']);

        Livewire::test(RecentOrdersTable::class)
            ->assertSee('Recent orders')->assertSee('DEMO-ORDER-1002')->assertSee('Oct 8, 2026')->assertSee('shipped')->assertSee('/demo/admin/orders/');
        Livewire::test(LowStockProductsTable::class)
            ->assertSee('Low-stock products')->assertSee('DEMO-LAMP-001')->assertSee('8')->assertSee('Low stock')->assertSee('/demo/admin/products/');
    }

    public function test_dashboard_registers_each_phase_one_widget_once_through_discovery(): void
    {
        $panel = (new AdminPanelProvider(app()))->panel(Panel::make());
        $property = (new ReflectionClass($panel))->getProperty('widgets');
        $property->setAccessible(true);
        $registeredWidgets = $property->getValue($panel);

        foreach ([CommerceStatsOverview::class, RevenueOrdersChart::class, RecentOrdersTable::class, LowStockProductsTable::class] as $widget) {
            $this->assertCount(1, array_filter($registeredWidgets, fn (string $registered): bool => $registered === $widget));
        }
    }

    public function test_low_stock_contract_aggregates_multiple_rows_and_excludes_threshold_plus_one(): void
    {
        $this->seed();
        $lamp = Product::query()->where('sku', 'DEMO-LAMP-001')->firstOrFail();
        Inventory::factory()->create(['product_id' => $lamp->id, 'product_variant_id' => null, 'quantity' => 2, 'location' => 'Demo overflow']);

        $aboveThreshold = Product::factory()->create(['sku' => 'DEMO-ABOVE-THRESHOLD', 'name' => 'Above threshold']);
        $aboveThreshold->forceFill(['is_demo_fixture' => true])->save();
        Inventory::factory()->create(['product_id' => $aboveThreshold->id, 'quantity' => DashboardMetrics::LOW_STOCK_THRESHOLD + 1]);

        $atThreshold = Product::factory()->create(['sku' => 'DEMO-AT-THRESHOLD', 'name' => 'At threshold']);
        $atThreshold->forceFill(['is_demo_fixture' => true])->save();
        Inventory::factory()->create(['product_id' => $atThreshold->id, 'quantity' => DashboardMetrics::LOW_STOCK_THRESHOLD]);

        $products = app(DashboardMetrics::class)->lowStockProducts();

        $this->assertSame(10, DashboardMetrics::LOW_STOCK_THRESHOLD);
        $this->assertSame(DashboardMetrics::LOW_STOCK_THRESHOLD, $products->firstWhere('sku', 'DEMO-LAMP-001')->dashboard_inventory_quantity);
        $this->assertContains('DEMO-AT-THRESHOLD', $products->pluck('sku')->all());
        $this->assertNotContains('DEMO-ABOVE-THRESHOLD', $products->pluck('sku')->all());
        $this->assertSame(['DEMO-AT-THRESHOLD', 'DEMO-LAMP-001'], $products->pluck('sku')->all());
    }

    public function test_missing_related_records_render_safe_placeholders_and_zero_inventory(): void
    {
        $this->seed();
        Order::query()->where('number', 'DEMO-ORDER-1002')->update(['customer_id' => null]);
        $product = Product::factory()->create(['sku' => 'DEMO-NO-INVENTORY', 'name' => 'No inventory product']);
        $product->forceFill(['is_demo_fixture' => true])->save();

        $metrics = app(DashboardMetrics::class);

        $this->assertNull($metrics->recentOrders()->firstWhere('number', 'DEMO-ORDER-1002')->customer);
        $this->assertSame(0, $metrics->lowStockProducts()->firstWhere('sku', 'DEMO-NO-INVENTORY')->dashboard_inventory_quantity);
        Livewire::test(RecentOrdersTable::class)->assertSee('Guest');
        Livewire::test(LowStockProductsTable::class)->assertSee('DEMO-NO-INVENTORY')->assertSee('0');
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
