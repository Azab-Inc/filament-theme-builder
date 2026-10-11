<?php

namespace App\Filament\Pages\Showcase\Forms;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\ToggleButtons;
use Filament\Schemas\Components\Section;
use Illuminate\Contracts\Support\Htmlable;

final class OrderStatusForm
{
    /** @return list<Htmlable|string> */
    public static function components(): array
    {
        return [
            Section::make('OrderStatusForm')
                ->description('A non-persisting status update with server-side validation.')
                ->schema([
                    Select::make('order_status')
                        ->label('Order status')
                        ->options([
                            'pending' => 'Pending',
                            'paid' => 'Paid',
                            'shipped' => 'Shipped',
                            'refunded' => 'Refunded',
                        ])
                        ->required(),
                    Textarea::make('order_status_note')
                        ->label('Status note')
                        ->default('Awaiting payment confirmation.')
                        ->nullable(),
                    ToggleButtons::make('status_presentation')
                        ->label('Status presentation')
                        ->options([
                            'pending' => 'Pending',
                            'paid' => 'Paid',
                            'shipped' => 'Shipped',
                        ])
                        ->default('pending')
                        ->inline()
                        ->required(),
                ])
                ->columns(2),
        ];
    }
}
