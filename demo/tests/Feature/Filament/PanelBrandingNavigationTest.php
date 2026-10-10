<?php

namespace Tests\Feature\Filament;

use App\Filament\Resources\Customers\CustomerResource;
use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Resources\Products\ProductResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelBrandingNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_panel_uses_local_independent_brand_assets_and_existing_navigation_groups(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin')
            ->assertOk()
            ->assertSee('Filament Theme Builder')
            ->assertDontSee('Filament Demo')
            ->assertSee('data:image/svg+xml;base64,')
            ->assertSee('fi-logo-light')
            ->assertSee('fi-logo-dark')
            ->assertSee('Catalog')
            ->assertSee('Sales')
            ->assertSee('Customers')
            ->assertSee('Operations')
            ->assertDontSee('https://filamentphp.com');

        foreach (['logo-light.svg', 'logo-dark.svg', 'favicon.svg'] as $asset) {
            $this->assertFileExists(resource_path('views/filament/branding/'.$asset));
        }
    }

    public function test_representative_resources_have_distinct_semantic_icons_and_stable_accessible_badges(): void
    {
        $this->seed();

        $this->assertNotSame(ProductResource::getNavigationIcon(), OrderResource::getNavigationIcon());
        $this->assertNotSame(OrderResource::getNavigationIcon(), CustomerResource::getNavigationIcon());

        $this->assertSame('2', ProductResource::getNavigationBadge());
        $this->assertSame('2', OrderResource::getNavigationBadge());
        $this->assertSame('2', CustomerResource::getNavigationBadge());
        $this->assertSame('success', ProductResource::getNavigationBadgeColor());
        $this->assertSame('info', OrderResource::getNavigationBadgeColor());
        $this->assertSame('gray', CustomerResource::getNavigationBadgeColor());

        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $html = $this->get('/demo/admin')->assertOk()->getContent();
        $this->assertStringContainsString('Total products', $html);
        $this->assertStringContainsString('Total orders', $html);
        $this->assertStringContainsString('Total customers', $html);
    }
}
