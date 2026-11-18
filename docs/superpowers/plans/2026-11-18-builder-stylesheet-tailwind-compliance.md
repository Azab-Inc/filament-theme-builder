# Builder Stylesheet Tailwind Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all 14 stylesheets in `builder/src/styles` under the mandatory Tailwind v4 `@apply` / token / nesting standard with zero intentional visual change.

**Architecture:** One `tokens.css` `@theme`/`@utility` source imported first by `app.css`; every selector rule converted in place to nested `@apply` referencing tokens; duplication consolidated through `@utility` so source order and specificity do not move; two oversized stylesheets split with their original import order preserved; a permanent compliance guard test plus Playwright computed-style and screenshot evidence.

**Tech Stack:** Vue 3 + Vite 8 + Tailwind CSS 4.3.3 (`@tailwindcss/vite`) + Vitest + Playwright. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md`](../specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md)
**Umbrella ticket:** [FTB-076](../../../TICKETS.md#ftb-076)

## Global constraints

- No intentional visual change; computed values for existing surfaces stay identical.
- Do not change export generation, canonical theme state, the registry, the demo application, or Filament tokens.
- Preserve the `app.css` entrypoint contract: two Tailwind imports, unique `./styles/*` imports, at most 100 lines, no Vue `<style>` blocks.
- Keep rules unlayered; never wrap converted rules in `@layer components`.
- Consolidate duplicates only through `@utility` or identical token values, never by moving a rule to another file unless this plan says so.
- `!important` is permitted only in `@media (prefers-reduced-motion: reduce)` blocks, recorded in the guard.
- Prettier formatting output is committed alone as `Autogen:` before logic changes.
- Work test-first: failing guard/assertion, expected failure recorded, smallest implementation, then focused and browser verification.
- Do not touch unrelated dirty worktree files.

## Task 0 — Baseline and formatting (FTB-077)

- [ ] Start the dev server stack via `docker compose -f compose.dev.yaml up` and confirm the builder, default and four prototype query modes, at 1440px and 390px.
- [ ] Record the pre-change browser baseline: screenshots for the five modes at both widths in `docs/verification/ftb-076-stylesheet-compliance/baseline/`.
- [ ] Record current computed-style values for the sentinel list in the spec (root, header, primary button, current nav item, input, focus ring, popover/dialog, pane grid).
- [ ] Run `npx prettier --write src/styles/theme-prototype.css src/styles/inspect-prototype.css` from `builder/`.
- [ ] Verify the formatted files produce no visual diff against the baseline captures.
- [ ] Commit only the formatter output: `Autogen: format minified builder prototype stylesheets`.
- [ ] Evidence: baseline README with commands, revision, and file list.

## Task 1 — Token foundation and compliance guard (FTB-078)

- [ ] Write `builder/src/__tests__/stylesheet-compliance.spec.ts` first, asserting the six rules in spec section 10. Run it and record the expected failure against the current tree.
- [ ] Write `builder/src/styles/tokens.css`:
  - [ ] `@theme` colors for builder surfaces/text/border/accent/focus/danger, and distinct `inspect`/`theme`/`guidelines`/`dashboard`/`visual` palettes derived from the inventory.
  - [ ] `@theme` radii, shadows, control/gutter/popover/dialog sizing, and type steps actually used.
  - [ ] `@utility` definitions: `scrollbar-thin`, `bg-checkerboard`, `pb-safe`, `font-inherit`, `popover-shell`, `dialog-shell`, `focus-ring-builder`, `focus-ring-indigo`, `focus-ring-gold`, `focus-ring-brand`, and a shared control base only where the same declaration set repeats with identical values.
  - [ ] A single `@layer base` block for `box-sizing` and form-control inheritance that Preflight would otherwise provide.
- [ ] Import `tokens.css` first in `app.css` after the two Tailwind imports.
- [ ] Update `css-entrypoint.spec.ts` for the new import without weakening its existing assertions.
- [ ] Confirm the guard now fails only on remaining unconverted files, not on `tokens.css` itself.
- [ ] Verify: `npm run test:unit -- --run src/__tests__/stylesheet-compliance.spec.ts src/__tests__/css-entrypoint.spec.ts` and `npm run build`.
- [ ] Commit: `Feature: add builder style tokens and compliance guard`.

## Task 2 — Editor chrome (FTB-079)

Convert `editor-shell.css`, `editor-navigation.css`, `editor-responsive.css`, `editor-mobile.css`.

- [ ] Convert flat rules to native nesting; replace declarations with `@apply` against `tokens.css` utilities.
- [ ] Replace the six hex values and raw sizing in `editor-shell.css`; keep focus ring `#2563eb` via `focus-ring-builder`.
- [ ] Scope the unscoped `[aria-checked="true"]` switch selectors under the toolbar ancestor.
- [ ] Convert the sr-only clip block to `sr-only`; convert `scrollbar-width: thin` to `scrollbar-thin`.
- [ ] Convert `editor-responsive.css` literal gold focus ring to `focus-ring-gold`; keep its `-3px` offset.
- [ ] Preserve mobile grid overrides and `:has(.editor-nav-rail)` behavior.
- [ ] Verify guard passes for these four files only; run focused units, type-check, build.
- [ ] Playwright: computed-style assertions for header, primary button, nav current item, focus ring, and workspace columns at 1440/390px; screenshots compared with baseline.
- [ ] Commit: `Refactor: convert editor chrome styles to tokens and Tailwind utilities`.

## Task 3 — Field, foundation, and dialog controls (FTB-080)

Convert `color-field.css`, `foundation-surfaces.css`, `foundation-controls.css`, `local-theme-dialog.css`.

- [ ] Convert `color-field.css` including the checkerboard (`bg-checkerboard`), popover sizing (`popover-shell`), swatch grid, selected/focus states, and the `:has()` layout overrides.
- [ ] Keep the reduced-motion block as the only `!important` use and ensure the guard allowlist matches it.
- [ ] Convert foundation surfaces/controls with nesting; replace the direct `.grid-cols-3` override with the equivalent utility layer behavior.
- [ ] Convert `local-theme-dialog.css` including `::backdrop`, `min()` sizing via `dialog-shell`, and the scoped toolbar-button override.
- [ ] Verify guard for these four files; focused units, type-check, build.
- [ ] Playwright: open color popover, local theme dialog, and foundation panel; assert computed border/radius/shadow/outline and screenshot parity.
- [ ] Commit: `Refactor: convert control stylesheets to tokens and Tailwind utilities`.

## Task 4 — Dashboard first editor split and conversion (FTB-081)

- [ ] Create `dashboard-editor-layout.css`, `dashboard-editor-controls.css`, `dashboard-editor-responsive.css` from the original file, preserving declaration order and comments.
- [ ] Delete `dashboard-first-editor.css` and import the three files in layout → controls → responsive order at the end of `app.css`.
- [ ] Update `css-entrypoint.spec.ts` to assert the three imports.
- [ ] Convert each split file to nested `@apply` with tokens, including container queries, resize handle, `:has()` overrides, and toolbar/field overrides of earlier sheets.
- [ ] Remove `!important` layout overrides by correcting selector context/order; keep reduced-motion only if present.
- [ ] Verify guard, units, type-check, build.
- [ ] Playwright: assert pane grid columns, resize handle, nav selection, field sizing, and dashboard toolbar computed values; verify editor at 1440/390px and with both navigation layouts.
- [ ] Commit: `Refactor: split and convert dashboard editor styles`.

## Task 5 — Legacy prototype stylesheets (FTB-082)

Convert `inspect-prototype.css`, `theme-prototype.css`, `dashboard-prototype.css`, `guidelines-prototype.css`.

- [ ] Add `@reference "../app.css";` to `dashboard-prototype.css` and `guidelines-prototype.css` (component-imported).
- [ ] Move each file's private palette variables into the matching prototype token group in `tokens.css`; remove local `--ink`/`--muted`/`--line`/`--paper` definitions.
- [ ] Convert all flat/minified rules to nested `@apply` using the family tokens, preserving distinct palettes.
- [ ] Replace `.inspect, .prototype { margin: -8px }` with root-scoped behavior that produces the same rendered result.
- [ ] Consolidate only identical switcher/focus/button geometry through `@utility`; keep distinct colors and widths.
- [ ] Verify guard, units, type-check, build.
- [ ] Playwright: run `?inspect=1`, `?dashboard-prototype=1`, `?guidelines-prototype=1` at 1440/390px; computed sentinels and screenshots.
- [ ] Commit: `Refactor: convert prototype stylesheets to tokens and Tailwind utilities`.

## Task 6 — Visual prototype split and conversion (FTB-083)

- [ ] Split `visual-prototype.css` into `visual-prototype-shell.css`, `-canvas.css`, `-switcher.css`, `-details.css`; keep `visual-prototype.css` as an `@import` aggregator.
- [ ] Add `@reference "../app.css";` to each split file.
- [ ] Convert all 706 lines to nested `@apply` with `--color-visual-*` tokens; preserve the appended override block and mobile media queries.
- [ ] Replace `!important` and `var(--vp-swatch)` usages with token/utility equivalents that preserve computed output.
- [ ] Verify guard, units, type-check, build.
- [ ] Playwright: `?visual-prototype=1` at 1440/390px with computed sentinels and screenshots; verify canvas, dock, switcher, and shade layouts.
- [ ] Commit: `Refactor: split and convert visual prototype styles`.

## Task 7 — Final audit and umbrella close (FTB-076)

- [ ] Run the full guard and confirm zero exceptions outside the documented allowlist.
- [ ] Run `npm run type-check`, `npm run test:unit -- --run`, and `npm run build` from `builder/`.
- [ ] Run the export golden tests and confirm byte-identical output for both vanilla and Tailwind `@apply` strategies.
- [ ] Run the full five-mode, two-width Playwright capture and compare with the Task 0 baseline.
- [ ] Confirm the demo iframe has no builder stylesheet matches.
- [ ] Write `docs/verification/ftb-076-stylesheet-compliance/README.md` with commands, revision, tested working-tree state, screenshots, computed-style table, and results.
- [ ] Independent read-only review against the spec; fix only blocking findings.
- [ ] Update `TICKETS.md`, GitHub issues, and project status for every closed ticket.

## Verification commands

```sh
# from builder/
npm run test:unit -- --run src/__tests__/stylesheet-compliance.spec.ts
npm run type-check
npm run test:unit -- --run
npm run build

# from repository root (with compose dev stack running)
npx playwright test e2e/ --reporter=line
```

Use a longer explicit timeout for the full unit and Playwright suites when their measured duration exceeds the default.

## Completion evidence

| Stage | Required result |
| --- | --- |
| Guard | Passes with only the reduced-motion allowlist |
| Types | `vue-tsc --build` passes |
| Units | Full suite passes |
| Build | Vite production build passes with no unknown-utility errors |
| Export | Golden output unchanged |
| Browser | Five modes, two widths, computed values match baseline |
| Review | No unresolved blocking finding |
