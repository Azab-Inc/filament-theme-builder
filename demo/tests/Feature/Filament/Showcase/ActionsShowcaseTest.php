<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\ActionsShowcase;
use App\Filament\Pages\Showcase\NotificationsShowcase;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Schemas\Schema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ActionsShowcaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_actions_and_notifications_showcase_pages_render_deterministic_native_fixtures(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $this->get('/demo/admin/actions-showcase')
            ->assertOk()
            ->assertSee('Actions & Modals')
            ->assertSee('Primary action')
            ->assertSee('Danger action')
            ->assertSee('Success action')
            ->assertSee('Warning action')
            ->assertSee('Info action')
            ->assertSee('Gray action')
            ->assertSee('Outline action')
            ->assertSee('Icon-only action')
            ->assertSee('Disabled action')
            ->assertSee('Loading action')
            ->assertSee('Action group')
            ->assertSee('Tooltip action')
            ->assertSee('Confirmation modal')
            ->assertSee('Form modal')
            ->assertSee('Slide-over form')
            ->assertSee('Read-only details');

        $this->get('/demo/admin/notifications-showcase')
            ->assertOk()
            ->assertSee('Notifications')
            ->assertSee('Success notification')
            ->assertSee('Danger notification')
            ->assertSee('Warning notification')
            ->assertSee('Info notification')
            ->assertSee('Persistent fixture notification')
            ->assertSee('Transient fixture notification');
    }

    public function test_actions_use_native_variants_and_safe_read_only_callbacks(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(ActionsShowcase::class)
            ->assertActionExists('primary')
            ->assertActionExists('danger')
            ->assertActionExists('success')
            ->assertActionExists('warning')
            ->assertActionExists('info')
            ->assertActionExists('gray')
            ->assertActionExists('outline', fn (Action $action): bool => $action->isOutlined())
            ->assertActionExists('iconOnly', fn (Action $action): bool => $action->getIcon() !== null)
            ->assertActionExists('disabled', fn (Action $action): bool => $action->isDisabled())
            ->assertActionExists('loading', fn (Action $action): bool => $action->getLivewireTarget() !== null)
            ->assertActionExists('tooltip', fn (Action $action): bool => $action->getTooltip() === 'Explains this fixture action')
            ->assertActionExists('confirm', fn (Action $action): bool => $action->isConfirmationRequired())
            ->assertActionExists('form', fn (Action $action): bool => $action->getSchema(Schema::make()) !== null)
            ->assertActionExists('slideOver')
            ->assertActionExists('details')
            ->assertActionExists('groupPrimary');
    }

    public function test_form_action_validates_and_confirmation_and_cancel_do_not_mutate_state(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(ActionsShowcase::class)
            ->mountAction('form')
            ->assertActionMounted('form')
            ->callMountedAction()
            ->assertHasFormErrors(['note' => 'required']);

        Livewire::test(ActionsShowcase::class)
            ->mountAction('confirm')
            ->assertActionMounted('confirm')
            ->unmountAction()
            ->assertActionNotMounted('confirm');
    }

    public function test_notifications_page_has_explicit_state_for_each_status(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(NotificationsShowcase::class)
            ->assertSet('lastNotification', 'Info notification')
            ->call('showSuccess')
            ->assertSet('lastNotification', 'Success notification')
            ->call('showDanger')
            ->assertSet('lastNotification', 'Danger notification')
            ->call('showWarning')
            ->assertSet('lastNotification', 'Warning notification')
            ->call('showInfo')
            ->assertSet('lastNotification', 'Info notification')
            ->call('showPersistent')
            ->assertSet('lastNotification', 'Persistent fixture notification')
            ->call('showTransient')
            ->assertSet('lastNotification', 'Transient fixture notification');
    }
}
