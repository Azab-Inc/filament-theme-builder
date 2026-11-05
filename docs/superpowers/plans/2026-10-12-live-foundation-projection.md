# Live Foundation Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every foundation editor property produce an immediate, validated, visible change in the live Filament iframe and serialize the same canonical values.

**Architecture:** Builder TypeScript owns a canonical foundation mapping contract containing validated values and fixed runtime selector scopes. The preview bridge mirrors that contract, validates complete projections, and applies CSS variables plus allowlisted scoped emulation rules without accepting arbitrary selectors or CSS. Playwright tests measure computed styles and geometry in the real iframe across light/dark modes and verify persistence/export parity.

**Tech Stack:** Vue 3, Pinia, TypeScript, Vitest, Playwright, Blade JavaScript, Filament runtime CSS.

**Spec:** Approved in conversation on 2026-10-12.

## Global Constraints

- No new dependencies.
- Do not modify `.gitignore` or `.playwright-mcp`.
- Preserve unrelated worktree changes.
- Native showcase pages remain read-only; no forced-state system or CRUD duplication.
- No arbitrary selector/value injection; only centralized verified selector maps.
- Run builder type-check, unit tests, build, and relevant Compose/PHP checks before completion.

---

### Task 1: Canonical mapping contract and projection coverage

**Files:**
- Modify: `builder/src/models/foundations.model.ts`
- Create/modify: `builder/src/registry/filament-foundation-inventory.ts`
- Modify: `builder/src/services/foundation-projection.ts`
- Modify: `builder/src/services/foundation-validation.ts`
- Test: existing/new builder unit tests for mapping completeness

- [ ] Write failing matrix tests asserting every palette, surface, border, text, typography, spacing, density, radius, border-width, and shadow mapping is preview-emulatable and has a canonical runtime contract.
- [ ] Run the focused unit tests and confirm they fail because current mappings are export-only/unmapped and projection omits values.
- [ ] Implement typed mapping entries with canonical IDs, value kinds, CSS variables or emulation keys, and fixed selector scopes.
- [ ] Remove terminal `export-only`/`unmapped` foundation statuses; retain only live mapping categories needed by the implementation.
- [ ] Project all canonical foundation values in lockstep, including mode-resolved values and palette shades.
- [ ] Run focused unit tests and commit as `(builder) Feature: define live foundation mapping contract`.

### Task 2: Bridge validation and live CSS emulation

**Files:**
- Modify: `demo/resources/views/filament/preview-bridge.blade.php`
- Modify: `demo/tests/Feature/Filament/FilamentPanelTest.php`
- Test: `e2e/theme-foundations.spec.ts`

- [ ] Add failing bridge/E2E assertions for all six palette families, semantic surfaces/text/borders, typography, spacing, density, six radii, border widths, and five shadows.
- [ ] Run the focused test and confirm the bridge rejects or ignores the currently missing mappings.
- [ ] Mirror the canonical contract in bridge constants and validate complete mapping shape, value kinds, selector keys, and allowed values.
- [ ] Toggle `<html class="dark">` for dark mode while retaining `color-scheme`.
- [ ] Apply variables and centralized validated CSS rules to verified native Filament selectors; scope semantic values to documented selector groups.
- [ ] Ensure `none` and `full` radius, literal border widths, and literal shadow values visibly differ from baseline.
- [ ] Dispatch update/compatibility events only after accepted complete projections; remove compatibility reporting for normal foundation mappings.
- [ ] Run PHP feature assertions and focused E2E, then commit as `(demo) Feature: live-project all foundation tokens`.

### Task 3: Editor, persistence, and export parity

**Files:**
- Modify: `builder/src/App.vue`
- Modify: `builder/src/stores/theme.ts`
- Modify: `builder/src/services/theme-serialization.ts` if required by canonical foundation export
- Test: `e2e/theme-foundations.spec.ts` and builder unit tests

- [ ] Add failing tests that edit each control family, observe an immediate iframe event/style change without navigation, reload, and compare persisted/exported canonical values.
- [ ] Run tests and verify failures identify inert controls or divergent serialization.
- [ ] Wire every editor control through the canonical projection path and make status labels report live categories only.
- [ ] Preserve reset, undo/redo, mode switching, local persistence, and no-font-network behavior.
- [ ] Verify exported values are exactly the values projected to the bridge.
- [ ] Run builder checks and the complete foundation E2E matrix, then commit as `(builder) Feature: connect every foundation editor control`.

### Task 4: Full verification and review evidence

**Files:**
- Modify only tests/docs needed to record verified selector scopes and results.

- [ ] Run `npm --prefix builder run type-check`.
- [ ] Run `npm --prefix builder run test:unit -- --run`.
- [ ] Run `npm --prefix builder run build`.
- [ ] Run full PHP/Pint/PHPStan/health checks using repository-configured commands.
- [ ] Run relevant Compose Playwright suites in both light and dark paths.
- [ ] Inspect `git diff` and `git status`, preserve unrelated changes, and commit verification/docs if needed.
- [ ] Report exact files, commits, test counts, and any remaining proven gaps; do not claim completion while any editor property lacks a measured live effect.
