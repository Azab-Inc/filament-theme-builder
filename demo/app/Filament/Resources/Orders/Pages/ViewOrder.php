<?php

namespace App\Filament\Resources\Orders\Pages;

use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Resources\Orders\Resources\OrderItems\OrderItemResource;
use App\Filament\Support\OrderWorkflow;
use App\Models\Order;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;
use Illuminate\Validation\ValidationException;

class ViewOrder extends ViewRecord
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('items')
                ->label('Items')
                ->url(fn (): string => OrderItemResource::getUrl('index', ['order' => $this->record])),
            Action::make('markFulfilled')
                ->label('Mark fulfilled')
                ->form([
                    Select::make('fulfillment')
                        ->label('Fulfillment')
                        ->options(['shipped' => 'Shipped'])
                        ->default('shipped')
                        ->required(),
                ])
                ->requiresConfirmation()
                ->modalHeading('Mark order as fulfilled')
                ->modalSubmitActionLabel('Confirm fulfillment')
                ->action(function (array $data): void {
                    if (($data['fulfillment'] ?? null) !== OrderWorkflow::FULFILLED_STATUS) {
                        Notification::make()->danger()->title('Unable to fulfill order')->body('Choose the fixed shipped fulfillment option.')->send();

                        return;
                    }

                    try {
                        $record = $this->getRecord();

                        if (! $record instanceof Order) {
                            throw ValidationException::withMessages(['order' => 'The selected record is not an order.']);
                        }

                        app(OrderWorkflow::class)->markFulfilled($record);
                        $this->getRecord()->refresh();
                    } catch (ValidationException $exception) {
                        Notification::make()->danger()->title('Unable to fulfill order')->body($exception->validator->errors()->first())->send();

                        return;
                    }

                    Notification::make()->success()->title('Order marked as fulfilled')->send();
                }),
            EditAction::make(),
        ];
    }
}
