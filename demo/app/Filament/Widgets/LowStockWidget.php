<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\Products\ProductResource;
use App\Filament\Support\DashboardMetrics;
use App\Filament\Widgets\Concerns\LoadsImmediately;
use App\Models\Product;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Support\Collection;

class LowStockWidget extends TableWidget
{
    use LoadsImmediately;

    protected int|string|array $columnSpan = ['default' => 1, 'xl' => 2];

    public function table(Table $table): Table
    {
        return $table
            ->heading('Low-stock products')
            ->description('Showcase products with inventory at or below '.DashboardMetrics::LOW_STOCK_THRESHOLD.' units.')
            ->records(fn (): Collection => app(DashboardMetrics::class)->lowStockProducts())
            ->columns([
                TextColumn::make('sku')->label('SKU')->url(fn (Product $record): string => ProductResource::getUrl('view', ['record' => $record])),
                TextColumn::make('name')->label('Product'),
                TextColumn::make('dashboard_inventory_quantity')->label('Units'),
                TextColumn::make('stock_status')->label('Status')->state('Low stock')->badge(),
            ])
            ->paginated(false)
            ->emptyStateHeading('No low-stock products')
            ->emptyStateDescription('Products below the stock threshold will appear here.');
    }
}
