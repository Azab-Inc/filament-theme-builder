<?php

namespace Tests\Feature\Filament;

use App\Filament\Resources\Customers\CustomerResource;
use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Resources\Products\ProductResource;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Filament\Support\Icons\Heroicon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
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
        $this->assertSame(Heroicon::OutlinedShoppingBag, ProductResource::getNavigationIcon());
        $this->assertSame(Heroicon::OutlinedShoppingCart, OrderResource::getNavigationIcon());
        $this->assertSame(Heroicon::OutlinedUsers, CustomerResource::getNavigationIcon());

        $this->assertSame('2', ProductResource::getNavigationBadge());
        $this->assertSame('2', OrderResource::getNavigationBadge());
        $this->assertSame('2', CustomerResource::getNavigationBadge());
        $this->assertSame('success', ProductResource::getNavigationBadgeColor());
        $this->assertSame('info', OrderResource::getNavigationBadgeColor());
        $this->assertSame('gray', CustomerResource::getNavigationBadgeColor());

        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $html = $this->get('/demo/admin')->assertOk()->getContent();
        $this->assertStringContainsString('Showcase product fixtures', $html);
        $this->assertStringContainsString('Showcase order fixtures', $html);
        $this->assertStringContainsString('Showcase customer fixtures', $html);
    }

    public function test_showcase_badges_ignore_ordinary_create_delete_and_visitor_auth_state(): void
    {
        $this->seed();

        $this->assertSame(['2', '2', '2'], $this->badgeValues());

        $newProduct = Product::factory()->create();
        $newOrder = Order::factory()->create();
        $newCustomer = Customer::factory()->create();
        $this->assertSame(['2', '2', '2'], $this->badgeValues());

        $this->assertTrue($newProduct->delete());
        $this->assertTrue($newOrder->delete());
        $this->assertTrue($newCustomer->delete());
        $this->assertSame(['2', '2', '2'], $this->badgeValues());

        $showcaseProduct = Product::query()->where('sku', 'DEMO-CHAIR-001')->firstOrFail();
        $showcaseOrder = Order::query()->where('number', 'DEMO-ORDER-1001')->firstOrFail();
        $showcaseCustomer = Customer::query()->where('email', 'avery@example.test')->firstOrFail();
        $this->assertFalse($showcaseProduct->delete());
        $this->assertFalse($showcaseOrder->delete());
        $this->assertFalse($showcaseCustomer->delete());

        Livewire::test(ProductResource::getPages()['index']->getPage())
            ->callTableBulkAction('delete', [$showcaseProduct->getKey()])
            ->assertNotified('Failed to delete');

        $this->assertDatabaseHas('products', ['id' => $showcaseProduct->getKey()]);
        $this->assertSame(['2', '2', '2'], $this->badgeValues());

        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $this->assertSame(['2', '2', '2'], $this->badgeValues());
    }

    /** @return array{string|null, string|null, string|null} */
    private function badgeValues(): array
    {
        return [
            ProductResource::getNavigationBadge(),
            OrderResource::getNavigationBadge(),
            CustomerResource::getNavigationBadge(),
        ];
    }
}
