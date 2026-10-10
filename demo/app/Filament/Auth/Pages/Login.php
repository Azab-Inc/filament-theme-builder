<?php

namespace App\Filament\Auth\Pages;

use Filament\Auth\Pages\Login as BaseLogin;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Component;
use Illuminate\Support\HtmlString;

class Login extends BaseLogin
{
    protected function getEmailFormComponent(): Component
    {
        return TextInput::make('email')
            ->label('Username')
            ->required()
            ->autocomplete('username')
            ->autofocus()
            ->hint(new HtmlString('Username: user<br>Password: password'));
    }
}
