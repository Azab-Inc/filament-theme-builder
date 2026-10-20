# FTB-051 Custom and Tailwind Color Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans task-by-task. Every implementation task follows red-green TDD and scoped review.

**Goal:** Promote approved popover A to all existing editable color fields without changing their domain behavior.
**Architecture:** A local immutable Tailwind snapshot feeds one shared field/popover. Existing component adapters still call their current mutation/reset functions. Drafts, search, positioning and open state are UI-only.
**Tech Stack:** Vue 3, TypeScript, existing Tailwind 4.3.3, Vitest, Playwright, Compose; no added package.
**Spec:** `docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md`
**Review fixed point:** `0cce04d0e8f7c2cfb0fd5afed88c2ca32b846b46`.

## Global constraints

- Preserve all existing field labels/IDs, canonical schema, field-specific validators, reset/history/persistence and live iframe protocol.
- Six semantic palettes × bases/11 editable shades; all 11 mode-specific surface/border/text fields in each light/dark mode; toolbar primary; four Product name scope fields; three raw color properties.
- Prototype A governs the chooser only, not a shell rewrite. No production import from any prototype module.
- No package/service/network palette fetch, new MCP operation, arbitrary generated Tailwind class, selector or direct iframe style mutation.
- Source/tests each ≤100 lines; named types in models/DTOs, Vue script-before-template and no Vue style blocks.
- Retain unrelated worktree changes, current dev branch, existing visual prototype. The pre-existing App.vue source-text type-boundary failure is separately recorded, not silently fixed by adding an unused import.

## File map and contracts

- `registry/tailwind-palette*.ts`: immutable hex snapshot, metadata and grouping; family modules split for readability. Source/license recorded under `builder/src/registry/`.
- `models/tailwind-palette.model.ts`: `TailwindColor = { family:string; shade:number; name:string; value:string; sourceValue:string }`.
- `utils/tailwind-palette.ts`: `getTailwindColors(): readonly TailwindColor[]`, `searchTailwindColors(query:string): readonly TailwindColor[]`, `findTailwindColor(value:string): TailwindColor | undefined`.
- `models/color-field.model.ts`: profiles `hex6 | hex68 | foundation | raw`, public field/popover props and events.
- `utils/color-field-validation.ts`: `isColorFieldValueValid(value:string, profile:ColorFieldProfile):boolean`, reusing existing validators; no expansion of supported forms.
- `ColorField.vue`: controlled textual draft (or native primary presentation), field-specific native picker and `Choose … from Tailwind palette` trigger. Emits actual input events through its owned input for current adapters. Supports field context key, optional status/error IDs, empty inherited override values, and display/effective value distinct from empty explicit value.
- `ColorPopover.vue`, `ColorPopoverCustom.vue`, `TailwindPaletteChoices.vue`: Custom/Tailwind tabs, bounded searchable grouped ramps and explicit selection, no domain writes. Props include target ID/label/current value/profile; emits a selected literal or close.
- `use-color-popover.ts` and focused positioning/draft helpers: open/close, viewport clamp, Escape/outside click/focus restoration, listener cleanup and invalid-draft isolation. Split by responsibility under 100 lines.
- Existing controls consume ColorField; adapters preserve their existing exact event payloads, aria labels/status/IDs.
- Tests: `tailwind-palette*.spec.ts`, `ColorField*.spec.ts`, `ColorPopover*.spec.ts`, `color-field-coverage.spec.ts`, focused `e2e/color-picker-tailwind*.spec.ts`.

## Task 1: Deterministic licensed palette data

- [ ] Write failing snapshot/search tests (26×11 unique names, all stops, source 4.3.3/MIT metadata, case/space-insensitive family/shade/token search, empty query/no-results, deterministic ordering, representative gray-900/red-500/neutral-50 literals).
```ts
expect(searchTailwindColors('GRAY-900').map(color => color.name)).toEqual(['gray-900'])
expect(getTailwindColors()).toHaveLength(286)
```
- [ ] Run `npm --prefix builder run test:unit -- --run src/__tests__/tailwind-palette.spec.ts`; observe missing data/API red.
- [ ] Implement checked-in snapshot from installed v4.3.3 `theme.css`, original source OKLCH and deterministic conversion in spec; record upstream URL/package/version/date/MIT notice and transformation. Runtime consumes committed data only. Invalid bundled shape fails closed for choices without disabling text entry.
- [ ] Run focused tests/type-check and commit intended files `Feature: add pinned Tailwind color palette snapshot`.

## Task 2: Accessible shared field and popover

- [ ] Add failing component/unit tests for field profiles, original IDs/labels and draft recovery, one emitted input per explicit selection, empty shade override plus effective swatch, unsupported native values unchanged, token preserved on open/close, tabs/search/empty recovery/selection, focus restoration/Escape/outside click, context change/unmount cleanup.
```ts
expect(isColorFieldValueValid('#abc', 'foundation')).toBe(false)
expect(isColorFieldValueValid('var(--gray-900)', 'foundation')).toBe(true)
// Opening/dismissing must emit zero mutations; choosing gray-900 emits its hex once.
```
- [ ] Run focused tests red. Implement fresh production components/composables, not prototype code imports. Custom input Apply and native change/Tailwind choice each apply once; native draft input alone does not apply a fallback. Inline invalid draft remains visible, current validators stay authoritative.
- [ ] Render one bounded popover outside scroll clipping; clamp/reflow on viewport/scroll changes. Use explicit button labels, dialog/trigger relationship, labelled search, keyboard-operable swatches with family/shade/value names, result count and selected indication. No focus trap; Escape/outside close without writes. Close on context change.
- [ ] Run focused tests, type-check/build and commit `Feature: add shared Custom and Tailwind color popover`.

## Task 3: Integrate complete existing field inventory

- [ ] Before production integration, add/run a failing Compose journey selecting `gray-900` on Page dark and component tests asserting both affordances on every currently rendered color field.
```ts
await page.getByRole('button', {name:'Choose page surface dark from Tailwind palette'}).click()
await page.getByRole('searchbox', {name:/search.*color/i}).fill('gray-900')
// Select the labelled gray-900 option; assert exact target state and live preview.
```
- [ ] Integrate toolbar primary (`hex6`, retain native label), palette base/shades (`hex68`, empty explicit shade + effective value), surfaces/borders/text (`foundation`, per-mode context), Product name backgrounds (`hex6`), raw Inspector color/background-color/border-color (`raw`). Non-color raw inputs unchanged.
- [ ] Preserve label IDs, status/error associations and exact event shapes by relaying input events to existing handlers; do not bypass validators. Draft edits invalid for that profile cannot modify canonical state. A valid selection clears stale draft/error and updates only its target. Preserve eight-digit hex/alpha and unsupported native reference/function values.
- [ ] Update existing tests/selectors only for honest extra affordances, keeping all previous checks. Test reset clears draft even when the canonical value was already default. Ensure changing mode/target/theme cannot apply a stale open popover to a different field.
- [ ] Run inventory/component tests, builder type-check/full unit/build and focused real Compose journey. Commit `Feature: integrate Tailwind choices across builder color fields`.

## Task 4: Real browser acceptance and evidence

- [ ] Add/run Compose Playwright journeys through real builder/iframe for palette base+shade, mode surface+border+text, semantic component and raw color; assert selected value, one-step undo/redo, resets and reload persistence, target/mode isolation and existing mapped projection.
- [ ] Cover manual/native editing, allowed alpha, invalid-draft recovery, empty searches, token open/dismiss preservation, Escape/focus/outside click, field-switch closure, 390px bounds/no overflow, data available offline and zero palette-data requests/generated arbitrary classes.
- [ ] Run full builder unit/type/build, affected existing foundations/manager/native-default regression journeys and Playwright MCP manual smoke. Report real baseline failures separately without claiming all green; inspect any newly introduced failure.
- [ ] Review the entire diff from the fixed point. Update capability inventory (UI enhancement/no new operation), local FTB-051 and GitHub #51/project status/evidence together. Record approved A, source attribution, cleanup and verification; remove only the color-prototype App gate when promoted, preserve unrelated Studio prototype.
- [ ] Commit evidence with `Tests: verify Custom and Tailwind color selection` and return exact results/limits to user.

## Self-review

The four tasks cover data/provenance, interaction/accessibility, complete field adapters, and real preview/history/recovery acceptance. Existing validators and event boundaries are authoritative. All new interfaces above are produced before their consumers; no prototype module is a runtime dependency.
