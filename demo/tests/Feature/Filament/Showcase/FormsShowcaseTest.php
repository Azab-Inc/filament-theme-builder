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
            ->assertSee('Campaign brief')
            ->assertSee('Wizard')
            ->assertSee('Repeater')
            ->assertSee('Content blocks')
            ->assertSee('Editorial notes')
            ->assertSee('Tabs and sections')
            ->assertSee('Conditional details')
            ->assertSee('Disabled fixture')
            ->assertSee('Prefilled fixture');
    }

    public function test_forms_showcase_uses_deterministic_prefilled_optional_and_long_text_states(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->assertFormSet([
                'campaign_name' => 'Autumn studio launch',
                'audience' => 'Independent makers',
                'show_details' => true,
                'optional_note' => null,
                'long_text' => 'A long local fixture paragraph demonstrates how editorial copy remains readable while the form stays scannable.',
            ])
            ->assertSee('Long text fixture');
    }

    public function test_forms_showcase_server_validation_rejects_missing_required_campaign_name(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(FormsShowcase::class)
            ->fillForm(['campaign_name' => ''])
            ->call('save')
            ->assertHasFormErrors(['campaign_name' => 'required']);
    }
}
