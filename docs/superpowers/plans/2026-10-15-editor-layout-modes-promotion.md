# Editor Layout Modes Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote production Sidebar and Top navigation modes inside a usable editor side panel beside the unchanged live Filament iframe, while preserving canonical state and removing only the production prototype query gate after verification.

**Architecture:** Keep `App.vue` as the existing composition shell and add a small production navigation model (`editorSection`, `editorNavigationMode`) that controls which existing real editor section is displayed. Wrap the existing editor controls in an internal panel: Sidebar renders a vertical rail beside the selected section and Top renders horizontally scrollable tabs above it; the iframe remains one mounted sibling with its existing `ref`, `src`, load handler, and bridge effects. Use CSS grid/flex containment and CSS media queries for desktop/intermediate/narrow geometry without adding dependencies or a second state store.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Vitest/Vue Test Utils, Playwright, existing Compose runtime.

**Spec:** `docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md`

## Global Constraints

- Production exposes only modes A (Sidebar) and B (Top navigation); prototype A/B/C references remain unchanged.
- The mode control is an accessible labelled radio/segmented control named “Editor navigation”.
- The real iframe must stay mounted, keep the same document/URL, and remain beside the editor panel; no screenshot/static preview replacement.
- Canonical Pinia theme state, selected section/control, unsaved edits, inspector/raw/branding/icon controls, undo/redo, and bridge behavior remain authoritative.
- No new dependency, MCP capability, persistence system, or prototype-only static values/control markup.
- Preserve unrelated worktree changes in `.gitignore`, demo tests, and existing plans.

---

### Task 1: Add failing production component and browser contract tests

**Files:**
- Modify: `builder/src/__tests__/App.spec.ts`
- Create or modify: `e2e/ftb-050-editor-layout.spec.ts`

**Interfaces:**
- Tests observe `[data-editor-workspace]`, `[data-editor-panel]`, `[data-editor-navigation]`, `[data-editor-content]`, `[data-editor-section]`, and `[data-editor-iframe]`.
- The production mode control exposes radio roles/names `Sidebar` and `Top navigation` under `Editor navigation`.

- [ ] **Step 1: Write failing unit tests** for production default mode, accessible mode switching, section selection, prototype-query non-exposure, canonical edit preservation, and unchanged iframe `src`/element identity.
- [ ] **Step 2: Write a failing Playwright spec** using the real builder and iframe at desktop (1280×900), intermediate (900×900), and narrow (640×900), asserting side-by-side geometry, internal rail/tabs, no document horizontal overflow, mode/section state preservation, iframe identity/src continuity, and a real primary-color-to-iframe update without reload.
- [ ] **Step 3: Run the focused Vitest and Playwright specs before implementation** and record expected failures; do not weaken assertions or skip unavailable environments.

### Task 2: Implement production editor navigation and side-panel geometry

**Files:**
- Modify: `builder/src/App.vue`

**Interfaces:**
- Add typed production values `EditorNavigationMode = 'sidebar' | 'top'` and `EditorSection = 'navigation' | 'foundations' | 'components' | 'branding' | 'icons' | 'inspector'`.
- Add stable refs/data attributes for workspace, panel, nav, content, section, and iframe.

- [ ] **Step 1: Add the minimal reactive UI state** with Sidebar default, a selected section defaulting to Foundations, and a section-selection function that does not touch the theme store or iframe refs.
- [ ] **Step 2: Replace the prototype import/query gate only**: retain the inspect query gate, remove `prototypeMode`, `prototypeVariant`, `prototypePreviewUrl`, and `ThrowawayThemePrototype` production rendering; do not edit the prototype component.
- [ ] **Step 3: Wrap the existing real editor sections** in a side-panel content region and conditionally render the selected section while preserving each section’s existing markup and handlers; keep the inspector section available when evidence exists and preserve inspector auto-scroll by selecting its real section.
- [ ] **Step 4: Add the labelled native radio/segmented mode control** and Sidebar rail/Top tab navigation with `aria-checked`/`aria-selected`, roving keyboard focus or native radio operation, visible focus, and no C option.
- [ ] **Step 5: Change only production shell CSS** to a contained viewport workspace: editor panel and iframe as grid siblings, panel internal scrolling, rail beside content in Sidebar mode, tab strip above content in Top mode, min-width containment, and narrow fallback that keeps the iframe visible and avoids page horizontal overflow.
- [ ] **Step 6: Ensure the iframe remains the same single element** with existing `ref`, `iframeSrc`, `@load`, title, bridge watchers, and no `v-if`/key tied to mode or section.
- [ ] **Step 7: Run focused Vitest and type-check** and fix only genuine failures.

### Task 3: Verify real browser behavior and accessibility

**Files:**
- Modify: `e2e/ftb-050-editor-layout.spec.ts` as needed for stable observable assertions.
- Modify: `TICKETS.md`, relevant coverage/inventory documentation only if tests provide evidence.

- [ ] **Step 1: Run the focused Playwright spec** against the real Compose builder/demo and capture screenshots plus measured panel/iframe rectangles at all supported viewports.
- [ ] **Step 2: Verify keyboard mode switching, visible focus, named iframe, 200% zoom/reflow, reduced motion, tabs/rail reachability, and an automated accessibility scan without claiming whole-product WCAG certification.
- [ ] **Step 3: Verify `?prototype=1&variant=A|B|C`, unknown variants, ordinary `/`, and `?inspect=1` no longer expose production prototype UI while `ThrowawayThemePrototype.vue` remains unchanged.
- [ ] **Step 4: Update only FTB-050 acceptance checkboxes/evidence and capability inventory/COVERAGE if an evidence-backed entry is required; do not claim done until all criteria pass.

### Task 4: Run complete verification and commit intended files

**Files:**
- Intended implementation/tests/docs only; leave unrelated worktree changes untouched.

- [ ] **Step 1: Run builder `npm run type-check`, `npm run test:unit -- --run`, and `npm run build`.
- [ ] **Step 2: Run full PHP test suite, Pint test, PHPStan, health endpoint, and full Compose Playwright suite; fix genuine regressions without skips or weakened tests.
- [ ] **Step 3: Inspect `git diff`, `git status`, and `git diff --check`; verify prototype bytes and unrelated files are preserved.
- [ ] **Step 4: Commit only intended files using repository prefixes, e.g. `(builder)`, `(tests)`, and `(docs)` as applicable, with a concise feature commit message.
- [ ] **Step 5: Report exact commands/results, viewport measurements, iframe continuity evidence, remaining gaps, and commit hash.

## Spec self-review

- Geometry, modes, state preservation, iframe continuity, accessibility, prototype cleanup, responsive behavior, no-dependency/MCP constraints, and full verification each have explicit tasks.
- No placeholder TODO/TBD steps are present.
- The planned section values and observable hooks are consistent across unit, Playwright, and implementation tasks.
- Existing prototype A/B/C is never modified; only its production import/query gate is removed after tests.
