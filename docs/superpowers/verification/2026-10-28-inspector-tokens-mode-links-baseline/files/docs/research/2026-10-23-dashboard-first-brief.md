# Approved revision: one dashboard-first editor prototype

## User intent and non-negotiable acceptance

The user rejected most previous guideline prototypes because they hid the dashboard: “one of the key points is that the filament dashboard is always in view for live feedback”. They explicitly selected one cohesive layout. The REAL Filament dashboard must dominate the workspace and remain visibly present during every editing/search/group/export interaction, on desktop and mobile. Editing must update actual iframe styles, not a sample swatch alone.

## Ownership

One implementation writer. Preserve ALL existing dirty work and prior Guidelines*/VisualPrototype* files; do not replace/remove them. Add a distinct DEV-only async mount via `?dashboard-prototype=1` in App.vue, retaining all existing branches. Create new `DashboardPrototype*` components, `use-dashboard-prototype*` composable if needed, dedicated memory-only Pinia store/models, scoped CSS, and `e2e/dashboard-first-prototype.spec.ts`. Follow builder AGENTS.md and existing Vue/TS/Tailwind. No third-party dependencies, branch changes, commits, backend edits, production storage, or new product/MCP capabilities.

## Design direction

- This is a functional visual prototype around the editor/real preview, not a settings landing page. Keep page-level chrome compact (roughly 56–64 px), system typography, restrained borders and accent colors.
- Desktop: single editing dock ~320–360 px on the left; actual Filament iframe fills the remainder. Preview should occupy >=60% at 1280/1440 widths and most available height. No giant headings/explanatory panels taking preview space.
- Dock: grouped controls with clear active state, a small actual search, editable primary palette and surface token with source/resolved/inherited status, useful supported layout controls (e.g. density/radius). Real controls in a focused foundations prototype, not fake Branding/Icons/Inspector placeholders.
- Search + group nav operate only within dock. URL state can retain useful location; live iframe identity/src/window remain stable during foundation changes and navigation. Never remount/key/replace it to switch groups.
- Mobile 390×844: real dashboard top ~45–55% of available viewport height, full-width independently scrolling dock below. Both simultaneously in view. Do NOT introduce Edit/Preview tabs or shrink dashboard to a decorative thumbnail. Desktop/tablet responsive behavior must work at 900 px as well.
- Toolbar: working draft history if exposed, subtle “Prototype · Unsaved draft” indicator. Export options should be a dock-contained/toolbar-anchored disclosure, not a modal/backdrop over dashboard. Only expose real working actions (a browser-only draft JSON download is fine; otherwise omit Export rather than fake choices).
- Focus-visible states, skip links hidden until focused, labels/name/autocomplete/spellcheck on technical inputs, useful inline validation, honest active state, adequate touch targets/safe areas. No fixed prototype bar covering iframe or controls; one prototype needs no variant switcher.
- Existing ColorField can be reused if it fits, but prevent any popover from covering dashboard. Avoid repeated markup >2 times; explain duplication before creating abstraction. Prefer focused components instead of arbitrary split/minified long lines. All new files <=100 lines, no SFC style blocks.

## Integration strategy (verified entry points)

- `usePreviewTheme` accepts `PreviewThemeStore = Pick<ReturnType<typeof useThemeStore>, 'theme'|'previewFoundation'>`; it does not require production persistence. Reuse it with memory-only draft state. `createDefaultCurrentThemeState()` returns V5; `projectFoundations` and `generatePalette`/provenance helpers exist.
- Existing `useThemePaletteActions`, `useThemeFoundationActions`, `useThemeProjection` take a ThemeStoreContext (`theme` ref and registry); inspect/reuse appropriate actions rather than cloning domain behavior. Use a dedicated Pinia store WITHOUT `useThemeStore`, which initializes localStorage persistence.
- `usePreviewTheme` posts `ftb:theme:update`, runs projectPadding, manages theme mode, and iframe onload; wire to real `/demo/admin` via `import.meta.env.VITE_DEMO_URL ?? '/demo/admin'`. No hand-written CSS mutation of iframe as substitute for real bridge; no mock dashboard.
- `PreviewFrame` is existing slot+iframe and can be reused with carefully scoped responsive styles, or mount one permanent titled iframe yourself. Scope styles to new prototype so ordinary editor does not change.
- Only actual preview document-origin storage written by Filament itself is allowable; no production `ftb-theme*` writes from prototype edits. Avoid allowing navigation of preview controls to accidentally mutate demo data in tests; tests change only editor controls.

## TDD / verification

Before implementation write/run Playwright CLI regression against running Compose: `COMPOSE_E2E=1 npx playwright test e2e/dashboard-first-prototype.spec.ts --reporter=line`. Verify expected red due missing gated prototype. Then implement and pass.

Cover actual iframe DOM and CSS, not just iframe existence:

1. Desktop actual dashboard heading/content loaded; preview region >=60% at 1440×1000 and usable at 900×900; editor controls visible and no page-level overflow.
2. Primary color and at least surface value changes affect actual iframe computed CSS/style through normal bridge. Invalid color preserves last valid output and gives inline actionable error; reset restores inheritance/default visibly.
3. Search, group changes, history, mode/controls if exposed, and Export opening never hide/unmount/reload or cover iframe. Record contentWindow/document marker and src, check unchanged. With disclosure open, hit-testing representative iframe points still finds iframe (no overlay).
4. Mobile 390×844 (also short 390×700 if practical): iframe + dock both intersect viewport with meaningful bounds; dashboard height >=280 px; control edits cause actual preview feedback. Dock scroll does not scroll dashboard away. No preview workspace replacement control.
5. Draft changes do not modify existing `ftb-theme*` localStorage; normal route and existing prototype routes remain unchanged. Use isolated contexts.
6. Keyboard focus/skip links, meaningful current state, all exposed actions work. Any export test verifies real download rather than fake success.

Run `npm run type-check`, `npm run test:unit -- --run`, `npm run build` from builder. Prior full suite had timeout failures/command timeout with unknown attribution. Inspect for active Vitest processes before running; use ONE settled full suite, explicit adequate timeout, no repeated blind attempts. If timeout persists document actual result; do not fix unrelated tests. Focused Playwright and applicable unit tests during iteration.

## Evidence and screenshot handoff

Record exact commands, cwd, expected-red and final outcomes, HEAD + final-file hashes, known limitations in `docs/research/2026-10-23-dashboard-first-evidence.md`. Update revision-2 progress row in existing ledger. Generate real screenshots under `docs/research/editor-guidelines/`: `06-dashboard-first-after.png` 1440×1000 (real dashboard dominates), `06-dashboard-first-mobile-after.png` 390×844, optionally `06-dashboard-first-feedback.png` same desktop with visible changed color/surface. Hide only Vue devtools overlay for screenshot via capture CSS, not product elements. Controller owns description/before comparison and independent review. Preserve prior pairs.

Return implementation summary, file list, evidence results, screenshot paths, limitations, and review-ready state. Do not spawn agents/reviewers or run unrelated workflows.
