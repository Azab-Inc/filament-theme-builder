# Inspector scopes, named colors, and explicit mode links

## Approved request

User wants the white chart/table/surrounding surfaces selectable, reusable table styling instead of customer-field-specific selectors, custom palettes/color variables in Foundations, and per-value light/dark locks.

Question answers approved:

- Generic header/body/row targets plus whole columns by position.
- Named palettes with generated shades plus single color variables (not arbitrary non-color CSS vars).
- Linking uses the active mode's effective value, confirms replacement of differing values, synchronizes subsequent edits in either mode, and unlocking preserves appearance while enabling independent editing.

## Baseline and ownership

- Current branch dev, HEAD `82004b7` with previous mode-isolation/accessibility/prototype work uncommitted. Preserve it; do not commit, stage, create branches, install packages, or edit tickets.
- Audit owner luna56 session `ses_e8050824effeNbnxkC9JP7Npuu` completed read-only DOM/code audit.
- One implementation owner across schema/store/bridge/UI to avoid conflicting writers; reviewer independently read-only.
- Capture exact task-start file contents/diffs/hashes in a persistent artifact location, not only `/tmp`, before touching already-dirty files. Prior task lost temp baseline; do not repeat.

## Accepted implementation boundaries

- Use existing Vue/Pinia/Laravel stack and canonical Compose at `http://127.0.0.1:4175`.
- Generic table selectors `.fi-ta-header-cell`, `.fi-ta-cell`, `.fi-ta-row`, header/body/container surfaces; strip field-specific classes from proposals. Keep exact semantic Product-name mapping and classless safety.
- Whole-column targeting is positional and reusable across matching Filament tables, never tied to data/field/resource/record names. UI documents 1-based physical DOM index including selection/action columns. Only a bounded generated positional grammar or structured descriptor is allowed; retain safe CSS rejection.
- Parent surface chooser reaches actual relevant `.fi-*` wrappers, chart canvas container/widget and header/search wrappers without silently broadening a child edit. Canvas pixels are not individual DOM text targets.
- Custom tokens use a validated reserved namespace; generated CSS variable references available through compatible color controls. Reject unknown refs, collisions, injection and cycles (or exclude recursive token definitions by construction). Changes stay live, mode-aware, exported and persisted. Referenced token deletion/rename must not leave broken references; use validated policy/confirmation.
- Link identity is per mode-editable property and selector/semantic context/state, not blanket whole-theme linking. Existing inheritance remains independent of explicit link. Preserve reset/history/export/reload and explicit equality semantics. Confirm only when replacing a different other-mode value.
- Introduce schema7 with proper current-state alias if canonical changes require it; preserve v1-v6 import and existing values. Centralize lock-aware mutation rather than repeated UI-only checks.
- Strict TypeScript/bridge canonical validation parity; mode links/named tokens/positional targets same import/export/relay/MCP authorization/confirmation paths. Document actual AI-client evidence limits, never claim unrun checks.
- Avoid unrelated prototype/refactors/dependencies and preserve native Filament styling until explicit customization.

## Task ledger

| Task | Owner | Status |
| --- | --- | --- |
| Approved behavior and read-only live/code audit | controller / luna56 | completed |
| Red tests + generic Inspector scopes/surface fixes | luna56 | completed: bounded scope contract, bridge evidence, and Inspector target chooser landed |
| Named palettes/color tokens + explicit per-value links and canonical integration | luna56 | completed: runtime validation, CRUD/reference UI, persistence, token CSS emission, per-value locks, and schema-7 relay integration |
| Focused/full tests and native Compose browser acceptance | luna56 | completed with known baseline failures and the MCP actual-client limitation recorded below |
| Exact task diff, independent review, scoped repairs, final report | controller / reviewer | completed: final 127-path exact diff refreshed after reset/identity repairs; reviewer PASS; no outstanding blockers |

**Feature code status:** implemented; final reset/identity repairs have passed scoped independent review.

**Evidence status:** completed except the known baseline failures and the
unverified actual MCP client path recorded in the verification report.

**Review status:** implemented and verified; independent review PASS
(`ses_e7fb24e1effe9uRQ9q7jMZil23`) on the final specification/correctness and
quality state, including reset/identity fixes. No outstanding blockers. Earlier
phase-A/partial statuses are historical and superseded.

### Final consistency repair (new evidence)

- New store-level tests reproduced linked semantic and palette reset no-ops (3 failing cases): removal of an explicit value left lock metadata inconsistent and the commit validator refused the reset.
- The shared reset boundary now clears both semantic/palette overrides and their link; linked palette-base reset is symmetric from either active mode and preserves sibling overrides. Undo restores the prior link atomically.
- New identity test reproduced descriptor insertion-order-dependent lock IDs. IDs are now canonicalized; existing saved schema-7 order-dependent IDs are accepted and normalized, while duplicate logical targets are rejected. Preview validation uses the same identity/deduplication rules.
- Verification: focused 5-file/24-test run passed; type-check/build passed at 12:01;
  the three new native Compose feature journeys passed (34.4s). Final full unit
  rerun at 12:04: 617 passed, one known css-entrypoint failure, 618 tests/136
  files, 240.13s. Earlier unaffected evidence remains valid; see final verification
  report and refreshed exact artifacts.
- Controller owns these bounded final repairs. No concurrent writer or new dependency; no commit/staging.

## Evidence and acceptance

Report `docs/superpowers/verification/2026-10-28-inspector-tokens-mode-links.md` with commands/cwd/env/exit, red+green, exact baseline/final hashes and diff. Require real Playwright CLI red before user-visible fixes. Pointer inspection on chart/table/header/white wrappers, target changes and previews; generic scopes across at least two distinct tables, column header+all body cells only, sibling columns unaffected, no field names. Custom secondary palette+singlecolor creation/reuse/update in multiple controls, separate/linked modes, reference safety/import/export/reload/history. Link from each mode, confirmation/cancel, active-value merge, subsequent edits, unlink independent values, reset/undo/redo, state-specific links. Exported CSS tested as actual computed styles, not only strings. MCP inventory and applicable auth/protocol tests.

Reuse prior unaffected evidence; final builder type-check/unit/build and applicable PHP/Compose E2E once settled. Known baseline failures: css-entrypoint dirty dashboard import; PHP source-literal assertion PreviewInspectorBridgeTest114; storage-error UI assertion ftb021. Report honestly rather than silently changing unrelated behavior.

## Final controller and review update

### Durable artifacts

- Task-start baseline (unchanged):
  `docs/superpowers/verification/2026-10-28-inspector-tokens-mode-links-baseline/`
  (`head.txt` = `82004b7ca02129518b92dbff8ed0aebed77d1eb6`, full dirty-file
  contents, `file-hashes.sha256`, `dirty-list.txt`, `tracked-diff-from-head.patch`).
- Final exact artifact:
  `docs/superpowers/verification/2026-10-28-inspector-tokens-mode-links-final/`.
   No full-tree snapshot is copied; the artifact is one exact diff plus small
   manifests:
   - `baseline-to-current.diff` — 127 source/test paths, 3,841 lines, 36 new files;
     sha256 `02df121369ebff7c7338be84a675ab2afc428b56bc4501733aa03507d9c43440`.
   - `source-hashes.sha256` — current hashes for those 127 paths;
     sha256 `7f47dc8f31e354f3a5dbbaca52d56e65d4cbf05bc27e5ef8a9f2daa7732c9dc0`.
   - `baseline-source-map.tsv` — per-path baseline provenance (`snapshot` 51,
     `HEAD` 40, `empty` 36) and baseline/current hashes;
     sha256 `24d4410959d92d25312791551a4c50f924c800dd376089b286dc36d985c75de4`.
 - The earlier 121-path and 123-path artifact hashes are superseded by this refresh. The
  reconstruction rules are unchanged: pre-existing dirty/untracked paths use the
  durable baseline file contents, paths clean at task start use `git HEAD`, and new
  feature paths use an empty baseline. Reconstruction was verified by applying the
  diff to the reconstructed baseline tree with `patch -p1`; the result was
   byte-identical to all 127 current files, including new `reset-mode-link-target.ts`,
   `normalize-mode-links.ts`, `mode-link-reset-integration.spec.ts`, and
   `mode-link-identity-migration.spec.ts`. All manifest source hashes match current
   files.

### Feature code completed

- Generic Inspector scope surfaces, reusable physical table columns 1–32
  (including selection/action columns), parent `.fi-*` surface chooser, chart
  canvas-container targeting, field-specific class filtering, and bounded
  highlight groups (1,000 matches).
- Named palettes and single color variables with validated reserved references,
  literal-only definitions (no cycles), 1–32 lowercase names, at most 64
  definitions, active-mode shade regeneration, reference-blocked deletion, and
  live mode-aware resolution/export.
- Explicit per-value light/dark links for foundation, raw, semantic, palette, and
  custom user-color/palette targets; confirmation only when replacing a differing
  value; active-mode synchronization; appearance-preserving unlock; linked raw
  reset clears both values and the link; cancel writes nothing.
- Reviewer repairs:
  - Lock targets now validate foundation paths against `KNOWN_EXPLICIT_PATHS` and
    require strict token ownership for user colours/palettes, fixing the accepted
    missing user-palette/foundation-path blocker.
  - Canonical mode links require explicit stored light and dark values, both equal
    to `metadata.value`; unknown, missing, or divergent raw locks are rejected.
  - Shared stored-value access is extracted to
    `builder/src/utils/mode-link-stored-values.ts` so runtime mutation detection
    and canonical validation use one accessor.
  - Unused legacy public `linkFoundation` / `linkUserColor` / `linkedValue` paths
    were removed; only the validated generic link actions remain.
  - The preview helper mirrors link identity/key matching, strict stored shared
    values, known fields/known palettes, and shared `isSafeRawSelector` checks for
    overrides, locks, and bounded column highlights.
  - Classless Inspector targets remain the exact picked element. The silent
    `closest` parent fallback was removed; choosing a parent surface is an explicit
    user choice through the target dropdown.
- Schema 7 is the current runtime state with schema-7 defaults/imports/relay
  validation; schema versions 1–6 migrate to 7 (1→2→3→4→5→6→7). Legacy versions
  remain accepted.

### Review history and superseded statuses

1. Original reviewer blocker (accepted): missing user-palette and
   foundation-path lock targets. The regression was RED first (bad links validated
   as true), then GREEN after the known-path and strict-ownership fixes.
2. Reviewer's second alleged legacy schema-6-without-`userTokens` `TypeError` was
   disputed. New unit `legacy-mode-link-validation.spec.ts` covers two cases
   (user-color and user-palette links, both identity forms): `valid === false`
   with no throw, and **no production fix was needed**. The controller demonstrated
   the guard early-rejects; the reviewer accepted the finding as invalid.
3. Browser regression found during the 15-test run: the old exact-classless test
   caught the added silent `closest` parent fallback. Removing that fallback
   restored exact classless picking; parent selection remains explicit. The failed
   test plus the generic column-scope test were rerun and passed 2/2 in 12s.
4. Reviewer final result: **PASS** on specification/correctness and quality. Long
   source-quality notes are nonblocking. No outstanding blockers.

### Final evidence

- Builder unit, earlier run: `npm run test:unit -- --run` (cwd `builder`) exit 1;
  610 passed, 1 known pre-existing `css-entrypoint` failure, 611 tests across 134
  files, 183.93s. This is historical and superseded by the final run below.
- Builder type/diff: `npm run type-check && git diff --check` (cwd `builder`)
  exit 0.
- Production build (last run 03:27):
  `npm run test:unit -- --run src/__tests__/user-tokens-integration.spec.ts
  src/__tests__/mode-link-targets.spec.ts src/__tests__/theme-mode-links.spec.ts
  src/__tests__/theme-import-migrations.spec.ts
  src/__tests__/inspector-tokens-mode-links.contract.spec.ts && npm run type-check
  && npm run build` (cwd `builder`) — 28 passed / 5 files, type-check/build exit 0.
  No TypeScript production changes landed after that build; the later classless
  change was bridge/test JavaScript only, so this build is validly reused rather
  than rerun.
- Browser, 15-test run:
  `COMPOSE_E2E=1 npx playwright test e2e/inspector-tokens-mode-links.spec.ts
  e2e/ftb-007-inspector.spec.ts` (repo root) — 14 passed, 1 failed in 1.9m. The one
  failure was the old exact-classless contract, fixed by removing the fallback.
  Targeted rerun
  `COMPOSE_E2E=1 npx playwright test e2e/ftb-007-inspector.spec.ts
  e2e/inspector-tokens-mode-links.spec.ts --grep 'exact classless|generic table column'`
  passed 2/2 in 12s. The other 14 results were reused; the full 15 were not rerun.
- The earlier 13-test browser matrix (1.7m) remains valid for the new three UI
  journeys, raw six, cache parity two, dark-first, and mode export, except that the
  new metadata repair is covered by the new three UI journeys in the 15-test run.
  Named token/UI lock tests passed 3/3, including actual preview CSS live/reload,
  raw link, and unlink. Native title bindings and no console errors were already
  verified.
- PHP host relay: 23 passed, 141 assertions (unchanged from the previous evidence).
  The original Docker-host failure was an environment mismatch and is documented,
  not green. The known baseline PHP source assertion 114 and storage UI ftb-021
  were not rerun.

- Final reset/identity verification: the focused five-file unit run passed 24 tests;
  `npm run type-check` and `npm run build` both exited 0 at 12:01 (248 modules);
  `COMPOSE_E2E=1 npx playwright test e2e/inspector-tokens-mode-links.spec.ts`
  passed 3/3 in 34.4s. The final full builder unit run at 12:04 exited 1 with 617
  passed and the one known `css-entrypoint` baseline failure (618 tests / 136 files,
  240.13s). No suites were rerun during the documentation/artifact refresh.

### Known limitations and untouched baselines

- Actual AI-client MCP use was not verified. Schema-7 canonical transfers use the
  existing `local_theme_export` / `local_theme_import_preview` tools plus browser
  confirmation; there are no purpose-built per-token or per-lock MCP tools and no
  anonymous mutator bypass.
- Known baseline failures remain: builder `css-entrypoint`; PHP
  `PreviewInspectorBridgeTest` source-literal assertion 114; previous-task storage
  UI assertion ftb-021.
- Long source-quality notes from review are nonblocking.
- No commit was made; no production or test files were edited by this docs/artifact
  task. No staging was performed.
