# Builder Studio Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote prototype A's compact, accessible accordion palette editor into the production Foundations section without changing theme behavior or the existing editor/preview shell.

**Architecture:** Keep `FoundationsPaletteControls.vue` as a typed presentation control and `EditorSections.vue`/`BuilderShellModel` as the existing mutation boundary. Keep accordion expansion local UI state; canonical palette edits, reset, history, persistence, and preview remain owned by current theme/store flows.

**Tech Stack:** Vue 3, TypeScript, Tailwind utilities, existing app.css CSS files, Vitest, Playwright, Docker Compose; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-20-builder-studio-visual-refresh-design.md`

## Global Constraints

- Preserve all six palettes and shades `50,100,200,300,400,500,600,700,800,900,950`.
- Preserve base changes, sparse shade overrides, individual resets, status classifications, theme history/persistence/import/export, and existing iframe projection.
- Keep current BuilderShell/EditorWorkspace/EditorNavigation/EditorToolbar/preview shell intact in this production slice.
- Use Vue/TypeScript conventions and keep every modified/new builder source file at or below 100 lines.
- Add no dependencies; do not delete or disable prototype artifacts until production promotion and reference checks pass.
- Run builder type-check, unit tests, build, plus focused Compose Playwright at desktop and mobile widths.

---

## File Responsibility Map

- `builder/src/components/FoundationsPaletteControls.vue`: accordion presentation, local open-palette state, accessible base/shade controls and unchanged emitted actions.
- `builder/src/__tests__/FoundationsPaletteControls.spec.ts`: component rendering, keyboard, single-open, labeling and emission contract.
- `builder/src/styles/editor-navigation.css` (or focused existing stylesheet chosen after inspection): palette row/ramp layout, focus and responsive rules; no component-local style blocks.
- `e2e/theme-foundations.spec.ts`: production-level persistence, reset and iframe regression journey; retain existing comprehensive foundations coverage.
- `builder/src/App.vue` and visual prototype artifacts: inspect query gate/references only; do not alter/remove them in this palette-only plan unless code inspection proves promotion requires a narrowly scoped removal and all shell prototype dependencies are resolved.

## Tasks

### Task 1: Write and run the failing production browser journey first

**Files:** Test `e2e/theme-foundations.spec.ts`.

- [ ] Add a focused Playwright journey that opens Primary by keyboard, checks one-open accordion behavior and 11 shades, edits base and a shade, resets both, and verifies canonical storage plus the real iframe token.
- [ ] In that journey, check no navigation/non-GET builder requests and repeat the open/reachability check at 390px; use existing `COMPOSE_E2E` skip/base-URL conventions.
- [ ] Run `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/theme-foundations.spec.ts -g "palette accordion production journey"`; expected FAIL on absent accordion behavior before any production implementation.

### Task 2: Specify accessible palette accordion behavior in component tests

**Files:** Test `builder/src/__tests__/FoundationsPaletteControls.spec.ts`.

- [ ] Add assertions for six named headers, collapsed initial state, `aria-expanded=false`, and shade editors hidden until expansion.
- [ ] Assert opening Primary exposes its controlled panel, all 11 labels and base picker/text fields; keyboard opening Success closes Primary and retains focus.
- [ ] Assert status association and the existing base/shade edit and reset emit payloads remain unchanged.
- [ ] Run `cd builder && npm run test:unit -- --run src/__tests__/FoundationsPaletteControls.spec.ts`; expected FAIL only for the new accordion assertions.

### Task 3: Implement compact accessible accordion palette rows

**Files:** Modify `builder/src/components/FoundationsPaletteControls.vue`; modify `builder/src/styles/editor-navigation.css` or add one focused imported stylesheet under `builder/src/styles/` only if existing boundaries require it; update the component test from Task 1 only as needed for actual names.

- [ ] Keep the provided palette props and four existing emits; add `ref<PaletteName | null>(null)` for single-open UI state and a typed toggle function.
- [ ] For each supplied palette name, render native header button with `aria-expanded`, stable `aria-controls` panel ID, swatch/base text, 11 generated shade swatches and generated/edited count based on existing override data; panel exists only when open.
- [ ] In the open panel, retain editable base text and picker, all shade editors, `statusFor` paths, and existing reset event shapes; give each input and reset control explicit palette/shade-specific accessible names.
- [ ] Add restrained neutral borders, compact spacing, visible `:focus-visible`, non-color-only edited/status text, and responsive wrapping; maintain >=36px interactive targets and prevent page-level overflow.
- [ ] Run the focused unit test; expected PASS. Then run `cd builder && npm run type-check && npm run test:unit -- --run && npm run build`; expected all pass.

### Task 4: Verify production behavior in real preview and responsive browser

**Files:** Test `e2e/theme-foundations.spec.ts`.

- [ ] Extend the Task 1 journey to assert all six palette headers and all 11 shades are reachable via UI; verify base/shade resets restore generated values in canonical storage and the real iframe.
- [ ] Assert no builder navigation/non-GET request; at desktop and 390px assert accordion remains usable and document horizontal scroll width does not exceed viewport width.
- [ ] Run `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/theme-foundations.spec.ts`; expected existing and new foundations journeys pass on the canonical Compose stack.

### Task 5: Final scope and prototype-gate review

**Files:** Inspect `builder/src/App.vue`, all `VisualPrototype*.vue`, `builder/src/composables/use-visual-prototype.ts`, `builder/src/models/visual-prototype.model.ts`, and `builder/src/styles/visual-prototype.css`; no production shell edits in this plan.

- [ ] Confirm palette production UI does not import or depend on prototype state/styles and its route still works with and without `?visual-prototype=1&variant=A`.
- [ ] Run all Task 2 checks and Task 3 Playwright test after final edits; record actual pass/failure outputs in the handoff, not as speculative ticket evidence.
- [ ] Keep the Studio shell follow-ups in the approved design spec; create a separate implementation plan before changing navigation, toolbar, preview composition, or removing prototype routing/artifacts.

## Self-review

- Coverage: row summary, all palettes/shades, statuses, keyboard/accessibility, override/reset events, responsive layout, canonical persistence and real preview are assigned to Tasks 1–4; shell/promotion boundary is Task 5 and follow-up list is in the spec.
- Placeholder scan: no TODO/TBD or deferred implementation step; tasks state concrete files, behaviors, commands, and expected outcomes.
- Type consistency: component uses the existing `PaletteName`, `PaletteShade`, props and emits; no new domain API or mutation method is introduced.
