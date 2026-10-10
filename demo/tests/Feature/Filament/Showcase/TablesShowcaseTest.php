<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\Tables\InventoryTableFixture;
use App\Filament\Pages\Showcase\Tables\OrdersTableFixture;
use App\Filament\Pages\Showcase\TablesShowcase;
use App\Models\Product;
use App\Models\ShowcaseTableProduct;
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
            ->assertSee('Orders')
            ->assertSee('Orders table fixture')
            ->assertSee('Inventory table fixture')
            ->assertSee('Loading products…');
    }

    public function test_tables_showcase_supports_search_sort_filter_group_summary_and_column_toggles(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $component = Livewire::test(TablesShowcase::class)
            ->assertCanSeeTableRecords(ShowcaseTableProduct::query()->orderBy('position')->get())
            ->assertTableColumnExists('product.image_url')
            ->assertTableColumnExists('product.name')
            ->assertTableColumnExists('product.status')
            ->assertTableColumnExists('product.supplier.name')
            ->assertTableColumnExists('order_items_count')
            ->assertTableColumnExists('is_featured')
            ->assertTableColumnSummarizerExists('order_items_count', 'count')
            ->searchTable('Brass Lamp')
            ->assertCanSeeTableRecords(ShowcaseTableProduct::query()->whereHas('product', fn ($query) => $query->where('sku', 'DEMO-LAMP-001'))->get())
            ->searchTable()
            ->sortTable('position', 'desc')
            ->assertSet('tableSort', 'position:desc');

        $this->assertSame(
            ShowcaseTableProduct::query()->orderByDesc('position')->pluck('id')->all(),
            $component->instance()->getFilteredSortedTableQuery()->pluck('showcase_table_products.id')->all(),
        );

        $component
            ->filterTable('status', 'active')
            ->assertCanSeeTableRecords(ShowcaseTableProduct::query()->whereHas('product', fn ($query) => $query->where('status', 'active'))->orderByDesc('position')->get(), true)
            ->assertTableColumnVisible('product.name');

        $component->set('tableGrouping', 'product.status');
        $this->assertSame('product.status', $component->instance()->getTableGrouping()?->getId());
        $component->set('tableRecordsPerPage', 1);
        $this->assertCount(1, $component->instance()->getTableRecords());
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
            ->assertNotified('Product details are read-only in this showcase.')
            ->set('selectedTableRecords', [ShowcaseTableProduct::query()->whereBelongsTo($product)->value('id')])
            ->mountTableBulkAction('review-selection', ShowcaseTableProduct::query()->whereBelongsTo($product)->pluck('id')->all())
            ->callMountedTableBulkAction()
            ->assertNotified('Selected products are ready for review.');

        $this->assertSame($before, $product->fresh()->getAttributes());
    }

    public function test_tables_showcase_reorders_only_the_isolated_fixture_rows(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $rows = ShowcaseTableProduct::query()->orderBy('position')->get();
        $canonicalBefore = Product::query()->orderBy('id')->pluck('name', 'id')->all();

        Livewire::test(TablesShowcase::class)
            ->call('toggleTableReordering')
            ->call('reorderTable', [$rows[1]->getKey(), $rows[0]->getKey()]);

        $this->assertSame(
            [$rows[1]->getKey(), $rows[0]->getKey()],
            ShowcaseTableProduct::query()->orderBy('position')->pluck('id')->all(),
        );
        $this->assertSame($canonicalBefore, Product::query()->orderBy('id')->pluck('name', 'id')->all());
    }

    public function test_orders_and_inventory_are_native_table_fixtures_with_safe_empty_states(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(OrdersTableFixture::class)
            ->assertSee('DEMO-ORDER-1001')
            ->assertTableColumnExists('number')
            ->assertTableColumnExists('status')
            ->assertTableColumnSummarizerExists('total_cents', 'sum');

        Livewire::test(InventoryTableFixture::class)
            ->assertSee('Demo Oak Chair')
            ->assertTableColumnExists('product.name')
            ->assertTableColumnExists('quantity')
            ->assertTableColumnSummarizerExists('quantity', 'sum');
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
            ->assertTableColumnStateSet('product.supplier.name', 'No supplier', $lamp)
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
