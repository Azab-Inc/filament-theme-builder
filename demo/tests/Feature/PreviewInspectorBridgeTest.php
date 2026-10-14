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

    public function test_preview_bridge_contains_the_v4_raw_override_projection_contract(): void
    {
        $this->get('/demo/admin/login')
            ->assertOk()
            ->assertSee('rawOverrides', false)
            ->assertSee('isSafeRawOverride', false)
            ->assertSee('ftb-managed-theme', false)
            ->assertSee('rawOverrideRules', false)
            ->assertSee('url\\s*\\(', false);
    }

    public function test_preview_bridge_keeps_raw_allowlist_and_duplicate_rejection_in_sync_with_builder_contract(): void
    {
        $response = $this->get('/demo/admin/login')->assertOk();

        foreach ([
            'color', 'background-color', 'border-color', 'border-width', 'border-radius',
            'box-shadow', 'opacity', 'padding', 'margin', 'font-family', 'font-size',
            'font-weight', 'line-height', 'letter-spacing', 'text-decoration',
            'border-style', 'text-align', 'white-space',
        ] as $property) {
            $response->assertSee("'{$property}'", false);
        }

        $response
            ->assertSee('new Set(message.theme.rawOverrides.map((override) => override.selector)).size === message.theme.rawOverrides.length', false)
            ->assertSee('rawSelectorPattern', false)
            ->assertSee('isSafeRawPropertyValue', false)
            ->assertSee('rawOverrideRules', false);
    }

    public function test_preview_bridge_projects_all_supported_semantic_override_mappings(): void
    {
        $this->get('/demo/admin/login')
            ->assertOk()
            ->assertSee("['button.primary\\u0000background'", false)
            ->assertSee("['button.secondary\\u0000background'", false)
            ->assertSee("['form.product-name\\u0000background'", false)
            ->assertSee("['global.primary\\u0000primary'", false)
            ->assertSee('semanticOverrideMappings', false)
            ->assertSee("['hover', 'focus']", false)
            ->assertSee("states: ['default', 'hover']", false)
            ->assertSee("states: ['focus']", false)
            ->assertSee('override.stateId !== \'default\' ? `${baseSelector}:${override.stateId}`', false)
            ->assertSee('supportedPseudoStates.includes(override.stateId)', false)
            ->assertDontSee("override.stateId === 'hover' ? 'hover' : 'focus'", false);
    }
}
