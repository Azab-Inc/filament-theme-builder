<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Support\DashboardMetrics;
use App\Models\Order;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Support\Collection;

class RecentOrdersWidget extends TableWidget
{
    protected int|string|array $columnSpan = ['default' => 1, 'xl' => 2];

    public function table(Table $table): Table
    {
        return $table
            ->heading('Recent orders')
            ->description('Latest showcase orders by placed date.')
            ->records(fn (): Collection => app(DashboardMetrics::class)->recentOrders())
            ->columns([
                TextColumn::make('number')->label('Order')->url(fn (Order $record): string => OrderResource::getUrl('view', ['record' => $record])),
                TextColumn::make('customer.name')->label('Customer')->placeholder('Guest'),
                TextColumn::make('placed_at')->label('Placed')->dateTime('M j, Y'),
                TextColumn::make('total_cents')->label('Total')->money(fn (Order $record): string => $record->currency, divideBy: 100),
                TextColumn::make('status')->badge(),
            ])
            ->paginated(false)
            ->emptyStateHeading('No recent orders')
            ->emptyStateDescription('Showcase orders will appear here when available.');
    }
}
