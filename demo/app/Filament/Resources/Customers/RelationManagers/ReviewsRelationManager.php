<?php

namespace App\Filament\Resources\Customers\RelationManagers;

use App\Filament\Support\RelationManagerTable;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReviewsRelationManager extends RelationManager
{
    protected static string $relationship = 'reviews';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('product_id')->relationship('product', 'name')->searchable()->preload()->required(),
            TextInput::make('rating')->numeric()->minValue(1)->maxValue(5)->required(), TextInput::make('title'),
            Textarea::make('body'), Select::make('status')->options(['pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected'])->required(),
        ]);
    }

    public function table(Table $table): Table
    {
        return RelationManagerTable::configure($table, [
            TextColumn::make('product.name')->searchable(), TextColumn::make('title')->searchable(),
            TextColumn::make('rating')->sortable(), TextColumn::make('status')->badge()->sortable(),
        ], headerActions: [CreateAction::make()], recordActions: [EditAction::make(), DeleteAction::make()]);
    }
}
