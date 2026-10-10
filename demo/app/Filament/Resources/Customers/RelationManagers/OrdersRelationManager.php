<?php

namespace App\Filament\Resources\Customers\RelationManagers;

use App\Filament\Support\RelationManagerTable;
use Filament\Actions\DissociateAction;
use Filament\Actions\DissociateBulkAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class OrdersRelationManager extends RelationManager
{
    protected static string $relationship = 'orders';

    public function table(Table $table): Table
    {
        return RelationManagerTable::configure($table, [
            TextColumn::make('number')->searchable()->sortable(), TextColumn::make('status')->badge()->sortable(),
            TextColumn::make('total_cents')->money(fn ($record): string => $record->currency ?? 'USD', divideBy: 100),
        ], filters: [SelectFilter::make('status')->options(['pending' => 'Pending', 'paid' => 'Paid', 'shipped' => 'Shipped', 'refunded' => 'Refunded'])], recordActions: [DissociateAction::make()], toolbarActions: [DissociateBulkAction::make()]);
    }
}
