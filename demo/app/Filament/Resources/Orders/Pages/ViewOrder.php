<?php

namespace App\Filament\Resources\Orders\Pages;

use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Resources\Orders\Resources\OrderItems\OrderItemResource;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewOrder extends ViewRecord
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('items')
                ->label('Items')
                ->url(fn (): string => OrderItemResource::getUrl('index', ['order' => $this->record])),
            EditAction::make(),
        ];
    }
}
