<?php

namespace App\Filament\Pages\Showcase;

final class LoginSurface
{
    public static function credentialHint(): string
    {
        return 'Username: user · Password: password';
    }
}
