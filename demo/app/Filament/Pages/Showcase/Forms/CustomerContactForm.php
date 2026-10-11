<?php

namespace App\Filament\Pages\Showcase\Forms;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Illuminate\Contracts\Support\Htmlable;

final class CustomerContactForm
{
    /** @return list<Htmlable|string> */
    public static function components(): array
    {
        return [
            Section::make('CustomerContactForm')
                ->description('Address and contact fields for a customer-facing fixture.')
                ->schema([
                    TextInput::make('street_address')
                        ->label('Street address')
                        ->required(),
                    TextInput::make('city')
                        ->label('City')
                        ->required(),
                    TextInput::make('region')
                        ->label('State or region'),
                    TextInput::make('postal_code')
                        ->label('Postal code')
                        ->required(),
                    TextInput::make('contact_email')
                        ->label('Contact email')
                        ->email()
                        ->required(),
                    TextInput::make('contact_phone')
                        ->label('Contact phone')
                        ->tel(),
                ])
                ->columns(2),
        ];
    }
}
