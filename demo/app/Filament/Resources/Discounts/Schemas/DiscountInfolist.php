<?php

namespace App\Filament\Resources\Discounts\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class DiscountInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'discount');
    }
}
