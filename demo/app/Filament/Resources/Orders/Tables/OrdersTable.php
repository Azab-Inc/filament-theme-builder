<?php

namespace App\Filament\Resources\Orders\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'order');
    }
}
