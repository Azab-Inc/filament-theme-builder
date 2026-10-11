# Theme Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement FTB-005 as a typed, validated, persisted foundations domain with deterministic palette generation, immediate compatible preview messaging, and independently consumable density/branding seams.

**Architecture:** Keep `ThemeState` as the single persisted source of truth. Add pure foundation defaults/generation/validation/projection modules, let the existing Pinia store own mutations/history/persistence, and let the existing preview bridge consume only validated inventory-approved projections. Keep runtime-only and unmapped values in state without inventing CSS tokens.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, existing browser APIs, Laravel/Filament 5.9 preview, Playwright, Docker Compose; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-11-theme-foundations-design.md`

## Global Constraints

- Filament baseline is `^5.9`; every selector/variable must be verified in installed/runtime evidence before use.
- `ThemeState` is the only persisted source of truth; CSS and runtime configuration are projections.
- Preserve schema-version 1/2 readability and `colors.primary`; migrate sequentially to the current state.
- Six palettes are `primary`, `success`, `warning`, `danger`, `info`, and `gray`; each has generated shades `50,100,200,300,400,500,600,700,800,900,950`.
- Fonts are system, curated-name, or custom-family representations only; the builder does not host or automatically load fonts.
- Density is exactly `compact`, `default`, or `spacious`.
- Every foundation control has individual reset, history, persistence, validation, and preview classification.
- Preview changes use the existing versioned `ftb:theme:update` bridge immediately; no normal edit may require reload, Laravel request, or Vite rebuild.
- Unknown keys, unsafe values, arbitrary selectors/rules, font URLs, `@import`, HTML, and JavaScript are rejected.
- No new npm/composer dependency, MCP tool, service, `.gitignore` change, or `.playwright-mcp/` change.
- The demo-first gate remains in force; this plan does not change ticket statuses for blocked/in-progress tickets.
- Documentation/status evidence is edited only after the relevant tests pass.

---

## File Responsibility Map

- **Modify:** `builder/src/models/theme.model.ts` — versioned canonical state, foundation types, migration-facing result types; preserve FTB-003 compatibility.
- **Create:** `builder/src/models/foundations.model.ts` — palette, shade, surface, typography, scale, density, reset, and projection types.
- **Create:** `builder/src/services/foundation-defaults.ts` — immutable stock defaults and density preset tables.
- **Create:** `builder/src/services/palette-generator.ts` — pure eleven-shade generation and per-shade override application.
- **Create:** `builder/src/services/foundation-validation.ts` — allowlist/range/font/security validation and typed errors.
- **Create:** `builder/src/services/foundation-projection.ts` — inventory-gated preview projection; no CSS string generation from arbitrary input.
- **Create:** `builder/src/registry/filament-foundation-inventory.ts` — verified Filament 5.9 selector/variable evidence and mapping classification.
- **Modify:** `builder/src/stores/theme.ts` — migration, foundation mutations/resets, history, persistence, and preview projection trigger.
- **Modify:** `demo/resources/views/filament/preview-bridge.blade.php` — accept the compatible foundation projection and reject unsafe/unknown values.
- **Modify:** `demo/tests/Feature/FilamentPanelTest.php` — bridge contract assertions.
- **Modify:** `builder/src/__tests__/theme-state.spec.ts` — migration, persistence, history, and reset integration.
- **Create:** `builder/src/__tests__/foundation-defaults.spec.ts` — typed defaults and density presets.
- **Create:** `builder/src/__tests__/palette-generator.spec.ts` — all shade/override/reset behavior.
- **Create:** `builder/src/__tests__/foundation-validation.spec.ts` — invalid values/security cases.
- **Create:** `builder/src/__tests__/foundation-projection.spec.ts` — mapping/protocol compatibility.
- **Create:** `e2e/theme-foundations.spec.ts` — Playwright-first immediate-preview and reset journey.
- **Modify only after passing checks:** `TICKETS.md` — concise FTB-005 evidence, without claiming unrelated ticket completion.

## Exact Interfaces

These names and shapes are the seams later FTB-012 and FTB-018 consume. Keep them in one model file and import them rather than duplicating types.

```ts
export const PALETTE_NAMES = ['primary', 'success', 'warning', 'danger', 'info', 'gray'] as const
export type PaletteName = typeof PALETTE_NAMES[number]
export const PALETTE_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type PaletteShade = typeof PALETTE_SHADES[number]
export type Density = 'compact' | 'default' | 'spacious'
export type ThemeMode = 'light' | 'dark'
export type FoundationMapping = 'preview-emulatable' | 'runtime-refresh-required' | 'export-only' | 'unmapped'

export type FontChoice =
  | { kind: 'system'; name: string; family: string }
  | { kind: 'curated'; name: string; family: string; provider: 'google-fonts' }
  | { kind: 'custom'; name: string; family: string }

export type PaletteState = {
  base: string
  shades: Partial<Record<PaletteShade, string>>
  overrides: Partial<Record<PaletteShade, string>>
}

export type FoundationState = {
  palettes: Record<PaletteName, PaletteState>
  surfaces: Record<'page' | 'sidebar' | 'topbar' | 'card' | 'elevated' | 'input', { light: string; dark: string }>
  borders: Record<'default' | 'strong', { light: string; dark: string }>
  text: Record<'primary' | 'muted' | 'disabled', { light: string; dark: string }>
  typography: { body: FontChoice; heading: FontChoice; mono: FontChoice }
  spacing: Record<string, number>
  density: Density
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  borderWidth: number
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export type FoundationStateV3 = {
  schemaVersion: 3
  colors: { primary: string }
  foundations: FoundationState
  overrides: ThemeOverride[]
  customCss: string
}

export type FoundationValidationResult =
  | { valid: true; state: FoundationState }
  | { valid: false; code: 'unknown-key' | 'invalid-value' | 'unsafe-font' | 'duplicate-override' | 'unsupported-mapping'; path: string; message: string }

export type FoundationProjection = {
  schemaVersion: 1
  compatibility: 'filament-5.9'
  mode: ThemeMode
  mappings: Array<{ id: string; mapping: FoundationMapping; selector?: string; variable?: string; value: string | number }>
}

export function generatePalette(base: string): Record<PaletteShade, string>
export function applyPaletteOverrides(generated: Record<PaletteShade, string>, overrides: PaletteState['overrides']): Record<PaletteShade, string>
export function validateFoundationState(value: unknown): FoundationValidationResult
export function projectFoundations(state: FoundationState, mode: ThemeMode): FoundationProjection
export function migrateThemeState(value: unknown): FoundationStateV3
```

`setFoundation(path, value)`, `resetFoundation(path)`, `setPaletteBase(name, value)`, `setPaletteShadeOverride(name, shade, value)`, `resetPaletteShade(name, shade)`, `setDensity(value)`, `resolveFoundation(mode)`, and `previewFoundation(mode)` are store-facing operations. They must validate before one canonical mutation and must never expose a second mutable foundation store.

## Bite-sized implementation tasks

### Task 1: Establish the typed model and stock defaults

**Files:**
- Modify: `builder/src/models/theme.model.ts`
- Create: `builder/src/models/foundations.model.ts`
- Create: `builder/src/services/foundation-defaults.ts`
- Test: `builder/src/__tests__/foundation-defaults.spec.ts`

**Interfaces:**
- Consumes: current `ThemeStateV2` with `colors.primary` and `overrides`.
- Produces: the exact foundation types above, `createDefaultFoundationState()`, `createDefaultThemeState()`, and `densityPreset(value: Density)`.

- [ ] **Step 1: Write the failing tests.** Assert all six palette names, all eleven shade keys, default density/radius/border/shadow, independent light/dark records, and system font defaults.
- [ ] **Step 2: Run the focused test to verify it fails.** Run `npm run test:unit -- src/__tests__/foundation-defaults.spec.ts --run`. Expected: missing model/default exports.
- [ ] **Step 3: Implement the types and immutable defaults.** Preserve version-1/2 input types and do not add guessed Filament variables.
- [ ] **Step 4: Run the focused test to verify it passes.** Expected: PASS with exact key sets and no shared mutable references between default calls.
- [ ] **Step 5: Commit.** `git add builder/src/models/theme.model.ts builder/src/models/foundations.model.ts builder/src/services/foundation-defaults.ts builder/src/__tests__/foundation-defaults.spec.ts && git commit -m "(builder) Feature: define typed theme foundation defaults"`

### Task 2: Implement deterministic palette generation and shade overrides

**Files:**
- Create: `builder/src/services/palette-generator.ts`
- Test: `builder/src/__tests__/palette-generator.spec.ts`

**Interfaces:**
- Consumes: `PaletteShade`, `PALETTE_SHADES`, and validated hex input.
- Produces: `generatePalette`, `applyPaletteOverrides`, and `resetPaletteShade`-compatible pure behavior.

- [ ] **Step 1: Write failing tests.** Test all eleven shade keys, deterministic repeated output, malformed/unsupported color rejection, changing base while retaining overrides, one-shade override precedence, and reset returning the generated shade.
- [ ] **Step 2: Run the focused test red.** Run `npm run test:unit -- src/__tests__/palette-generator.spec.ts --run`. Expected: missing generator exports.
- [ ] **Step 3: Implement the smallest pure generator.** Document the chosen interpolation/color-space and rounding; use no package or browser-only API.
- [ ] **Step 4: Run green.** Expected: all shade and override assertions pass.
- [ ] **Step 5: Commit.** `git add builder/src/services/palette-generator.ts builder/src/__tests__/palette-generator.spec.ts && git commit -m "(builder) Feature: generate foundation palette shades"`

### Task 3: Add allowlisted validation and verified Filament 5.9 inventory

**Files:**
- Create: `builder/src/registry/filament-foundation-inventory.ts`
- Create: `builder/src/services/foundation-validation.ts`
- Test: `builder/src/__tests__/foundation-validation.spec.ts`
- Test: `builder/src/__tests__/foundation-projection.spec.ts`

**Interfaces:**
- Consumes: typed foundation state and the runtime evidence in `demo/public/css/filament/filament/app.css`, compiled `fi-*` markup, and the current preview bridge.
- Produces: frozen `FILAMENT_FOUNDATION_INVENTORY`, `validateFoundationState`, mapping lookup, and typed validation errors.

- [ ] **Step 1: Write failing tests.** Assert unknown palette/surface/font/density/shade keys, malformed colors, unsafe family strings (`url(`, quotes/control characters, `@import`), non-finite numbers, duplicate overrides, and unsupported mappings are rejected. Assert every mapped selector/variable has a `filament-5.9` evidence reference and no inventory entry uses an invented `--fi-*` token.
- [ ] **Step 2: Run validation/projection tests red.** Run `npm run test:unit -- src/__tests__/foundation-validation.spec.ts src/__tests__/foundation-projection.spec.ts --run`. Expected: missing inventory/validator exports.
- [ ] **Step 3: Record only verified mappings.** Use `fi-*` selectors or the existing `--ftb-primary`/`--primary-{shade}` bridge variables where verified. Represent unverified semantic surfaces as `unmapped` or `export-only`; do not fill gaps with guesses.
- [ ] **Step 4: Implement validation.** Validate at boundaries, reject unknown keys instead of coercing, and return stable error codes/paths.
- [ ] **Step 5: Run green.** Expected: security and inventory tests pass.
- [ ] **Step 6: Commit.** `git add builder/src/registry/filament-foundation-inventory.ts builder/src/services/foundation-validation.ts builder/src/__tests__/foundation-validation.spec.ts builder/src/__tests__/foundation-projection.spec.ts && git commit -m "(builder) Feature: validate foundation mappings safely"`

### Task 4: Add protocol-safe foundation projection and bridge handling

**Files:**
- Create: `builder/src/services/foundation-projection.ts`
- Modify: `demo/resources/views/filament/preview-bridge.blade.php`
- Modify: `demo/tests/Feature/FilamentPanelTest.php`
- Test: `builder/src/__tests__/foundation-projection.spec.ts`

**Interfaces:**
- Consumes: `FILAMENT_FOUNDATION_INVENTORY`, validated `FoundationState`, current origin/source checks, and `ftb:theme:update` envelope.
- Produces: `projectFoundations(state, mode)` with only inventory-approved mappings and a bridge-compatible payload.

- [ ] **Step 1: Write failing Playwright-first bridge test.** Add `e2e/theme-foundations.spec.ts` before implementation; assert a valid foundation edit changes the iframe's managed style/event immediately, no reload occurs, and an unmapped control yields a compatibility notice rather than guessed CSS.
- [ ] **Step 2: Run the browser test red.** Use the repository's existing Playwright command/configuration. Expected: the foundation control/bridge projection is absent.
- [ ] **Step 3: Add unit protocol assertions.** Test schema compatibility, mode, mapping allowlist, rejection of unknown keys, and that no font URL/import is emitted.
- [ ] **Step 4: Run unit red.** Run the focused Vitest file. Expected: missing projection implementation.
- [ ] **Step 5: Implement projection and bridge validation.** Keep the existing `ftb:theme:update` envelope and origin/source checks. Validate only the projection shape, update the managed style, and dispatch the existing update event. Never accept arbitrary CSS, selectors, URLs, HTML, or scripts.
- [ ] **Step 6: Run unit and PHP bridge tests green.** Run the focused Vitest file and `cd demo && php artisan test --filter=FilamentPanelTest`. Expected: PASS.
- [ ] **Step 7: Run the Playwright test green.** Expected: immediate preview behavior passes without a reload/network mutation.
- [ ] **Step 8: Commit.** `git add builder/src/services/foundation-projection.ts demo/resources/views/filament/preview-bridge.blade.php demo/tests/Feature/FilamentPanelTest.php builder/src/__tests__/foundation-projection.spec.ts e2e/theme-foundations.spec.ts && git commit -m "(builder) Feature: preview validated foundations immediately"`

### Task 5: Integrate foundations into migration, store mutation, history, and persistence

**Files:**
- Modify: `builder/src/stores/theme.ts`
- Modify: `builder/src/models/theme.model.ts`
- Modify: `builder/src/__tests__/theme-state.spec.ts`

**Interfaces:**
- Consumes: defaults, palette generator, validator, projection, and existing FTB-003 history/persistence behavior.
- Produces: the store-facing foundation operations listed in Exact Interfaces and sequential V1 → V2 → V3 migration.

- [ ] **Step 1: Write failing store tests.** Cover V1 and V2 migration preserving primary/overrides, setting/resetting one foundation control, shade override/reset, light/dark selection, all three density values, one mutation per history entry, undo/redo restoring absence, debounced sparse persistence, and invalid persisted state fallback.
- [ ] **Step 2: Run store tests red.** Run `npm run test:unit -- src/__tests__/theme-state.spec.ts --run`. Expected: current store lacks foundation state/operations.
- [ ] **Step 3: Implement sequential migration and safe restore.** Keep the current storage key/debounce/failure behavior; invalid external data must not disable editing.
- [ ] **Step 4: Implement validated one-mutation operations.** Clone, validate, mutate canonical state once, and preserve generated/resolved values as derived data only.
- [ ] **Step 5: Run store tests green.** Expected: migration, reset, history, persistence, and compatibility tests pass.
- [ ] **Step 6: Commit.** `git add builder/src/models/theme.model.ts builder/src/stores/theme.ts builder/src/__tests__/theme-state.spec.ts && git commit -m "(builder) Feature: integrate theme foundation state"`

### Task 6: Complete the user-visible editor journey with Playwright coverage

**Files:**
- Modify: `builder/src/App.vue` — extend the existing first-slice editor with foundations controls and status/reset affordances.
- Modify: `builder/src/__tests__/App.spec.ts` — preserve iframe/primary-color behavior while adding focused editor accessibility assertions.
- Test: `e2e/theme-foundations.spec.ts`

**Interfaces:**
- Consumes: store foundation operations, typed defaults, projection notices, and existing builder/iframe route.
- Produces: controls for palettes/shades, surfaces/modes, typography choices, spacing, density, radius, border, shadow, and per-control reset.

- [ ] **Step 1: Extend the failing Playwright journey.** Cover each required control family, light/dark switching, Compact/Default/Spacious, per-shade override/reset, per-control reset, and reload persistence. Assert no automatic third-party font request and no builder-hosted font file.
- [ ] **Step 2: Run the browser test red.** Expected: controls and assertions are absent.
- [ ] **Step 3: Implement focused editor sections.** Bind controls to the store; show generated/inherited/explicit/unmapped status; keep typography input as names only; do not add dependency or font loading.
- [ ] **Step 4: Run the focused Playwright test green.** Expected: all foundation interactions and immediate preview assertions pass.
- [ ] **Step 5: Run existing builder tests.** From `builder/`, run `npm run type-check`, `npm run test:unit -- --run`, and `npm run build`. Expected: all pass.
- [ ] **Step 6: Commit.** `git add builder e2e/theme-foundations.spec.ts && git commit -m "(builder) Feature: add global foundations editor"`

### Task 7: Verify and record narrowly scoped FTB-005 evidence

**Files:**
- Modify only after passing checks: `TICKETS.md`
- No changes: `.gitignore`, `.playwright-mcp/`, unrelated application files.

**Interfaces:**
- Consumes: passing unit, PHP, type-check, build, and Playwright results from Tasks 1–6.
- Produces: auditable FTB-005 evidence and no claim about FTB-012 completion, FTB-018 completion, or the demo-first gate.

- [ ] **Step 1: Run the complete required checks before docs.** Run `cd builder && npm run type-check && npm run test:unit -- --run && npm run build`; run focused PHP bridge tests; run the focused and existing Playwright suites. Record exact passing commands and test paths.
- [ ] **Step 2: Run scope checks.** Run `git status --short`, confirm `.gitignore` remains the pre-existing modification, `.playwright-mcp/` is untouched, no package manifests changed, and only intended files are present.
- [ ] **Step 3: Update FTB-005 evidence.** Check only criteria proven by tests; reference typed defaults, palette, bridge, store, and Playwright tests. State that FTB-012 density integration and FTB-018 branding/runtime consumption remain separate.
- [ ] **Step 4: Run all checks again after documentation.** Expected: same pass results and no application behavior changes.
- [ ] **Step 5: Commit the evidence.** `git add TICKETS.md && git commit -m "(builder) Docs: record FTB-005 foundations evidence"`

## Plan self-review

- **Spec coverage:** Tasks 1–2 cover typed defaults, six palettes, eleven shades, shade overrides, light/dark layers, typography, spacing, density, radius, border, and shadow. Task 3 covers validation/security and verified runtime evidence. Task 4 covers immediate postMessage preview and compatibility. Task 5 covers migration, persistence, history, and reset. Task 6 covers user-visible controls and Playwright-first behavior. Task 7 gates evidence on passing checks.
- **Later consumers:** FTB-012 receives stable `Density`, spacing, and projection seams; FTB-018 receives `FontChoice`, runtime mapping classification, and a no-font-loading boundary. Neither consumer needs to duplicate foundation state.
- **Placeholder scan:** The plan contains no unresolved placeholder or unspecified test step; every later task has named files, interfaces, commands, and expected outcomes.
- **Type consistency:** `FoundationState`, `FoundationStateV3`, `Density`, `FontChoice`, `FoundationProjection`, `generatePalette`, `validateFoundationState`, and `projectFoundations` are defined once and reused by later tasks.
- **Safety:** No task invents a Filament token, loads a font, adds a package, edits `.gitignore`, touches `.playwright-mcp/`, bypasses origin validation, or changes the demo-first gate.
