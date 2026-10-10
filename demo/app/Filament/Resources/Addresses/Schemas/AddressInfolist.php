<?php

namespace App\Filament\Resources\Addresses\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class AddressInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'address');
    }
}
