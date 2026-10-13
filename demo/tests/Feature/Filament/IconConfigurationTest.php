<?php

namespace Tests\Feature\Filament;

use App\Filament\Support\IconConfiguration;
use App\Providers\Filament\AdminPanelProvider;
use Filament\Panel;
use Tests\TestCase;

class IconConfigurationTest extends TestCase
{
    public function test_default_panel_icon_configuration_is_explicit_and_semantic(): void
    {
        $icons = IconConfiguration::panelIcons();

        $this->assertSame('heroicon-o-shopping-bag', $icons['panels::resources.products.navigation-item']);
        $this->assertSame('heroicon-o-shopping-cart', $icons['panels::resources.orders.navigation-item']);
        $this->assertSame('heroicon-o-users', $icons['panels::resources.customers.navigation-item']);
        $this->assertSame('heroicon-o-archive-box', $icons['panels::resources.inventories.navigation-item']);
    }

    public function test_panel_provider_surfaces_the_icon_configuration_to_filament(): void
    {
        $panel = (new AdminPanelProvider($this->app))->panel(Panel::make());

        $this->assertSame(IconConfiguration::panelIcons(), $panel->getIcons());
    }
}
