# Builder Stylesheet Tailwind Compliance Design

Date: 2026-11-18
Status: Approved for implementation
Umbrella ticket: [FTB-076](../../../TICKETS.md#ftb-076)
Implementation plan: [Builder Stylesheet Tailwind Compliance Implementation Plan](../plans/2026-11-18-builder-stylesheet-tailwind-compliance.md)
Mandatory rules: [builder/src/styles/AGENTS.md](../../../builder/src/styles/AGENTS.md)

## 1. Problem

`builder/src/styles/AGENTS.md` now requires Tailwind CSS v4 `@apply`, semantic tokens, native CSS nesting, and no scattered literals for every stylesheet in `builder/src/styles/**/*.css`. The directory does not meet that standard:

- 14 stylesheets, ~1,750 physical lines, and only 4 `@apply` usages.
- No central token source: zero `@theme`, `@utility`, `@reference`, or `--builder-*` definitions exist in `builder/src`.
- ~270 hardcoded color occurrences (~50 distinct values) plus raw `px`/`rem`, `rgb()`, named colors, and arbitrary shadows at points of use.
- Flat, one-rule-per-line selector bundles rather than nested blocks.
- `!important` declarations, unscoped attribute selectors, and viewport-margin resets that can affect same-document markup.
- Prototype stylesheets duplicate builder-chrome patterns and each define a private, near-identical token set.
- Two files are minified to 3 and 12 lines, making review and conversion impractical.

The compliance debt is invisible to users today, but it blocks consistent theming of the builder itself, makes light/dark overrides impossible to add safely, and makes every future UI change copy literals instead of reusing tokens.

## 2. Goals

- Bring all 14 stylesheets under the documented standard with zero intentional visual change.
- Introduce one central token source, `builder/src/styles/tokens.css`, imported before every component stylesheet.
- Convert selector rules to native nesting plus valid Tailwind v4 `@apply` utilities that resolve to tokens.
- Remove avoidable duplication through documented `@utility` definitions rather than relocating rules, preserving cascade order and specificity.
- Split the two oversized stylesheets into cohesive files.
- Make regression protection executable: a compliance guard test plus real-browser computed-style checks and before/after screenshots.
- Keep the builder design system separate from the user-generated Filament theme and the embedded demo preview.

## 3. Non-goals

- No change to the CSS export format. Vanilla CSS remains the default and Tailwind `@apply` remains a separate export option; generator code and golden exports are untouched.
- No change to Filament theme tokens, registry, canonical theme state, Inspector behavior, or the demo application.
- No new dark mode for the builder. The builder chrome is light-only today; tokens must be structured so a dark override can be added later, but no visual scheme is introduced now.
- No Preflight import. The existing `theme.css` + `utilities.css` imports remain; form-inheritance and box-sizing behavior currently provided by hand-written rules must be preserved.
- No visual redesign, spacing normalization, or palette consolidation. Distinct focus colors and prototype palettes stay distinct.
- No new third-party dependency, Sass/Less, CSS-in-JS, or PostCSS plugin.
- No unrelated refactor of components, composables, or application logic.

## 4. Scope and current-state inventory

| File | Loaded by | Lines | Hex | Primary concern |
| --- | --- | --- | --- | --- |
| `tokens.css` (new) | `app.css` first | new | allowed | Tokens, utilities, base exceptions |
| `editor-shell.css` | `app.css` | 99 | 6 | Editor shell layout, nav rail, tabs |
| `editor-navigation.css` | `app.css` | 98 | 5 | Navigation tree, palette accordion |
| `editor-responsive.css` | `app.css` | 187 | 31 | Header, toolbar, responsive utilities |
| `editor-mobile.css` | `app.css` | 67 | 0 | Mobile and inspector layout overrides |
| `inspect-prototype.css` | `app.css` | 12 (minified) | 83 occurrences | Inspector prototype chrome |
| `theme-prototype.css` | `app.css` | 3 (minified) | 50 occurrences | Theme prototype chrome |
| `color-field.css` | `app.css` | 52 | 32 occurrences | Color field and popover |
| `foundation-surfaces.css` | `app.css` | 13 | 4 | Surface layout controls |
| `foundation-controls.css` | `app.css` | 16 | 16 | Foundation panel controls |
| `local-theme-dialog.css` | `app.css` | 41 | 23 | Local theme manager dialog |
| `dashboard-first-editor.css` | `app.css` last | 357 | 28 | Dashboard-first editor overrides |
| `dashboard-prototype.css` | `DashboardPrototype.vue` | 29 | 28 | Dev-only dashboard prototype |
| `guidelines-prototype.css` | `GuidelinesPrototype.vue` | 59 | 33 | Dev-only guidelines prototype |
| `visual-prototype.css` | `BuilderVisualPrototype.vue` | 706 | 61 | Dev-only visual prototype |

Existing entrypoint constraints in `builder/src/__tests__/css-entrypoint.spec.ts`:

- `src/main.ts` imports `./app.css` exactly once.
- `app.css` imports `tailwindcss/theme.css` and `tailwindcss/utilities.css` exactly once each, with no other Tailwind import.
- `app.css` stays at or below 100 lines, imports are unique, and every `./styles/*` import resolves.
- No Vue single-file component contains a `<style>` block.

Any new or renamed stylesheet must be added to `app.css` (or the owning component import) and to the entrypoint test.

## 5. Token architecture

### 5.1 One central source

`builder/src/styles/tokens.css` is imported first in `app.css`, immediately after the two Tailwind imports. It owns:

1. `@theme` declarations for semantic colors, radii, shadows, spacing, and type scale.
2. `@theme inline` entries only where a utility must reference a separately defined runtime variable.
3. `@utility` definitions for reusable patterns that no built-in utility expresses.
4. A small, documented `@layer base` block for reset behavior that Preflight would otherwise provide.

No other stylesheet may declare `@theme` tokens.

### 5.2 Naming

Follow the existing project vocabulary rather than literal values:

- Colors: `--color-builder-bg`, `-surface`, `-surface-subtle`, `-surface-raised`, `-text`, `-text-muted`, `-border`, `-border-strong`, `-accent`, `-accent-strong`, `-accent-soft`, `-accent-ink`, `-focus`, `-danger`, `-danger-ink`.
- Focus variants kept distinct: `--color-builder-focus` (blue), `--color-focus-indigo`, `--color-focus-gold`, `--color-focus-brand` (green). The three gold values (`#e2a832`, `#e7ad35`, `#ebae34`) are intentionally different surfaces and are not unified.
- Prototype palettes: `--color-inspect-*`, `--color-theme-*`, `--color-guidelines-*`, `--color-dashboard-*`, `--color-visual-*`. Each retains its existing values; only the definition site moves.
- Radii: `--radius-builder-xs`, `-sm`, `-md`, `-lg`, `-pill`.
- Shadows: `--shadow-builder-popover`, `-dialog`, `-switcher`, `-marker`.
- Sizing: `--spacing-builder-control`, `-control-sm`, `-gutter`, `-popover-width`, `-popover-max-height`, `-dialog-width`, `-dialog-max-height`.
- Type: `--text-builder-caption`, `-label`, `-body`, `-title`, plus prototype-specific steps where an existing scale is retained.

The initial implementation derives the token list from actual values in the inventory; it must not invent tokens that no rule uses.

### 5.3 Light and dark

There is no builder dark mode in scope. Tokens are declared once and consumed through utilities. A future dark override belongs on the same token names; no component stylesheet should need to change. Any existing user-theme or Filament light/dark behavior is untouched.

### 5.4 Prototype palettes

The four prototype families intentionally look different. Their colors become tokens, but not shared tokens. Structural values that are genuinely identical (radii, control heights, focus geometry) may use shared builder tokens where the computed value is identical; otherwise each family keeps its own.

## 6. Utility catalog and exception policy

| Need | Resolution |
| --- | --- |
| Buttons, fields, tabs, nav items | Built-in utilities via `@apply` plus a `@utility` base only where the same declaration set repeats 3+ times with identical values |
| Focus rings | `@utility focus-ring-{builder,indigo,gold,brand}` referencing the matching token, with width/offset preserved per surface |
| `scrollbar-width: thin` | `@utility scrollbar-thin` |
| Transparent checkerboard | `@utility bg-checkerboard` using token colors; replaces `repeating-conic-gradient` literals |
| Safe-area padding | `@utility pb-safe` using `env(safe-area-inset-bottom)` |
| `font: inherit` on form controls | `@utility font-inherit`; Preflight is not enabled, so this behavior is load-bearing |
| Screen-reader clip block | Built-in `sr-only` utility via `@apply` |
| Container queries | `@container` utility and `@max-*` / arbitrary container variants; no raw `container-type` declaration |
| `::backdrop` | `backdrop:` variant utilities |
| Details marker suppression | `list-none` / `marker:` / arbitrary variant utilities |
| `min()` / `calc()` popover and dialog sizing | Component `@utility` (`popover-shell`, `dialog-shell`) built from sizing tokens and `100vw`/`100dvh` |
| Unique one-off grid tracks | Tailwind arbitrary-value utilities for that single rule; reusable tracks become spacing tokens |
| `100vh` / `100dvh` | `h-screen` / `h-dvh` |
| `z-index: 1000` | `z-*` scale where it preserves ordering, otherwise an arbitrary z utility; never a color/size literal |
| Opacity, transforms, cursor, touch-action, tracking, leading | Built-in utilities |

Raw declarations are permitted only inside:

- `@theme`, `@theme inline`, and CSS custom-property definitions.
- `@utility` bodies.
- The single `@layer base` reset block in `tokens.css`.
- Pseudo-element properties that Tailwind cannot express through a variant, and only with a named justification in this document.

Raw declarations in ordinary selector rules are not permitted.

## 7. Cascade and specificity contract

- Rules stay unlayered exactly as they are today. Wrapping converted rules in `@layer components` would change precedence against utilities and against `dashboard-first-editor.css`, so it is forbidden.
- `@apply` inlines declarations at the rule's current location; it must not move a rule between files unless the move is approved by the split contract in section 8.
- Reusable patterns are consolidated through `@utility`, which expands at each point of use and therefore preserves source order.
- Current import order is preserved: `editor-shell`, `editor-navigation`, `editor-responsive`, `editor-mobile`, `inspect-prototype`, `theme-prototype`, `color-field`, `foundation-surfaces`, `foundation-controls`, `local-theme-dialog`, then the dashboard-editor files last.
- No `!important`. A narrow allowlist is permitted only for `prefers-reduced-motion` override blocks, recorded in the compliance guard and this document. Any additional entry requires a spec amendment; the default answer is to fix specificity or order.
- Unscoped selectors are removed or scoped: `[aria-checked="true"]` descendant rules become scoped to their toolbar ancestor, and `.inspect, .prototype { margin: -8px }` becomes root-scoped.

## 8. Stylesheet split contract

### 8.1 `dashboard-first-editor.css` (357 lines)

Split by concern while keeping last-import precedence:

1. `dashboard-editor-layout.css` — shell, header, workspace, panes, resize handle, container query.
2. `dashboard-editor-controls.css` — buttons, fields, color-field overrides, foundation rows, nav buttons, dialogs.
3. `dashboard-editor-responsive.css` — media queries and `:has()` layout overrides.

`app.css` imports them in that order at the end of the list. `css-entrypoint.spec.ts` asserts the three imports instead of the single legacy file. The original file is deleted; no aggregator remains.

### 8.2 `visual-prototype.css` (706 lines)

Split by concern:

1. `visual-prototype-shell.css` — root, reset, layout, header, navigation, dock.
2. `visual-prototype-canvas.css` — canvas, preview frame, section content, foundation groups.
3. `visual-prototype-switcher.css` — variant switcher and palette list.
4. `visual-prototype-details.css` — shade/accordion, appended override block, mobile media queries.

`visual-prototype.css` remains as a thin aggregator that `@import`s the four files, so `BuilderVisualPrototype.vue` keeps its single import. Each part begins with `@reference "../app.css";` because the component imports it outside the global entrypoint.

### 8.3 Other files

No other stylesheet is split in this work. Each remaining file keeps one cohesive concern.

## 9. Prototype isolation

- `inspect-prototype`, `theme-prototype`, `dashboard-prototype`, `guidelines-prototype`, and `visual-prototype` remain dev-only modes selected by query parameter and are not part of production behavior.
- They are loaded into the builder document, never into the Filament demo iframe. Conversion must not add selectors that could match demo markup.
- Converted rules keep the same visual result in the real browser at both desktop and mobile widths.
- `@reference "../app.css";` is added to every stylesheet that a component imports directly and that uses `@apply`.
- The stylesheets must stop relying on private `--ink`/`--paper`-style definitions; those values move into the token source.

## 10. Compliance guard

A new Vitest spec, `builder/src/__tests__/stylesheet-compliance.spec.ts`, scans `builder/src/styles/**/*.css` and fails when:

1. A hex, `rgb()`, `rgba()`, `oklch()`, `hsl()`, or named color literal appears outside `tokens.css`. `transparent`, `currentColor`, and `inherit` are allowed.
2. A raw declaration appears in an ordinary selector rule outside the permitted `@theme` / `@utility` / `@layer base` / custom-property contexts. The guard parses at-rule nesting rather than matching text, and reports file, line, and property.
3. `!important` appears outside the explicit allowlist. The allowlist is keyed by file and containing at-rule (initially only `@media (prefers-reduced-motion: reduce)`).
4. A governed stylesheet uses `@theme` more than once or outside `tokens.css`.
5. A stylesheet imported by a component and containing `@apply` lacks `@reference`.
6. `app.css` imports `tokens.css` after any `./styles/` component stylesheet.

The guard intentionally does not validate that every `@apply` utility exists; the Tailwind build is authoritative for that. It also does not forbid one-off arbitrary grid utilities.

The guard is written first, run against the current tree, and its failure is recorded as the failing-first evidence. It stays in the suite permanently.

## 11. Verification contract

Per ticket:

1. **A — focused:** the compliance guard plus focused unit/component tests changed by the ticket.
2. **B — integration:** `npm run type-check`, `npm run test:unit -- --run`, `npm run build` from `builder/`.
3. **C — browser:** Playwright against the real application.

Browser evidence uses two complementary layers:

- **Computed-style assertions.** For each mode, assert computed values on sentinel elements: root background/text, header/toolbar surface, primary button background/border/radius, current nav item background, input border/radius/min-height, focused control outline color/width/offset, popover/dialog surface/shadow/width, and pane grid columns.
- **Screenshots.** Capture default builder, `?inspect=1`, `?visual-prototype=1`, `?dashboard-prototype=1`, and `?guidelines-prototype=1` at 1440px and 390px before conversion and after each ticket that affects them. Baselines and final captures live under `docs/verification/ftb-076-stylesheet-compliance/` with a README recording command, revision, and result.

Export invariance: the existing export golden tests must pass unchanged. No file under `builder/src/utils/` that generates export output is edited.

The demo iframe is inspected in the Playwright run to confirm no builder stylesheet applies inside it.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| `@apply` inlines utilities that resolve differently under the installed Tailwind version | Build is a required gate per ticket; unknown utilities fail compilation rather than silently emitting nothing |
| Reordering or layering rules changes precedence | Rules stay unlayered and in place; consolidation only through `@utility`; dashboard files keep last-import order |
| Prototype visuals drift because palettes were merged | Distinct palettes become distinct token groups; screenshot matrix covers all five modes |
| Removing `!important` changes reduced-motion behavior | Reduced-motion is the seeded allowlist entry |
| Splitting `dashboard-first-editor.css` breaks overrides | Split files are imported adjacently in the original order; computed-style assertions cover navigation, fields, and resize handle |
| Component-imported CSS loses theme context | Mandatory `@reference "../app.css";`, enforced by the guard |
| Guard test becomes a maintenance burden | It enforces only the documented rules, parses at-rules instead of a full CSS AST, and reports actionable file/line details |
| Touching export format accidentally | Export utilities and golden tests are out of scope and must stay byte-identical |

## 13. Rollout and ticket mapping

| Ticket | Scope |
| --- | --- |
| FTB-076 | Umbrella: standard, acceptance, final audit and evidence index |
| FTB-077 | Baseline capture and Prettier un-minification (DX) |
| FTB-078 | Token foundation, utilities, base block, compliance guard, entrypoint test update |
| FTB-079 | `editor-shell`, `editor-navigation`, `editor-responsive`, `editor-mobile` |
| FTB-080 | `color-field`, `foundation-surfaces`, `foundation-controls`, `local-theme-dialog` |
| FTB-081 | `dashboard-first-editor` split and conversion |
| FTB-082 | `inspect-prototype`, `theme-prototype`, `dashboard-prototype`, `guidelines-prototype` |
| FTB-083 | `visual-prototype` split and conversion |

Dependency order: FTB-077 → FTB-078 → {FTB-079, FTB-080, FTB-082} → FTB-081 → FTB-083; FTB-076 closes only when all slices pass.

## 14. Acceptance checklist

- [ ] `tokens.css` is the only file declaring `@theme`, and `app.css` imports it first.
- [ ] Every governed selector uses `@apply`; raw declarations exist only in the documented contexts.
- [ ] No color or reusable dimension literal exists outside `tokens.css`.
- [ ] Child elements, states, and modifiers use native nesting, ideally no deeper than three levels.
- [ ] All referenced utilities compile against Tailwind CSS 4.3.3.
- [ ] `dashboard-first-editor.css` and `visual-prototype.css` are split per section 8 with import order preserved.
- [ ] Component-imported stylesheets declare `@reference "../app.css";`.
- [ ] `!important` survives only in the reduced-motion allowlist.
- [ ] Compliance guard, type-check, unit suite, and build pass from `builder/`.
- [ ] Playwright computed-style checks and the five-mode screenshot matrix show no visual change.
- [ ] Export golden tests are unchanged and pass.
- [ ] The demo iframe receives no builder stylesheet rules.
