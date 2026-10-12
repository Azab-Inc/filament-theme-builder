<?php

namespace App\Filament\Pages\Showcase;

final class TenantSwitcherSurface
{
    public static function persistencePolicy(): string
    {
        return 'No tenant is persisted, switched, or used for authorization in this preview.';
    }

    /** @return array<int, string> */
    public static function options(): array
    {
        return ['Demo workspace', 'Read-only preview'];
    }
}
