<?php

namespace Tests\Feature;

use Tests\TestCase;

class ComposeRuntimeTest extends TestCase
{
    public function test_filament_login_route_is_available_under_demo_prefix(): void
    {
        $this->get('/demo/admin/login')
            ->assertOk()
            ->assertSee('Sign in');
    }

    public function test_root_route_is_not_the_laravel_welcome_view(): void
    {
        $this->get('/')->assertNotFound();
    }

    public function test_api_health_returns_exact_ok_json(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson(['status' => 'ok']);
    }

    public function test_maintenance_commands_are_registered_and_scheduled_every_ten_minutes(): void
    {
        foreach (['demo:reset', 'shares:cleanup-expired', 'uploads:cleanup'] as $command) {
            $this->artisan('schedule:list')
                ->expectsOutputToContain("php artisan {$command}")
                ->expectsOutputToContain('*/10 * * * *')
                ->assertExitCode(0);
        }
    }

    public function test_maintenance_commands_are_observable_when_their_domain_storage_is_unconfigured(): void
    {
        $this->artisan('demo:reset')
            ->expectsOutputToContain('skipped')
            ->assertExitCode(0);

        $this->artisan('shares:cleanup-expired')
            ->expectsOutputToContain('skipped')
            ->assertExitCode(0);

        $this->artisan('uploads:cleanup')
            ->expectsOutputToContain('skipped')
            ->assertExitCode(0);
    }
}
