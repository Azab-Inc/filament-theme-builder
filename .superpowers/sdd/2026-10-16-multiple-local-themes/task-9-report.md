# Task 9 — FTB-021 final integration report

## Verification status

**Incomplete — environment prevented the full configured Compose suite from reaching a
terminal Playwright result.** The existing focused FTB-021 evidence remains valid and
is preserved below. No full-suite pass/failure claim is made.

## Commands and results

- `cd builder && npm run type-check && npm run test:unit -- --run && npm run build` — **PASS**; 79 unit files, 333 tests, and production build passed.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-021-local-themes.spec.ts` — **PASS**; 4 tests passed.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test` — **INCOMPLETE; no exit status**. The runner was terminated by the execution harness after `1,200,000 ms` (20 minutes), before Playwright printed its summary. It reported `Running 113 tests using 1 worker`; observed through test 97: `1 passed`, `57 failed`, `39 skipped`, and `16 not started`. The 39 skips were fail-fast skips after earlier failures, not explicit configured skips. The 57 observed failures were:
  - `e2e/demo-panel.spec.ts:42` — exposes coherent navigation and stable seeded resources.
  - `e2e/demo-showcase.spec.ts:35` — public showcase index groups real pages and exposes native presentation surfaces.
  - `e2e/entity-resource-smoke.spec.ts:4` — customers and products resource indexes and product detail load.
  - `e2e/ftb-007-bridge.spec.ts:7,39,87` — allowed-parent bridge, hover/selection evidence, and invalid-origin/source/version rejection.
  - `e2e/ftb-007-inspector.spec.ts:15,31,42,50,68,80` — Inspector toggle, outlines, selector-only breadcrumb, mapped input, nested click, and navigation clearing.
  - `e2e/ftb-008-raw-inspector.spec.ts:16,41,55,77,91,122` — raw edit, fragile selector/export, download, clipboard, clean fixture, and bridge rejection.
  - `e2e/ftb-018-branding.spec.ts:4` — branding draft preservation and runtime preview refresh.
  - `e2e/ftb-021-local-themes.spec.ts:28,58,94,119` — create/manage, persistence/history, keyboard/focus, and storage failure journeys.
  - `e2e/ftb-050-editor-layout.spec.ts:13` (desktop, intermediate, narrow), `:55`, `:69`, `:97`, `:156`, `:188`, `:263`, `:276` — layout, routes, keyboard, tabs, iframe identity, zoom, breakpoint, and navigation journeys.
  - `e2e/ftb-053-characterization.spec.ts:11,36,52`, `:78` (prototypes A/B/C), `:104`, `:131` (prototypes A/B/C) — upload, rejection, stylesheet, prototype layouts/selectors/CSS.
  - `e2e/local-theme-manager.spec.ts:4` — accessible manager, Escape focus restoration, and rename.
  - `e2e/native-default-styles.spec.ts:6,92,107` — native dashboard/table styles, browser defaults, and legacy migration.
  - `e2e/smoke.spec.ts:4,52,80,89,101,280,305,358` — builder embed, primary-color bridge, login, public preview, allowlist, credentials/logout, gateway, and demo Vite/API proxy.
  - `e2e/theme-foundations.spec.ts:59,75` — malformed persisted JSON recovery and red Tailwind shade reference.
- The first run’s observed infrastructure error was repeated gateway `502 Bad Gateway` responses because Caddy timed out connecting to `builder-vite:5173`, `demo-vite:5173`, and `demo-php:80`.
- `docker compose -f compose.dev.yaml down && docker compose -f compose.dev.yaml up -d ...` (stack recovery attempt) — **FAIL**; Compose recreation left both Node services stopped/unhealthy. `builder-vite` exited `146` after npm `ETIMEDOUT`/`network read ETIMEDOUT`; `demo-vite` exited `1` after npm failed downloading `https://registry.npmjs.org/yuku-parser/-/yuku-parser-0.5.48.tgz`. The gateway never started, so a second full Playwright run was not possible.
- `git diff --check` — **PASS** after the evidence edits.

## Boundary and acceptance audit

- The focused journey covers create/open/rename/duplicate/delete with confirmation and active fallback, 300 ms persistence/reload, per-theme history after reopen, dialog keyboard focus/Escape/restoration, and visible non-blocking storage failure recovery.
- `ThemeStateV4` and `theme-serialization.ts` are unchanged across the FTB-021 implementation range. The active editor continues to consume the existing store `theme`; local collection metadata is not serialized into canonical theme state.
- Local-theme components contain no `localStorage`/`sessionStorage` access. Storage and persistence remain in `local-theme-storage.ts` and `use-local-theme-persistence.ts`.
- The inventory contains the single intended `builder.local-themes` UI-only row and explicitly defers MCP to FTB-048. No MCP implementation or dependency change was made.
- No dependency manifest or lockfile changed in the FTB-021 implementation range.
- All maintainable `builder/src` `.ts`/`.vue` source files are at or below 100 lines; the only longer file is the 151-line local-theme storage test, which is test code rather than maintainable application source.
- Existing repository type-boundary exceptions remain visible: several pre-existing component-local `.model.ts`/`.dto.ts` files and the local-theme storage result aliases are outside `models/`/`dtos/`. No canonical model duplication was introduced, and this integration task did not rewrite unrelated boundary work.

## Deferred and remaining gaps

- The FTB-020 preset-isolation criterion and Playwright journey are explicitly deferred because FTB-020 is not implemented. This report and `TICKETS.md` make no preset-support claim.
- The full-suite attempt is not evidence that FTB-021 is broken: the Compose gateway was unavailable and the run never reached a terminal result. The four FTB-021 failures observed in the interrupted run are recorded verbatim above; they are environment-contaminated by the same gateway timeouts.
- Pre-existing dirty files were preserved: `.gitignore`, `builder/AGENTS.md`, `builder/src/models/local-theme.model.ts`, `demo/tests/Feature/FilamentPanelTest.php`, and three untracked plan documents.

## Intended evidence change

Only the FTB-021 section of `TICKETS.md` is updated with reproducible focused evidence,
the incomplete full-suite attempt, the FTB-020 deferral, and MCP deferral. This report
does not upgrade the full-suite claim or alter FTB-020/FTB-048 scope.
