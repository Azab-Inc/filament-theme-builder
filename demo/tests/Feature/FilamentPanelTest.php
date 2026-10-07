<?php

namespace Tests\Feature;

use Tests\TestCase;

class FilamentPanelTest extends TestCase
{
    public function test_filament_panel_login_route_is_available(): void
    {
        $this->get('/admin/login')->assertOk();
    }
}
