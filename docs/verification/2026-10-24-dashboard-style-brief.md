# Implementation brief: production dashboard-first CSS/layout

## User-approved requirement

User loves `/?dashboard-prototype=1` visual style but demands ALL current options/properties/buttons stay, explicitly including padding. They expect only CSS and moving things around. Implement the style on ordinary `/` using **existing BuilderShell/EditorToolbar/EditorWorkspace/EditorSections**, never the reduced DashboardPrototype store or component. Do not remove or replace a single existing panel, field, option, control, event, or action. Dropdowns allowed, not required.

## One writer and bounded scope

You are sole implementation owner. Main work should be `builder/src/styles/editor-*.css` and optionally a focused new scoped production stylesheet imported after color-field.css in app.css. Keep files <=100 lines, readable selectors, no SFC style blocks. Minimal static template wrappers/reordering/classes permissible ONLY if necessary; preserve all script/event/prop wiring. Prefer CSS-only so source parity is verifiable. Do not change stores/composables/utils/registries/models/backend/demo files, App.vue, package files, or any existing prototype file. Do not add search/new editing functionality. No dependencies/branch/commit/agents.

Read builder/AGENTS.md. Ordinary production DOM and its long, full control inventory must remain; constrain/style dense rows to fit dock instead of dropping them. Apply approved restrained palette/system font, compact toolbar, tidy native controls, rounded subtle borders, selected teal states and visible keyboard focus. Do not add marketing design, special fonts, art, animations, or new features.

## Current surface inventory (verify and extend in report)

- Toolbar: primary native/text picker and palette trigger; Export theme JSON; Copy vanilla CSS; Download vanilla CSS; Export PanelProvider icon config; Export panel branding JSON; Export PanelProvider branding config; Undo; Redo; Inspector; active theme name; Manage themes; Import theme; Pair local client.
- Conditional toolbar: export/inspector/runtime/recovery statuses, Restore legacy customization, Download archived JSON, recovery errors. Theme manager Save/Create/Open/Rename/Duplicate/Delete, rename/save/confirm/cancel/close; import hidden file chooser, name/summary/confirm/cancel; pairing start/approve/cancel/disconnect/status. Preserve full conditional flows and existing dialogs.
- Navigation: Sidebar and Top navigation radios; Foundations, Components, Branding, Icons tabs, conditional Inspector tab; existing arrow/Home/End behavior.
- Foundations: all six palettes, base and all eleven shade overrides, generated ramps, edit counters, all reset/picker actions. Light/Dark preview; all six surfaces/two borders/three text values in both modes + statuses/errors/resets. Body/heading/mono font choices AND name inputs, custom/curated options. Density select + three preset buttons, all ten spacing inputs/resets, radius/border width/shadow controls/options/resets.
- Components: Product name four inheritance-scope background controls/status/resets. **Entire hierarchical padding panel**: every registry-supported target/context, Global/Section/Component/Variant/State where present; linked and separate edges, numeric values, unit choices, all inherit/native statuses, every reset. Do not replace or prune registry-generated rows.
- Branding: app name, light/dark logo and favicon uploads AND refs, errors, logo height, typography/custom family, content width/sidebar options, reset.
- Icons: pack/options, ALL semantic resource override options/previews/reset actions, reset configuration.
- Inspector: selected target evidence, raw selector/error/classification, ALL raw properties/resets, all conditional behavior.

## Layout invariants

- Production root is genuinely viewport-bounded (no browser-default margin causing outer scrollbar). Scoped .preview-shell styles only, not a global reset that changes prototypes/demo.
- Desktop1440×1000: ~340–380 px editor dock; real iframe >=65% width, most available height. Keep all production controls and radio modes; compact Sidebar rail is allowed but don't change orientation/key semantics or remove mode choice. 900×900 stays side by side usable. A horizontally scrollable toolbar is acceptable if every button remains reachable/focus-scrollable; don't add dropdowns merely to hide necessary actions or create dozens of test rewrites.
- Mobile390×844 and390×700: dashboard TOP with >=280 px meaningful height; full editor dock BELOW, independent scrolling, no page-level horizontal/vertical overflow, no preview replacement tabs. Full controls must remain reachable by dock scrolling. Toolbar can horizontal-scroll rather than consume the screen.
- Foundations/component/icon/raw grid rows must reflow to narrow dock width at desktop as well as mobile (viewport md Tailwind classes are not dock container width!). No clipped label/control/reset/unit or flex min-width overflow. Preserve ALL content; do not use display:none/truncation as a workaround that makes controls unavailable. Long identifiers can wrap.
- Styling must not unhide deliberately hidden file fields or hidden tabpanels, remove borders on preview content, or apply to the iframe document. Dialogs/pickers and conditional statuses remain usable; do not change their existing transactional workflow semantics.
- Main live-edit path leaves dashboard unobscured and stable. Existing explicit modal workflows may retain their established behavior; no new full-screen overlays. No iframe remount/src changes induced by rearranging editor; existing branding-triggered runtime refresh is intentional and must remain.

## TDD / control preservation evidence

Before edits, capture source/runtime inventory of control signatures/options/counts (including expansions/selected panels) in a fixture/report. Prefer automated regression of stable id/aria-label/name/options and generated padding target/context counts; source components and all scripts unchanged is strong additional parity evidence. Include hidden/conditional flows via existing tests/fixtures, not only default visible controls. Do not snapshot volatile generated theme ids or values.

Write and run new Playwright CLI layout/parity acceptance BEFORE implementation; record expected red for old42% dock/mobile side-by-side/no typography. Existing controls/parity assertions should already pass at baseline. Use running Compose stack: `COMPOSE_E2E=1 npx playwright test <focused specs> --reporter=line`; no server startup/install/reseed commands. Use isolated contexts; authenticate existing login user/password if padding tests require it. Serial tests, avoid overlapping shared mutable browser/demo state.

Cover settled change:

1. All toolbar actions, navigation options and every panel/property/padding row still present/reachable, by parity inventory + automated test. Test all six export/copy buttons accessible and actual representative download/copy; manager/import/pairing entry points remain. Keep dialogs open/close focus behavior.
2. Both nav modes and all tabs; inspector selected evidence and raw controls reachable. Visible focus/active state; narrow/zoom controls not clipped. Preserve keyboard navigation semantics.
3. Actual live color updates and hierarchical padding edits/reset + linked/separate/unit choices. Use existing e2e/ftb-054-padding-controls.spec.ts and affected padding evidence tests; don't modify their semantics to hide failures. Verify iframe document marker/window persists during nav/style changes (not branding updates).
4. Desktop1440,900, mobile390×844/700 (200% zoom320 effective width as practical): iframe+editor bounds, no outer overflow; mobile iframe above dock; scroll long Components/Padding/Branding without dashboard moving away.
5. Existing ftb-050-editor-layout.spec.ts expects side-by-side at640; update only geometry expectations directly superseded by approved mobile layout, preserve all controls/keyboard/iframe invariants. Do not skip/remove tests just to turn green. If dropdowns used, adapt relevant tests through semantic disclosure opening rather than weakening action checks.

Run relevant existing integration checks once on settled code (at least layout, padding, color-picker, branding/icons, local-theme/import/pairing entry coverage selected based on changed surface). Full `npm run type-check`, `npm run test:unit -- --run`, `npm run build` from builder required. Full unit previously533 passed216s; use explicit adequate timeout (~600000ms), inspect active Vitest before restart, no blind repeats. Record actual failures and pause if unrelated; do not expand into backend fixes. Run git diff --check.

## Report and handoff

Record baseline+final control parity, exact changed files, domain code untouched, command/cwd/outcomes and tested HEAD+final relevant file hashes in docs/verification/2026-10-24-dashboard-style-evidence.md. Record any abstractions and duplicated pattern rationale before extracting; CSS sharing typically suffices. Update progress ledger beside brief.

Capture normal `/` (NOT prototype) screenshots in docs/verification/dashboard-style/: desktop.png1440×1000; components-padding.png1440×1000 with padding controls visibly present; mobile.png390×844. Hide only Vue devtools screenshot overlays (parent+iframe), not real UI. Show actual full editor and live dashboard. Controller owns review/handoff, no agents/reviewer/commit. Return review-ready report, precise parity inventory and evidence, screenshots, actual blockers.
