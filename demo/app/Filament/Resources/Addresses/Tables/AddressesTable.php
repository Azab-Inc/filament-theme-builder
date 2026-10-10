<?php

namespace App\Filament\Resources\Addresses\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class AddressesTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'address');
    }
}
