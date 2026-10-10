<?php

namespace App\Filament\Resources\Refunds\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class RefundForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'refund');
    }
}
