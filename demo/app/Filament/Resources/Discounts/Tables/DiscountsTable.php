<?php

namespace App\Filament\Resources\Discounts\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class DiscountsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'discount');
    }
}
