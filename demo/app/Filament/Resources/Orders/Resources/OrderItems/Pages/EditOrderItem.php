<?php

namespace App\Filament\Resources\Orders\Resources\OrderItems\Pages;

use App\Filament\Resources\Orders\Resources\OrderItems\OrderItemResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditOrderItem extends EditRecord
{
    protected static string $resource = OrderItemResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
