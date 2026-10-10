<?php

namespace App\Filament\Pages\Showcase\Tables;

use App\Models\Inventory;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\Summarizers\Sum;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class InventoryTableFixture extends TableWidget
{
    protected int|string|array $columnSpan = ['@xl' => 1, '!@lg' => 2];

    /** @return Builder<Inventory> */
    public function getTableQuery(): Builder
    {
        return Inventory::query()
            ->with(['product', 'variant'])
            ->whereHas('product', fn (Builder $query): Builder => $query->where('is_demo_fixture', true))
            ->orderBy('inventories.id');
    }

    public function table(Table $table): Table
    {
        return $table
            ->heading('Inventory table fixture')
            ->description('Seeded inventory demonstrates relationship, numeric, icon, and summary columns.')
            ->columns([
                TextColumn::make('product.name')->label('Product')->placeholder('No product')->searchable()->sortable(),
                TextColumn::make('variant.name')->label('Variant')->placeholder('No variant')->searchable(),
                TextColumn::make('quantity')->label('Units')->numeric()->sortable()->summarize(Sum::make('sum')->label('Total units')),
                TextColumn::make('location')->label('Location')->searchable()->sortable(),
                IconColumn::make('in_stock')->label('In stock')->boolean()->state(fn (Inventory $record): bool => $record->quantity > 0),
            ])
            ->filters([
                SelectFilter::make('location')->options(['Demo warehouse' => 'Demo warehouse']),
            ])
            ->defaultSort('inventories.id')
            ->persistSearchInSession(false)
            ->persistSortInSession(false)
            ->persistFiltersInSession(false)
            ->emptyStateHeading('No inventory found')
            ->emptyStateDescription('Seeded inventory will appear here when available.')
            ->paginated([5, 10]);
    }
}
