<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\FormsShowcase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class FormsShowcaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_forms_showcase_page_is_registered_and_renders_native_schema_fixtures(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin/forms-showcase')
            ->assertOk()
            ->assertSee('Forms & Schemas')
            ->assertSee('ProductEditorForm')
            ->assertSee('CustomerContactForm')
            ->assertSee('OrderStatusForm')
            ->assertSee('Section / grid layout')
            ->assertSee('Wizard steps layout')
            ->assertSee('Tabbed form layout')
            ->assertSee('Product image')
            ->assertSee('Local preview only; JPEG/PNG; not stored')
            ->assertDontSee('type="file"')
            ->assertSee('Street address')
            ->assertSee('Order status');
    }

    public function test_forms_showcase_uses_deterministic_prefilled_optional_and_contact_states(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->assertFormSet([
                'product_name' => 'Considered Field Notebook',
                'product_reference' => 'FIXTURE-PRODUCT-001',
                'product_price' => '24.00',
                'product_category' => 'stationery',
                'product_available' => true,
                'product_launch_date' => '2026-10-10',
                'product_image' => 'Local preview only; JPEG/PNG; not stored',
                'product_long_text' => 'A long deterministic fixture paragraph keeps the showcase readable while exercising long-form text treatment without relying on persisted content.',
                'street_address' => '14 Market Street',
                'contact_email' => 'hello@example.test',
                'order_status' => 'pending',
            ])
            ->assertSee('Product description');
    }

    public function test_forms_showcase_rejects_long_text_overflow(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->fillForm(['product_long_text' => str_repeat('Overflow fixture text. ', 20)])
            ->call('save')
            ->assertHasFormErrors(['product_long_text' => 'max']);
    }

    public function test_forms_showcase_rejects_invalid_contact_email(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->fillForm(['contact_email' => 'not-an-email'])
            ->call('save')
            ->assertHasFormErrors(['contact_email' => 'email']);
    }

    public function test_forms_showcase_server_validation_rejects_missing_required_order_status(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->fillForm(['order_status' => ''])
            ->call('save')
            ->assertHasFormErrors(['order_status' => 'required']);
    }

    public function test_forms_showcase_exposes_named_product_customer_and_order_fixtures(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin/forms-showcase')
            ->assertOk()
            ->assertSee('ProductEditorForm')
            ->assertSee('CustomerContactForm')
            ->assertSee('OrderStatusForm')
            ->assertSee('Section / grid layout')
            ->assertSee('Wizard steps layout')
            ->assertSee('Tabbed form layout')
            ->assertSee('Product price')
            ->assertSee('Product category')
            ->assertSee('Product availability')
            ->assertSee('Product launch date')
            ->assertSee('Product image')
            ->assertSee('Local preview only; JPEG/PNG; not stored')
            ->assertSee('Street address')
            ->assertSee('Contact email')
            ->assertSee('Order status');
    }

    public function test_forms_showcase_prefills_named_fixture_values_and_validates_order_status(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->assertFormSet([
                'product_name' => 'Considered Field Notebook',
                'product_price' => '24.00',
                'product_category' => 'stationery',
                'product_available' => true,
                'product_launch_date' => '2026-10-10',
                'product_image' => 'Local preview only; JPEG/PNG; not stored',
                'street_address' => '14 Market Street',
                'contact_email' => 'hello@example.test',
                'order_status' => 'pending',
            ])
            ->fillForm(['order_status' => ''])
            ->call('save')
            ->assertHasFormErrors(['order_status' => 'required']);
    }
}
