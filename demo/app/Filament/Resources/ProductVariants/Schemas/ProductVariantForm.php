<?php

namespace App\Filament\Resources\ProductVariants\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class ProductVariantForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'product-variant');
    }
}
