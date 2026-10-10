<?php

namespace App\Filament\Resources\Shipments\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class ShipmentForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'shipment');
    }
}
