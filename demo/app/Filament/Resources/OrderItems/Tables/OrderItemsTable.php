<?php

namespace App\Filament\Resources\OrderItems\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class OrderItemsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'order-item');
    }
}
