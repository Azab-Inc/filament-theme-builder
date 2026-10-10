<?php

namespace App\Filament\Resources\Customers\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class CustomerForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'customer');
    }
}
