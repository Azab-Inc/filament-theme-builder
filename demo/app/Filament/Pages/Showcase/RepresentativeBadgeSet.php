<?php

namespace App\Filament\Pages\Showcase;

final class RepresentativeBadgeSet
{
    /**
     * @return array<int, array{label: string, color: string}>
     */
    public static function items(): array
    {
        return [
            ['label' => 'Active', 'color' => 'success'],
            ['label' => 'Pending', 'color' => 'warning'],
            ['label' => 'Read-only preview', 'color' => 'gray'],
        ];
    }
}
