# FTB-007 Semantic Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production Inspector that communicates across the existing builder/Filament iframe boundary, outlines real DOM targets, resolves registry matches, and navigates only to editable controls.

**Architecture:** Keep the preview bridge as the only DOM/outline owner and add a versioned inspector channel beside the existing theme-update channel. Keep registry resolution and editor navigation in the builder; selector-only matches are informational and never invent controls. Keep prototypes untouched.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Laravel Blade JavaScript, PHP tests, Compose Playwright.

**Spec:** `TICKETS.md#ftb-007`, `SPECS.md` §§6–9 and §35.

## Global Constraints

- No new dependencies.
- Preserve unrelated `.gitignore`, existing plan, and prototype changes.
- Do not modify FTB-016 forced-state behavior.
- Normal preview navigation must remain unchanged while Inspector is off.
- No arbitrary selector or CSS injection; use validated DOM evidence and bridge-owned styles.
- Mark FTB-007 done only after all acceptance criteria have passing evidence.

---

### Task 1: Inspector protocol and registry resolution seams

**Files:**
- Create: `builder/src/models/inspector.model.ts`
- Create: `builder/src/services/inspector-protocol.ts`
- Modify: `builder/src/registry/theme-registry.ts`
- Test: `builder/src/__tests__/inspector-protocol.spec.ts`

- [ ] Write failing tests for protocol version/type validation, safe candidate selectors, mapped lookup, selector-only lookup, and ambiguous/incompatible results.
- [ ] Run the focused Vitest file and verify it fails because the protocol seam is absent.
- [ ] Implement typed protocol constants, message guards, target evidence validation, and a pure resolution result that distinguishes editable from selector-only entries.
- [ ] Extend registry lookup only where necessary to consume ordered candidate selector evidence without changing existing lookup behavior.
- [ ] Run the focused tests and then the existing registry tests.

### Task 2: Real preview bridge Inspector channel

**Files:**
- Modify: `demo/resources/views/filament/preview-bridge.blade.php`
- Modify: `demo/tests/Feature/Filament/FilamentPanelTest.php`
- Test: bridge assertions in the focused PHP test.

- [ ] Add failing PHP assertions for inspector protocol version, origin/source validation, delegated event handling, ancestor resolution, managed temporary/persistent outlines, and disable cleanup.
- [ ] Run the focused PHP test and confirm failure is caused by missing Inspector bridge behavior.
- [ ] Implement enable/disable handling, `ready`, `hover`, `select`, and `clear` events using one managed style/class system.
- [ ] Generate only safe `.fi-*` class-chain evidence and consume clicks only while Inspector is enabled.
- [ ] Preserve existing theme-update validation and event behavior.
- [ ] Run the focused PHP test and existing panel bridge tests.

### Task 3: Production App Inspector UI and navigation

**Files:**
- Modify: `builder/src/App.vue`
- Test: `builder/src/__tests__/App.spec.ts`

- [ ] Add failing Vue tests for the header toggle, enable/disable messages, breadcrumb display, persistent selection, selector-only non-navigation, mapped navigation to `data-editor-target="form.product-name"`, and iframe URL continuity.
- [ ] Run the focused App tests and verify they fail for missing production Inspector state/UI.
- [ ] Add builder event validation tied to the exact iframe origin and `contentWindow`; post enable/disable on toggle and after iframe load.
- [ ] Add inspector state, resolution display, selection clearing, and only-editable navigation/scroll behavior.
- [ ] Add stable editor target metadata to the existing component control section without duplicating controls.
- [ ] Add accessible toggle/status markup and minimal builder-owned styles/classes.
- [ ] Run App and inspector unit tests.

### Task 4: Real Compose Playwright coverage

**Files:**
- Create: `e2e/ftb-007-inspector.spec.ts`
- Modify: `e2e/urls.ts` only if an existing URL helper cannot support the Compose route.

- [ ] Write and run the new Compose tests before implementation; verify they fail because Inspector is not present.
- [ ] Cover off-state navigation, toggle continuity, temporary hover outline, persistent click selection, selector-only breadcrumb/no navigation, mapped product-name navigation, nested ancestor resolution, invalid origin/source rejection, and normal navigation after disable.
- [ ] Use real Filament DOM in the iframe, not prototype components or simulated markup.
- [ ] Run the focused Compose Playwright file and verify all scenarios.

### Task 5: Truthful coverage, inventory, and ticket closure

**Files:**
- Modify: `COVERAGE.md`
- Modify: `TICKETS.md`
- Modify: `docs/ai-operability/demo-showcase-capability-inventory.md`
- Modify: existing inventory test only if needed to assert the new UI-only row.

- [ ] Add failing documentation/inventory assertions if the existing inventory test covers the relevant contract.
- [ ] Record Inspector as read-only UI presentation with no MCP mutation tool; editable changes remain on existing validated theme paths.
- [ ] Record exact Inspector coverage IDs, real fixtures, and test evidence without claiming unsupported broad coverage.
- [ ] Mark only proven FTB-007 criteria complete and change status to done only after all verification passes.

### Task 6: Full verification and commit

- [ ] Run `npm --prefix builder run type-check`.
- [ ] Run `npm --prefix builder run test:unit -- --run`.
- [ ] Run `npm --prefix builder run build`.
- [ ] Run focused and full relevant Compose PHP tests, Pint, PHPStan, and `/api/health`.
- [ ] Run focused and full relevant Compose Playwright suites.
- [ ] Inspect `git diff --check`, `git diff`, and `git status`; ensure unrelated `.gitignore` and existing plan/prototype files are unchanged.
- [ ] Commit intended files with `(builder)` and/or `(demo)` prefixes and report exact tests and gaps.
