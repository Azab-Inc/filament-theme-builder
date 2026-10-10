<?php

namespace Tests\Feature;

use App\Filament\Auth\Pages\Login;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Livewire\Livewire;
use Tests\TestCase;

class FilamentPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_filament_panel_login_route_is_available(): void
    {
        $this->get('/demo/admin/login')
            ->assertOk()
            ->assertSee('Sign in')
            ->assertSee('Username: user')
            ->assertSee('Password: password')
            ->assertSee('Username');
    }

    public function test_preview_dashboard_is_public_and_embeddable(): void
    {
        $this->get('/demo/admin')
            ->assertOk()
            ->assertSee('Dashboard')
            ->assertSee('ftb-preview-bridge')
            ->assertSee('event.origin !== window.location.origin', false);
    }

    public function test_demo_credentials_can_authenticate_with_username(): void
    {
        $this->seed();
        $this->seed();
        $this->assertDatabaseCount('users', 1);

        Livewire::test(Login::class)
            ->set('data.email', 'user')
            ->set('data.password', 'password')
            ->call('authenticate')
            ->assertRedirect('/demo/admin');

        $this->assertAuthenticatedAs(User::query()->where('email', 'user')->firstOrFail());
    }

    public function test_logout_returns_to_public_preview(): void
    {
        $user = User::query()->create([
            'name' => 'Demo User',
            'email' => 'user',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user)
            ->post('/demo/admin/logout')
            ->assertRedirect('/demo/admin');

        $this->assertGuest();
        $this->get('/demo/admin')->assertOk();
    }
}
