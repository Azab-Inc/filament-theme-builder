<?php

declare(strict_types=1);

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\ThemeTokenOperation;
use PHPUnit\Framework\TestCase;

final class ThemeTokenOperationTest extends TestCase
{
    public function test_named_color_can_be_read_and_set_only_as_a_bounded_hex_value(): void
    {
        $theme = $this->theme();
        self::assertSame('#123456', ThemeTokenOperation::read($theme, ['kind' => 'user-color', 'name' => 'accent'])['light']);
        $changed = ThemeTokenOperation::mutate($theme, ['kind' => 'user-color', 'name' => 'accent'], 'set', 'dark', '#abcdef');
        self::assertSame('#abcdef', $changed['foundations']['userTokens']['colors']['accent']['dark']);
        $this->expectException(\InvalidArgumentException::class);
        ThemeTokenOperation::mutate($theme, ['kind' => 'user-color', 'name' => 'accent'], 'set', 'light', 'var(--unsafe)');
    }

    public function test_link_and_unlink_use_canonical_identity_and_keep_mode_values_equal(): void
    {
        $theme = $this->theme();
        $target = ['kind' => 'user-color', 'name' => 'accent'];
        $linked = ThemeTokenOperation::mutate($theme, ['kind' => 'mode-link', 'target' => $target], 'link', 'light');
        $identity = 'target:{"kind":"user-color","name":"accent"}';
        self::assertSame('#123456', $linked['modeLinks'][$identity]['value']);
        self::assertSame('#123456', $linked['foundations']['userTokens']['colors']['accent']['dark']);
        $unlinked = ThemeTokenOperation::mutate($linked, ['kind' => 'mode-link', 'target' => $target], 'unlink');
        self::assertArrayNotHasKey($identity, $unlinked['modeLinks']);
    }

    public function test_custom_palette_shade_supports_preview_set_and_dark_reset(): void
    {
        $theme = $this->theme();
        $theme['foundations']['userTokens']['palettes']['secondary'] = [
            'base' => ['light' => '#123456'], 'shades' => ['500' => ['light' => '#123456']],
        ];
        $target = ['kind' => 'user-palette-shade', 'name' => 'secondary', 'shade' => 500];
        $preview = ThemeTokenOperation::mutate($theme, $target, 'preview', 'dark', '#abcdef');
        self::assertSame('#abcdef', $preview['foundations']['userTokens']['palettes']['secondary']['shades']['500']['dark']);
        $reset = ThemeTokenOperation::mutate($preview, $target, 'reset', 'dark');
        self::assertArrayNotHasKey('dark', $reset['foundations']['userTokens']['palettes']['secondary']['shades']['500']);
    }

    public function test_unknown_or_injected_references_are_rejected_before_relay_creation(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        ThemeTokenOperation::mutate($this->theme(), ['kind' => 'user-color', 'name' => 'missing'], 'set', 'light', '#abcdef');
    }

    public function test_semantic_and_raw_targets_link_and_unlink_without_unsafe_selectors(): void
    {
        $theme = $this->theme();
        $semantic = ['kind' => 'semantic', 'targetId' => 'button.primary', 'controlId' => 'background', 'scope' => 'global'];
        $theme = ThemeTokenOperation::mutate($theme, $semantic, 'set', 'light', '#123456');
        self::assertSame('#123456', ThemeTokenOperation::read($theme, $semantic)['light']);
        $theme = ThemeTokenOperation::mutate($theme, ['kind' => 'mode-link', 'target' => $semantic], 'link', 'light');
        self::assertTrue(ThemeTokenOperation::read($theme, ['kind' => 'mode-link', 'target' => $semantic])['linked']);
        $raw = ['kind' => 'raw', 'selector' => '.fi-btn', 'property' => 'color'];
        $theme = ThemeTokenOperation::mutate($theme, $raw, 'set', 'light', '#abcdef');
        self::assertSame('#abcdef', ThemeTokenOperation::read($theme, $raw)['light']);
        $this->expectException(\InvalidArgumentException::class);
        ThemeTokenOperation::mutate($theme, ['kind' => 'raw', 'selector' => 'body', 'property' => 'color'], 'set', 'light', '#abcdef');
    }

    public function test_schema_seven_unknown_fields_are_rejected_before_any_edit(): void
    {
        $theme = $this->theme();
        $theme['unexpected'] = true;
        $this->expectException(\InvalidArgumentException::class);
        ThemeTokenOperation::read($theme);
    }

    /** @return array<string, mixed> */
    private function theme(): array
    {
        return [
            'schemaVersion' => 7, 'colors' => ['primary' => '#123456'],
            'foundations' => ['userTokens' => ['colors' => ['accent' => ['light' => '#123456']], 'palettes' => []]],
            'overrides' => [], 'rawOverrides' => [], 'customCss' => '', 'icons' => [], 'branding' => [], 'padding' => [], 'modeLinks' => [],
        ];
    }
}
