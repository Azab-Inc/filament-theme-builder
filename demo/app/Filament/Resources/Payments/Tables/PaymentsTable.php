<?php

namespace App\Filament\Resources\Payments\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class PaymentsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'payment');
    }
}
