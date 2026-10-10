<?php

namespace App\Filament\Resources\OrderStatusHistories\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class OrderStatusHistoriesTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'order-status-history');
    }
}
