<?php

namespace App\Filament\Resources\Suppliers\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class SupplierInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'supplier');
    }
}
