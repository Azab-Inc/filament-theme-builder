<?php

namespace App\Filament\Resources\OrderStatusHistories\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class OrderStatusHistoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'order-status-history');
    }
}
