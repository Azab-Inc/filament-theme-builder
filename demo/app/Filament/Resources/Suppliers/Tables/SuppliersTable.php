<?php

namespace App\Filament\Resources\Suppliers\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class SuppliersTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'supplier');
    }
}
