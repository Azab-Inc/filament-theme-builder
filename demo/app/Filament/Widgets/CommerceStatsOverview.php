<?php

namespace App\Filament\Widgets;

use App\Filament\Support\DashboardMetrics;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class CommerceStatsOverview extends StatsOverviewWidget
{
    protected int|string|array $columnSpan = 'full';

    protected ?string $heading = 'Commerce overview';

    protected ?string $description = 'Fixed showcase metrics through October 10, 2026.';

    protected int|array|null $columns = ['@xl' => 4, '!@lg' => 2];

    protected function getStats(): array
    {
        $summary = app(DashboardMetrics::class)->summary();

        return [
            Stat::make('Total revenue', '$'.number_format($summary['revenue_cents'] / 100, 2))
                ->description('Showcase order revenue')
                ->color('success'),
            Stat::make('Orders', (string) $summary['orders_count'])
                ->description('Placed showcase orders'),
            Stat::make('Customers', (string) $summary['customers_count'])
                ->description('Showcase customers'),
            Stat::make('Products', (string) $summary['products_count'])
                ->description($summary['low_stock_count'].' low-stock item'.($summary['low_stock_count'] === 1 ? '' : 's')),
        ];
    }
}
