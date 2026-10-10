<?php

namespace App\Filament\Resources\Products\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'product');
    }
}
