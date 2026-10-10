<?php

namespace App\Filament\Resources\ProductVariants\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class ProductVariantInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'product-variant');
    }
}
