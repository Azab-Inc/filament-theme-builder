<?php

namespace App\Filament\Widgets;

use App\Filament\Support\DashboardMetrics;
use App\Filament\Widgets\Concerns\LoadsImmediately;
use Filament\Widgets\ChartWidget;

class RevenueOrdersChartWidget extends ChartWidget
{
    use LoadsImmediately;

    protected int|string|array $columnSpan = ['default' => 1, 'xl' => 2];

    protected ?string $heading = 'Revenue and orders';

    protected ?string $description = 'Daily showcase totals for October 4–10, 2026.';

    protected function getData(): array
    {
        $series = app(DashboardMetrics::class)->revenueAndOrdersSeries();

        return [
            'labels' => $series['labels'],
            'datasets' => [
                ['label' => 'Revenue (cents)', 'data' => $series['revenue_cents'], 'borderColor' => '#d97706', 'backgroundColor' => 'rgba(217, 119, 6, 0.15)', 'yAxisID' => 'revenue'],
                ['label' => 'Orders', 'data' => $series['orders'], 'borderColor' => '#2563eb', 'backgroundColor' => 'rgba(37, 99, 235, 0.15)', 'yAxisID' => 'orders'],
            ],
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
