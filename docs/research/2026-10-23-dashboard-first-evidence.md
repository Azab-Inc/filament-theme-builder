# Dashboard-first prototype evidence

## Scope

Added the DEV-only `/?dashboard-prototype=1` cohesive shell. It keeps one real same-origin Filament iframe permanently visible, uses `usePreviewTheme` with the dedicated non-persistent Pinia draft store, and never writes production `ftb-theme*` storage. Desktop uses a compact left dock and dominant preview; mobile keeps the dashboard above an independently scrolling dock, without workspace tabs. The export disclosure is an in-flow toolbar row and performs a browser-only JSON download.

Shared dashboard markup is intentionally absent from the prototype: the iframe is the actual demo dashboard. New source files are all below 100 lines.

## Test-first evidence

Before implementation:

`COMPOSE_E2E=1 npx playwright test e2e/dashboard-first-prototype.spec.ts --reporter=line` — expected red against the missing gate: no dashboard prototype controls/route; existing app also failed the prototype-specific bounds and interaction assertions.

Final focused run from repository root, Compose gateway `http://127.0.0.1:4175`, `COMPOSE_E2E=1`:

`COMPOSE_E2E=1 npx playwright test e2e/dashboard-first-prototype.spec.ts --reporter=line` — **3 passed**, 10.4s.

Coverage proves the real iframe dashboard heading, desktop bounds, live primary-color CSS, stable `src`, no local sample dashboard, dock search/group/export without reload or iframe coverage, mobile dashboard height and simultaneous controls, live surface CSS feedback, and absence of Edit/Preview replacement tabs.

## Required checks (baseline before repair)

From `builder/`:

- `npm run type-check` — exit 0.
- `npm run build` — exit 0; Vite production build passed.
- `npm run test:unit -- --run` — exit 0: **123 files, 533 tests passed**, 216.13s. This successful full-suite evidence predates repair 1 and remains reusable because production surfaces were not changed. No active Vitest process existed before that single settled run; no blind retry was performed.

## Screenshots

Captured after the final implementation in the running Compose browser:

- `editor-guidelines/06-dashboard-first-after.png` — 1440×1000, real Filament dashboard dominates the workspace.
- `editor-guidelines/06-dashboard-first-mobile-after.png` — 390×844, real dashboard above visible controls.

## Final revision and hashes

Observed HEAD: `86ff5de966fb417b767a440a83976770b3c17fac`.

```text
f244e90d3acb29041bc9d9a6ada7fe7a0ec003875511516e5f3b8c333ab0491d  builder/src/App.vue
29a56715eeea102da45fddb7f18af5a67d7a0339c5edc9b84f6c8d8c2d6c09c5  builder/src/components/DashboardPrototypeControls.vue
bfd62f5ee9ee6ef605ba5f22ec2f29d66fca0e684a732ba71178ad4d6baf9417  builder/src/components/DashboardPrototypeField.vue
1e764558bd00ab7d7150fe992cfa3013aa36bf768127149e198feac3dc4ac191  builder/src/components/DashboardPrototypeToolbar.vue
e03b775e45608b3d0d8a9cc918ead120ff97f80e62b9973f49f1c9a069583336  builder/src/components/DashboardPrototype.vue
749e6587ba89025340db8462a0aeac36a5baec17876d6de27d6c0c339d03778e  builder/src/stores/dashboard-prototype.ts
19b97e63d29c22f46e97b611fe4f3db22e22521a264e39610841246e8fcc84c9  builder/src/styles/dashboard-prototype.css
7e6aca2a9c32fb0efdbacfdb098f13a1546f94892effe2bb97e4cb0530a7d9bf  e2e/dashboard-first-prototype.spec.ts
e10d39cf742eed7a7ae7c303efe66162ea4b3ee1addc2ab423a6464f648e85c7  docs/research/editor-guidelines/06-dashboard-first-after.png
df38e6a6a4bdbdb9bc6fdb4ae8f64970459bb0df4cc755ac5ec3794d882423a5  docs/research/editor-guidelines/06-dashboard-first-mobile-after.png
48de0c37f72bc5700cd2cef21a5a50f7421ea20ff972c60cd6dce86e73fad74d  docs/research/editor-guidelines/06-dashboard-first-feedback.png
```

## Limitations

This remains a development-only visual prototype. Editor controls send draft foundation messages through the existing bridge, with browser-only export and no production theme persistence or new backend/MCP capability. The real embedded demo retains its normal interactions; this prototype does not enforce a read-only sandbox.

## Repair 1 evidence

Tests were strengthened before the repair and the expected-red run failed on missing All/default controls, empty-state/clear behavior, bounded viewport height, reset actions, field metadata, invalid draft handling, download, and identity/storage assertions. The settled focused command was:

`COMPOSE_E2E=1 npx playwright test e2e/dashboard-first-prototype.spec.ts --reporter=line` from repository root — **3 passed**, 16.0s.

Repair implementation adds canonical `resetFoundation` actions for primary, surface, density, and radius; per-field draft/error state with `aria-invalid`/`aria-describedby`; a reusable field/reset shell (the repeated field/reset structure is centralized there); All plus group filters; real JSON download; bounded fixed viewport composition; and iframe marker/contentWindow identity, download, storage, 900×900, and 390×700 assertions. `npm run type-check` and `npm run build` from `builder/` both passed after repair. The prior successful full unit suite was not rerun because this repair only changed prototype code. Screenshots were regenerated, including optional `06-dashboard-first-feedback.png` with primary `#0f766e` and surface `#eeeeee`.

## Repair 2 evidence

The mobile regression first failed because the dock rendered above the dashboard (`iframe bottom 844 > dock top 132.84`). The focused fix adds explicit mobile flex ordering: preview `order: 0`, dock `order: 1`; desktop remains dock-left. The same focused spec now injects a unique iframe document property/node, retains and verifies the actual `contentWindow`, checks representative iframe center hit-testing while export is open, and verifies dashboard bottom ≤ dock top at both 390×844 and 390×700.

- `COMPOSE_E2E=1 npx playwright test e2e/dashboard-first-prototype.spec.ts --reporter=line` — **3 passed**, 13.4s.
- `npm run type-check` from `builder/` — reused successful result from the unchanged TypeScript source surface.
- `npm run build-only` from `builder/` — exit 0 after the CSS repair.
- Only `06-dashboard-first-mobile-after.png` was regenerated; desktop screenshot was unchanged. Vue devtools containers were hidden with capture-only CSS before the mobile capture.

Repair-2 hashes: `19b97e63d29c22f46e97b611fe4f3db22e22521a264e39610841246e8fcc84c9` (`dashboard-prototype.css`), `7e6aca2a9c32fb0efdbacfdb098f13a1546f94892effe2bb97e4cb0530a7d9bf` (focused spec), and `df38e6a6a4bdbdb9bc6fdb4ae8f64970459bb0df4cc755ac5ec3794d882423a5` (mobile screenshot). Prior full unit evidence remains valid and was not rerun.

## Controller acceptance and final screenshots

Independent read-only review approved reset/viewport repairs for spec/correctness and quality. Controller checked the subsequent narrow CSS ordering patch and its regressions: mobile dashboard above controls, actual injected document marker/window persistence, and representative iframe hit testing with export open. No unresolved scoped blocker remains.

Controller recaptured the final desktop before/default-after/live-feedback images and mobile-after in fresh Playwright contexts against Compose. Earlier screenshot hashes above describe earlier captures and are superseded by this final capture (implementation hashes remain unchanged). Capture-only CSS hid Vue devtools/inspector overlays in both parent and iframe. Actual theme bridge output was awaited before live-feedback capture.

Final mobile measurement at 390×844: iframe y=54, height=379.1875, bottom=433.1875; dock y=433.1875, height=410.8125; no outer-page horizontal/vertical overflow. Desktop screenshot displays real dashboard feedback after primary `#0f766e` and page surface `#eeeeee`.

Gallery/description: `2026-10-23-dashboard-first.md`. No commits made by this task.
