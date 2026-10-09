<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiHealthTest extends TestCase
{
    public function test_api_health_returns_ok_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk();
        $response->assertExactJson(['status' => 'ok']);
    }
}
