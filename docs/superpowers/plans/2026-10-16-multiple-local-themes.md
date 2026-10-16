# Multiple Local Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single local draft with multiple named browser-local themes, each with independently persisted canonical state and undo/redo history, and provide accessible management UI.

**Architecture:** Retain `ThemeStateV4` as the sole canonical editable value and keep collection metadata, migration, serialization, validation, autosave/history, active selection, and storage errors inside the existing theme store boundary or a focused storage utility it owns. The UI stays a thin toolbar plus focused dialog component, invoking typed store operations; all persistence remains outside components.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, TypeScript, Pinia, native `localStorage`/`<dialog>`, Vitest/Vue Test Utils, existing Playwright CLI/Compose setup.

**Spec:** `docs/superpowers/specs/2026-10-16-multiple-local-themes-design.md`

## Global Constraints

- `ThemeStateV4` remains unchanged and is the complete canonical state for each theme; persisted history snapshots are also `ThemeStateV4`.
- Use keys `ftb-themes`, `ftb-theme-active`, `ftb-theme:<id>`, and `ftb-theme-history:<id>` with the payload contracts in the spec; legacy `ftb-theme` is read only for one-time migration.
- Validate parsed records, IDs, states, and history bounds before use; never activate malformed state or replace a valid collection with an empty collection because a key is unreadable.
- Migration is idempotent; write and verify new records before deleting valid legacy bytes; preserve invalid legacy bytes and existing valid new-format data.
- Debounce canonical autosave by exactly 300 ms; each theme owns independent persisted undo/redo snapshots and cursor, including redo truncation after a new edit.
- Flush safely before switching/deleting; stale debounce callbacks must never persist under a different active ID. Persistence failures remain non-blocking, visible, and truthful; editing and history remain available.
- Collection semantics: create default `Untitled`; open only validated theme; rename trims and rejects blank values; duplicate copies canonical state but starts fresh history and becomes active; delete confirms, preserves a non-active selection, selects the most recently updated remaining theme when deleting active, or recreates default `Untitled` if last.
- Preset application changes only active theme and participates in its own history/autosave; do not alter FTB-020 behavior beyond proving this isolation.
- Management dialog must be named, focus on open, contain keyboard focus, close on Escape, restore focus to trigger, identify active theme, and confirm destructive deletion. Storage/migration/save/history errors use perceivable non-blocking status.
- Capability inventory records theme management as UI-only and MCP deferred to FTB-048; do not add MCP tools or imply MCP support.
- No new package or generalized persistence framework. Respect builder type/model boundaries and keep every maintainable builder source file at or below 100 lines by splitting focused responsibilities.
- Do not change canonical serialization/schema, preset semantics, unrelated editor consumers, demo, or unrelated worktree changes.
- Implementation is gated by repository demo-first requirements; do not use this plan to relax or bypass that gate. Before feature execution, confirm required demo-complete evidence remains satisfied.

---

## File map and interfaces

The concrete existing integration points are `builder/src/stores/theme.ts`, `builder/src/components/EditorToolbar.vue`, and `builder/src/App.vue`. Keep `App.vue` a composition shell and extract a focused component if integration markup would exceed the 100-line rule. Planned new modules are:

- `builder/src/models/local-theme.model.ts`: `LocalThemeRecord = { id: string; name: string; updatedAt: number }`, `LocalThemeHistory = { snapshots: ThemeStateV4[]; cursor: number }`, `LocalThemeCollection = { themes: LocalThemeRecord[]; activeId: string }`, `StorageOperationResult = { ok: true } | { ok: false; error: string }`, and `LocalThemeLoadResult` containing the validated collection, active state/history, and any recoverable storage error. Metadata contains no canonical state/history.
- `builder/src/utils/local-theme-validation.ts`: pure validation for IDs, collection entries/index, `ThemeStateV4` via existing theme validation/migration, and history bounds; reject unsafe IDs before key construction.
- `builder/src/utils/local-theme-storage.ts`: focused browser storage boundary with key builders and typed load/write/verify/migration primitives; accepts a `Storage` instance for tests and never owns Vue state.
- `builder/src/composables/use-local-theme-persistence.ts`: store-owned orchestration for initialization/migration, per-ID debounced save, history persistence, safe flush/cancel, ordered collection commits, and an observable non-blocking storage error. It exposes explicit collection operations rather than a generic mutation escape hatch.
- `builder/src/stores/theme.ts`: existing active canonical `theme` and editor actions remain the consumer contract; expose `themes`, `activeThemeId`, `storageError`, and explicit `createTheme()`, `openTheme(id)`, `renameTheme(id,name)`, `duplicateTheme(id)`, `deleteTheme(id)` operations plus current undo/redo capability.
- `builder/src/components/LocalThemeManager.vue`: accessible presentation only; typed props provide records, active ID, error, and operation busy/confirmation state; typed emits request create/open/rename/duplicate/delete/close. It does not read/write localStorage.
- `builder/src/components/LocalThemeDialog.vue`: focused native-dialog/list/action presentation, likewise storage-agnostic; `LocalThemeManager.vue` owns only the manager boundary and event wiring.
- `builder/src/components/EditorToolbar.vue`: receive active name and storage error and provide a manager trigger/slot boundary; no persistence behavior.
- `builder/src/App.vue`: connect toolbar/dialog events to store methods while preserving existing editor/preview behavior.
- `builder/src/__tests__/local-theme-validation.spec.ts`, `local-theme-storage.spec.ts`, `local-theme-persistence.spec.ts`, `local-theme-store.spec.ts`, `LocalThemeManager.spec.ts`: pure boundary, migration, lifecycle, operations, and accessibility behavior tests.
- `e2e/ftb-021-local-themes.spec.ts`: real builder journey through collection operations, reload, keyboard dialog behavior, preset isolation, and injected storage errors.
- `docs/ai-operability/demo-showcase-capability-inventory.md`: UI-only inventory row for local theme management, with MCP deferred explicitly to FTB-048.
- `TICKETS.md`: update FTB-021 checklist/evidence only after acceptance verification; do not change ticket status without evidence.

Interfaces shared across tasks: storage key helpers `themeStateKey(id): string` and `themeHistoryKey(id): string`; storage writes return `StorageOperationResult = { ok: true } | { ok: false; error: string }`; persistence exposes `initialize()`, `createTheme()`, `openTheme(id)`, `renameTheme(id,name)`, `duplicateTheme(id)`, `deleteTheme(id)`, `scheduleSave(id,state,history)`, and `flush(id)`; store actions/signatures are the public façade described above. Rename returns `boolean`; successful create/duplicate return `LocalThemeRecord`; open/delete return `void` and report failures through `storageError`. Manager emits use IDs, not names, as identity. `ThemeStateV4` is imported from `@/models/theme.model`; history semantics must match existing `useThemeHistory` rather than creating a second canonical model.

## Task 1: Establish failing persistence contract tests and safe pure validation

**Files:**
- Create: `builder/src/models/local-theme.model.ts`
- Create: `builder/src/utils/local-theme-validation.ts`
- Create: `builder/src/__tests__/local-theme-validation.spec.ts`
- Modify: `builder/src/__tests__/theme-state-test-helpers.ts` only if the existing helper needs an exported valid fixture; do not alter fixture semantics.

**Interfaces:**
- `LocalThemeRecord`, `LocalThemeHistory`, and `LocalThemeCollection` as defined in File map.
- Export pure `isSafeLocalThemeId(value: unknown): value is string`, `parseLocalThemeCollection(value: unknown): LocalThemeRecord[] | null`, and `parseLocalThemeHistory(value: unknown, validateState: (value: unknown) => ThemeStateV4 | null): LocalThemeHistory | null`.
- Collection validation rejects duplicate IDs, unsafe IDs, non-string names, blank names, invalid timestamps, and malformed entries; history rejects empty/invalid snapshots and cursor outside `0..snapshots.length-1`.

- [ ] **Step 1: Write failing validation tests** for stable-safe IDs (including separators/control chars rejection), valid records, duplicate/unsafe IDs, blank names, malformed fields, valid history, invalid snapshots, and negative/out-of-range cursors.
- [ ] **Step 2: Run the focused tests and verify expected failure** because the model/validator exports do not yet exist.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-validation.spec.ts`

Expected: FAIL with unresolved module/export errors for the new local theme types/validators.
- [ ] **Step 3: Add the model and pure validators** using existing theme-state validation/migration functions; do not place storage or Vue dependencies in these modules.
- [ ] **Step 4: Re-run focused tests and type-check**; expect all new validator cases PASS and type-check PASS.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-validation.spec.ts && npm run type-check`

Expected: PASS; malformed inputs return null/false and valid inputs preserve values without modifying `ThemeStateV4`.

## Task 2: Implement storage contracts, migration, and ordered recovery

**Files:**
- Create: `builder/src/utils/local-theme-storage.ts`
- Create: `builder/src/__tests__/local-theme-storage.spec.ts`
- Modify: `builder/src/utils/local-theme-validation.ts` only for validator issues exposed by storage contract tests.

**Interfaces:**
- `themeStateKey(id: string): string` and `themeHistoryKey(id: string): string` reject unsafe IDs rather than producing keys.
- `loadLocalThemeCollection(storage: Storage): LocalThemeLoadResult` returns validated collection/state/history records and recoverable error status; it distinguishes empty storage, valid new format, valid/invalid legacy key, partial/corrupt new data, and storage exceptions.
- `writeAndVerifyLocalTheme(storage: Storage, id: string, state: ThemeStateV4, history: LocalThemeHistory): StorageOperationResult`; `initializeLocalThemeStorage(storage, defaultState, migrateState): LocalThemeLoadResult` performs idempotent initialization/migration and removes `ftb-theme` only after read-back validation.
- Writes prepare/validate before mutation; state/history precede publishing index/active pointer; deletion-facing primitives publish safe fallback/index before removing old keys. Roll back prior key values where feasible and propagate partial-write failure.

- [ ] **Step 1: Add failing storage tests** covering exact key names/payload shape, serialization round-trip, key-ID validation, no-data default, valid legacy migration preserving state, older supported state migration, retry idempotence, existing new-format no-overwrite, invalid legacy byte preservation, malformed index/state/history rejection, storage get/set/remove exceptions, read-back verification, and partial-write rollback.
- [ ] **Step 2: Run focused tests before implementation** and confirm failures are missing storage exports/expected contract behavior.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-storage.spec.ts`

Expected: FAIL for missing storage boundary functions; do not mark tests skipped for jsdom/browser environment.
- [ ] **Step 3: Implement minimal key/serialization/validation functions** with injected `Storage`; use existing canonical validation and sequential migration functions; do not alter canonical schema.
- [ ] **Step 4: Implement idempotent migration and recoverable ordered writes**; ensure invalid legacy data is retained and valid new collection is never overwritten.
- [ ] **Step 5: Run storage and validation specs** and inspect read-back assertions for exact `ThemeStateV4` equality.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-storage.spec.ts src/__tests__/local-theme-validation.spec.ts`

Expected: PASS, including preservation of last known valid data and visible error result on failed commit.

## Task 3: Persist per-theme history and autosave safely

**Files:**
- Create: `builder/src/composables/use-local-theme-persistence.ts`
- Create: `builder/src/__tests__/local-theme-persistence.spec.ts`
- Modify: `builder/src/stores/theme.ts` only to replace single-key initialization after tested persistence API exists.
- Read, do not rewrite without necessity: `builder/src/composables/use-theme-history.ts` and `builder/src/composables/use-theme-persistence.ts`.

**Interfaces:**
- `useLocalThemePersistence(options: { storage: Storage; initialState: ThemeStateV4; now: () => number; schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>; cancel: (handle: ReturnType<typeof setTimeout>) => void })` returns `{ themes: Ref<LocalThemeRecord[]>; activeThemeId: Ref<string>; activeState: Ref<ThemeStateV4>; activeHistory: Ref<LocalThemeHistory>; storageError: Readonly<Ref<string | null>>; initialize(): LocalThemeLoadResult; scheduleSave(id,state,history): void; flush(id): StorageOperationResult; switchTo(id): StorageOperationResult; createTheme(): LocalThemeRecord; renameTheme(id,name): boolean; duplicateTheme(id): LocalThemeRecord; deleteTheme(id): StorageOperationResult }`.
- Save delay is exactly 300 ms; the scheduled closure captures the theme ID and cloned canonical state/history. A flush cancels timer only after safe write; errors preserve usable in-memory values and are exposed rather than swallowed.
- `ThemeStateV4` remains the store's active-state ref and existing editor-facing shape.

- [ ] **Step 1: Write fake-timer tests first** for one 300 ms save (not at 299 ms), independent IDs/history, undo/redo persisted after switch/reopen, redo branch truncation, flush on switching, delete-time flush/cancel, stale callbacks not crossing IDs, autosave/history exceptions, and edits remaining usable after failure.
- [ ] **Step 2: Run the focused persistence spec and verify expected failures** for missing composable/incorrect current one-key persistence behavior.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-persistence.spec.ts`

Expected: FAIL in tests for absent independent state/history keys and stale-safe lifecycle behavior.
- [ ] **Step 3: Implement per-ID state/history scheduling** by composing the tested storage boundary and existing history semantics; do not keep one global mutable history across IDs.
- [ ] **Step 4: Replace only the theme store's initialization/history persistence wiring** after new format is verified; retain current theme ref, projection, editor action signatures, and recovery semantics not superseded by this spec.
- [ ] **Step 5: Run persistence plus existing history/recovery tests**.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-persistence.spec.ts src/__tests__/theme-state-icons-and-history.spec.ts src/__tests__/theme-state-persistence-recovery.spec.ts`

Expected: PASS with no regression in existing history behavior; verify timer cleanup when store scope is disposed.

## Task 4: Add theme collection store operations

**Files:**
- Create: `builder/src/__tests__/local-theme-store.spec.ts`
- Modify: `builder/src/stores/theme.ts`
- Modify: `builder/src/composables/use-local-theme-persistence.ts` only for store-required persistence orchestration (keep it under 100 lines by moving pure helpers to storage/validation utilities).

**Interfaces:**
- Store exposes `themes: readonly LocalThemeRecord[]`, `activeThemeId: string`, `activeThemeName: string`, and `storageError: string | null`.
- `createTheme(): LocalThemeRecord`; `openTheme(id: string): void`; `renameTheme(id: string, name: string): boolean`; `duplicateTheme(id: string): LocalThemeRecord`; `deleteTheme(id: string): void`.
- Create uses default canonical state and fresh history; duplicate uses a fresh ID, `<source name> copy`, cloned source current state, empty initial history, and selects it. Rename changes trimmed display name only and rejects blank. Open flushes prior state before loading its own. Deletion preserves pointer if nonactive; active deletion selects greatest `updatedAt` remaining, with deterministic list-order tie-break, or creates default Untitled.

- [ ] **Step 1: Write failing store tests** for initialization, create/open/rename/duplicate/delete, ID uniqueness, metadata timestamps, state preservation, active selection, fresh duplicate history, active-delete fallback, last-theme recreation, invalid IDs/names, partial storage failure, and no dangling active pointer.
- [ ] **Step 2: Run store tests before changes** and verify missing collection methods are the failure.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-store.spec.ts`

Expected: FAIL because the store does not yet expose collection state/actions.
- [ ] **Step 3: Implement the store collection actions** as thin typed calls into persistence orchestration; on storage failure preserve the last usable memory state and publish `storageError`.
- [ ] **Step 4: Add preset-isolation unit test** applying an existing preset to one active theme, verifying its own history/state changes and every other theme remains unchanged.
- [ ] **Step 5: Run store, preset, history, recovery, type-check, and build checks**.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-store.spec.ts src/__tests__/theme-state-icons-and-history.spec.ts src/__tests__/App.structure.spec.ts && npm run type-check && npm run build`

Expected: PASS; all maintainer-facing builder source files touched remain at most 100 lines.

## Task 5: Add accessible theme manager toolbar and dialog

**Files:**
- Create: `builder/src/components/LocalThemeManager.vue`
- Create: `builder/src/components/LocalThemeDialog.vue`
- Create: `builder/src/__tests__/LocalThemeManager.spec.ts`
- Modify: `builder/src/components/EditorToolbar.vue`
- Modify: `builder/src/App.vue`

**Interfaces:**
- Manager takes typed `themes`, `activeThemeId`, `storageError`, and emits `create`, `open(id)`, `rename(id,name)`, `duplicate(id)`, `delete(id)`, `close`.
- Toolbar exposes a `Manage themes` trigger with current active name and status slot/props, and only relays manager/store events; persistence is never in Vue markup.
- Native `<dialog>` uses accessible name, calls `showModal()`, starts focus at a meaningful list/action control, traps focus natively, supports Escape/close, and restores focus to the opener. Delete action transitions to explicitly named confirmation before emitting delete.
- Rename uses editable form with trimmed non-empty validation and accessible error; active row is visibly marked and conveyed semantically. Storage error is a polite/alert live status and does not disable editor controls.

- [ ] **Step 1: Write failing component tests** for trigger/name, dialog accessible name, active identification, create/open/rename/duplicate/delete-confirm emission, blank rename rejection, Escape/close, focus start/restoration, and live error presence without disabling editing controls.
- [ ] **Step 2: Run component tests before implementation** and verify expected failure due to missing manager component and toolbar connection.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/LocalThemeManager.spec.ts`

Expected: FAIL because manager component and accessible controls are absent.
- [ ] **Step 3: Implement focused native dialog component** with typed props/emits only; do not access store, localStorage, or theme serialization inside it.
- [ ] **Step 4: Connect toolbar and App to store actions** without changing active theme consumer shape or preview/editor layout; split presentation into a focused subcomponent before any builder source file exceeds 100 lines.
- [ ] **Step 5: Run manager, toolbar, app structure/accessibility unit tests and type-check**.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/LocalThemeManager.spec.ts src/__tests__/App.toolbar.spec.ts src/__tests__/App.inspector-accessibility.spec.ts && npm run type-check`

Expected: PASS; keyboard and status assertions succeed without coupling component to storage internals.

## Task 6: Record the capability inventory boundary

**Files:**
- Modify: `docs/ai-operability/demo-showcase-capability-inventory.md`

**Interfaces:**
- Inventory row identifies capability `builder.local-themes`, surface `LocalThemeManager` and local theme store, mutation in browser-local state, authorization as local browser owner/no server identity, explicit delete confirmation, and “No MCP tool; deferred to FTB-048.”
- No MCP tool/code, AI-client claim, authorization bypass, or server capability is added.

- [ ] **Step 1: Add the single inventory row** without rewriting unrelated demo entries; record the operation as UI-only browser-local mutation, local browser owner/no server identity, explicit delete confirmation, and no MCP tool deferred to FTB-048.
- [ ] **Step 2: Verify the exact inventory row** with `grep -n 'builder.local-themes' docs/ai-operability/demo-showcase-capability-inventory.md` and require one matching row that makes no MCP-support claim.

Expected: exactly one row identifies the local theme surface and says no MCP tool is available in this ticket; Playwright reasserts the UI/inventory boundary in Task 8.

## Task 7: Complete unit acceptance and regression tests

**Files:**
- Modify: `builder/src/__tests__/local-theme-storage.spec.ts`
- Modify: `builder/src/__tests__/local-theme-persistence.spec.ts`
- Modify: `builder/src/__tests__/local-theme-store.spec.ts`
- Modify: `builder/src/__tests__/LocalThemeManager.spec.ts`
- Modify: existing focused theme/preset tests only where needed to assert active-theme isolation.

**Interfaces:**
- Tests cover every unit/store item in spec acceptance section: four key contracts, safe unique IDs, malformed data, legacy migration/idempotence/no overwrite, all collection semantics, independent undo/redo and redo truncation across switch/reopen, 300 ms debounce, flush/cancel/stale timer, FTB-020 active-only preset application, storage exception/quota/partial write behavior, accessible dialog status.
- Keep test seams external and deterministic; inject storage, clock/timer and storage failures rather than adding production-only test controls.

- [ ] **Step 1: Audit tests against each unit/store acceptance bullet** and add missing explicit assertions before changing implementation further.
- [ ] **Step 2: Run all local-theme unit specs** and confirm current failures are actual implementation defects, not timing/test setup artifacts.

Run from `builder/`: `npm run test:unit -- --run src/__tests__/local-theme-validation.spec.ts src/__tests__/local-theme-storage.spec.ts src/__tests__/local-theme-persistence.spec.ts src/__tests__/local-theme-store.spec.ts src/__tests__/LocalThemeManager.spec.ts`

Expected: FAIL only for uncovered behavior; if a failure occurs, follow test evidence and fix the owning boundary.
- [ ] **Step 3: Complete minimal fixes and rerun focused suite** until all focused theme tests pass; retain assertions for failed save truthfulness and no cross-theme writes.
- [ ] **Step 4: Run complete builder unit suite and type-check**.

Run from `builder/`: `npm run test:unit -- --run && npm run type-check`

Expected: PASS for all existing and newly added unit tests.

## Task 8: Add and execute Playwright acceptance journey

**Files:**
- Create: `e2e/ftb-021-local-themes.spec.ts`
- Modify: `playwright.config.ts` only if the existing base URL/project setup cannot run the focused spec as configured; preserve existing runtime topology.

**Interfaces:**
- Use existing Playwright CLI/config and Compose-served builder/demo; tests locate controls by accessible role/name, not implementation-only selectors except stable storage-error injection seam.
- Cover create/open/rename/duplicate/delete-confirm and active fallback; save edit after 300 ms and reload; theme-specific undo/redo after reopening; active-only preset; dialog focus containment/Escape/focus restoration; visible active label; injected localStorage failure presents accessible non-blocking status while editor remains operable.
- The repository inventory row is verified separately; the browser journey verifies the UI behavior and does not attempt to inspect repository documentation.

- [ ] **Step 1: Write the failing Playwright journeys first** against production UI and real browser localStorage; isolate scenarios with fresh browser contexts to avoid persisted fixtures leaking between tests.
- [ ] **Step 2: Run the focused Playwright CLI test before implementation completion** and verify it fails on missing management UI/required persistence behavior, not because the browser/app is unavailable.

Run from repository root: `npx playwright test e2e/ftb-021-local-themes.spec.ts`

Expected: FAIL with missing management controls/dialog behavior or missing per-theme persistence; preserve logs as diagnosis, do not weaken assertions.
- [ ] **Step 3: Run focused Playwright after component/store implementation** and fix only failures in FTB-021 scope.
- [ ] **Step 4: Verify real keyboard sequence**: open manager, navigate controls, Escape, confirm opener focus; open delete confirmation and cancel/confirm; verify active marker and no dangling selection.
- [ ] **Step 5: Verify reload/history and failure journey**: edit theme A, create/edit theme B, reload/open A, undo/redo A, confirm B unchanged; simulate storage failure and confirm status is announced and editor still accepts a color edit.

Expected: focused Playwright spec PASS in the configured complete Compose runtime; test proves browser persistence and behavior, not mocked component-only rendering.

## Task 9: Final integration, evidence, and intended implementation commits

**Files:**
- Intended files only from Tasks 1–8; update `TICKETS.md` FTB-021 acceptance evidence only when each item is verified.
- Do not commit this plan-writing task; implementation execution may commit intended code only as allowed by the executor's task instructions.

**Interfaces:**
- Active editor reads canonical `ThemeStateV4` from existing store `theme`; local collection does not leak into preview, serialization, or editor consumers.
- No new MCP capabilities/packages; build output and e2e journey use existing project dependencies/runtime.

- [ ] **Step 1: Run required builder verification** from `builder/`.

Run: `npm run type-check && npm run test:unit -- --run && npm run build`

Expected: all commands PASS.
- [ ] **Step 2: Run focused and full relevant Playwright verification** using configured CLI and Compose runtime.

Run: `npx playwright test e2e/ftb-021-local-themes.spec.ts` followed by `npx playwright test`

Expected: FTB-021 focused and full configured e2e pass; preserve only existing explicit opt-in skips.
- [ ] **Step 3: Audit file sizes and source boundaries**: no maintainable builder source file exceeds 100 lines; all types are in `models/`, components contain no storage access, persistence is outside UI, and `ThemeStateV4`/serialization contracts remain unchanged.
- [ ] **Step 4: Inspect `git diff --check`, `git diff`, and `git status`**; ensure no unrelated worktree files were overwritten, no dependency manifests/lockfiles changed, and the only inventory change is the FTB-021 UI-only row.
- [ ] **Step 5: Verify acceptance traceability** by mapping each spec section 29–96 and each unit/Playwright criterion 102–118 to implemented test/evidence; update FTB-021 checklist/evidence in `TICKETS.md` only for verified criteria, and leave MCP deferred to FTB-048.
- [ ] **Step 6: Commit only intended implementation/test/docs files** after reviewing the exact staged diff; use repository commit prefix `Feature: ` for behavior and preserve the approved ticket status unless acceptance evidence supports a change.
- [ ] **Step 7: Report exact verification commands/results, inventory/MCP boundary, remaining gaps, and commit hash.**

## Plan self-review

- Storage format, legacy migration, no-overwrite/idempotence, malformed-data recovery, ordered writes, rollback, and error visibility are assigned to Tasks 1–3.
- Per-theme state/history, debounce, switching/deletion flush safety, stale timers, undo/redo and preset isolation are assigned to Tasks 3, 4, 7, and 8.
- Create/open/rename/duplicate/delete/fallback and UI accessibility are assigned to Tasks 4, 5, 7, and 8.
- Inventory explicitly scopes UI-only and FTB-048 deferral in Task 6; no MCP implementation or claim is planned.
- Unit coverage and Playwright acceptance map to the spec's complete acceptance lists; final integration checks full builder and configured browser suite.
- Type/model/component/store boundaries and 100-line maximum are explicit; no canonical model duplication, new dependency, or `ThemeStateV4` schema modification is allowed.
- No placeholders or unresolved design decisions are present; implementation commits are part of future execution, not this plan-writing task.
