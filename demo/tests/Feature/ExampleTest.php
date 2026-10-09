<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_root_route_is_not_the_laravel_welcome_view(): void
    {
        $this->get('/')->assertNotFound();
    }
}
