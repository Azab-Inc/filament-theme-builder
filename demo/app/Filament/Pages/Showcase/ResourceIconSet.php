<?php

namespace App\Filament\Pages\Showcase;

use Filament\Support\Icons\Heroicon;

final class ResourceIconSet
{
    /**
     * @return array<int, array{label: string, icon: Heroicon, description: string}>
     */
    public static function items(): array
    {
        return [
            ['label' => 'Products', 'icon' => Heroicon::OutlinedShoppingBag, 'description' => 'Catalog fixtures'],
            ['label' => 'Orders', 'icon' => Heroicon::OutlinedShoppingCart, 'description' => 'Sales fixtures'],
            ['label' => 'Customers', 'icon' => Heroicon::OutlinedUsers, 'description' => 'Customer fixtures'],
            ['label' => 'Inventory', 'icon' => Heroicon::OutlinedArchiveBox, 'description' => 'Operations fixtures'],
        ];
    }
}
