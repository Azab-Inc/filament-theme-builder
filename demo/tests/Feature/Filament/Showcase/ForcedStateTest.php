<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\ShowcaseStateControls;
use App\Filament\Support\ShowcaseState;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ForcedStateTest extends TestCase
{
    use RefreshDatabase;

    public function test_showcase_state_allowlist_is_explicit_and_reset_is_pure(): void
    {
        $this->assertSame([
            'default',
            'FormValidationState',
            'FormFocusState',
            'TableEmptyState',
            'TableLoadingState',
            'TableSelectedRowState',
            'ActionLoadingState',
            'ModalOpenState',
            'NotificationVisibleState',
            'HoverState',
            'DisabledState',
        ], ShowcaseState::allowed());
        $this->assertTrue(ShowcaseState::fromRequest(request()->duplicate(['state' => 'TableEmptyState']))->is('TableEmptyState'));
        $this->assertTrue(ShowcaseState::fromRequest(request()->duplicate(['state' => 'unknown']))->is('default'));
        $this->assertTrue(ShowcaseState::fromRequest(request()->duplicate(['state' => 'TableEmptyState']))->reset()->is('default'));
    }

    public function test_state_showcase_renders_each_named_state_without_writing_records_or_session(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $productBefore = Product::query()->orderBy('id')->pluck('updated_at', 'id')->map(static fn ($value): string => (string) $value)->all();

        foreach (array_diff(ShowcaseState::allowed(), ['default', 'hover', 'disabled']) as $state) {
            $this->get('/demo/admin/states-showcase?state='.$state)
                ->assertOk()
                ->assertSee('ShowcaseStateControls')
                ->assertSee($state);
        }

        $this->assertSame($productBefore, Product::query()->orderBy('id')->pluck('updated_at', 'id')->map(static fn ($value): string => (string) $value)->all());
        $this->assertFalse(session()->has('showcase_state'));
    }

    public function test_state_control_is_presentation_only_and_request_scoped(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(ShowcaseStateControls::class)
            ->set('state', 'ModalOpenState')
            ->assertSet('state', 'ModalOpenState')
            ->call('resetState')
            ->assertSet('state', 'default')
            ->assertSessionMissing('showcase_state');
    }
}
