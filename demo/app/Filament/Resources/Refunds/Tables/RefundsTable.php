<?php

namespace App\Filament\Resources\Refunds\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class RefundsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'refund');
    }
}
