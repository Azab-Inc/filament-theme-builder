<?php

namespace Tests\Feature\Filament\Resources;

use App\Filament\Resources\Orders\OrderResource;
use App\Filament\Support\OrderWorkflow;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Filament\Actions\Action;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use Tests\TestCase;

class CommerceActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_details_render_safe_placeholders_for_missing_customer_and_product(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        $order = Order::query()->where('number', 'DEMO-ORDER-1002')->firstOrFail();
        $order->update(['customer_id' => null]);
        OrderItem::query()->where('order_id', $order->getKey())->update(['product_id' => null, 'product_name' => 'Unavailable sample product']);

        Livewire::test(OrderResource::getPages()['view']->getPage(), ['record' => $order->getRouteKey()])
            ->assertSee('Guest')
            ->assertSee('Unavailable sample product');
    }

    public function test_paid_order_can_be_marked_fulfilled_and_records_status_history(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $order = Order::factory()->paid()->create();

        Livewire::test(OrderResource::getPages()['view']->getPage(), ['record' => $order->getRouteKey()])
            ->mountAction('markFulfilled')
            ->fillForm(['fulfillment' => 'shipped'])
            ->callMountedAction()
            ->assertNotified('Order marked as fulfilled');

        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'status' => 'shipped']);
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->getKey(), 'status' => 'shipped']);
    }

    public function test_mark_fulfilled_action_has_fixed_confirmation_form_and_cancel_does_not_mutate(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $order = Order::factory()->paid()->create();

        Livewire::test(OrderResource::getPages()['view']->getPage(), ['record' => $order->getRouteKey()])
            ->assertActionExists('markFulfilled', fn (Action $action): bool => $action->isConfirmationRequired()
                && $action->getModalHeading() === 'Mark order as fulfilled'
                && $action->getModalSubmitActionLabel() === 'Confirm fulfillment'
                && $action->getModalCancelActionLabel() === 'Cancel')
            ->mountAction('markFulfilled')
            ->assertActionMounted('markFulfilled');

        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'status' => 'paid']);
        $this->assertDatabaseMissing('order_status_histories', ['order_id' => $order->getKey(), 'status' => 'shipped']);
    }

    public function test_invalid_transition_is_rejected_server_side_and_notifies_failure(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $order = Order::factory()->create(['status' => 'pending']);

        $this->expectException(ValidationException::class);
        app(OrderWorkflow::class)->markFulfilled($order);
    }

    public function test_invalid_transition_action_sends_failure_notification_without_mutating_order(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $order = Order::factory()->create(['status' => 'pending']);

        Livewire::test(OrderResource::getPages()['view']->getPage(), ['record' => $order->getRouteKey()])
            ->mountAction('markFulfilled')
            ->fillForm(['fulfillment' => 'shipped'])
            ->callMountedAction()
            ->assertNotified('Unable to fulfill order');

        $this->assertDatabaseHas('orders', ['id' => $order->getKey(), 'status' => 'pending']);
    }

    public function test_unauthorized_user_cannot_use_the_order_workflow(): void
    {
        $this->seed();
        $order = Order::factory()->paid()->create();

        $this->expectException(AuthorizationException::class);
        app(OrderWorkflow::class)->markFulfilled($order);
    }

    public function test_order_surfaces_do_not_expose_unrestricted_delete_actions(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());
        $order = Order::query()->firstOrFail();

        Livewire::test(OrderResource::getPages()['index']->getPage())
            ->assertTableBulkActionDoesNotExist('delete');

        Livewire::test(OrderResource::getPages()['edit']->getPage(), ['record' => $order->getRouteKey()])
            ->assertActionDoesNotExist('delete');
    }

    public function test_capability_inventory_describes_confirmed_order_fulfillment_boundary(): void
    {
        $inventory = file_get_contents(dirname(__DIR__, 5).'/docs/ai-operability/demo-showcase-capability-inventory.md');

        $this->assertStringContainsString('`commerce.orders.mark-fulfilled`', $inventory);
        $this->assertStringContainsString('Explicit confirmation before applying status transition', $inventory);
        $this->assertStringContainsString('No MCP mutation tool; not available', $inventory);
    }
}
