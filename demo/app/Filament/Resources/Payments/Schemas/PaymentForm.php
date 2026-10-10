<?php

namespace App\Filament\Resources\Payments\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class PaymentForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'payment');
    }
}
