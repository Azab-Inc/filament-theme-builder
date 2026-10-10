<?php

namespace App\Filament\Pages\Showcase\Tables;

use App\Models\Order;
use Filament\Tables\Columns\Summarizers\Sum;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Grouping\Group;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class OrdersTableFixture extends TableWidget
{
    protected int|string|array $columnSpan = ['@xl' => 1, '!@lg' => 2];

    /** @return Builder<Order> */
    public function getTableQuery(): Builder
    {
        return Order::query()
            ->showcaseFixture()
            ->with('customer')
            ->orderBy('orders.id');
    }

    public function table(Table $table): Table
    {
        return $table
            ->heading('Orders table fixture')
            ->description('Seeded orders demonstrate money, status, relationship, and date columns.')
            ->columns([
                TextColumn::make('number')->label('Order')->searchable()->sortable(),
                TextColumn::make('customer.name')->label('Customer')->placeholder('Guest')->searchable()->sortable(),
                TextColumn::make('total_cents')->label('Total')->money(fn (Order $record): string => $record->currency, divideBy: 100)->sortable()->summarize(Sum::make('sum')->label('Order total')),
                TextColumn::make('status')->label('Status')->badge()->sortable(),
                TextColumn::make('placed_at')->label('Placed')->dateTime('M j, Y')->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'refunded' => 'Refunded',
                    'shipped' => 'Shipped',
                    'paid' => 'Paid',
                ]),
            ])
            ->groups([Group::make('status')->label('Status')->collapsible()])
            ->defaultGroup('status')
            ->defaultSort('orders.id')
            ->persistSearchInSession(false)
            ->persistSortInSession(false)
            ->persistFiltersInSession(false)
            ->emptyStateHeading('No orders found')
            ->emptyStateDescription('Seeded orders will appear here when available.')
            ->paginated([5, 10]);
    }
}
