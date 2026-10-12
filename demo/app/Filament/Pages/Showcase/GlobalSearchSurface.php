<?php

namespace App\Filament\Pages\Showcase;

final class GlobalSearchSurface
{
    public static function keyboardHint(): string
    {
        return 'Ctrl K';
    }

    public static function exampleQuery(): string
    {
        return 'DEMO-ORDER-1001';
    }
}
