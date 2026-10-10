<?php

namespace App\Filament\Resources\Orders\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'order');
    }
}
