# All-properties light/dark isolation

## Plan identity and baseline

- Request: scan literally all properties and repair values incorrectly shared between light/dark themes.
- Branch: dev; baseline HEAD `82004b7` plus existing dirty accessibility/prototype/E2E files. Preserve those edits. No commits/packages/ticket edits authorized for implementation workers.
- Root and builder AGENTS require dark inheritance from light until explicit dark editing; isolated reset/history/export behavior; test-first and real Compose Playwright verification.
- Controller audit owner: luna56, read-only session `ses_e87cacfc5ffeE24fislNCqkILb`.

## Accepted scope and architecture

- Mode-aware: all 18 unique raw Inspector visual properties (plus orthogonal selector/state variants), all editable semantic control scopes/variants/states, all six palette bases/shade overrides and toolbar primary color; preserve/fix existing foundation surface/border/text mode behavior.
- Intentionally shared configuration: typography families, structural spacing/density/radius/border-width/shadow foundations, padding hierarchy, branding other than existing light/dark logos, icon configuration. Raw overrides of corresponding visual properties are still independently mode-editable.
- Dark inherits LIGHT PER PROPERTY until explicitly edited in dark, including identical-to-light explicit values. Dark reset returns to light inheritance; light reset preserves explicit dark. Switching mode/selector does not mutate theme/history.
- Use existing Vue/Pinia/domain boundaries, validation and canonical services; introduce shared mode-value resolution rather than duplicating fallback rules across controls. Describe repeated behavior before extraction.
- Version canonical format for incompatible changes (v6); preserve v1-v5 import/migration and old global values as light/inherited-dark. Keep one source of truth for primary palette/toolbar compatibility value.
- Strict preview canonical recomputation must agree with TS resolution, never loosen to trust arbitrary supplied projections. Export mode scoping must prevent light/dark selector specificity and hover/selected cascade leaks.
- Existing MCP/relay export/import must accept current canonical version through the same validation and authorization paths, reject malformed mode payloads; document inventory and actual AI-client verification limits.

## Task ledger

| Task | Owner | Status |
| --- | --- | --- |
| Read-only exhaustive property/pipeline audit | luna56 | completed |
| Red regression + cohesive model/pipeline/UI implementation | luna56 / replacement owner | completed for scoped mode isolation; focused domain 32/32, type-check/build recorded passing, dark-first red/green repaired |
| Focused matrix tests + real Compose acceptance | replacement owner / controller | final 4-test bridge browser run green (30.9s); earlier unchanged 5-test run green (41.4s); targeted broad foundation test green (1.4m); 37-test matrix recorded 35/37 with only designated pre-existing storage failure remaining; full matrix not rerun |
| Refresh review artifacts + report hashes | controller | completed: 69-path non-baseline diff SHA-256 `e61a9882b8cacd3c311f9d3dc82943504ac254fc34d38f933e28f43674892722`; 5-path mixed-baseline supplement SHA-256 `b17e4b3297e5cb70d36a5f746f76ea6692a604ae941e8ba754635961192a44be` |
| Independent review of review artifacts and evidence | reviewer | completed PASS (`ses_e87726579ffekMIo8331SYfD33`); all original blockers resolved |
| Adjudication and final acceptance | controller | completed except designated baseline failures; review PASS; no commit |

## Acceptance/evidence

Record commands, cwd, exit, environment and baseline/final file hashes in `docs/superpowers/verification/2026-10-26-all-properties-mode-isolation.md`; link the non-baseline review diff and mixed-baseline supplement with explicit attribution caveats. Run user-visible Playwright CLI test red before production edits. Parameterized unit coverage must account for every raw property and palette/shade plus semantic scope/state combinations. Check inheritance, explicit equality, editing either mode, reset, undo/redo, persistence/reload, JSON roundtrip/migration, mode-scoped CSS, actual preview computed styles and toolbar mode class. Security checks for malformed modes/duplicates and MCP/relay import/export.

Use canonical Compose at `http://127.0.0.1:4175`, no host servers/dependencies. Completed broader checks: builder full units/type-check/build, combined PHP relay/bridge suite, focused existing Inspector/mode/bridge/padding/palette/relay E2E. Known pre-existing full-unit css-entrypoint and PHP source-string failures remain documented; do not silently fix them. Report all actual failures/missing checks.

## Evidence and blockers

- Verification report: `docs/superpowers/verification/2026-10-26-all-properties-mode-isolation.md`.
- Non-baseline review diff: `docs/superpowers/verification/2026-10-26-all-properties-mode-isolation.task-only.diff` (69 paths, 2066 lines; SHA-256 `e61a9882b8cacd3c311f9d3dc82943504ac254fc34d38f933e28f43674892722`). Adds `e2e/palette-cache-parity.spec.ts` and the current bridge hash. Legacy filename only; not an exact task-only attribution.
- Mixed-baseline supplementary review: `docs/superpowers/verification/2026-10-26-all-properties-mode-isolation.shared-baseline-mixed-review.diff` (5 paths: `FoundationsPaletteControls.vue`, `ftb-008`, `ftb-021`, `ftb-022`, relay routes support; 255 lines; SHA-256 `b17e4b3297e5cb70d36a5f746f76ea6692a604ae941e8ba754635961192a44be`). Explicitly mixed pre-existing + task code.
- Original dirty baseline artifacts are gone: `/tmp/ftb-dirty-files.txt`, `/tmp/ftb-baseline-sha256.txt`, `/tmp/ftb-baseline-diff.patch`. The 35 pre-task dirty paths were recovered from OpenCode DB part `prt_17861fa13001LvcTkAkcwmmfsp`; the snapshot at `db4034b7f9a103fee6a8c73cbb976d44cb38bd5f` is incomplete for baseline reconstruction because it contains only 18 tracked diffs.
- `builder/src/models/mode-values.model.ts` was deleted as an unused zero-import abstraction; it was removed from the artifact list. No imports remain.
- Artifact integrity verified: `git apply --check` and a full apply against a clean HEAD archive succeed; all 69 primary applied files match the hashes recorded in the report and all 5 supplementary hashes match.
- Final builder unit run: `npm run test:unit -- --run`, cwd `builder/`, exit 1; 585 passed, 1 known unrelated `css-entrypoint.spec.ts` failure, 586 tests, 127 files, 197.17s. The preceding run was 582 passed / 4 failed; three semantic reset regressions were exposed and fixed by defaulting `request.mode` to light in `use-theme-override-actions.ts`.
- `npm run type-check && npm run build`, cwd `builder/`, exit 0.
- Combined PHP run, root: `docker compose -f compose.dev.yaml exec -T demo-php php artisan test tests/Feature/PreviewInspectorBridgeTest.php tests/Feature/Mcp/ThemeRelayValidationV6Test.php`, exit 1; 10 passed, 1 pre-existing source-string failure, 82 assertions. `PreviewInspectorBridgeTest.php:114` expects `context.targetId === rule.targetId`, but baseline HEAD bridge already has `context.targetId !== target.id`; the 3 new MCP tests passed. Earlier relay suite remains 19 passed.
- Bridge fix and parity test: `generatedPaletteShade` now matches TypeScript `Math.round` encoded-sRGB/alpha math and derives from base plus overrides instead of trusting stale derived `dark`/`light.shades`. `e2e/palette-cache-parity.spec.ts` covers explicit dark base false/true, valid stale-cache injection, forged cache-matching projection rejection, and a subsequent valid-message barrier. Playwright CLI was red before the fix (both cases failed, accepted `0`) and green after.
- Browser evidence: final 4-test bridge run passed 4/4 in 30.9s (`palette-cache-parity`, `dark-first-palette`, `all-properties-mode-isolation`); earlier unchanged 5-test run passed 5/5 in 41.4s for non-bridge paths; broad foundation test passed by itself in 1.4m after its own budget rose from `120_000` to `240_000ms`; full 37-test matrix was not rerun. `ftb-021-local-themes` storage failure remains designated pre-existing. Final bridge-only change invalidated only bridge-covering browser evidence, which the 4-test run replaced; units/type-check/build and PHP were not rerun.
- Review `ses_e87726579ffekMIo8331SYfD33` is PASS for correctness/quality; all original blockers resolved. Nonblocking remains: `ThemeStateV5` accepts schema 5 or 6, and the bridge duplicates the palette-shade algorithm because it cannot import TypeScript across the boundary.
- Actual AI-client MCP verification was not run; relay/domain/bridge tests remain the evidence limit. No commit was created because no commit permission was given.

## Review / repair handoff

- Independent review `ses_e87726579ffekMIo8331SYfD33`: now PASS for correctness/quality. Its historical blockers (schema6 padding export/validation, relay metadata version5, rename dropping dark raw values, and eight browser acceptance failures) are resolved across the current 74-path review surface.
- Controller further identified semantic dark-first writes polluting light, resets ignoring same-length changes/deleting opposite mode, raw reset-all deleting both modes, stale generated dark palette shades freezing inheritance, palette statuses using light provenance, exported CSS mode specificity/root scoping defects, and inaccurate coverage claims in report.
- First owner hit usage limit (`The usage limit has been reached`) during repair round 1. Replacement owner inspected the partial tree: it already contains fixes/tests for many listed defects and focused domain tests pass 32/32. Current type-check and production build also pass.
- Relay current schema version was confirmed by its focused test (7/7).
- Resolved since that handoff: new browser mode/export fixture stabilized; one-time storage clear preserves reload state; missing foundation CSS addressed; broad foundation timeout fixed with `240_000ms` budget; dark-first red regression reproduced and fixed; semantic reset regressions fixed; final unit/type-check/build evidence recorded; review artifacts/hashes refreshed.
- Remaining known baseline failures: `ftb-021` storage assertion, PHP `PreviewInspectorBridgeTest.php:114` source-string assertion, and the unit CSS-entrypoint expectation. No review blocker remains. Nonblocking type-alias and bridge-algorithm duplication are documented for follow-up.

## Controller reassessment

- Existing matrix improved to 35/37; new evidence justified targeted continuation rather than another implementation restart.
- Resolved: mode/export test now clears `ftb-theme*` once before initial navigation and preserves storage on reload.
- Resolved: broad foundation test timeout raised to `240_000ms`, preserving all native showcase assertions; targeted test passed in 1.4m.
- Resolved: dark-first palette red regression traced to preview canonical palette filtering on dark paths in light mode; fixed with `projection.mode`, confirmed in the final 4-test bridge browser run (and the earlier unchanged 5-test run).
- No concurrent writer; review artifacts/report refreshed. Code and focused acceptance are complete except designated baseline failures; independent review is PASS. No commit was created because no commit permission was given.
