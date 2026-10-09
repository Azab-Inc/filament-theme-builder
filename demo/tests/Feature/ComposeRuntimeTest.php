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
}
