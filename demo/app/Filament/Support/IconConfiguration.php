<?php

namespace App\Filament\Support;

final class IconConfiguration
{
    /**
     * @return array<string, string>
     */
    public static function panelIcons(): array
    {
        $overrides = config('preview.icon_overrides', []);
        $defaults = [
            'panels::resources.products.navigation-item' => 'heroicon-o-shopping-bag',
            'panels::resources.orders.navigation-item' => 'heroicon-o-shopping-cart',
            'panels::resources.customers.navigation-item' => 'heroicon-o-users',
            'panels::resources.inventories.navigation-item' => 'heroicon-o-archive-box',
        ];

        if (! is_array($overrides)) {
            return $defaults;
        }

        foreach ($defaults as $key => $default) {
            if (is_string($overrides[$key] ?? null) && preg_match('/^heroicon-(?:o|s|m)-(?:shopping-bag|shopping-cart|users|archive-box|cube|star|bolt|heart|check-circle)$/', $overrides[$key]) === 1) {
                $defaults[$key] = $overrides[$key];
            }
        }

        return $defaults;
    }
}
