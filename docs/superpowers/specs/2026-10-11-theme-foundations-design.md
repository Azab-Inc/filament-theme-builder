# FTB-005 Theme Foundations Design

**Date:** 2026-10-11
**Status:** Approved design
**Scope:** Global foundations editing for FTB-005. This document supplements [`SPECS.md`](../../../SPECS.md) and the acceptance criteria in [`TICKETS.md`](../../../TICKETS.md#ftb-005); those documents remain authoritative for the wider product and ticket graph.

## Purpose and sequencing

FTB-005 expands the existing FTB-003 primary-color edit into a typed, versioned foundations contract that later editor, exporter, density, accessibility, and branding work can consume. The canonical `ThemeState` remains the only source of truth; generated CSS, preview messages, and future PanelProvider output are projections.

The repository's demo-first gate still applies. This design does not lift the gate or claim completion of FTB-011, FTB-012, FTB-013, FTB-014, FTB-015, FTB-016, FTB-017, or FTB-018. FTB-012 may consume the density contract once its remaining theme-density criterion is scheduled. FTB-018 may consume the typography/branding boundary without taking ownership of global font loading.

## Runtime evidence and compatibility boundary

The verified baseline is Filament `^5.9` from [`demo/composer.json`](../../../demo/composer.json). The current preview bridge verifies and accepts the versioned `ftb:theme:update` message, `ThemeState` schema versions 1 and 2, six-digit hex `colors.primary`, sparse primitive overrides, and origin/source checks in [`demo/resources/views/filament/preview-bridge.blade.php`](../../../demo/resources/views/filament/preview-bridge.blade.php).

The current bridge emits only the application-owned `--ftb-primary` and `--primary-{50,100,200,300,400,500,600,700,800,900,950}` variables. Existing rendered evidence uses real `fi-*` classes such as `fi-btn`, `fi-badge`, `fi-dropdown`, `fi-simple-header`, and `fi-logo-light`/`fi-logo-dark`; the panel provider verifies brand/runtime methods such as `brandName`, `brandLogo`, `darkModeBrandLogo`, `brandLogoHeight`, `favicon`, `globalSearch`, and sidebar collapse methods.

FTB-005 must not invent Filament surface tokens, selectors, or variable names. A foundation projection may target a selector or variable only when it is recorded in a compatibility-bound runtime inventory derived from the installed Filament 5.9 output and covered by a focused test. If a requested foundation has no verified target, it remains represented and persisted as a typed value but is marked `export-only`/`unmapped` for that compatibility baseline; it must not be emitted as guessed CSS. Structural selectors are permitted only when no verified semantic `fi-*` selector exists and the inventory records the reason and fixture.

## Canonical typed state

The following types are the implementation contract. They extend the current version-2 shape while retaining `colors.primary` for compatibility with FTB-003 and existing preview validation.

```ts
export type ThemeMode = 'light' | 'dark'
export type ThemeModeValues<T> = { light: T; dark: T }
export type ThemeValue = string | number | boolean

export type PaletteName = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
export type PaletteShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950
export type Palette = {
  base: string
  shades: Partial<Record<PaletteShade, string>>
  overrides: Partial<Record<PaletteShade, string>>
}

export type SurfaceName = 'page' | 'sidebar' | 'topbar' | 'card' | 'elevated' | 'input'
export type BorderName = 'default' | 'strong'
export type TextName = 'primary' | 'muted' | 'disabled'

export type FontChoice =
  | { kind: 'system'; name: string; family: string }
  | { kind: 'curated'; name: string; family: string; provider: 'google-fonts' }
  | { kind: 'custom'; name: string; family: string }

export type Density = 'compact' | 'default' | 'spacious'
export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type ShadowScale = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export type FoundationState = {
  palettes: Record<PaletteName, Palette>
  surfaces: Record<SurfaceName, ThemeModeValues<string>>
  borders: Record<BorderName, ThemeModeValues<string>>
  text: Record<TextName, ThemeModeValues<string>>
  typography: {
    body: FontChoice
    heading: FontChoice
    mono: FontChoice
  }
  spacing: Record<string, number>
  density: Density
  radius: RadiusScale
  borderWidth: number
  shadow: ShadowScale
}

export type ThemeOverride = {
  targetId: string
  controlId: string
  scope: 'global' | 'component' | 'variant' | 'state'
  componentId?: string
  variantId?: string
  stateId?: string
  value: ThemeValue
}

export type ThemeStateV3 = {
  schemaVersion: 3
  colors: { primary: string }
  foundations: FoundationState
  overrides: ThemeOverride[]
  customCss: string
}
```

The implementation may use more precise branded types internally, but serialized names and discriminants above are stable. The six palettes are always present in current state. Their `base` values are valid six- or eight-digit hex colors; generated shades are the eleven fixed shade keys; an override is explicit and wins over the generated shade. `shades` is the deterministic generated result, while `overrides` records only user deviations from generation. A reset removes the selected shade override and regenerates that shade from the base color.

Default foundation state is deterministic and preserves the current builder primary default: primary `#6366f1`, success `#22c55e`, warning `#f59e0b`, danger `#ef4444`, info `#3b82f6`, and gray `#6b7280`; light/dark surfaces and text use the values established by the verified fixture rather than invented Filament tokens; body/heading/mono use system choices; spacing uses the existing Tailwind/Filament-compatible scale; density is `default`; radius is `md`; border width is `1`; shadow is `sm`. The exact default fixture is part of the implementation tests and must be changed only with an explicit contract update.

## Foundation semantics

### Palettes and shades

All six semantic palettes expose a base color and generated `50–950` shades. Generation is deterministic, pure, and separate from persistence. The algorithm must document its color-space and rounding behavior, preserve valid output for every valid base input, and never produce CSS or values from malformed input. A per-shade override is an explicit sparse value; changing the base retains overrides while recalculating non-overridden shades. Resetting one shade affects only that shade.

### Light/dark values and surfaces

Page, sidebar, topbar, card, elevated, and input surfaces have independent light and dark values. Default/strong borders and primary/muted/disabled text also have independent mode values. Mode switching selects the appropriate value without copying light values into dark state. The editor must show whether a value is inherited, generated, or explicitly overridden.

The state names are product-level semantic concepts, not claims that Filament exposes identically named variables. Projection is mediated by the verified runtime inventory. No unsupported surface token such as an invented `--fi-surface-*` may be emitted.

### Typography and font loading

System fonts, a finite curated list of Google Font names, and custom font-family names are represented by `FontChoice`. Curated entries store a known name/family and provider metadata only; they do not fetch or inject a stylesheet. Custom entries store a validated family name only. The builder never hosts font files, proxies font files, injects `@import`, or automatically loads third-party fonts. Export/installation guidance must tell the user to load a selected custom or curated font in their own application and must preserve a safe fallback stack.

### Density and layout scales

Density is exactly `compact`, `default`, or `spacious`. It is a named foundation choice, not an arbitrary multiplier. Each preset resolves to a typed spacing/control scale consumed by later projections. Spacing scale, radius, border width, and shadow are independent foundation controls and each has a reset path. FTB-012 consumes the density/spacing contract for table density; FTB-018 consumes typography and runtime branding boundaries without changing this state contract.

## Reset, history, persistence, and schema migration

Every foundation control has an individual reset operation. Reset removes the explicit value/override and returns to generated, inherited, or contract default behavior; it never writes a copied parent/default value. Section and theme reset may compose individual resets but must create one meaningful history entry.

Foundation edits, shade resets, mode changes, density changes, and section resets are canonical theme mutations. Undo/redo restores exact sparse state, including absence versus explicit values. Debounced local persistence stores the validated canonical `ThemeStateV3`; it never stores resolved CSS or a second foundation store. Existing version-1 and version-2 themes migrate sequentially, preserving `colors.primary`, existing overrides, and custom CSS where present. Invalid or oversized persisted/imported data is rejected or safely quarantined and the current editable theme remains usable.

## Preview protocol and immediate behavior

The builder sends a versioned `ftb:theme:update` message to the real Filament iframe immediately after a valid canonical mutation. The message includes the current schema version, a validated projection payload, and no arbitrary selectors, CSS rules, HTML, script, font URL, or filesystem reference. The bridge validates origin and source, validates message shape and values, and updates one managed style element without Laravel requests, reloads, or Vite rebuilds for CSS-previewable foundations.

Protocol compatibility rules:

1. Existing `ftb:theme:update` envelope and `schemaVersion: 1` message field remain accepted.
2. Incoming theme schema versions 1 and 2 remain readable through migration to version 3.
3. The preview bridge must reject unknown foundation keys, malformed colors, invalid shade keys, unsafe font strings, unsupported selectors, and non-finite numbers.
4. A projection includes an explicit compatibility baseline and only inventory-approved targets.
5. Runtime-only or unmapped settings are preserved in canonical state and reported to export/install guidance; they are not faked with CSS.

## Validation and security

Validate at editor mutation, migration/restore, JSON import, preview serialization, and export boundaries. Enforce allowlists for palette/mode/density/radius/shadow names, shade keys, font kinds, font-family syntax, spacing keys, numeric ranges, override IDs, and compatibility baselines. Reject duplicate override identities and unsafe or unknown keys. Encode values as CSS values only after control validation; never interpolate user-provided selectors, rules, markup, script, font URLs, or `@import` statements.

No FTB-005 capability adds an MCP mutation tool. If a future AI capability edits foundations, it must reuse the same domain service, validation, authorization, persistence, and preview-confirmation path, with a capability inventory and authorization/end-to-end client tests as required by [`ai-operability.md`](../../../.config/opencode/rules/ai-operability.md). Previewing an AI mutation must not apply it until explicit confirmation.

## Runtime mapping and export classification

Each foundation control is classified as `preview-emulatable`, `runtime-refresh-required`, `export-only`, or `unmapped` for the verified Filament 5.9 baseline. The registry stores the evidence path, selector/variable, and test fixture for every mapped control. A missing mapping is a visible compatibility warning, not a guessed token. CSS-previewable values use the managed style element. PanelProvider values and user-loaded fonts are exported as guidance/snippets for later FTB-018/FTB-026 work.

## Testing contract

Unit tests cover typed defaults, palette generation for all eleven shades, per-shade override/reset, light/dark resolution, font-choice validation and no-loading behavior, density presets, numeric ranges, migration, persistence, history, duplicate/unsafe input rejection, and protocol projection.

Playwright tests are written first for the user-visible bridge: edit a palette/surface/font/density/radius/shadow control, observe immediate preview change without reload/network mutation, reset one control, switch light/dark, and verify persistence after reload. Bridge tests assert allowed-origin/source checks and rejection of unsupported or unsafe payloads. Runtime-dependent tests use real Filament 5.9 output and only inventory-approved selectors/variables. No application-code task is complete from this design alone; status evidence is added only after its checks pass.

## Non-goals

- No implementation in this design commit.
- No invented Filament surface tokens, selectors, or compatibility claims.
- No custom font hosting, proxying, automatic Google Font loading, `@import`, or font-file upload.
- No arbitrary CSS/HTML/JavaScript injection.
- No icon packs, semantic icon replacement, or panel branding implementation; FTB-017 and FTB-018 own those slices.
- No full component registry, Inspector, table showcase, or visual coverage completion.
- No new npm/composer dependency, service, or MCP tool.
- No change to the demo-first gate, ticket statuses, `.gitignore`, or `.playwright-mcp/`.
