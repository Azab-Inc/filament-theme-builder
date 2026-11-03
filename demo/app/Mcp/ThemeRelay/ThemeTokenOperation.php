<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

use InvalidArgumentException;

/** Pure, bounded edits layered on the canonical browser import boundary. */
final class ThemeTokenOperation
{
    private const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    private const RAW_PROPERTIES = ['color', 'background-color', 'border-color', 'border-width', 'border-radius', 'box-shadow', 'opacity', 'padding', 'margin', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-decoration', 'border-style', 'text-align', 'white-space'];
    private const SEMANTIC_TARGETS = ['button.primary:background', 'button.secondary:background', 'form.product-name:background', 'global.primary:primary'];

    /** @return array<string, mixed> */
    public static function capabilities(): array
    {
        return [
            'target_kinds' => ['user-color', 'user-palette-base', 'user-palette-shade', 'mode-link'],
            'read_actions' => ['discover', 'read'],
            'mutation_actions' => ['preview', 'set', 'reset', 'link', 'unlink'],
            'boundary' => 'canonical_import_preview_revision_grant',
        ];
    }

    /** @param array<string, mixed> $theme @return array<string, mixed> */
    public static function read(array $theme, ?array $target = null): array
    {
        self::assertTheme($theme);
        if ($target === null) {
            return ['user_tokens' => $theme['foundations']['userTokens'], 'mode_links' => $theme['modeLinks']];
        }
        self::assertTarget($target);
        [$light, $dark] = self::values($theme, $target);

        return ['target' => $target, 'light' => $light, 'dark' => $dark, 'linked' => self::link($theme, $target) !== null];
    }

    /** @param array<string, mixed> $theme @param array<string, mixed> $target @return array<string, mixed> */
    public static function mutate(array $theme, array $target, string $action, ?string $mode = null, ?string $value = null): array
    {
        self::assertTheme($theme);
        self::assertTarget($target);
        if ($action === 'preview') {
            $action = $value === null ? 'reset' : 'set';
        }
        if (! in_array($action, ['set', 'reset', 'link', 'unlink'], true)) {
            throw new InvalidArgumentException('invalid_action');
        }
        if ($action === 'set') self::assertValue($target, $value);
        if (in_array($action, ['set', 'reset'], true) && ! in_array($mode, ['light', 'dark'], true)) {
            throw new InvalidArgumentException('invalid_mode');
        }

        if ($target['kind'] === 'mode-link') {
            self::mutateLink($theme, $target, $action, $mode, $value);
        } elseif ($action === 'set') {
            self::writeValue($theme, $target, (string) $mode, (string) $value);
        } elseif ($action === 'reset') {
            self::resetValue($theme, $target, (string) $mode);
        } else {
            throw new InvalidArgumentException('invalid_action_for_target');
        }

        return $theme;
    }

    /** @param array<string, mixed> $theme */
    private static function assertTheme(array $theme): void
    {
        $keys = ['schemaVersion', 'colors', 'foundations', 'overrides', 'rawOverrides', 'customCss', 'icons', 'branding', 'padding', 'modeLinks'];
        if (($theme['schemaVersion'] ?? null) !== 7 || array_diff(array_keys($theme), $keys) !== [] || array_diff($keys, array_keys($theme)) !== []
            || ! is_array($theme['colors'] ?? null) || ! preg_match('/\A#[0-9a-fA-F]{6,8}\z/', (string) ($theme['colors']['primary'] ?? ''))
            || ! is_array($theme['foundations'] ?? null) || ! is_array($theme['foundations']['userTokens'] ?? null)
            || ! is_array($theme['foundations']['userTokens']['colors'] ?? null) || ! is_array($theme['foundations']['userTokens']['palettes'] ?? null)
            || ! is_array($theme['overrides'] ?? null) || ! is_array($theme['rawOverrides'] ?? null)
            || ! is_string($theme['customCss'] ?? null) || ! is_array($theme['padding'] ?? null) || ! is_array($theme['modeLinks'] ?? null)) {
            throw new InvalidArgumentException('invalid_theme');
        }
        $tokenNames = array_merge(array_keys($theme['foundations']['userTokens']['colors']), array_keys($theme['foundations']['userTokens']['palettes']));
        if (count($tokenNames) > 64 || count(array_unique($tokenNames)) !== count($tokenNames)) throw new InvalidArgumentException('invalid_theme');
        foreach ($theme['foundations']['userTokens']['colors'] as $name => $pair) self::assertTokenNameAndPair($name, $pair);
        foreach ($theme['foundations']['userTokens']['palettes'] as $name => $palette) {
            self::assertTokenNameAndPair($name, $palette['base'] ?? null);
            if (! is_array($palette['shades'] ?? null) || array_diff(array_keys($palette['shades']), array_map('strval', self::SHADES)) !== []) throw new InvalidArgumentException('invalid_theme');
            foreach ($palette['shades'] as $pair) self::assertTokenNameAndPair($name, $pair);
        }
        foreach ($theme['rawOverrides'] as $row) self::assertRawOverride($row);
        foreach ($theme['overrides'] as $row) self::assertSemanticOverride($row);
    }

    /** @param array<string, mixed> $target */
    private static function assertTarget(array $target): void
    {
        $kind = $target['kind'] ?? null;
        if (! is_string($kind) || ! in_array($kind, ['user-color', 'user-palette-base', 'user-palette-shade', 'raw', 'semantic', 'mode-link'], true)) {
            throw new InvalidArgumentException('invalid_target');
        }
        if ($kind === 'mode-link') {
            if (! is_array($target['target'] ?? null)) throw new InvalidArgumentException('invalid_target');
            self::assertTarget($target['target']);
            return;
        }
        if ($kind === 'raw') {
            if (array_diff(array_keys($target), ['kind', 'selector', 'property']) !== [] || ! is_string($target['selector'] ?? null) || ! is_string($target['property'] ?? null)
                || ! preg_match('/\A(?:\.fi-[A-Za-z0-9_-]+)(?:\.[A-Za-z0-9_-]+)*(?::(?:hover|focus))?(?:\s+\.fi-[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?::(?:hover|focus))?)*\z/', $target['selector'])
                || preg_match('/\.fi-ta-(?:header-cell|cell)-[^\s]+\.(?!fi-)/', $target['selector']) || ! in_array($target['property'], self::RAW_PROPERTIES, true)) throw new InvalidArgumentException('invalid_target');
            return;
        }
        if ($kind === 'semantic') {
            $allowed = ['kind', 'targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId'];
            if (array_diff(array_keys($target), $allowed) !== [] || ! in_array(($target['scope'] ?? null), ['global', 'component', 'variant', 'state'], true)
                || ! is_string($target['targetId'] ?? null) || ! is_string($target['controlId'] ?? null)
                || ! in_array($target['targetId'].':'.$target['controlId'], self::SEMANTIC_TARGETS, true)) throw new InvalidArgumentException('invalid_target');
            return;
        }
        if (! is_string($target['name'] ?? null) || ! preg_match('/\A[a-z][a-z0-9-]{0,31}\z/', $target['name'])) {
            throw new InvalidArgumentException('invalid_target');
        }
        if ($kind === 'user-palette-shade' && ! in_array($target['shade'] ?? null, self::SHADES, true)) {
            throw new InvalidArgumentException('invalid_target');
        }
        if ($kind !== 'user-palette-shade' && array_key_exists('shade', $target)) throw new InvalidArgumentException('invalid_target');
    }

    /** @param array<string, mixed> $theme @param array<string, mixed> $target @return array{0:mixed,1:mixed} */
    private static function values(array $theme, array $target): array
    {
        if ($target['kind'] === 'mode-link') return self::values($theme, $target['target']);
        $tokens = $theme['foundations']['userTokens'];
        if ($target['kind'] === 'raw') {
            $row = self::rawRow($theme, $target);
            return [$row['properties'][$target['property']] ?? null, $row['darkProperties'][$target['property']] ?? ($row['properties'][$target['property']] ?? null)];
        }
        if ($target['kind'] === 'semantic') {
            $row = self::semanticRow($theme, $target);
            return [$row['value'] ?? null, $row['darkValue'] ?? ($row['value'] ?? null)];
        }
        if ($target['kind'] === 'user-color') $pair = $tokens['colors'][$target['name']] ?? [];
        elseif ($target['kind'] === 'user-palette-base') $pair = $tokens['palettes'][$target['name']]['base'] ?? [];
        else $pair = $tokens['palettes'][$target['name']]['shades'][(string) $target['shade']] ?? [];

        if (! is_array($pair) || ! array_key_exists('light', $pair)) throw new InvalidArgumentException('unknown_target');

        return [$pair['light'], $pair['dark'] ?? null];
    }

    /** @param array<string, mixed> $theme @param array<string, mixed> $target */
    private static function writeValue(array &$theme, array $target, string $mode, string $value): void
    {
        if ($target['kind'] === 'raw') {
            $row =& self::rawRowReference($theme, $target);
            $key = $mode === 'dark' ? 'darkProperties' : 'properties';
            $row[$key][$target['property']] = $value;
            return;
        }
        if ($target['kind'] === 'semantic') {
            $row =& self::semanticRowReference($theme, $target);
            $row[$mode === 'dark' ? 'darkValue' : 'value'] = $value;
            return;
        }
        $name = $target['name'];
        if ($target['kind'] === 'user-color') $pair =& $theme['foundations']['userTokens']['colors'][$name];
        elseif ($target['kind'] === 'user-palette-base') $pair =& $theme['foundations']['userTokens']['palettes'][$name]['base'];
        else $pair =& $theme['foundations']['userTokens']['palettes'][$name]['shades'][(string) $target['shade']];
        if (! is_array($pair) || ! array_key_exists('light', $pair)) throw new InvalidArgumentException('unknown_target');
        $pair[$mode] = $value;
    }

    /** @param array<string, mixed> $theme @param array<string, mixed> $target */
    private static function resetValue(array &$theme, array $target, string $mode): void
    {
        if ($mode === 'light') throw new InvalidArgumentException('light_value_required');
        if ($target['kind'] === 'raw') {
            $row =& self::rawRowReference($theme, $target);
            $key = $mode === 'dark' ? 'darkProperties' : 'properties';
            unset($row[$key][$target['property']]);
            if ($key === 'darkProperties' && ($row[$key] ?? []) === []) unset($row[$key]);
            if (($row['properties'] ?? []) === [] && ($row['darkProperties'] ?? []) === []) $theme['rawOverrides'] = array_values(array_filter($theme['rawOverrides'], static fn ($item) => $item !== $row));
            return;
        }
        if ($target['kind'] === 'semantic') {
            $row =& self::semanticRowReference($theme, $target);
            unset($row[$mode === 'dark' ? 'darkValue' : 'value']);
            if (! isset($row['value']) && ! isset($row['darkValue'])) $theme['overrides'] = array_values(array_filter($theme['overrides'], static fn ($item) => $item !== $row));
            return;
        }
        $name = $target['name'];
        if ($target['kind'] === 'user-color') $pair =& $theme['foundations']['userTokens']['colors'][$name];
        elseif ($target['kind'] === 'user-palette-base') $pair =& $theme['foundations']['userTokens']['palettes'][$name]['base'];
        else $pair =& $theme['foundations']['userTokens']['palettes'][$name]['shades'][(string) $target['shade']];
        if (! is_array($pair) || ! array_key_exists('light', $pair)) throw new InvalidArgumentException('unknown_target');
        unset($pair['dark']);
    }

    /** @param array<string, mixed> $theme @param array<string, mixed> $target */
    private static function mutateLink(array &$theme, array $target, string $action, ?string $mode, ?string $value): void
    {
        $inner = $target['target'];
        $identity = self::identity($inner);
        if ($action === 'unlink') { unset($theme['modeLinks'][$identity]); return; }
        if ($action === 'reset') { unset($theme['modeLinks'][$identity]); return; }
        if ($action === 'link') {
            $sourceMode = $mode === 'dark' ? 'dark' : 'light';
            [$light, $dark] = self::values($theme, $inner);
            $source = $sourceMode === 'dark' ? ($dark ?? $light) : $light;
            if (! is_string($source) || $source === '') throw new InvalidArgumentException('unknown_target');
            self::writeValue($theme, $inner, 'light', $source);
            self::writeValue($theme, $inner, 'dark', $source);
            $theme['modeLinks'][$identity] = ['identity' => $identity, 'value' => $source, 'linked' => true, 'target' => $inner];
            return;
        }
        throw new InvalidArgumentException('invalid_action');
    }

    /** @param array<string, mixed> $theme @param array<string, mixed> $target @return array<string, mixed>|null */
    private static function link(array $theme, array $target): ?array
    {
        if ($target['kind'] === 'mode-link') $target = $target['target'];
        $identity = self::identity($target);
        return $theme['modeLinks'][$identity] ?? null;
    }

    private static function identity(array $target): string
    {
        ksort($target);
        return 'target:'.json_encode($target, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    }

    private static function assertValue(array $target, ?string $value): void
    {
        if ($value === null) throw new InvalidArgumentException('invalid_value');
        if (in_array($target['kind'], ['user-color', 'user-palette-base', 'user-palette-shade', 'semantic'], true)
            || ($target['kind'] === 'raw' && in_array($target['property'], ['color', 'background-color', 'border-color'], true))) {
            if (! preg_match('/\A#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\z/', $value)
                && ! preg_match('/\Auser\.(?:color\.[a-z][a-z0-9-]{0,31}|palette\.[a-z][a-z0-9-]{0,31}\.(?:50|100|200|300|400|500|600|700|800|900|950))\z/', $value)) throw new InvalidArgumentException('invalid_color');
            return;
        }
        if (! preg_match('/\A(?:0|[0-9]{1,4}(?:\.[0-9]+)?(?:px|rem|em|%|s)?|none|solid|dashed|left|right|center|normal)\z/i', $value)) throw new InvalidArgumentException('invalid_value');
    }

    private static function assertTokenNameAndPair(string|int $name, mixed $pair): void
    {
        if (! is_string($name) || in_array($name, ['primary', 'success', 'warning', 'danger', 'info', 'gray'], true) || ! preg_match('/\A[a-z][a-z0-9-]{0,31}\z/', $name) || ! is_array($pair)
            || ! preg_match('/\A#[0-9a-fA-F]{6,8}\z/', (string) ($pair['light'] ?? ''))
            || (isset($pair['dark']) && ! preg_match('/\A#[0-9a-fA-F]{6,8}\z/', (string) $pair['dark']))) throw new InvalidArgumentException('invalid_theme');
    }

    private static function assertRawOverride(mixed $row): void
    {
        if (! is_array($row) || ! is_string($row['selector'] ?? null) || ! is_array($row['properties'] ?? null)
            || array_diff(array_keys($row), ['selector', 'properties', 'darkProperties']) !== []
            || (isset($row['darkProperties']) && ! is_array($row['darkProperties']))
            || ! preg_match('/\A(?:\.fi-[A-Za-z0-9_-]+)(?:\.[A-Za-z0-9_-]+)*(?::(?:hover|focus))?(?:\s+\.fi-[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?::(?:hover|focus))?)*\z/', $row['selector'])) throw new InvalidArgumentException('invalid_theme');
        foreach ([$row['properties'], $row['darkProperties'] ?? []] as $properties) {
            foreach ($properties as $property => $value) {
                if (! is_string($property) || ! in_array($property, self::RAW_PROPERTIES, true) || ! is_string($value)) throw new InvalidArgumentException('invalid_theme');
                self::assertValue(['kind' => 'raw', 'property' => $property], $value);
            }
        }
    }

    private static function assertSemanticOverride(mixed $row): void
    {
        if (! is_array($row) || ! array_key_exists('value', $row)) throw new InvalidArgumentException('invalid_theme');
        $target = ['kind' => 'semantic', 'targetId' => $row['targetId'] ?? null, 'controlId' => $row['controlId'] ?? null, 'scope' => $row['scope'] ?? null];
        foreach (['componentId', 'variantId', 'stateId'] as $key) if (array_key_exists($key, $row)) $target[$key] = $row[$key];
        self::assertTarget($target);
        if (! is_string($row['value'])) throw new InvalidArgumentException('invalid_theme');
        self::assertValue($target, $row['value']);
        if (isset($row['darkValue'])) { if (! is_string($row['darkValue'])) throw new InvalidArgumentException('invalid_theme'); self::assertValue($target, $row['darkValue']); }
    }

    /** @return array<string, mixed> */
    private static function rawRow(array $theme, array $target): array
    {
        foreach ($theme['rawOverrides'] as $row) if (($row['selector'] ?? null) === $target['selector']) return $row;
        throw new InvalidArgumentException('unknown_target');
    }

    /** @return array<string, mixed> */
    private static function semanticRow(array $theme, array $target): array
    {
        foreach ($theme['overrides'] as $row) if (self::sameSemantic($row, $target)) return $row;
        throw new InvalidArgumentException('unknown_target');
    }

    /** @return array<string, mixed> */
    private static function &rawRowReference(array &$theme, array $target): array
    {
        foreach ($theme['rawOverrides'] as &$row) if (($row['selector'] ?? null) === $target['selector']) return $row;
        $theme['rawOverrides'][] = ['selector' => $target['selector'], 'properties' => []];
        return $theme['rawOverrides'][array_key_last($theme['rawOverrides'])];
    }

    /** @return array<string, mixed> */
    private static function &semanticRowReference(array &$theme, array $target): array
    {
        foreach ($theme['overrides'] as &$row) if (self::sameSemantic($row, $target)) return $row;
        $theme['overrides'][] = ['targetId' => $target['targetId'], 'controlId' => $target['controlId'], 'scope' => $target['scope']];
        return $theme['overrides'][array_key_last($theme['overrides'])];
    }

    private static function sameSemantic(array $row, array $target): bool
    {
        foreach (['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId'] as $key) if (($row[$key] ?? null) !== ($target[$key] ?? null)) return false;
        return true;
    }
}
