<?php

namespace App\Filament\Resources\Discounts\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class DiscountForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'discount');
    }
}
