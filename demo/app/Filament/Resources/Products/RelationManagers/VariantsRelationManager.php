<?php

namespace App\Filament\Resources\Products\RelationManagers;

use App\Filament\Support\RelationManagerTable;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class VariantsRelationManager extends RelationManager
{
    protected static string $relationship = 'variants';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')->required(), TextInput::make('sku')->required(),
            TextInput::make('price_cents')->numeric()->nullable(), Toggle::make('is_active'),
        ]);
    }

    public function table(Table $table): Table
    {
        return RelationManagerTable::configure($table, [
            TextColumn::make('name')->searchable(), TextColumn::make('sku')->searchable(),
            TextColumn::make('price_cents')->money('USD', divideBy: 100), TextColumn::make('is_active')->badge(),
        ], headerActions: [CreateAction::make()], recordActions: [EditAction::make(), DeleteAction::make()]);
    }
}
