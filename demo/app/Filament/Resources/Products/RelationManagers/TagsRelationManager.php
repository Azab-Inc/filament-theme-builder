<?php

namespace App\Filament\Resources\Products\RelationManagers;

use App\Filament\Support\RelationManagerTable;
use Filament\Actions\AttachAction;
use Filament\Actions\DetachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Table;

class TagsRelationManager extends RelationManager
{
    protected static string $relationship = 'tags';

    public function table(Table $table): Table
    {
        return RelationManagerTable::configure($table, [
            TextColumn::make('name')->searchable()->sortable(), TextColumn::make('slug')->searchable(),
        ], filters: [Filter::make('named')->query(fn ($query) => $query->whereNotNull('name'))], headerActions: [AttachAction::make()], recordActions: [DetachAction::make()], toolbarActions: [DetachBulkAction::make()]);
    }
}
