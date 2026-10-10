<?php

namespace App\Filament\Resources\Reviews\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class ReviewsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'review');
    }
}
