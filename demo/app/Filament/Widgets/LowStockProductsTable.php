<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\Products\ProductResource;
use App\Filament\Support\DashboardMetrics;
use App\Models\Product;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Support\Collection;

class LowStockProductsTable extends TableWidget
{
    protected int|string|array $columnSpan = ['@xl' => 2, '!@lg' => 2];

    public function table(Table $table): Table
    {
        return $table
            ->heading('Low-stock products')
            ->description('Showcase products with inventory at or below 10 units.')
            ->records(fn (): Collection => app(DashboardMetrics::class)->lowStockProducts())
            ->columns([
                TextColumn::make('sku')->label('SKU')->url(fn (Product $record): string => ProductResource::getUrl('view', ['record' => $record])),
                TextColumn::make('name')->label('Product'),
                TextColumn::make('inventories.quantity')->label('Units'),
            ])
            ->paginated(false)
            ->emptyStateHeading('No low-stock products')
            ->emptyStateDescription('Products below the stock threshold will appear here.');
    }
}
