<?php

namespace App\Filament\Resources\Suppliers\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class SupplierForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'supplier');
    }
}
