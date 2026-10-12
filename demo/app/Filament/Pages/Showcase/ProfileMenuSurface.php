<?php

namespace App\Filament\Pages\Showcase;

final class ProfileMenuSurface
{
    /** @return array<int, string> */
    public static function actions(): array
    {
        return ['Profile', 'Sign out'];
    }
}
