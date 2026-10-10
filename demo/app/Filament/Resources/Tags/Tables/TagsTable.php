<?php

namespace App\Filament\Resources\Tags\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class TagsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'tag');
    }
}
