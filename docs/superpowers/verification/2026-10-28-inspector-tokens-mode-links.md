# Inspector scopes, named tokens, and mode links — implementation evidence

## Status

**Implemented and verified; independent review PASS
(`ses_e7fb24e1effe9uRQ9q7jMZil23`); no outstanding blockers.**

Feature code is complete. Evidence is complete except the known baseline failures
and the actual MCP-client limitation recorded below. Earlier phase-A/partial
statuses and earlier artifact hashes are historical and superseded by this final
refresh. Long source-quality review notes are nonblocking.

## Environment and scope

- Repository: `/home/swagoverlord/repos/filament-theme-builder`, branch `dev`,
  task-start `HEAD` `82004b7ca02129518b92dbff8ed0aebed77d1eb6`.
- Runtime: canonical Docker Compose preview at `http://127.0.0.1:4175`.
- No dependency, package, branch, ticket, staging, or commit changes were made.
- This refresh changed docs/artifacts only; no production or test files and no test
  suites were touched.

## Durable baseline and exact final artifact

Baseline (unchanged): `docs/superpowers/verification/2026-10-28-inspector-tokens-mode-links-baseline/`

- `head.txt` = `82004b7ca02129518b92dbff8ed0aebed77d1eb6`
- Full task-start dirty/untracked file contents under `files/`
- `file-hashes.sha256`, `dirty-list.txt`, `tracked-diff-from-head.patch`

Final: `docs/superpowers/verification/2026-10-28-inspector-tokens-mode-links-final/`

- `baseline-to-current.diff` — exact baseline-to-current feature diff, 127
  source/test paths, 3,841 lines, 36 new files.
  sha256 `02df121369ebff7c7338be84a675ab2afc428b56bc4501733aa03507d9c43440`.
- `source-hashes.sha256` — current sha256 for each of the 127 paths.
  sha256 `7f47dc8f31e354f3a5dbbaca52d56e65d4cbf05bc27e5ef8a9f2daa7732c9dc0`.
- `baseline-source-map.tsv` — per-path baseline provenance and baseline/current
  hashes: 51 `snapshot`, 40 `HEAD`, 36 `empty` (new feature paths).
  sha256 `24d4410959d92d25312791551a4c50f924c800dd376089b286dc36d985c75de4`.

The prior 123-path artifact is superseded by this 127-path refresh. Earlier
121-path and 123-path artifact hashes remain historical only. No redundant full-tree
copy is included; this directory contains only the exact diff and small manifests.

### Reconstruction and exactness proof

For each changed source/test path:

- pre-existing dirty or untracked at task start → durable baseline file contents;
- clean at task start → `git show HEAD:<path>`;
- created after task start → empty baseline (`/dev/null`).

Baseline/final artifact paths, `artifacts/`, and unrelated prototype/accessibility
prior changes are excluded. Because the durable baseline already contains the prior
dirty prototype/accessibility work, the diff isolates post-baseline task changes.

Verification: the diff was applied with `patch -p1` to a temporary tree reconstructed
by the same rules. The result matched the current files byte-for-byte for all 127
paths. The manifest has 127/127 matching current hashes and all baseline provenance
was resolved from the durable snapshot, `HEAD` `82004b7`, or empty new-file baseline.

## Implemented behavior

### Inspector scopes and surfaces

- Generic table container/header/body/row surfaces and chart
  `.fi-wi-chart-canvas-ctn` surfaces. The parent chooser walks actual `.fi-*`
  ancestors. Canvas-drawn chart text is not treated as editable DOM text.
- Reusable physical table columns 1–32, including selection and action columns.
  The same position applies to matching Filament tables; no record, resource, or
  customer field name is embedded in the selector.
- Dynamic `fi-ta-header-cell-*` / `fi-ta-cell-*` classes are filtered from
  proposals. Scoped highlights are capped at 1,000 matched elements.
- Classless targets remain the exact picked element; the silent `closest` parent
  fallback was removed. Selecting a parent surface is an explicit user choice via
  the Inspector target dropdown.
- Inspector scope commands and bridge evidence must pass the strict protocol and
  bridge selectors before use.

### Named palettes and color variables

- Named palettes with generated shades and single color variables under a reserved
  user-token namespace. Definitions are literal six- or eight-digit hex values;
  recursive definitions are excluded by construction.
- Names are 1–32 lowercase letters/numbers/hyphens; a theme supports at most 64
  named definitions; built-in palette names are reserved.
- Editing a custom palette base regenerates the active mode's eleven shades. The
  UI states this explicitly. Referenced tokens cannot be deleted until references
  are replaced; links for a removed token are cleaned up.
- References are selectable in compatible foundation, raw, and semantic color
  controls, resolve per mode with light fallback, persist, export, and emit token
  CSS. No untrusted CSS expansion is used.

### Explicit per-value mode links

- Links are per editable value and target context, not a blanket theme-wide link.
  Existing light/dark inheritance remains independent.
- Targets cover foundation surface/border/text values, raw selector/property
  values, semantic overrides, built-in palette base/shade values, custom palette
  base/shade values, and custom user colors/palettes.
- Linking uses the active mode's effective value, confirms only when replacing a
  differing other-mode value, mirrors subsequent edits, and preserves appearance
  when unlocked. Cancelling writes nothing.
- Reset of a linked raw, semantic, or palette-base value clears both modes and
  removes the link so reset returns to inheritance; linked palette-base reset works
  symmetrically from light or dark and preserves sibling palette overrides. Undo
  restores the prior link and values atomically. Help text describes linked raw reset.
- `applyModeLinks` clones the entire candidate JSON before mutation so reactive
  proxies and `DataCloneError` paths are avoided.
- Canonical mode links require explicit stored light and dark values, both equal to
  `metadata.value`; unknown, missing, or divergent raw locks are rejected.
- Foundation link targets are checked against `KNOWN_EXPLICIT_PATHS`; user color
  and palette targets require strict token ownership/known palette names.
- Shared stored-value access is extracted to
  `builder/src/utils/mode-link-stored-values.ts`, so runtime mutation detection and
  canonical validation use the same accessor.
- Unused legacy public `linkFoundation` / `linkUserColor` / `linkedValue` paths
  were removed; only the validated generic link actions remain.
- Link IDs are canonicalized independent of descriptor insertion order. Previously
  persisted schema-7 order-dependent IDs remain accepted and normalize to canonical
  IDs without losing stored link data; duplicate logical targets are rejected.
- The preview helper mirrors link identity/key matching, strict stored shared
  values, known fields/known palettes, and shared `isSafeRawSelector` checks for
  overrides, locks, and bounded column highlights.
- A link over an active custom user-color reference snapshots the resolved literal
  into the link. Other reference semantics are not independently verified and are
  recorded as a review item.

### Canonical schema 7

- Schema 7 is the current/default runtime state. `ThemeStateCurrent` is the schema-7
  alias; no schema-5 union is used for current state.
- Imports accept versions 1–7 and migrate 1→2→3→4→5→6→7. Schema-6 imports add
  literals-only `foundations.userTokens` and `modeLinks` defaults.
- Canonical export/import/preview, local persistence/recovery, and relay validation
  accept the schema-7 payload. Relay target version is 7; legacy 1–6 remain
  accepted and migrate. Root state validation rejects unknown fields and unknown
  references.

## Chronological review and evidence history

### Original RED evidence (historical, preserved)

Before the first UI fixes:

1. Column CSS was `rgba(0,0,0,0)` instead of `rgb(18,52,86)`, and the schema-7
   bridge payload was rejected.
2. The named-token chooser was absent.
3. The raw lock button was absent.
4. The scoped highlight check failed at 0/3 matched body cells; the bridge scope
   command was fixed before the green run.

These remain the original RED record. The final state below supersedes the
then-partial implementation status.

### Reviewer blocker 1 — accepted

Original reviewer blocker: missing user-palette and foundation-path lock targets.

- Fix: validate foundation paths through `KNOWN_EXPLICIT_PATHS`; require strict
  user-token/palette ownership.
- Regression was RED first (bad links validated as `true`) and then GREEN after the
  fixes.
- Canonical mode links now enforce explicit stored light/dark values equal to
  `metadata.value`; unknown, missing, or divergent raw locks are rejected.
- Shared stored-value access was extracted from `applyModeLinks`; legacy unused
  public link paths were removed; cancel writes nothing.

### Reviewer finding 2 — disputed, then accepted as invalid

The reviewer alleged a legacy schema-6 state without `userTokens` would throw a
`TypeError`. The controller disputed this.

- New `builder/src/__tests__/legacy-mode-link-validation.spec.ts` covers two cases:
  a `user-color` link and a `user-palette-base` link, each with both identity forms.
- Each case asserts `valid === false` and **no throw**, with **no production fix**.
- The controller demonstrated the guard early-rejects. The reviewer accepted the
  finding as invalid. Final review remained PASS on specification/correctness and
  quality.

### Browser regression found in the 15-test run — fixed

The 15-test run had one failure: the old exact-classless contract found the added
silent `closest` parent fallback. The fallback was removed so a classless target
remains the exact picked element; parent selection is an explicit dropdown choice.
The failed test and the generic column-scope test were rerun: 2/2 passed in 12s.
The other 14 results were reused; the full 15 were not rerun.

## Final source and browser evidence

Environment: Linux, Compose preview `http://127.0.0.1:4175`, repository HEAD
`82004b7` plus the recorded working-tree changes.

| Command | CWD | Result |
| --- | --- | --- |
| `npm run test:unit -- --run` | `builder/` | exit 1; 610 passed, 1 known pre-existing `css-entrypoint` failure, 611 tests / 134 files, 183.93s |
| `npm run type-check && git diff --check` | `builder/` | exit 0 |
| `npm run test:unit -- --run src/__tests__/user-tokens-integration.spec.ts src/__tests__/mode-link-targets.spec.ts src/__tests__/theme-mode-links.spec.ts src/__tests__/theme-import-migrations.spec.ts src/__tests__/inspector-tokens-mode-links.contract.spec.ts && npm run type-check && npm run build` | `builder/` | 28 passed / 5 files; type-check and build exit 0 (last production build 03:27) |
| `COMPOSE_E2E=1 npx playwright test e2e/inspector-tokens-mode-links.spec.ts e2e/ftb-007-inspector.spec.ts` | repo root | 14 passed, 1 failed, 1.9m; the failure was the old exact-classless test |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-007-inspector.spec.ts e2e/inspector-tokens-mode-links.spec.ts --grep 'exact classless\|generic table column'` | repo root | 2 passed in 12s (failed test + generic column scope) |
| `php artisan test tests/Feature/Mcp --filter='LocalThemeRelay\|ThemeRelay'` | `demo/` | 23 passed, 141 assertions (host environment; unchanged from previous evidence) |
| `npm run test:unit -- --run` | `builder/` | exit 1; 617 passed, 1 known `css-entrypoint` failure, 618 tests / 136 files, 240.13s (last run 12:04; final reset/identity changes included) |
| Focused five-file unit run | `builder/` | 24 passed; includes reset integration and identity migration regressions (RED 3 reset cases and insertion-order identity test were recorded before fixes) |
| `npm run type-check` and `npm run build` | `builder/` | both exit 0 at 12:01; build bundle 248 modules, after the final reset/identity fixes |
| `COMPOSE_E2E=1 npx playwright test e2e/inspector-tokens-mode-links.spec.ts` | repo root | 3 passed in 34.4s after final reset/identity fixes |

Build reuse is explicit: no TypeScript production changes landed after the 03:27
build. The later classless repair changed bridge/test JavaScript only, so the
production build remains valid and was not rerun. The earlier 13-test browser
matrix remains valid for the new three UI journeys, raw six, cache parity two,
dark-first, and mode export, except that the new metadata repair is covered by the
new three UI journeys in the 15-test run. Named token/UI lock tests passed 3/3,
including actual preview CSS live/reload, raw link, and unlink. Native title
bindings and no console errors were already verified.

## Known failed checks, limitations, and untouched baselines

- Builder unit suite exits 1 with the known pre-existing `css-entrypoint` failure
  (617/618). It was not changed or claimed fixed.
- PHP `PreviewInspectorBridgeTest` source-literal assertion 114 and the previous
  task's storage UI assertion ftb-021 remain known baselines. Neither was rerun in
  this phase; they are not claimed as fixed by this feature.
- The original Docker-host PHP invocation failed 19/22 because of a Compose
  host-environment mismatch (recorded as not green). The correct host environment
  passes 23/141. **The original Docker failure is not claimed as fixed.**
- Actual AI-client MCP use was not verified. Schema-7 transfers use the existing
  `local_theme_export` and `local_theme_import_preview` tools plus browser
  confirmation. There are no direct per-token, per-palette, per-link, or per-lock
  MCP tools, and no anonymous mutator bypass. Do not claim purpose-built MCP
  coverage for the new UI capabilities.
- Link locking snapshots resolved custom user-color references to literals; other
  reference semantics were not independently verified.
- Long source-quality notes from review are nonblocking.
- No production or test files were edited by this docs/artifact refresh. No commit
  was made, per the absence of explicit permission.
