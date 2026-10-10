<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'product');
    }
}
