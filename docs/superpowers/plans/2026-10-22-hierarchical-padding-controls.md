# Hierarchical Padding Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add schema V5 sparse hierarchical padding controls with one canonical resolver/projection shared by the builder UI, real Filament iframe, exports, and purpose-built local MCP operations.

**Architecture:** Extend the existing registry and V4 migration boundary into a V5 canonical theme state. Store only sparse per-edge explicit values; resolve effective values and provenance through one pure service with precedence `state > variant > component > section > global > native`. UI mutations, history, persistence, preview projection, CSS/JSON export, and MCP all consume that service rather than maintaining derived copies. Global and section entries are semantic defaults, not fake universal selectors; containers skip global/section inheritance but can receive explicit component/variant/state values.

**Tech Stack:** Vue 3 + TypeScript + Pinia + Vitest in `builder/`; Laravel 13 + Laravel MCP + bounded local relay in `demo/`; real Filament 5.9.0 showcase iframe; existing Playwright and stdio MCP clients; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md` plus its approved addendum. The addendum and this plan supersede unresolved padding choices in the original planning document. Refreshed implementation fixed point: `94e1bd7bbb2796458ad267525bc45dd4de698bcf` on `dev`; unrelated dirty worktree changes must remain untouched.

## Global Constraints

- Implement schema V5 while preserving V1, V2, V3, and V4 through the existing migration boundary.
- Store padding sparsely: omitted edge means inherit; numeric/string zero is an explicit value and must never be treated as omission.
- `PaddingEdges` accepts canonical string lengths or numeric `0`; negative values, non-finite values, and nonzero unitless values are rejected, while CSS receives only validated string values (`0` for zero).
- Use one canonical resolver/projection for UI, iframe, JSON/CSS exports, and purpose-built MCP.
- Precedence is exactly `state > variant > component > section > global > native`.
- Global and section values are semantic defaults. Do not invent a global selector or blanket selector rule.
- Containers skip global and section defaults, but support explicit component, variant, and state values.
- The initial verified target matrix is limited to the selectors and measurements recorded below. All other groups remain explicitly unmapped until runtime evidence exists.
- Filament compatibility is `v5.9.0` from `demo/composer.lock`.
- Reuse existing paired-session authorization, revision-bound confirmation, expiry, and apply-time revalidation. Do not add a second confirmation protocol.
- No padlocks are installed. Do not add an anticipatory lock framework or lock identities.
- MCP inputs accept stable target IDs, scopes, edges, and approved values/units only; arbitrary selectors and CSS rules are rejected.
- No third-party package, server-side theme domain service, generic framework, fake global target, or unrelated refactor.
- Builder production and test files must remain under 100 lines; split by responsibility where needed.
- Every implementation task uses failing test → expected failure → smallest implementation → passing verification, followed by review and a commit containing only that task’s intended files.
- Do not edit or overwrite current unrelated dirty files, including prototype files and existing unrelated plans.

## Verified target matrix

The registry extension must encode this matrix as stable target IDs, exact selectors, evidence references, visual-target classification, and nested-target policy. These are the only initially supported padding targets:

| Group | Target classification | Exact selector(s) | Evidence | Initial result |
| --- | --- | --- | --- | --- |
| Forms | leaf input | `.fi-fo-text-input .fi-input` | forms-showcase, 13, computed `6px 12px` | supported |
| Forms | leaf textarea | `.fi-fo-textarea textarea` | forms-showcase, 4, computed `6px 12px` | supported |
| Forms | leaf native select | `.fi-fo-select.fi-fo-select-native .fi-select-input` | forms-showcase, 4, computed `6px 32px 6px 12px` | supported |
| Forms | multiselect | none | runtime evidence absent | explicitly unmapped |
| Forms | section container | `.fi-section` | forms-showcase, 6, computed zero | supported only as explicit container target |
| Forms | section header container | `.fi-section-header` | forms-showcase, 6, computed `16px 24px` | supported only as explicit container target |
| Forms | section content container | `.fi-section-content` | forms-showcase, 6, computed `24px` | supported only as explicit container target |
| Forms | field structural wrapper | `.fi-fo-field` | structural only | explicitly excluded |
| Tables | table container | `.fi-ta` | tables-showcase, 3, computed zero | supported only as explicit container target |
| Tables | table header container | `.fi-ta-header` | tables-showcase, 3, computed `16px 24px` | supported only as explicit container target |
| Tables | table header cell leaf | `.fi-ta-header-cell` | tables-showcase, 16, computed `14px 12px` | supported |
| Tables | visual text cell | `.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-text` | tables-showcase, 26, computed `16px 12px` | supported leaf |
| Tables | visual image cell | `.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-image` | tables-showcase, 2, computed `16px 12px` | supported leaf |
| Tables | generic cell / selection / icon / action internals | no generic `.fi-ta-cell` padding | ordinary TD is zero; internals excluded | explicitly excluded |
| Buttons | default leaf | `.fi-btn` | actions-showcase, 25, computed `8px 12px` | supported |
| Buttons | primary variant of `buttons.default` | `.fi-btn.fi-color-primary` | actions-showcase, 11 | supported variant metadata |
| Buttons | outlined variant of `buttons.default` | `.fi-btn.fi-outlined` | actions-showcase, 1, computed `6px 10px` | supported variant metadata |
| Buttons | disabled state of `buttons.default` | `.fi-btn:disabled` | actions-showcase, 2 | supported state metadata |
| Buttons | hover/focus-visible | actual pseudo-state evidence absent | T1 nonmutating runtime checks required | blocked from support until verified |

The primary verified table selector is **not** `.fi-ta-cell`; that selector includes selection cells and ordinary TDs whose computed padding is zero. Never pad the TD on top of the native padded `.fi-ta-text`/`.fi-ta-image` child. `tables.cell.text` and `tables.cell.image` remain separate stable targets because their evidence and visual elements are distinct.

## File map and ownership

The following paths were verified during investigation. Keep each responsibility narrow:

- `builder/src/models/theme.model.ts`: V5 state, padding edge/scope/request/result types.
- `builder/src/models/theme-registry.model.ts`: padding metadata, evidence, target classification, and value-unit contracts.
- `builder/src/registry/theme-registry-catalog-*.ts`: existing registry extension; no second registry. Existing core color IDs and button variant metadata remain untouched.
- `builder/src/registry/filament-padding-targets.json`: single versioned neutral catalog. TypeScript imports it from the existing registry-local path; PHP reads its packaged copy from `resources/theme-registry/filament-padding-targets.json`.
- `builder/src/registry/theme-registry-validation.ts`, `theme-registry-validation-entry.ts`, and `theme-registry-validation-controls.ts`: duplicate identity, selector, evidence, unit, and mapping validation.
- `builder/src/utils/theme-import-migrations.ts`: V1→V5 migration.
- `builder/src/utils/foundation-state-validation.util.ts` and `builder/src/utils/padding-validation.ts`: V5 state validation without making the foundation validator unmaintainable.
- `builder/src/utils/theme-resolver.ts`, `builder/src/utils/padding-resolver.ts`, and `builder/src/utils/padding-projection.ts`: one canonical resolution/projection interface.
- `builder/src/composables/use-theme-override-actions.ts` and `builder/src/stores/theme.ts`: store-owned canonical mutations.
- `builder/src/composables/use-theme-history.ts`, `use-local-theme-persistence.ts`, and import utilities: unchanged mechanisms exercised with V5 sparse state.
- `builder/src/composables/use-preview-theme.ts`: post the canonical padding projection, not a second resolved state.
- `builder/src/utils/vanilla-css-export*.ts`: consume the same projection for deterministic CSS.
- `demo/resources/views/filament/preview-bridge.blade.php`: validate and apply the bounded projection and locally embedded catalog; remove padding resolution duplication.
- `demo/app/Mcp/Servers/LocalThemeServer.php` and `demo/app/Mcp/Tools/`: purpose-built discovery/read/preview/set/reset relay tools.
- `demo/app/Mcp/ThemeRelay/OperationStore.php`, `OperationPreviewLifecycle.php`, `ImportGrantStore.php`, `OperationResultLifecycle.php`, and `RelayImportPreviewValidator.php`, plus `builder/src/composables/use-theme-relay.ts` and `use-theme-relay-operations.ts`: extend existing paired revision-bound confirmation, not a new transport.
- `e2e/ftb-054-padding-evidence.spec.ts`, `e2e/ftb-054-padding-controls.spec.ts`, `e2e/ftb-054-mcp.spec.ts`, and the named builder/PHP test files in Tasks 1–5: external behavior, real iframe, and transport coverage.

## Formal interfaces

Use these names and shapes unless an existing type forces a compatible refinement:

```ts
type PaddingEdge = 'top' | 'right' | 'bottom' | 'left'
type PaddingEdges = Partial<Record<PaddingEdge, string | 0>>
type PaddingScope = 'global' | 'section' | 'component' | 'variant' | 'state'
type PaddingTargetKind = 'leaf' | 'container'

type PaddingContext =
  | { scope: 'global' }
  | { scope: 'section'; sectionId: string }
  | { scope: 'component'; targetId: string }
  | { scope: 'variant'; targetId: string; variantId: string }
  | { scope: 'state'; targetId: string; variantId?: string; stateId: string }

type PaddingRecord = PaddingContext & { edges: PaddingEdges }

type ResolvedPaddingEdge = {
  edge: PaddingEdge
  value: string | null
  source: PaddingScope | 'native'
  sourceTargetId?: string
  explicit: boolean
  native: boolean
}

type ResolvedPadding = {
  targetId: string
  edges: Record<PaddingEdge, ResolvedPaddingEdge>
}

type PaddingResolutionRequest = {
  targetId: string
  variantId?: string
  stateId?: string
}

type PaddingReadRequest = PaddingResolutionRequest & { selectedContext: PaddingContext }

type PaddingReadResult = {
  resolved: ResolvedPadding
  selectedContext: PaddingContext
  explicitEdges: PaddingEdge[]
}

type PaddingContextDto =
  | { scope: 'global' }
  | { scope: 'section'; section_id: string }
  | { scope: 'component'; target_id: string }
  | { scope: 'variant'; target_id: string; variant_id: string }
  | { scope: 'state'; target_id: string; variant_id?: string; state_id: string }

type PaddingMutation = {
  context: PaddingContext
  operation: 'set' | 'reset'
  edges?: PaddingEdges
  resetEdges?: PaddingEdge[]
}

type PaddingCssProjection = {
  schemaVersion: 1
  compatibility: 'filament-5.9'
  rules: Array<{
    targetId: string
    selector: string
    declarations: Partial<Record<PaddingEdge, string>>
    order: number
  }>
}

type ValidationResult =
  | { valid: true }
  | { valid: false; code: string; path: string; message: string }

function resolvePadding(state: ThemeStateV5, registry: FilamentRegistry, request: PaddingResolutionRequest): ResolvedPadding
function readPadding(state: ThemeStateV5, registry: FilamentRegistry, request: PaddingReadRequest): PaddingReadResult
function projectPadding(state: ThemeStateV5, registry: FilamentRegistry): PaddingCssProjection
function validatePaddingMutation(input: PaddingMutation, state: ThemeStateV5, registry: FilamentRegistry): ValidationResult
function setPadding(mutation: PaddingMutation & { operation: 'set' }): void
function resetPadding(mutation: PaddingMutation & { operation: 'reset' }): void
```

The Pinia store exposes the same canonical methods without a second UI model: `setPadding(mutation: PaddingMutation & { operation: 'set' }): void`, `resetPadding(mutation: PaddingMutation & { operation: 'reset' }): void`, `readPadding(request: PaddingReadRequest): PaddingReadResult`, and `resolvePadding(request: PaddingResolutionRequest): ResolvedPadding`.

`PaddingResolutionRequest.targetId` identifies a supported leaf/container target; its section is derived from validated registry metadata, never supplied by the caller. `variantId` and `stateId` are validated against that target’s metadata. `PaddingContext` is the only persisted identity shape: unknown keys, mismatched scope keys, duplicate identities, and global/section target IDs are rejected. `PaddingEdges` preserves numeric `0` canonically; nonzero values are validated strings with approved units. CSS serialization converts numeric zero to the string `0` only after validation.

`PaddingCssProjection` must contain only registry-owned selectors and resolved declarations whose source is explicit. Native edges are omitted. It must identify target ID, selector, edge declarations, and deterministic ordering. It must never contain arbitrary input selectors, copied resolved records, or shorthand composites. Global and section records affect leaf resolution but do not emit a global/section selector; containers skip those contexts.

The canonical state contract is exact: `ThemeStateV5 = Omit<ThemeStateV4, 'schemaVersion'> & { schemaVersion: 5; padding: PaddingRecord[] }`. Every V1–V4 migration returns `padding: []`; V5 validation requires the `padding` key and rejects malformed records rather than silently dropping them.

## Task 1: Registry evidence, target contract, and runtime checks

**Deliverable:** Independently testable validated registry target matrix, including live nonmutating selector/state evidence and unsupported/unmapped entries without fake controls.

**Files:**
- Modify: `builder/src/models/theme-registry.model.ts`.
- Modify: `builder/src/registry/theme-registry-catalog-core.ts`, `theme-registry-catalog-forms.ts`, and `theme-registry-catalog-showcases-components.ts`.
- Modify: `builder/src/registry/theme-registry-validation.ts`, `theme-registry-validation-entry.ts`, and `theme-registry-validation-controls.ts`.
- Create: `builder/src/registry/filament-padding-targets.json` as the single versioned neutral target catalog imported by the TypeScript registry and packaged for PHP/bridge code.
- Modify: `compose.dev.yaml` to mount the canonical catalog read-only at `/var/www/html/resources/theme-registry/filament-padding-targets.json` in `demo-php`.
- Modify: `demo/Dockerfile` to copy the same canonical catalog to `resources/theme-registry/filament-padding-targets.json` in production.
- Create: `builder/src/models/padding-registry.model.ts` and `builder/src/registry/padding-registry-validation.ts`, keeping each under 100 lines.
- Test: `builder/src/__tests__/theme-registry-validation.spec.ts`, `builder/src/__tests__/theme-registry-catalog.spec.ts`, `builder/src/__tests__/foundation-inventory-catalog.spec.ts`, and new `builder/src/__tests__/padding-registry.spec.ts`.
- Test: new `e2e/ftb-054-padding-evidence.spec.ts` for real forms, tables, actions, and nonmutating hover/focus checks.
- Test: `builder/src/__tests__/padding-catalog-parity.spec.ts` and `demo/tests/Feature/PreviewPaddingCatalogTest.php` for TypeScript import/PHP local-read parity and dev/production catalog packaging contracts.

**Interfaces:**
- Consumes: existing `RegistryEntry`, `FilamentRegistry`, `SUPPORTED_FILAMENT_COMPATIBILITY`, and current catalog composition.
- Produces: `RegistryEntry.paddingTargets`; stable IDs `forms.input`, `forms.textarea`, `forms.select`, `forms.section`, `forms.section.header`, `forms.section.content`, `tables.container`, `tables.header`, `tables.header-cell`, `tables.cell.text`, `tables.cell.image`, and `buttons.default`; `buttons.default` owns verified `primary` and `outlined` variant metadata plus `disabled` state metadata. Existing core color IDs remain untouched. `validateRegistry()` rejects duplicate IDs/control identities, malformed selectors, absent evidence, unsupported units, and fake/unmapped active mappings.

- [ ] Write failing tests for every supported row in the matrix, the `.fi-ta-text`/`.fi-ta-image` selectors, exclusion of `.fi-ta-cell`, multiselect unmapped status, stable IDs, and v5.9.0 compatibility.
- [ ] Add the first failing assertion in the existing registry style:

```ts
expect(registry.entries.flatMap((entry) => entry.paddingTargets ?? [])).toContainEqual(
  expect.objectContaining({
  id: 'tables.cell.text',
    selectors: ['.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-text'],
    targetKind: 'leaf',
  }),
)
```

- [ ] Run `cd builder && npx vitest run src/__tests__/padding-registry.spec.ts src/__tests__/theme-registry-validation.spec.ts`; expect failures because the padding metadata and validation do not exist.
- [ ] Implement only the registry model/catalog/validation extension. Make the existing TypeScript registry import padding metadata from `builder/src/registry/filament-padding-targets.json` using the existing registry-local path; do not duplicate selector literals in catalog code. Preserve the existing core button color IDs and inspect/assert their current variant metadata while adding only the separate `buttons.default` padding target. Encode actual computed-value evidence and target kind. Mark hover/focus-visible as unverified rather than supported until the same task's runtime checks pass. Publish all target metadata, including unmapped groups, in the canonical catalog; unsupported groups remain visible metadata and produce no CSS.
- [ ] Run the nonmutating evidence probe against the existing live showcase before feature implementation. It is an evidence precondition, not a red TDD test:

```ts
expect(await page.locator('.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-text').count()).toBeGreaterThan(0)
await expect(page.locator('.fi-ta-table tbody td.fi-ta-cell:has(> .fi-ta-col > .fi-ta-text)').first()).toHaveCSS('padding-top', '0px')
```

- [ ] Run `npx playwright test e2e/ftb-054-padding-evidence.spec.ts`; expect PASS for existing counts/padding and record hover/focus-visible results without mutating state.
- [ ] Write the failing registry discovery assertion for the new catalog metadata, then run `cd builder && npx vitest run src/__tests__/padding-registry.spec.ts`; expect failure because the catalog extension does not exist.
- [ ] Implement only selector/evidence corrections justified by the live DOM. Do not broaden selectors or add fake targets. Keep hover/focus-visible unmapped if pointer/focus checks do not verify actual supported states.
- [ ] Run the focused Vitest and evidence probe, then `cd builder && npm run type-check`; expect PASS.
- [ ] Review the intended registry/catalog/evidence files and commit them: `git add builder/src/registry/filament-padding-targets.json compose.dev.yaml demo/Dockerfile builder/src/models/theme-registry.model.ts builder/src/models/padding-registry.model.ts builder/src/registry/theme-registry-catalog-core.ts builder/src/registry/theme-registry-catalog-forms.ts builder/src/registry/theme-registry-catalog-showcases-components.ts builder/src/registry/theme-registry-validation-entry.ts builder/src/registry/theme-registry-validation-controls.ts builder/src/registry/padding-registry-validation.ts builder/src/__tests__/theme-registry-validation.spec.ts builder/src/__tests__/theme-registry-catalog.spec.ts builder/src/__tests__/foundation-inventory-catalog.spec.ts builder/src/__tests__/padding-registry.spec.ts builder/src/__tests__/padding-catalog-parity.spec.ts demo/tests/Feature/PreviewPaddingCatalogTest.php e2e/ftb-054-padding-evidence.spec.ts && git commit -m "Feature: add verified padding target registry"`.

## Task 2: V5 canonical state, validation, migration, resolver, mutation, and history

**Deliverable:** One sparse canonical model and resolver with atomic store mutations and V1–V4→V5 migration.

**Files:**
- Modify: `builder/src/models/theme.model.ts`, `builder/src/models/foundations.model.ts` only where V5 typing requires it.
- Modify: `builder/src/utils/theme-import-migrations.ts`, `theme-serialization.ts`, `foundation-state-validation.util.ts`, `theme-import-service.ts`, and local recovery validators.
- Create: `builder/src/models/padding.model.ts`, `builder/src/utils/padding-validation.ts`, and `builder/src/utils/padding-resolver.ts`.
- Modify: `builder/src/utils/theme-resolver.ts`, `builder/src/composables/use-theme-override-actions.ts`, and `builder/src/stores/theme.ts`.
- Test: `builder/src/__tests__/theme-state-migrations.spec.ts`, `theme-resolver.spec.ts`, `theme-state-overrides.spec.ts`, `theme-invalid-state.spec.ts`, `local-theme-transaction.spec.ts`, and new `builder/src/__tests__/padding-resolver.spec.ts`.

**Interfaces:**
- Consumes: Task 1 registry and existing V4 migration/validation interfaces.
- Produces: `ThemeStateV5`, `migrateVersionedTheme()` target version 5, `resolvePadding()`, `setPadding()`, `resetPadding()`, and mutation validation with no derived padding copies persisted.

- [ ] Write failing tests for V1/V2/V3/V4 migration to V5, empty padding omission, explicit zero, partial edge inheritance, native fallback, all five precedence levels, container global/section skip, reset-to-inherit, explicit-equal-to-parent preservation, invalid units/negative/nonfinite values, and unknown target rejection:

```ts
const resolved = resolvePadding(state, registry, { targetId: 'forms.input' })
expect(resolved.edges.top).toMatchObject({ value: '0', source: 'component', explicit: true, native: false })
  const before = structuredClone(state.padding)
  const resolved = resolvePadding(state, registry, { targetId: 'forms.input' })
  expect(resolved.edges.top.value).toBe('0')
  expect(state.padding).toEqual(before)
```
- [ ] Run `cd builder && npx vitest run src/__tests__/theme-state-migrations.spec.ts src/__tests__/theme-resolver.spec.ts src/__tests__/theme-invalid-state.spec.ts`; expect failures showing V5 is unsupported and padding is absent.
- [ ] Implement V5 as the sole persisted shape. Make migration preserve every existing V1–V4 property and add exactly `padding: []`. Use actual emitted CSS validation: unitless zero is valid; nonzero values require an approved unit. Never coerce or materialize inherited values.
- [ ] Implement resolution in one pure service with deterministic scope matching and per-edge source records. Derive section from registry metadata, reject caller-supplied section IDs, and expose selected-context explicitness through `readPadding()`. Have existing semantic resolution call shared precedence logic where compatible instead of creating a second resolver.
- [ ] Implement store mutations with the exact `setPadding()`/`resetPadding()` signatures above. They replace only affected sparse records/edges; linked edits are one state assignment; separate edits preserve other edges; reset deletes only selected explicit edges/records.
- [ ] Run focused tests, then `cd builder && npm run type-check && npm run test:unit`; expect PASS and unchanged unrelated tests.
- [ ] Review the intended V5 model, migration, validator, resolver, store, and test files and commit them: `git add builder/src/models/theme.model.ts builder/src/models/foundations.model.ts builder/src/models/padding.model.ts builder/src/utils/theme-import-migrations.ts builder/src/utils/theme-serialization.ts builder/src/utils/foundation-state-validation.util.ts builder/src/utils/theme-import-service.ts builder/src/utils/padding-validation.ts builder/src/utils/padding-resolver.ts builder/src/utils/theme-resolver.ts builder/src/composables/use-theme-override-actions.ts builder/src/stores/theme.ts builder/src/__tests__/theme-state-migrations.spec.ts builder/src/__tests__/theme-resolver.spec.ts builder/src/__tests__/theme-state-overrides.spec.ts builder/src/__tests__/theme-invalid-state.spec.ts builder/src/__tests__/local-theme-transaction.spec.ts builder/src/__tests__/padding-resolver.spec.ts && git commit -m "Feature: add V5 sparse hierarchical padding state"`.

## Task 3: Shared projection, CSS/JSON export, and real iframe application

**Deliverable:** One `projectPadding()` output drives UI preview payload, minimal CSS export, and the iframe without duplicate resolution or nested double-padding.

**Files:**
- Create: `builder/src/models/padding-projection.model.ts` and `builder/src/utils/padding-projection.ts`.
- Modify: `builder/src/composables/use-preview-theme.ts`, `builder/src/utils/vanilla-css-export.ts`, `vanilla-css-export-semantic-overrides.ts`, and `builder/src/composables/use-builder-exports.ts`.
- Modify: `demo/resources/views/filament/preview-bridge.blade.php` only in its bounded message schema, projection validation, and padding rule application.
- Test: `builder/src/__tests__/theme-state-projection.spec.ts`, `vanilla-css-export-semantic.spec.ts`, `App.css-export.spec.ts`, and new `builder/src/__tests__/padding-projection.spec.ts`.
- Test: `demo/tests/Feature/PreviewInspectorBridgeTest.php`.
- Test: `builder/src/__tests__/padding-catalog-parity.spec.ts` and `demo/tests/Feature/PreviewPaddingCatalogTest.php` for TypeScript import/PHP local-read parity.

**Interfaces:**
- Consumes: `ThemeStateV5`, `FilamentRegistry`, and `resolvePadding()`.
- Produces: `PaddingCssProjection` with registry-owned selector/declaration tuples; preview message `paddingProjection`; export output derived from exactly the same projection. The bridge receives target IDs and declarations, then obtains the selector from its locally embedded `filament-padding-targets.json` catalog and rejects any sender selector that is absent or differs from the catalog.

- [ ] Write failing tests asserting global/section/component resolution materializes only mapped target declarations, native edges emit nothing, table cells use only `.fi-ta-text`/`.fi-ta-image`, containers do not inherit global/section, reset removes generated CSS, and JSON remains sparse:

```ts
const projection = projectPadding(state, registry)
expect(projection.rules.map(({ selector }) => selector)).not.toContain('.fi-ta-cell')
expect(JSON.stringify(serializeCanonicalTheme(state))).not.toContain('resolved')
```
- [ ] Run focused Vitest/PHP bridge tests; expect failure because V4 messages and exports have no padding projection.
- [ ] Implement the catalog as a build/local-read contract: TypeScript imports `builder/src/registry/filament-padding-targets.json` from the existing registry-local path; PHP reads `resource_path('theme-registry/filament-padding-targets.json')` and embeds the allowlist into the Blade bridge. The dev Compose stack mounts the canonical catalog read-only at `/var/www/html/resources/theme-registry/filament-padding-targets.json`; the production `demo/Dockerfile` copies the same catalog to `resources/theme-registry/filament-padding-targets.json`. Contract tests in `builder/src/__tests__/padding-catalog-parity.spec.ts` and `demo/tests/Feature/PreviewPaddingCatalogTest.php` ensure both canonical stacks package the same single source file. No external builder imports, Vite filesystem configuration, runtime network, palette generation, or external service is permitted.
- [ ] Implement projection ordering and grouping deterministically. Serialize `0` to CSS string `0` only after canonical validation. The bridge must validate the exact V5 message and projection shape, derive/verify selectors from its local catalog, and apply declarations only to application-owned selectors; it must not resolve canonical padding or accept arbitrary sender selectors.
- [ ] Add explicit bridge security tests proving V4/V5-invalid messages are rejected until the Task 2 migration/validation boundary is active, unknown target IDs are rejected, sender-supplied selector substitutions are rejected, unsafe/nonzero unitless values are rejected, and native edges emit no rule.
- [ ] Run focused tests, then `cd builder && npm run type-check && npm run test:unit && npm run build`; expect PASS.
- [ ] Review the intended catalog consumer, projection, preview, export, bridge, and test files and commit them: `git add builder/src/models/padding-projection.model.ts builder/src/utils/padding-projection.ts builder/src/composables/use-preview-theme.ts builder/src/utils/vanilla-css-export.ts builder/src/utils/vanilla-css-export-semantic-overrides.ts builder/src/composables/use-builder-exports.ts builder/src/__tests__/theme-state-projection.spec.ts builder/src/__tests__/vanilla-css-export-semantic.spec.ts builder/src/__tests__/App.css-export.spec.ts builder/src/__tests__/padding-projection.spec.ts builder/src/__tests__/padding-catalog-parity.spec.ts demo/resources/views/filament/preview-bridge.blade.php demo/tests/Feature/PreviewInspectorBridgeTest.php demo/tests/Feature/PreviewPaddingCatalogTest.php && git commit -m "Feature: project padding through preview and exports"`.

## Task 4: Hierarchical UI, linked/mixed edge editor, and store integration

**Deliverable:** Registry-driven hierarchy with effective/source display, linked all-sides editing, mixed presentation, separate-edge editing, reset, keyboard access, and one history entry for linked edits.

**Files:**
- Create: `builder/src/components/PaddingHierarchyPanel.vue`, `PaddingTargetRow.vue`, and `PaddingEdgeEditor.vue`; keep each under 100 lines.
- Create: `builder/src/composables/use-padding-editor.ts` for reactive coordination only; keep domain validation in utilities/store.
- Modify: `builder/src/components/EditorWorkspace.vue`, `builder/src/components/EditorSections.vue`, and `builder/src/components/SemanticComponentControls.vue`; do not put feature markup in `App.vue`.
- Create: `builder/src/__tests__/padding-ui.spec.ts`; extend `builder/src/__tests__/local-theme-persistence-history.spec.ts` for sparse history/persistence.
- Test: `e2e/ftb-054-padding-controls.spec.ts` against the real builder and iframe.

**Interfaces:**
- Consumes: registry target metadata, `readPadding()`, `resolvePadding()`, store `setPadding/resetPadding`, and history/revision behavior from Task 2; consumes `PaddingCssProjection` only for preview parity from Task 3.
- Produces: hierarchy rows keyed by stable target ID; edge editor emits the exact `PaddingMutation` shape; no copied resolved state.

- [ ] Write failing component/store tests for hierarchy contents, source labels, mixed linked display, linked atomic mutation, separate-edge preservation, reset semantics, and undo/redo sparse restoration:

```ts
const mixedEdges = { top: '6px', right: '12px', bottom: '6px', left: '12px' }
const wrapper = mount(PaddingEdgeEditor, { props: { linked: true, edges: mixedEdges } })
await wrapper.get('button[aria-label="Apply linked padding"]').trigger('click')
expect(wrapper.emitted('set')).toHaveLength(1)
store.setPadding({ context: { scope: 'component', targetId: 'forms.input' }, operation: 'set', edges: { top: 0, right: '12px' } })
expect(store.theme.padding).toContainEqual(expect.objectContaining({ targetId: 'forms.input', edges: { top: 0, right: '12px' } }))
expect(store.canUndo).toBe(true)
```
- [ ] Run focused Vitest; expect failures because no padding UI exists.
- [ ] Implement one reusable edge editor rather than four copied field implementations. Linked mode reads all four resolved edges, displays mixed values without mutating on toggle, and writes four explicit edges only on an intentional edit.
- [ ] Add Playwright checks for keyboard operation, narrow viewport, zoom, effective/source updates after parent edits, child override preservation, native fallback after reset, and no duplicate table/form padding in the real iframe.
- [ ] Run focused Vitest and Playwright tests, then the full builder checks; expect PASS.
- [ ] Review the intended UI, composable, store-history test, and Playwright files and commit them: `git add builder/src/components/PaddingHierarchyPanel.vue builder/src/components/PaddingTargetRow.vue builder/src/components/PaddingEdgeEditor.vue builder/src/composables/use-padding-editor.ts builder/src/components/EditorWorkspace.vue builder/src/components/EditorSections.vue builder/src/components/SemanticComponentControls.vue builder/src/__tests__/padding-ui.spec.ts builder/src/__tests__/local-theme-persistence-history.spec.ts e2e/ftb-054-padding-controls.spec.ts && git commit -m "Feature: add hierarchical padding editor"`.

## Task 5: Purpose-built MCP discovery/read/preview/set/reset over existing paired transport

**Deliverable:** AI-operable padding capabilities with the same registry, resolver, validation, store history, projection, authorization, and revision-bound confirmation path as the UI.

**Files:**
- Modify: `demo/app/Mcp/Servers/LocalThemeServer.php`.
- Create: `demo/app/Mcp/Tools/LocalPaddingDiscover.php`, `LocalPaddingRead.php`, `LocalPaddingPreview.php`, `LocalPaddingSet.php`, and `LocalPaddingReset.php`.
- Modify: `demo/app/Mcp/ThemeRelay/OperationStore.php`, `OperationPreviewLifecycle.php`, `ImportGrantStore.php`, `OperationResultLifecycle.php`, and `RelayImportPreviewValidator.php` for typed padding operation records and the existing paired revision-bound confirmation lifecycle.
- Modify: `demo/app/Http/Controllers/LocalThemeRelay/OperationPreviewController.php` and `OperationResultController.php`; existing routes remain under `demo/routes/web.php` and are extended only for typed operation payloads.
- Modify: `builder/src/composables/use-theme-relay.ts`, `builder/src/composables/use-theme-relay-operations.ts`, `builder/src/utils/theme-relay-apply.ts`, and `builder/src/composables/use-theme-import.ts` for browser polling, existing confirmation UI, and canonical store application.
- Test: `demo/tests/Feature/Mcp/LocalPaddingToolsTest.php`, `demo/tests/Feature/Mcp/LocalPaddingAuthorizationTest.php`, `demo/tests/Unit/Mcp/LocalPaddingOperationTest.php`, `builder/src/__tests__/theme-relay-operations.spec.ts`, `theme-relay-apply.spec.ts`, `theme-relay-confirm.spec.ts`, and new `e2e/ftb-054-mcp.spec.ts`.
- Test: `e2e/support/stdio-mcp-client.model.ts` and `e2e/support/stdio-mcp-client.ts` for the actual stdio journey.

**Interfaces:**
- Consumes: stable target IDs and registry evidence; browser-owned canonical state; existing pairing/session/process authorization and revision hash.
- Produces: typed capability results for discovery/read; structured preview diff and validation; confirmed set/reset operation bound to context, edge set, expected revision, operation digest, pairing session, and expiry. MCP never receives or accepts arbitrary selectors.

**Exact MCP tool contracts:**

```text
local_padding_discover({ pairing_id })
  -> { operation_id, kind: 'padding_discover', status: 'pending' }

local_padding_read({ pairing_id, target_id, variant_id?, state_id? })
  -> { operation_id, kind: 'padding_read', status: 'pending' }

local_padding_preview({ pairing_id, context, operation, edges?, reset_edges? })
  -> { operation_id, kind: 'padding_preview', status: 'pending' }

local_padding_set({ pairing_id, context, edges })
  -> { operation_id, kind: 'padding_set', status: 'pending' }

local_padding_reset({ pairing_id, context, reset_edges? })
  -> { operation_id, kind: 'padding_reset', status: 'pending' }
```

`context` is exactly the wire `PaddingContextDto` union above and is mapped to internal `PaddingContext`; `operation` is exactly `'set' | 'reset'`. All five tools reject extra keys, unknown target IDs, unsupported variant/state keys, arbitrary selectors, CSS strings, and invalid edge values. Discovery/read return the registry or `PaddingReadResult`; preview returns `{ status: 'preview', revision, diff, validation }`; set/reset return only an operation receipt until the existing paired browser confirmation flow completes.

The MCP caller cannot self-approve. `local_padding_set` and `local_padding_reset` stage a typed operation; the paired browser displays the existing confirmation UI, obtains the existing revision-bound grant, revalidates the current revision/registry/value/expiry, invokes `setPadding()` or `resetPadding()`, and publishes the canonical resolved/projection result. The MCP operation status then returns `{ status: 'approved', revision, result }` or a typed rejection. There is no new confirmation token or AI-only bypass.

- [ ] Write failing transport tests for discovery, resolved/source read, preview without mutation, existing browser confirmation requirement, stale revision rejection, invalid target/unit/selector rejection, and set/reset result parity with UI projection:

```php
$preview = $client->call('local_padding_preview', [
    'pairing_id' => $pairingId,
    'context' => ['scope' => 'component', 'target_id' => 'tables.cell.text'],
    'operation' => 'set',
    'edges' => ['top' => '16px'],
]);
$this->assertSame('preview', $preview['status']);
$this->assertSame($revision, $preview['revision']);
```
- [ ] Run focused PHP/unit/browser relay tests; expect failures because only generic import/export operations exist.
- [ ] Implement the five exact tool schemas with `additionalProperties: false`. MCP must never accept CSS selectors or CSS rules. The server relays typed intent; the paired browser invokes the canonical store service and returns the same resolved/projection result.
- [ ] Extend, do not duplicate, existing grant checks: revalidate pairing, process/session ownership, operation digest, current revision, registry mapping, values, confirmation expiry, and operation status immediately before mutation. Do not introduce padlock handling.
- [ ] Run the real stdio MCP client journey: discover → read → preview → browser confirmation → set/reset → read/export parity. Assert no mutation before browser confirmation and no mutation after stale revision.
- [ ] Run focused and full applicable PHP/builder tests; expect PASS.
- [ ] Review the intended MCP tools, relay, controller, browser, and test files and commit them: `git add demo/app/Mcp/Servers/LocalThemeServer.php demo/app/Mcp/Tools/LocalPaddingDiscover.php demo/app/Mcp/Tools/LocalPaddingRead.php demo/app/Mcp/Tools/LocalPaddingPreview.php demo/app/Mcp/Tools/LocalPaddingSet.php demo/app/Mcp/Tools/LocalPaddingReset.php demo/app/Mcp/ThemeRelay/OperationStore.php demo/app/Mcp/ThemeRelay/OperationPreviewLifecycle.php demo/app/Mcp/ThemeRelay/ImportGrantStore.php demo/app/Mcp/ThemeRelay/OperationResultLifecycle.php demo/app/Mcp/ThemeRelay/RelayImportPreviewValidator.php demo/app/Http/Controllers/LocalThemeRelay/OperationPreviewController.php demo/app/Http/Controllers/LocalThemeRelay/OperationResultController.php builder/src/composables/use-theme-relay.ts builder/src/composables/use-theme-relay-operations.ts builder/src/utils/theme-relay-apply.ts builder/src/composables/use-theme-import.ts demo/tests/Feature/Mcp/LocalPaddingToolsTest.php demo/tests/Feature/Mcp/LocalPaddingAuthorizationTest.php demo/tests/Unit/Mcp/LocalPaddingOperationTest.php builder/src/__tests__/theme-relay-operations.spec.ts builder/src/__tests__/theme-relay-apply.spec.ts builder/src/__tests__/theme-relay-confirm.spec.ts e2e/ftb-054-mcp.spec.ts e2e/support/stdio-mcp-client.model.ts e2e/support/stdio-mcp-client.ts && git commit -m "Feature: add confirmed padding MCP capabilities"`.

## Task 6: Final acceptance and tracking

**Deliverable:** Evidence-backed feature completion with capability inventory and no unverified claims.

**Files:**
- Modify: `docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md` by incorporating the approved FTB-054 addendum.
- Create: `docs/superpowers/verification/2026-10-22-hierarchical-padding-controls.md` with dated implementation evidence only after all checks pass.
- Modify: `docs/ai-operability/demo-showcase-capability-inventory.md`; include discovery/read/preview/set/reset authorization, confirmation, target scope, revision, and AI-client evidence.
- Modify: `TICKETS.md` and GitHub issue `#54` only after verification, keeping local and GitHub status/acceptance text synchronized.
- Test: full relevant builder, PHP, and Playwright commands from repository guidance and existing Compose workflow.

- [ ] Write a final acceptance checklist covering registry matrix, V5 migration, sparse zero semantics, all precedence levels, container rules, UI/iframe/export parity, linked history, reset/native behavior, MCP confirmation/stale revision/security, and absence of arbitrary selectors.
- [ ] Run `cd builder && npm run type-check && npm run test:unit && npm run build`; run the repository’s Compose PHP and Playwright suites using the canonical compose configuration. Expected result: all relevant checks pass; report any pre-existing unrelated failure separately.
- [ ] Run a final repository diff/status review and confirm only intended implementation, tests, evidence, and approved documentation changed; unrelated dirty files remain unchanged.
- [ ] Run the final standards/spec review from fixed point `94e1bd7bbb2796458ad267525bc45dd4de698bcf` with an explicit recorded review base; check the implementation against the approved addendum, registry evidence, security contract, and all six deliverables.
- [ ] Update `TICKETS.md`, `docs/ai-operability/demo-showcase-capability-inventory.md`, and GitHub issue `#54` together after verification; use `gh issue view 54`, `gh issue edit 54`, and a final local/GitHub status comparison so no tracker/document status diverges.
- [ ] Review the intended specification, verification, inventory, and ticket files and commit them: `git add docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md docs/superpowers/verification/2026-10-22-hierarchical-padding-controls.md TICKETS.md docs/ai-operability/demo-showcase-capability-inventory.md && git commit -m "Docs: record hierarchical padding acceptance"`.

## Self-review checklist

- Registry evidence is a first-class extension of the existing registry, not a competing registry.
- Edge validation, resolution, and projection are pure shared modules; UI, bridge, CSS, JSON, and MCP do not reimplement them.
- The edge editor is reused for linked and separate presentation rather than copying four controls.
- V5 migration preserves V1–V4 and does not persist resolved copies.
- `.fi-ta-cell` is never emitted as a padding selector; selection/icon/action internals remain excluded.
- No fake global selector, blanket DOM selector, arbitrary MCP selector, padlock framework, server theme store, or new dependency is introduced.
- Every implementation task has a failing test, expected failure, minimal implementation, verification command, review checkpoint, and correctly formatted commit.
- Real iframe and actual stdio MCP journeys are required; fake DOM/double-only tests are insufficient for final acceptance.
