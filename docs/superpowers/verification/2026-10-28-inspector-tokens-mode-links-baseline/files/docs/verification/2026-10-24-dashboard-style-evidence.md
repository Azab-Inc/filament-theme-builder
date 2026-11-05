# Production dashboard-first style evidence

## Scope and implementation

Applied the approved dashboard-first presentation to the ordinary `/` editor using only `builder/src/styles/dashboard-first-editor.css` imported by `builder/src/app.css`. Existing `BuilderShell`, `EditorToolbar`, `EditorWorkspace`, `EditorSections`, iframe, stores, composables, utilities, registries, events, and conditional workflows were not changed. No prototype, App.vue, domain, backend, package, or script files were modified.

The stylesheet is scoped to `.preview-shell` and keeps the full editor dock. Desktop uses a bounded dock with the real dashboard filling the remainder; Sidebar mode retains its existing 9rem parent grid track, with the rail width now `auto` so parent and child agree. Mobile explicitly uses a 6rem rail. Top navigation remains available in both layouts. Typography inherits a compact 13px/1.45 scale, and fieldsets, rows, padding value/unit controls, source text, labels, statuses, and reset actions are constrained with `min-width: 0` rather than hidden or truncated. Existing toolbar actions remain horizontally reachable. The repeated field-row layout is shared through CSS selectors rather than a new abstraction; no new control markup was introduced.

## Baseline inventory before style edits

The focused layout acceptance was written and run before production CSS changes:

`COMPOSE_E2E=1 npx playwright test e2e/dashboard-style.spec.ts --reporter=line`

Expected red: **3 failed** — old desktop iframe width was 795.375px (<900), old mobile layout placed the iframe beside the editor rather than above it, and the original inventory selector was corrected from button to semantic tab. The corrected inventory assertion then passed at baseline.

Runtime/source inventory on ordinary `/` before/independent of style behavior:

```text
toolbar/editor buttons: 150
inputs + textareas: 87
selects: 43
editor tabs: 4
Sidebar/Top radio modes: 2
registry padding target/context markers: 29
iframe src: /demo/admin
```

Source inventory covers toolbar export/copy actions, theme manager/import/pairing entry points, palette/surface/typography/layout controls, component controls, generated padding targets, branding, icons, raw inspector, resets, and conditional workflows. Runtime counts above describe the inspected mounted state, not every possible conditional state. CSS does not remove or replace the underlying DOM/control definitions. Production component templates, scripts, option lists, handlers, and registries remain unchanged.

## Final focused verification

Focused production layout/parity:

- `COMPOSE_E2E=1 npx playwright test e2e/dashboard-style.spec.ts --reporter=line` — **5 passed**, 28.6s after repair. Before repair, the two new reachability tests failed: `keeps every padding editor control inside the dock after expansion and scroll` (99 controls exceeded dock bounds) and `reflows foundations, branding, and icons without clipped controls in both nav modes` (branding and Foundations controls exceeded dock bounds). Both now pass at 1440×1000, 900×900, 390×844, and 390×700.
- `COMPOSE_E2E=1 npx playwright test e2e/ftb-050-editor-layout.spec.ts --reporter=line` — **8 passed / 2 failed**. Exact failures: `exposes complete tab and tabpanel relationships` (expected `danglingReferences: []`, found 20 color-popover/palette `aria-controls` IDs) and `reaches branding, icon, raw, and Inspector controls from navigation` (strict locator expected one `Product name global background` textbox but source exposes native color + text inputs). The same two failures were recorded in the pre-repair run; source markup/components were unchanged, so they are not CSS regressions. The superseded narrow side-by-side geometry and all action/navigation/iframe checks pass.
- `COMPOSE_E2E=1 npx playwright test e2e/ftb-054-padding-controls.spec.ts e2e/color-picker-tailwind.spec.ts e2e/theme-create-defaults.spec.ts --reporter=line` — **5 passed**; live color selection, hierarchical padding keyboard/reset, narrow zoom, defaults, and preview behavior pass.
- `COMPOSE_E2E=1 npx playwright test e2e/theme-icons.spec.ts --reporter=line` — **1 passed / 1 failed**. Exact remaining failure: `persists icon state and exports JSON plus PanelProvider PHP` (the test polls legacy localStorage `ftb-theme`, which remains `null`). Controller subsequently confirmed the active keyed storage/reload/export path succeeds; see the targeted diagnostic below. The existing test itself was not changed or rerun.
- `COMPOSE_E2E=1 npx playwright test e2e/ftb-021-local-themes.spec.ts e2e/local-theme-manager.spec.ts e2e/ftb-022-relay-pairing.spec.ts e2e/ftb-022-browser-relay-import.spec.ts --reporter=line` — **10 passed**, 1.1m.
- `git diff --check` — passed.

Required Vue checks from `builder/`:

- `npm run type-check` — exit 0.
- `npm run build` — exit 0.
- Full unit evidence remains reusable: prior settled run recorded **123 files / 533 tests passed** in 216.13s. It was not rerun because this change is scoped CSS/layout only and does not invalidate unit behavior.

## Screenshots

Captured from ordinary `/` with the real editor and dashboard, hiding only Vue devtools containers in the parent and same-origin iframe for capture:

- `dashboard-style/desktop.png` — final capture 1440×1000.
- `dashboard-style/components-padding.png` — 1440×1000, Components panel with padding controls present.
- `dashboard-style/mobile.png` — 390×844, real dashboard above full editor dock.

## Final hashes and status

Observed HEAD: `86ff5de966fb417b767a440a83976770b3c17fac`.

```text
7e216281cf2178eda5d9a4aa7549b7231831c8bcc832d85b58c83e64f6d33050  builder/src/app.css
7991fb2fcc9f560c5dd7c411216aa637934ae15854c7c60da39eb4e706549b84  builder/src/styles/dashboard-first-editor.css
62ef934a195d496e48ae0e3aba08a57d89d1a467ab5746ac8370d408d2997855  e2e/dashboard-style.spec.ts
41b22d1ecdafe72cacd567093b37fefbe97bf2605d0b8fd88413e162bf986fd2  docs/verification/dashboard-style/components-padding.png
b4bd3cea6030c6db79986f2f857df429091735bdd2d90611a0a8e5efa915a008  docs/verification/dashboard-style/desktop.png
26148980c24f50a6a286aaae036eecd64ecd8c22d8c33aea563db4c0ec0e299a  docs/verification/dashboard-style/mobile.png
```

Independent read-only review approved the repaired CSS for spec/correctness and quality. No commit, dependency, branch, production behavior, or unrelated work was added.

## Controller acceptance and additional diagnostic

- Reviewed exact production code delta: one scoped new stylesheet and one import in app.css. No component template/script, event, property definition, option list, padding registry, store, or domain code was changed by this task. No controls were removed.
- Reviewer approved clipping/scope repairs. Its nonblocking report corrections are reflected above: desktop Sidebar remains 9rem, mobile6rem; the tests count at least29padding markers and check their mounted control bounds plus representative expand/reset/last-row reachability, not every possible unit/context mutation.
- Concrete icon diagnostic in a fresh Playwright context: selected pack `mini` and Orders override `heroicon-m-cube`; awaited `ftb-theme:<active-id>` via `ftb-theme-active`; reloaded; both values persisted. Legacy `ftb-theme` remained null, explaining the older test failure. Downloaded JSON contained icons.pack=`mini` and Orders override; PanelProvider PHP contained `->icons([` and `heroicon-m-cube`. Read-only source confirms storage key contract in `utils/local-theme-storage.ts:22`. No application/test change was made for this out-of-scope obsolete assertion.
- Final screenshot recapture uses actual production `/`, Top navigation selected solely for presentation, desktop1440×1000 and mobile390×844. Sidebar remains available and tested. Only Vue devtools/inspector overlays were hidden in parent/iframe for capture. Screenshot hashes in the earlier block describe superseded captures; implementation/test hashes remain current.
- Final mobile bounds: iframe top169.40625,height310.3125,bottom479.71875; editor starts479.71875,height364.28125; page390×844 with no outer overflow. Padding screenshot shows live full editor's forms.input Global numeric/unit/reset controls alongside the real dashboard.
- Three older broad-suite assertions remain red: two unchanged markup/accessibility/strict-locator assertions and the confirmed legacy-storage assertion. Focused styling and successful workflow evidence are not a claim that every repository suite is green.
