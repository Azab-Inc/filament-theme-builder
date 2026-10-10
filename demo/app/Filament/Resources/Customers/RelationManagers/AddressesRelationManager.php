<?php

namespace App\Filament\Resources\Customers\RelationManagers;

use App\Filament\Support\RelationManagerTable;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class AddressesRelationManager extends RelationManager
{
    protected static string $relationship = 'addresses';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name'), TextInput::make('line_1')->required(), TextInput::make('line_2'),
            TextInput::make('city')->required(), TextInput::make('state'), TextInput::make('postal_code'),
            TextInput::make('country')->length(2)->required(), TextInput::make('phone'),
        ]);
    }

    public function table(Table $table): Table
    {
        return RelationManagerTable::configure($table, [
            TextColumn::make('name')->searchable(), TextColumn::make('line_1')->searchable(),
            TextColumn::make('city')->searchable(), TextColumn::make('country')->badge(),
        ], headerActions: [CreateAction::make()], recordActions: [EditAction::make(), DeleteAction::make()]);
    }
}
