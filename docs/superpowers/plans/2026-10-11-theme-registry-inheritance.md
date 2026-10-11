# Theme Registry and Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the FTB-006 prerequisite contract in the existing builder theme model and Pinia store: deterministic semantic registry metadata, Global → Component → Variant → State inheritance, safe validation/lookup, sparse persistence/history, and minimal/fully-explicit domain serialization.

**Architecture:** Keep `ThemeState` as the only persisted source of truth. Add pure registry, validation, resolver, and serialization modules that consume the registry and sparse overrides; the store becomes the single mutation/persistence/history boundary and never persists derived resolved values. Keep the existing `colors.primary` field as the version-1-compatible global foundation value, while registry-targeted component/variant/state values live in validated sparse overrides; the resolver treats that field as the global value for its registered target rather than duplicating it.

**Tech Stack:** Vue 3, Pinia, TypeScript, Vitest, existing browser `localStorage` and `structuredClone` APIs; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-11-theme-registry-inheritance-design.md`

## Global Constraints

- FTB-006 depends on FTB-003 and remains limited to the model/store, registry, resolver, persistence/history, serialization contract, and tests; do not implement the full editor or Inspector.
- Registry IDs, selectors, controls, compatibility declarations, and scope keys are application-owned allowlisted metadata.
- Unknown metadata is not silently interpreted as an active control.
- The child editor's default is **Inherit**: it stores no value.
- Resetting a control at any scope removes that scope's explicit override.
- Inherited values are derived and must not be separately recorded in history or local storage.
- Minimal serializes explicit deviations only; Fully Explicit materializes the selected scope from the shared resolver.
- Export must not emit unsupported controls or unresolved values as if they were valid.
- Validate theme overrides at input/mutation boundaries and again when restoring persisted or imported state and exporting.
- Existing version-1 `ThemeState` data, including `colors.primary`, must survive an explicit migration or compatible defaulting path.
- Persistence failure must not prevent editing.
- Lookup must return a unique match, explicit no-match, or ambiguity with candidate IDs; it must never choose arbitrarily.
- Theme values are untrusted input; never interpolate arbitrary selectors, CSS rules, markup, or executable content from theme input.
- Any future AI/MCP capability must reuse the registry, resolver, validation, authorization, and persistence/domain path; this plan adds no MCP tool.
- Do not add third-party packages, UI components, Inspector behavior, icon packs, branding, or a CSS/PHP exporter.

---

## File Responsibility Map

- **Modify:** `builder/src/models/theme.model.ts` — versioned canonical `ThemeState`, sparse override/scope/value types, and validation/serialization result types. Preserve the existing primary-color compatibility shape required by the current builder.
- **Create:** `builder/src/models/theme-registry.model.ts` — registry entry, control descriptor, compatibility, lookup evidence/result, and supported scope types.
- **Create:** `builder/src/registry/theme-registry.ts` — deterministic application-owned registry fixture, whole-registry validation, and selector lookup.
- **Create:** `builder/src/services/theme-validation.ts` — validation of registry metadata and theme overrides at mutation/restore/serialization boundaries.
- **Create:** `builder/src/services/theme-resolver.ts` — pure four-level inheritance and reset semantics; returns resolved or unresolved results without mutating state.
- **Create:** `builder/src/services/theme-serialization.ts` — validated minimal and fully-explicit domain serialization using the shared resolver; not CSS generation.
- **Modify:** `builder/src/stores/theme.ts` — restore/migrate/validate the extended state, expose sparse override/reset operations, and keep one complete theme mutation in undo/redo and debounced persistence.
- **Modify:** `builder/src/__tests__/theme-state.spec.ts` — preserve FTB-003 behavior and add migration, sparse mutation, persistence, undo, and redo assertions.
- **Create:** `builder/src/__tests__/theme-registry.spec.ts` — metadata validation, stable IDs, compatibility, deterministic lookup, no-match, and ambiguous-match tests.
- **Create:** `builder/src/__tests__/theme-resolver.spec.ts` — all inheritance levels, defaults, unresolved results, reset, and explicit-equal-parent tests.
- **Create:** `builder/src/__tests__/theme-serialization.spec.ts` — minimal/fully-explicit output and invalid input/export safety tests.
- **Modify:** `TICKETS.md` — only after all implementation tests pass, record FTB-006 evidence/status and checked acceptance criteria without claiming UI/Inspector work.

## Interfaces

The implementation must use these names and shapes consistently across tasks:

```ts
export type ThemeScope = 'global' | 'component' | 'variant' | 'state'

export type ThemeValue = string | number | boolean

export type ThemeOverride = {
  targetId: string
  controlId: string
  scope: ThemeScope
  componentId?: string
  variantId?: string
  stateId?: string
  value: ThemeValue
}

export type ThemeState = {
  schemaVersion: 2
  colors: { primary: string }
  overrides: ThemeOverride[]
}

export type ResolveRequest = {
  targetId: string
  controlId: string
  componentId?: string
  variantId?: string
  stateId?: string
}

export type ResolveResult =
  | { status: 'resolved'; value: ThemeValue; source: ThemeScope | 'registry-default' | 'legacy-global' }
  | { status: 'unresolved'; targetId: string; controlId: string }

export type SerializationMode = 'minimal' | 'fully-explicit'
```

`resolveThemeValue(state, registry, request): ResolveResult`, `validateThemeState(state, registry): ValidationResult`, `serializeTheme(state, registry, scope, mode): SerializationResult`, `lookupRegistryEntry(registry, evidence): LookupResult`, `setOverride(override): void`, and `resetOverride(request): void` are the public seams later tasks consume. `setOverride` and `resetOverride` are store mutations; the pure service functions never mutate state.

### Task 1: Define the versioned model and validated semantic registry

**Files:**
- Modify: `builder/src/models/theme.model.ts`
- Create: `builder/src/models/theme-registry.model.ts`
- Create: `builder/src/registry/theme-registry.ts`
- Test: `builder/src/__tests__/theme-registry.spec.ts`

**Interfaces:**
- Consumes: existing `ThemeState` `{ schemaVersion: 1, colors: { primary: string } }`.
- Produces: `ThemeState` version 2, `ThemeScope`, `ThemeOverride`, registry metadata types, `FilamentRegistry`, `createThemeRegistry()`, `validateRegistry()`, and `lookupRegistryEntry()`.

- [ ] **Step 1: Write the failing registry tests**

Add tests with these exact behaviors:

```ts
const backgroundControl = {
  id: 'background',
  valueType: 'color' as const,
  constraints: { pattern: /^#[\da-f]{6}$/i },
}
const buttonEntry = {
  id: 'button.primary',
  label: 'Primary button',
  family: 'button',
  selectors: ['.fi-btn-primary'],
  controls: [backgroundControl],
  variants: ['primary', 'secondary'],
  states: ['default', 'hover'],
  filamentCompatibility: '5.x',
}

it('rejects duplicate stable IDs and malformed selector/control metadata', () => {
  expect(() => validateRegistry([buttonEntry, { ...buttonEntry }])).toThrow(/duplicate.*button\.primary/i)
  expect(() => validateRegistry([{ ...buttonEntry, selectors: [] }])).toThrow(/selectors/i)
  expect(() => validateRegistry([{ ...buttonEntry, controls: [{ ...backgroundControl, valueType: 'unknown' as never }] })).toThrow(/control.*type/i)
})

it('keeps labels independent from stable semantic IDs', () => {
  const registry = createThemeRegistry()
  expect(registry.entries.find((entry) => entry.id === 'button.primary')?.label).toBe('Primary button')
})

it('returns unique, no-match, and ambiguous lookup results deterministically', () => {
  const registry = createThemeRegistry()
  expect(lookupRegistryEntry(registry, { selectors: ['.fi-btn-primary'], filamentVersion: '5.0' })).toMatchObject({ status: 'matched', entry: { id: 'button.primary' } })
  expect(lookupRegistryEntry(registry, { selectors: ['.not-a-filament-selector'], filamentVersion: '5.0' })).toEqual({ status: 'no-match' })
  expect(lookupRegistryEntry(registry, { selectors: ['.fi-shared'], filamentVersion: '5.0' })).toMatchObject({ status: 'ambiguous', candidateIds: expect.arrayContaining(['button.primary', 'button.secondary']) })
})

it('rejects lookup when the active Filament compatibility baseline is unsupported', () => {
  expect(lookupRegistryEntry(createThemeRegistry(), { selectors: ['.fi-btn-primary'], filamentVersion: '4.0' })).toEqual({ status: 'incompatible', required: '5.x' })
})
```

The test file must also define `createTestRegistry()` with `buttonEntry` and a second `button.secondary` entry sharing `.fi-shared`, then use that registry for the ambiguity assertion; the production registry must contain the verified concrete entries, not the synthetic ambiguity fixture.

- [ ] **Step 2: Run the registry tests to verify they fail**

Run: `npm run test:unit -- src/__tests__/theme-registry.spec.ts --run`

Expected: FAIL because the registry model and exported registry functions do not exist.

- [ ] **Step 3: Add the model and registry contracts**

Define control descriptors with explicit `valueType` (`color`, `string`, `number`, or `boolean`), constraints, supported variants/states, and parseable `filamentCompatibility`. Make `createThemeRegistry()` return a frozen/deterministically ordered registry containing at least `button.primary`, `button.secondary`, and the legacy global primary target. Use real Filament 5 selectors only when verified by the existing demo markup; keep selector intent in metadata rather than accepting arbitrary selectors.

- [ ] **Step 4: Implement whole-registry validation and lookup**

Validate all entries before exposing the registry. Match only declared selectors and the active compatibility range; sort candidate IDs before returning ambiguity. Return explicit `matched`, `no-match`, `ambiguous`, or `incompatible` results and never mutate the theme.

- [ ] **Step 5: Run the registry tests to verify they pass**

Run: `npm run test:unit -- src/__tests__/theme-registry.spec.ts --run`

Expected: PASS with all registry metadata, compatibility, and lookup assertions green.

- [ ] **Step 6: Commit the registry contract**

```bash
git add builder/src/models/theme.model.ts builder/src/models/theme-registry.model.ts builder/src/registry/theme-registry.ts builder/src/__tests__/theme-registry.spec.ts
git commit -m "(builder) Feature: add semantic theme registry contract"
```

### Task 2: Implement override validation and four-level resolution

**Files:**
- Create: `builder/src/services/theme-validation.ts`
- Create: `builder/src/services/theme-resolver.ts`
- Test: `builder/src/__tests__/theme-resolver.spec.ts`

**Interfaces:**
- Consumes: `ThemeState`, `ThemeOverride`, `ResolveRequest`, `ResolveResult`, and the validated registry from Task 1.
- Produces: `validateThemeOverride()`, `validateThemeState()`, and `resolveThemeValue()`.

- [ ] **Step 1: Write the failing resolver and validation tests**

Use one representative `button.primary.background` fixture and assert:

```ts
const requestFor = (variantId?: string, stateId?: string): ResolveRequest => ({ targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId, stateId })
const global = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'global', value })
const variant = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'variant', componentId: 'button', variantId: 'primary', value })
const stateValue = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'state', componentId: 'button', variantId: 'primary', stateId: 'hover', value })
const withOverrides = (...overrides: ThemeOverride[]): ThemeState => ({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides })

it('resolves Global → Component → Variant → State and nearest parent fallback', () => {
  const state = withOverrides(global('#334155'), variant('#4f46e5'), stateValue('#4338ca'))
  expect(resolveThemeValue(state, registry, requestFor('default'))).toMatchObject({ status: 'resolved', value: '#334155', source: 'global' })
  expect(resolveThemeValue(state, registry, requestFor('primary'))).toMatchObject({ value: '#4f46e5', source: 'variant' })
  expect(resolveThemeValue(state, registry, requestFor('primary', 'hover'))).toMatchObject({ value: '#4338ca', source: 'state' })
})

it('returns registry defaults and unresolved results without inventing values', () => {
  expect(resolveThemeValue(emptyTheme, registry, requestWithDefault)).toMatchObject({ status: 'resolved', source: 'registry-default' })
  expect(resolveThemeValue(emptyTheme, registry, requestWithoutDefault)).toEqual({ status: 'unresolved', targetId: 'button.primary', controlId: 'border' })
})

it('rejects unknown IDs, controls, unsupported keys, invalid values, and incompatible baselines', () => {
  expect(validateThemeOverride(unknownTarget, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown target/i) })
  expect(validateThemeOverride(unsupportedState, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*state/i) })
  expect(validateThemeOverride(invalidColor, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid value/i) })
})

it('preserves explicit equal-to-parent values as explicit', () => {
  const state = withOverrides(global('#334155'), component('#334155'))
  expect(resolveThemeValue(state, registry, componentRequest)).toMatchObject({ value: '#334155', source: 'component' })
})

it('does not throw while resolving a quarantined invalid external override', () => {
  expect(() => resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).not.toThrow()
})
```

Define `emptyTheme` as `withOverrides()`, `requestWithDefault` as the registered target/control with no overrides, `requestWithoutDefault` as `controlId: 'border'`, and the named invalid fixtures as literal objects with one failing invariant each. Define `componentRequest` as `requestFor('primary')` and ensure the fixture includes a component-scope override when testing explicit equality.

- [ ] **Step 2: Run the resolver tests to verify they fail**

Run: `npm run test:unit -- src/__tests__/theme-resolver.spec.ts --run`

Expected: FAIL because validation and resolver services are not defined.

- [ ] **Step 3: Implement validation at the pure service boundary**

Validate target ID, declared control, scope/key combination, compatibility baseline, and control-specific value constraints. Return a typed result containing the target/control/scope context in every failure. `validateThemeState` must return only valid state or a quarantined invalid result; it must never coerce unknown keys into active controls.

- [ ] **Step 4: Implement the pure resolver**

Walk state → variant → component → global in precedence order for the requested semantic target/control. Treat absent overrides as Inherit, preserve explicit equal values, consult the registry default only after all levels are absent, and return `unresolved` when no value exists. Do not write resolved values into `ThemeState`.

- [ ] **Step 5: Run the resolver tests to verify they pass**

Run: `npm run test:unit -- src/__tests__/theme-resolver.spec.ts --run`

Expected: PASS with all inheritance, default, unresolved, validation, and security assertions green.

- [ ] **Step 6: Commit the resolver contract**

```bash
git add builder/src/services/theme-validation.ts builder/src/services/theme-resolver.ts builder/src/__tests__/theme-resolver.spec.ts
git commit -m "(builder) Feature: add validated theme inheritance resolver"
```

### Task 3: Add shared minimal and fully-explicit domain serialization

**Files:**
- Create: `builder/src/services/theme-serialization.ts`
- Create: `builder/src/__tests__/theme-serialization.spec.ts`

**Interfaces:**
- Consumes: `ThemeState`, registry validation, and `resolveThemeValue()`.
- Produces: `serializeTheme(state, registry, scope, mode): SerializationResult` and `deserializeTheme(input, registry): DeserializeResult`.

- [ ] **Step 1: Write the failing serialization tests**

Assert the following exact behaviors:

```ts
it('minimal serialization keeps only sparse explicit overrides', () => {
  const result = serializeTheme(themeWithGlobalAndEqualChild, registry, primaryScope, 'minimal')
  expect(result).toEqual(expect.objectContaining({ valid: true, mode: 'minimal' }))
  expect(result.state.overrides).toEqual(expect.arrayContaining([globalOverride, equalChildOverride]))
  expect(result.state.overrides).not.toContainEqual(inheritedStateCopy)
})

it('fully-explicit serialization materializes inherited values from the shared resolver', () => {
  const result = serializeTheme(themeWithGlobalAndVariant, registry, primaryScope, 'fully-explicit')
  expect(result.state.overrides).toContainEqual(expect.objectContaining({ scope: 'state', value: '#4f46e5' }))
  expect(result.state.overrides).not.toContainEqual(expect.objectContaining({ value: undefined }))
})

it('rejects invalid or unresolved export values instead of emitting them', () => {
  expect(serializeTheme(invalidTheme, registry, primaryScope, 'minimal')).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
  expect(serializeTheme(unresolvedTheme, registry, primaryScope, 'fully-explicit')).toMatchObject({ valid: false, error: expect.stringMatching(/unresolved/i) })
})

it('round-trips the current domain representation without copying inherited values', () => {
  const serialized = serializeTheme(themeWithGlobalAndVariant, registry, primaryScope, 'minimal')
  expect(deserializeTheme(JSON.stringify(serialized.state), registry)).toEqual({ valid: true, state: serialized.state })
})
```

- [ ] **Step 2: Run the serialization tests to verify they fail**

Run: `npm run test:unit -- src/__tests__/theme-serialization.spec.ts --run`

Expected: FAIL because the domain serialization service is not defined.

- [ ] **Step 3: Implement validated serialization and deserialization**

Minimal output must preserve explicit overrides even when equal to a parent. Fully explicit output must enumerate the selected supported registry representation and materialize every effective value through `resolveThemeValue`; unresolved results are errors. Deserialize through the same state validator. Keep this module CSS- and PHP-export agnostic.

- [ ] **Step 4: Run the serialization tests to verify they pass**

Run: `npm run test:unit -- src/__tests__/theme-serialization.spec.ts --run`

Expected: PASS with sparse distinction, materialization, invalid-input, unresolved-output, and round-trip assertions green.

- [ ] **Step 5: Commit the domain serialization contract**

```bash
git add builder/src/services/theme-serialization.ts builder/src/__tests__/theme-serialization.spec.ts
git commit -m "(builder) Feature: add sparse theme serialization modes"
```

### Task 4: Integrate migration, mutation, persistence, and history in the Pinia store

**Files:**
- Modify: `builder/src/stores/theme.ts`
- Modify: `builder/src/__tests__/theme-state.spec.ts`

**Interfaces:**
- Consumes: registry, validation, resolver, and serialization services from Tasks 1–3.
- Produces: store mutations `setOverride(override: ThemeOverride): void`, `resetOverride(request: ResolveRequest): void`, `resolve(request: ResolveRequest): ResolveResult`, and existing `setPrimaryColor`, `undo`, `redo`, `canUndo`, and `canRedo` behavior.

- [ ] **Step 1: Write the failing store integration tests**

Add these exact assertions while retaining all existing FTB-003 tests:

```ts
it('migrates version-1 colors.primary into the current state without losing the color', () => {
  localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 1, colors: { primary: '#0f766e' } }))
  const store = useThemeStore()
  expect(store.theme.schemaVersion).toBe(2)
  expect(store.theme.colors.primary).toBe('#0f766e')
})

it('stores Inherit as absence and reset removes only the selected override', () => {
  const store = useThemeStore()
  store.setOverride(primaryButtonVariantOverride)
  store.resetOverride(primaryButtonVariantRequest)
  expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
  expect(store.resolve(primaryButtonVariantRequest)).toMatchObject({ source: 'legacy-global' })
})

it('records one sparse edit/reset as one undoable state change and restores exact absence', () => {
  const store = useThemeStore()
  store.setOverride(primaryButtonVariantOverride)
  store.resetOverride(primaryButtonVariantRequest)
  store.undo()
  expect(store.theme.overrides).toContainEqual(primaryButtonVariantOverride)
  store.redo()
  expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
})

it('persists sparse overrides but never persists resolved inherited copies', () => {
  vi.useFakeTimers()
  const store = useThemeStore()
  store.setOverride(primaryButtonVariantOverride)
  vi.advanceTimersByTime(300)
  expect(JSON.parse(localStorage.getItem('ftb-theme')!)).toEqual(store.theme)
  expect(JSON.parse(localStorage.getItem('ftb-theme')!).overrides).not.toContainEqual(expect.objectContaining({ scope: 'state', value: '#4f46e5' }))
})

it('ignores invalid persisted overrides and leaves editing usable', () => {
  localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [invalidExternalOverride] }))
  const store = useThemeStore()
  expect(store.theme.overrides).toEqual([])
  expect(() => store.setPrimaryColor('#0f766e')).not.toThrow()
})
```

- [ ] **Step 2: Run the store tests to verify they fail**

Run: `npm run test:unit -- src/__tests__/theme-state.spec.ts --run`

Expected: FAIL because the store still only understands schema version 1 and has no sparse override API.

- [ ] **Step 3: Implement explicit version migration and safe restore**

Migrate version 1 to version 2 without dropping `colors.primary`; validate the resulting state against the current registry and safely fall back/quarantine invalid persisted data. Keep the existing storage key, debounce, failure handling, and disposal behavior.

- [ ] **Step 4: Implement one-mutation sparse store operations**

Clone and validate an override before adding/replacing it. Reset by removing exactly the matching target/control/scope/key tuple. Both operations must update the canonical `theme` once so the existing deep watcher records one complete snapshot and persistence writes only sparse state. `resolve()` delegates to the pure resolver and returns derived data only.

- [ ] **Step 5: Run the store tests to verify they pass**

Run: `npm run test:unit -- src/__tests__/theme-state.spec.ts --run`

Expected: PASS with existing primary-color behavior plus migration, sparse Inherit/reset, exact undo/redo, persistence, and invalid-restore assertions green.

- [ ] **Step 6: Run the complete builder checks**

Run from `builder/`:

```bash
npm run type-check
npm run test:unit -- --run
npm run build
```

Expected: all commands exit 0; no application UI files or third-party dependencies are changed.

- [ ] **Step 7: Commit the store integration**

```bash
git add builder/src/stores/theme.ts builder/src/__tests__/theme-state.spec.ts
git commit -m "(builder) Feature: integrate sparse inheritance with theme store"
```

### Task 5: Verify the complete FTB-006 contract and record status evidence

**Files:**
- Modify: `TICKETS.md`
- No application files; no `.playwright-mcp/` changes.

**Interfaces:**
- Consumes: all registry, resolver, serialization, migration, persistence, and history tests from Tasks 1–4.
- Produces: auditable FTB-006 status evidence limited to the implemented domain contract; no claim of FTB-007 Inspector or full UI completion.

- [ ] **Step 1: Run the complete verification suite before documentation changes**

Run from `builder/`:

```bash
npm run type-check
npm run test:unit -- --run
npm run build
```

Expected: all commands pass, including the existing `App.spec.ts` tests and all new registry/resolver/serialization/store tests.

- [ ] **Step 2: Confirm the working tree scope**

Run from the repository root: `git status --short`

Expected: only the intended builder contract files and tests are modified; unrelated changes, `.gitignore`, and `.playwright-mcp/` are preserved.

- [ ] **Step 3: Update ticket evidence only after tests pass**

In `TICKETS.md`, change FTB-006 to `done` only if every acceptance criterion is supported by the passing tests: stable IDs, selectors/controls, compatibility metadata, all four inheritance levels, Inherit/reset semantics, minimal sparse distinction, representative fixture, and deterministic lookup. Add concise evidence references to the exact test files. Do not mark UI/Inspector behavior as implemented, and do not alter unrelated ticket statuses.

- [ ] **Step 4: Run the complete verification suite again after documentation changes**

Run from `builder/`: `npm run type-check && npm run test:unit -- --run && npm run build`

Expected: all commands still pass and `TICKETS.md` is the only non-builder documentation/status file changed.

- [ ] **Step 5: Commit the status evidence**

```bash
git add TICKETS.md
git commit -m "(builder) Docs: record FTB-006 contract evidence"
```

## Self-Review Checklist

- **Spec coverage:** Tasks 1–2 cover registry metadata, stable IDs, selectors, controls, compatibility, lookup, four-level inheritance, defaults, unresolved values, validation, and safe invalid data. Task 3 covers both export modes through one resolver without creating an exporter. Task 4 covers version-1 migration, local persistence, history, undo/redo, sparse absence, reset, and explicit-equal values. Task 5 records documentation/status evidence only after tests.
- **Scope:** No task creates a full editor, Inspector, icon pack, branding surface, CSS/PHP exporter, alternate state store, or MCP tool.
- **Completeness scan:** No step depends on an incomplete marker, unspecified error handling, or an unreferenced task.
- **Type consistency:** `ThemeScope`, `ThemeOverride`, `ResolveRequest`, `ResolveResult`, `ThemeState`, and `SerializationMode` are defined once in the Interfaces section and reused consistently by the registry, services, store, and tests.
- **Repository safety:** The plan never edits `.playwright-mcp/`, adds dependencies, changes compose files, or assumes unrelated worktree changes can be discarded.
