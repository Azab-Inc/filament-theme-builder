<?php

namespace App\Filament\Pages\Showcase\Forms;

use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Repeater;
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
                    Repeater::make('additional_contacts')
                        ->label('Additional contact methods')
                        ->schema([
                            TextInput::make('label')
                                ->label('Contact method')
                                ->required(),
                            TextInput::make('value')
                                ->label('Contact value')
                                ->email()
                                ->required(),
                        ])
                        ->default([
                            ['label' => 'Studio', 'value' => 'studio@example.test'],
                        ])
                        ->columns(2),
                    Radio::make('preferred_contact_method')
                        ->label('Preferred contact method')
                        ->options([
                            'email' => 'Email',
                            'phone' => 'Phone',
                            'sms' => 'SMS',
                        ])
                        ->default('email')
                        ->inline()
                        ->required(),
                ])
                ->columns(2),
        ];
    }
}
