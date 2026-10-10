<?php

namespace App\Filament\Resources\Customers\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class CustomersTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'customer');
    }
}
