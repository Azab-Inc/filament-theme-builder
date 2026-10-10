<?php

namespace App\Filament\Resources\Shipments\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class ShipmentInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'shipment');
    }
}
