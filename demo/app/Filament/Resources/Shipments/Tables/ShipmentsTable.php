<?php

namespace App\Filament\Resources\Shipments\Tables;

use App\Filament\Support\EntityResourceTable;
use Filament\Tables\Table;

class ShipmentsTable
{
    public static function configure(Table $table): Table
    {
        return EntityResourceTable::configure($table, 'shipment');
    }
}
