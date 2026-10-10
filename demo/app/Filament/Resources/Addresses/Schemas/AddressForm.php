<?php

namespace App\Filament\Resources\Addresses\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class AddressForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'address');
    }
}
