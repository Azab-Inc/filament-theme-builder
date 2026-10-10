<?php

namespace App\Filament\Resources\Inventories\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class InventoryInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'inventory');
    }
}
