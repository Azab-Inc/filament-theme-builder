# FTB-011 Product Input Theme Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one evidence-backed FTB-011 production registry target for the Product name input, with canonical inheritance editing and a strict live preview projection.

**Architecture:** Extend the existing semantic registry and `ThemeOverride` inheritance contract with `form.product-name` / `background`. The existing Pinia store remains the only mutation/history/persistence path; the preview bridge accepts only its fixed allowlisted target/selector/property tuple and projects sparse overrides onto the real `.fi-fo-text-input .fi-input`, including `:focus` only for the verified focus state.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Laravel 13 / Filament 5.9, Blade preview bridge, Compose Playwright.

**Spec:** `TICKETS.md` FTB-011 and `SPECS.md` sections 5–8.

## Global Constraints

- Preserve existing native-default, provenance, foundation, Tailwind, `.gitignore`, and unrelated plan changes.
- Use `form.product-name` as the only production registry target; do not add a new schema or a second state store.
- Use the existing `ThemeOverride`, resolver, Pinia mutation/history/persistence, validation, serialization, and preview-message paths.
- Project only the exact allowlisted `.fi-fo-text-input .fi-input` / `background-color` mapping; reject forged mappings/identities without weakening foundation validation.
- Do not add FTB-016 forced-state controls; prove focus with actual focus in Playwright.
- Do not add dependencies, MCP tools, or arbitrary selectors/CSS inputs.
- Write failing unit and Compose Playwright tests before production implementation and run the builder and Compose verification suites.

---

### Task 1: Red tests for the production target and UI contract

**Files:**
- Modify: `builder/src/__tests__/theme-registry.spec.ts`
- Modify: `builder/src/__tests__/theme-resolver.spec.ts`
- Modify: `builder/src/__tests__/theme-state.spec.ts`
- Modify: `e2e/demo-showcase.spec.ts`

**Interfaces:**
- Consumes: existing registry, resolver, store, and Compose preview message.
- Produces: executable expectations for the new target, inheritance/reset/history behavior, and real forms-showcase projection.

- [ ] Write tests asserting the registry has exactly one editable production form target with selector `.fi-fo-text-input .fi-input`, one `background` color control, `default` variant, and `focus` state.
- [ ] Write resolver tests for global/component/variant/focus-state precedence and inherited fallback for `form.product-name`.
- [ ] Write store tests proving `setOverride`, `resetOverride`, undo/redo, and parent changes use canonical state without copying inherited values.
- [ ] Add a serial Compose Playwright test that opens the real forms showcase, focuses Product name, edits global/component/variant/focus values through the builder UI, verifies source labels and computed `background-color`, resets to inherit, and sends forged target/scope data while confirming the foundation projection still applies.
- [ ] Run the focused Vitest and Playwright test before implementation and confirm failure is caused by the missing target/UI/bridge behavior.

### Task 2: Registry and canonical domain support

**Files:**
- Modify: `builder/src/registry/theme-registry.ts`
- Modify: `builder/src/__tests__/theme-registry.spec.ts`
- Modify: `builder/src/__tests__/theme-resolver.spec.ts`
- Modify: `builder/src/__tests__/theme-state.spec.ts`

**Interfaces:**
- Consumes: the red tests from Task 1.
- Produces: `form.product-name` registry metadata consumable by `resolveThemeValue` and `useThemeStore`.

- [ ] Add the one target with the verified selector, color constraint, `default` variant, and `focus` state; do not add production controls to the other selector-only form entries.
- [ ] Run the focused unit tests and keep the implementation minimal.
- [ ] Confirm invalid target/control/scope values remain rejected by existing validation.

### Task 3: Strict bridge projection and builder controls

**Files:**
- Modify: `demo/resources/views/filament/preview-bridge.blade.php`
- Modify: `builder/src/App.vue`
- Modify: `demo/tests/Feature/FilamentPanelTest.php`
- Modify: `e2e/demo-showcase.spec.ts`

**Interfaces:**
- Consumes: `form.product-name` registry metadata and canonical store methods.
- Produces: four minimal editor rows, source/inheritance text, reset-to-inherit actions, and accepted/rejected real iframe projection.

- [ ] Add the bridge’s exact `form.product-name` definition and fixed selector/property mapping to the existing allowlists.
- [ ] Apply only valid sparse overrides in global → component → variant → state order; use a `:focus` selector for the focus state and no forced-state UI.
- [ ] Reject malformed or forged form overrides as a whole message before touching styles, while retaining all existing foundation checks.
- [ ] Add a builder section that calls `theme.setOverride`, `theme.resetOverride`, and `theme.resolve`; display each row’s resolved source and whether it is explicit/inherited.
- [ ] Run focused builder unit tests, PHP bridge tests, and Compose Playwright tests.

### Task 4: Truthful coverage/status and full verification

**Files:**
- Modify: `COVERAGE.md`
- Modify: `TICKETS.md`

**Interfaces:**
- Consumes: passing unit, PHP, and Compose evidence from Tasks 1–3.
- Produces: truthful documentation marking only the evidenced FTB-011 inheritance criterion complete and preserving all remaining gaps.

- [ ] Record the exact production target, selector/property, inheritance/reset evidence, and actual-focus evidence in `COVERAGE.md`.
- [ ] Mark only the FTB-011 inheritance criterion complete in `TICKETS.md`; leave full coverage, forced-state, and unrelated criteria/status incomplete.
- [ ] Run builder type-check, unit tests, build; full PHP tests, Pint, PHPStan, health; focused and full relevant Compose Playwright tests.
- [ ] Inspect the final diff, stage only intended files, and commit with a `(builder)` or `(demo)` prefix.
