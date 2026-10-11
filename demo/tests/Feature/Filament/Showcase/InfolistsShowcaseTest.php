<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\InfolistsShowcase;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class InfolistsShowcaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_infolists_showcase_renders_native_product_and_order_entries(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin/infolists-showcase')
            ->assertOk()
            ->assertSee('Infolists')
            ->assertSee('Product overview')
            ->assertSee('Product details')
            ->assertSee('Related order')
            ->assertSee('DEMO-CHAIR-001')
            ->assertSee('DEMO-ORDER-1001')
            ->assertSee('Avery Demo')
            ->assertSee('Demonstration product; not available for purchase.')
            ->assertSee('Natural finish')
            ->assertSee('Product image')
            ->assertSee('alt="Demo Oak Chair"', false)
            ->assertSee('Demo bestseller')
            ->assertSee('Featured fixture')
            ->assertSee('Order items');
    }

    public function test_infolist_sections_use_readable_accessible_labels_and_native_layout_entries(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(InfolistsShowcase::class)
            ->assertSee('Product overview')
            ->assertSee('Product details')
            ->assertSee('Related order')
            ->assertSee('Order items')
            ->assertSee('Customer')
            ->assertSee('Status')
            ->assertSee('Supplier')
            ->assertSee('Description')
            ->assertSee('Price')
            ->assertSee('SKU');
    }

    public function test_rich_text_is_escaped_and_missing_values_relationships_and_repeating_rows_are_safe(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $product = Product::query()->where('sku', 'DEMO-CHAIR-001')->firstOrFail();
        $product->update(['description' => '<script>alert("xss")</script><strong>Safe copy</strong>', 'image_url' => null, 'supplier_id' => null]);
        $order = Order::query()->where('number', 'DEMO-ORDER-1001')->firstOrFail();
        $order->update(['customer_id' => null]);

        Livewire::test(InfolistsShowcase::class)
            ->assertSee('Safe copy')
            ->assertDontSee('<script>alert("xss")</script>', false)
            ->assertSee('No image')
            ->assertSee('No supplier')
            ->assertSee('Guest')
            ->assertSee('Order items')
            ->assertSee('Natural finish')
            ->assertSee('Demo Brass Lamp');
    }

    public function test_infolist_showcase_is_read_only(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $product = Product::query()->where('sku', 'DEMO-CHAIR-001')->firstOrFail();
        $order = Order::query()->where('number', 'DEMO-ORDER-1001')->firstOrFail();
        $productBefore = $product->getAttributes();
        $orderBefore = $order->getAttributes();

        Livewire::test(InfolistsShowcase::class)->assertOk();

        $this->assertSame($productBefore, $product->fresh()->getAttributes());
        $this->assertSame($orderBefore, $order->fresh()->getAttributes());
    }
}
