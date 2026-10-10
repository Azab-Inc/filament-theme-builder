<?php

namespace App\Filament\Resources\Categories\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class CategoriesTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'category');
    }
}
