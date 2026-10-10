<?php

namespace App\Filament\Resources\Notes\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class NotesTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'note');
    }
}
