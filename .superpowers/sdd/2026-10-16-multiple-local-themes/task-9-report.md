# Task 9 — FTB-021 final integration report

## Verification status

FTB-021 focused verification passed. The full configured Compose suite did not pass because two unrelated existing journeys failed; FTB-021 is not implicated by either failure.

## Commands and results

- `cd builder && npm run type-check && npm run test:unit -- --run && npm run build` — **PASS**; 79 unit files, 333 tests, and production build passed.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-021-local-themes.spec.ts` — **PASS**; 4 tests passed.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test` — **NOT CLEAN**; 105 passed, 2 failed, 3 explicit skips, and 3 did not run. Failures were `e2e/demo-showcase.spec.ts:423` (missing `Explicit` status) and `e2e/native-default-styles.spec.ts:107` (legacy foundation migration expected border width `1`, received `4`).
- `git diff --check` — **PASS**.

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
- The full-suite failures listed above remain outside FTB-021 and should be handled by their owning demo/foundation work.
- Pre-existing dirty files were preserved: `.gitignore`, `builder/AGENTS.md`, `builder/src/models/local-theme.model.ts`, `demo/tests/Feature/FilamentPanelTest.php`, and three untracked plan documents.

## Intended evidence change

Only the FTB-021 section of `TICKETS.md` was updated with verified checklist evidence, focused/full-suite results, the FTB-020 deferral, and MCP deferral. This report is the final FTB-021 evidence file.
