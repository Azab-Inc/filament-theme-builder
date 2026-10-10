<?php

namespace App\Filament\Resources\Orders\Resources\OrderItems\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

final class NestedOrderItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('product_id')->relationship('product', 'name')->searchable()->preload()->nullable(),
            Select::make('product_variant_id')->relationship('variant', 'name')->searchable()->preload()->nullable(),
            TextInput::make('product_name')->required(), TextInput::make('variant_name'), TextInput::make('sku'),
            TextInput::make('quantity')->numeric()->required(), TextInput::make('unit_price_cents')->numeric()->required(),
            TextInput::make('total_cents')->numeric()->required(),
        ]);
    }
}
