<?php

namespace Tests\Feature\Filament;

use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelBrandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_branding_is_read_from_a_validated_runtime_payload(): void
    {
        $response = $this->get('/demo/admin?ftb_branding='.rawurlencode(base64_encode(json_encode([
            'appName' => 'Acme Admin',
            'lightLogo' => null,
            'darkLogo' => null,
            'favicon' => null,
            'logoHeight' => '3rem',
            'brandTypography' => ['kind' => 'curated', 'name' => 'Roboto', 'family' => 'Roboto', 'provider' => 'google-fonts'],
            'contentWidth' => '5xl',
            'sidebar' => 'fully-collapsible',
        ], JSON_THROW_ON_ERROR))));

        $response->assertOk();
        $this->assertSame('Acme Admin', (string) Filament::getBrandName());
        $this->assertSame('3rem', Filament::getCurrentPanel()->getBrandLogoHeight());
    }

    public function test_invalid_runtime_branding_falls_back_to_native_defaults(): void
    {
        $response = $this->get('/demo/admin?ftb_branding='.rawurlencode(base64_encode(json_encode([
            'appName' => '<script>alert(1)</script>',
        ], JSON_THROW_ON_ERROR))));

        $response->assertOk();
        $response->assertSee('Filament Theme Builder');
        $response->assertDontSee('<script>alert(1)</script>', false);
    }
}
