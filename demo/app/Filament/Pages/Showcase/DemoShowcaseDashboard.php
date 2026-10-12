<?php

namespace App\Filament\Pages\Showcase;

use App\Filament\Widgets\CommerceStatsOverviewWidget;
use App\Filament\Widgets\LowStockWidget;
use App\Filament\Widgets\RecentOrdersWidget;
use App\Filament\Widgets\RevenueOrdersChartWidget;
use Filament\Pages\Dashboard;

final class DemoShowcaseDashboard extends Dashboard
{
    /**
     * @return array<int, class-string>
     */
    public function getWidgets(): array
    {
        return [
            CommerceStatsOverviewWidget::class,
            RevenueOrdersChartWidget::class,
            RecentOrdersWidget::class,
            LowStockWidget::class,
        ];
    }

    public function getColumns(): array
    {
        return ['default' => 1, 'lg' => 2, 'xl' => 4];
    }
}
