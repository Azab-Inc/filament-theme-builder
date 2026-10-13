<?php

namespace App\Support\Branding;

use Illuminate\Http\Request;

final readonly class PanelBrandingSettings
{
    /** @param array<string, mixed> $values */
    private function __construct(private array $values) {}

    public static function defaults(): self
    {
        return new self([
            'appName' => 'Filament Theme Builder',
            'lightLogo' => null,
            'darkLogo' => null,
            'favicon' => null,
            'logoHeight' => '2.5rem',
            'brandTypography' => ['kind' => 'system', 'name' => 'System', 'family' => 'ui-sans-serif, system-ui, sans-serif'],
            'contentWidth' => '7xl',
            'sidebar' => 'collapsible',
        ]);
    }

    public static function fromRequest(Request $request): self
    {
        $encoded = $request->query('ftb_branding');
        if (! is_string($encoded) || $encoded === '') {
            return self::defaults();
        }

        $decoded = base64_decode($encoded, true);
        if ($decoded === false) {
            return self::defaults();
        }

        try {
            $values = json_decode($decoded, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return self::defaults();
        }

        return self::fromArray(is_array($values) ? $values : null);
    }

    /** @param array<string, mixed>|null $values */
    public static function fromArray(?array $values): self
    {
        $defaults = self::defaults()->values;
        if ($values === null || array_diff(array_keys($values), array_keys($defaults)) !== [] || array_diff(array_keys($defaults), array_keys($values)) !== []) {
            return self::defaults();
        }
        if (! is_string($values['appName']) || ! preg_match("/^([\\p{L}\\p{N} .,_&'’()\\-]){1,100}$/u", $values['appName'])) {
            return self::defaults();
        }
        if (! self::assetIsSafe($values['lightLogo']) || ! self::assetIsSafe($values['darkLogo']) || ! self::assetIsSafe($values['favicon'])) {
            return self::defaults();
        }
        if (! is_string($values['logoHeight']) || ! preg_match('/^(?:0|[1-9]\\d?)(?:\\.\\d+)?(?:px|rem|em|vh|vw|%)$/', $values['logoHeight'])) {
            return self::defaults();
        }
        if (! is_array($values['brandTypography']) || ! self::fontIsSafe($values['brandTypography'])) {
            return self::defaults();
        }
        if (! is_string($values['contentWidth']) || ! in_array($values['contentWidth'], ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full'], true)) {
            return self::defaults();
        }
        if (! is_string($values['sidebar']) || ! in_array($values['sidebar'], ['collapsible', 'fully-collapsible', 'top-navigation'], true)) {
            return self::defaults();
        }

        return new self($values);
    }

    public function appName(): string
    {
        return $this->values['appName'];
    }

    public function logoHeight(): string
    {
        return $this->values['logoHeight'];
    }

    public function contentWidth(): string
    {
        return $this->values['contentWidth'];
    }

    public function sidebar(): string
    {
        return $this->values['sidebar'];
    }

    /** @return array<string, mixed> */
    public function typography(): array
    {
        return $this->values['brandTypography'];
    }

    public function asset(string $name): ?string
    {
        $asset = $this->values[$name] ?? null;

        return is_string($asset) ? $asset : null;
    }

    private static function assetIsSafe(mixed $value): bool
    {
        return $value === null || (is_string($value) && preg_match('/^[a-f0-9]{64}\/[a-f0-9]{40}\.(?:jpg|jpeg|png|webp)$/i', $value) === 1);
    }

    /** @param array<string, mixed> $font */
    private static function fontIsSafe(array $font): bool
    {
        if (! in_array($font['kind'] ?? null, ['system', 'curated', 'custom'], true) || ! is_string($font['name'] ?? null) || ! is_string($font['family'] ?? null)) {
            return false;
        }
        if (preg_match('/^[A-Za-z0-9][A-Za-z0-9 .,_\'"-]{0,99}$/', $font['family']) !== 1) {
            return false;
        }
        if ($font['kind'] === 'curated') {
            return ($font['provider'] ?? null) === 'google-fonts' && in_array($font['name'], ['Inter', 'Roboto'], true) && $font['name'] === $font['family'];
        }

        return $font['kind'] === 'custom' ? $font['name'] === $font['family'] : in_array($font['name'], ['System', 'System Mono'], true);
    }
}
