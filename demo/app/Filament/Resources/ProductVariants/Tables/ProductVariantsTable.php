<?php

namespace App\Filament\Resources\ProductVariants\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class ProductVariantsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'product-variant');
    }
}
