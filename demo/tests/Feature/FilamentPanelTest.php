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
            ->assertSee('!allowedOrigins.includes(event.origin)', false)
            ->assertSee("'ftb:theme:update'", false)
            ->assertSee('allowedOrigins.includes(event.origin)', false)
            ->assertSee('event.source !== window.parent', false)
            ->assertSee('ftb:preview-compatibility', false)
            ->assertSee('projection.schemaVersion !== 1', false)
            ->assertSee("projection.compatibility !== 'filament-5.9'", false)
            ->assertSee("mapping.mapping !== 'preview-emulatable'", false)
            ->assertSee('!previewVariables.has(mapping.variable)', false)
            ->assertSee("message.theme.customCss !== ''", false)
            ->assertSee('message.theme.schemaVersion === 3', false);
    }

    public function test_showcase_index_is_public_but_focused_showcase_pages_require_authentication(): void
    {
        $this->get('/demo/admin/showcase')->assertOk()->assertSee('Showcase');
        $this->get('/demo/admin/forms-showcase')->assertRedirect('/demo/admin/login');
    }

    public function test_anonymous_upload_fixture_is_public_and_isolated_from_focused_showcase_pages(): void
    {
        $this->get('/demo/admin/anonymous-upload')
            ->assertOk()
            ->assertSee('Anonymous demo uploads')
            ->assertSee('JPEG, PNG, WebP, or PDF up to 5 MB');
    }

    public function test_profile_page_requires_authentication_and_allows_seeded_demo_user(): void
    {
        $this->get('/demo/admin/profile')
            ->assertRedirect('/demo/admin/login');

        $this->seed();

        $this->actingAs(User::query()->where('email', 'user')->firstOrFail())
            ->get('/demo/admin/profile')
            ->assertOk()
            ->assertSee('Profile');
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
