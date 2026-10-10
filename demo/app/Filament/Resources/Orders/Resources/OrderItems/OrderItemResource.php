<?php

namespace App\Filament\Resources\Orders\Resources\OrderItems;

use App\Filament\Resources\OrderItems\Schemas\OrderItemForm;
use App\Filament\Resources\OrderItems\Schemas\OrderItemInfolist;
use App\Filament\Resources\OrderItems\Tables\OrderItemsTable;
use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Resources\Orders\Resources\OrderItems\Pages\CreateOrderItem;
use App\Filament\Resources\Orders\Resources\OrderItems\Pages\EditOrderItem;
use App\Filament\Resources\Orders\Resources\OrderItems\Pages\ListOrderItems;
use App\Filament\Support\HasEagerLoadedRelations;
use App\Models\OrderItem;
use BackedEnum;
use Filament\Resources\ParentResourceRegistration;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class OrderItemResource extends Resource
{
    use HasEagerLoadedRelations;

    protected static ?string $model = OrderItem::class;

    protected static ?string $parentResource = OrderResource::class;

    protected static string|UnitEnum|null $navigationGroup = 'Sales';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return OrderItemForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return OrderItemInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return OrderItemsTable::configure($table);
    }

    public static function getParentResourceRegistration(): ?ParentResourceRegistration
    {
        return OrderResource::asParent(childResource: static::class)->relationship('items');
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOrderItems::route('/'),
            'create' => CreateOrderItem::route('/create'),
            'edit' => EditOrderItem::route('/{record}/edit'),
        ];
    }
}
