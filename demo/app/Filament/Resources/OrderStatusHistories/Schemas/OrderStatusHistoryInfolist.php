<?php

namespace App\Filament\Resources\OrderStatusHistories\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use Filament\Schemas\Schema;

class OrderStatusHistoryInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'order-status-history');
    }
}
