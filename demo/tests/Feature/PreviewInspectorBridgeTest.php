<?php

namespace Tests\Feature;

use Tests\TestCase;

class PreviewInspectorBridgeTest extends TestCase
{
    public function test_preview_bridge_contains_the_versioned_inspector_channel(): void
    {
        $this->get('/demo/admin/login')
            ->assertOk()
            ->assertSee('INSPECTOR_PROTOCOL_VERSION', false)
            ->assertSee("'ftb:inspector:enable'", false)
            ->assertSee("'ftb:inspector:disable'", false)
            ->assertSee("'ftb:inspector:hover'", false)
            ->assertSee("'ftb:inspector:select'", false)
            ->assertSee('event.source !== window.parent', false)
            ->assertSee('allowedOrigins.includes(event.origin)', false)
            ->assertSee('ftb-inspector-hover', false)
            ->assertSee('ftb-inspector-selected', false)
            ->assertSee('candidateSelectors', false)
            ->assertSee('compoundSelectors', false)
            ->assertSee('clearInspector', false);
    }
}
