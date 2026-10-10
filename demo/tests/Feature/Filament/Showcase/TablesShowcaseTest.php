<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\TablesShowcase;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class TablesShowcaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_tables_showcase_renders_native_table_variants_and_seeded_products(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin/tables-showcase')
            ->assertOk()
            ->assertSee('Tables')
            ->assertSee('Demo Oak Chair')
            ->assertSee('Demo Brass Lamp')
            ->assertSee('Product image')
            ->assertSee('Status')
            ->assertSee('Supplier')
            ->assertSee('Orders');
    }

    public function test_tables_showcase_supports_search_sort_filter_group_summary_and_column_toggles(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(TablesShowcase::class)
            ->assertCanSeeTableRecords(Product::query()->orderBy('id')->get())
            ->assertTableColumnExists('image_url')
            ->assertTableColumnExists('name')
            ->assertTableColumnExists('status')
            ->assertTableColumnExists('supplier.name')
            ->assertTableColumnExists('order_items_count')
            ->assertTableColumnExists('is_featured')
            ->assertTableColumnSummarizerExists('order_items_count', 'count')
            ->searchTable('Brass Lamp')
            ->assertCanSeeTableRecords(Product::query()->where('sku', 'DEMO-LAMP-001')->get())
            ->sortTable('name', 'desc')
            ->filterTable('status', 'active')
            ->assertTableColumnVisible('name');
    }

    public function test_tables_showcase_actions_are_confirmed_and_do_not_mutate_seeded_records(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $product = Product::query()->where('sku', 'DEMO-CHAIR-001')->firstOrFail();
        $before = $product->getAttributes();

        Livewire::test(TablesShowcase::class)
            ->assertTableActionExists('inspect', null, $product)
            ->assertTableBulkActionExists('review-selection')
            ->mountTableAction('inspect', $product->getKey())
            ->callMountedTableAction()
            ->assertNotified('Product details are read-only in this showcase.');

        $this->assertSame($before, $product->fresh()->getAttributes());
    }

    public function test_tables_showcase_handles_missing_relationships_images_long_names_invalid_filters_and_empty_results(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        Product::query()->where('sku', 'DEMO-LAMP-001')->update([
            'name' => str_repeat('Very long product name ', 8),
            'image_url' => null,
            'supplier_id' => null,
        ]);
        $lamp = Product::query()->where('sku', 'DEMO-LAMP-001')->firstOrFail();

        Livewire::test(TablesShowcase::class)
            ->assertSee('Very long product name')
            ->assertSee('No image')
            ->assertTableColumnStateSet('supplier.name', 'No supplier', $lamp)
            ->filterTable('status', 'not-a-real-status')
            ->searchTable('no such product')
            ->assertSee('No products found')
            ->assertHasNoErrors();
    }

    public function test_tables_showcase_resets_selection_after_filtering(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $product = Product::query()->where('sku', 'DEMO-CHAIR-001')->firstOrFail();

        Livewire::test(TablesShowcase::class)
            ->set('selectedTableRecords', [$product->getKey()])
            ->searchTable('no such product')
            ->assertSet('selectedTableRecords', []);
    }
}
