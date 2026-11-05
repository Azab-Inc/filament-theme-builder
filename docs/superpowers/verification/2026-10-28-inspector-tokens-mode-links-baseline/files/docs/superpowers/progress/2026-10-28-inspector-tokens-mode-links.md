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
| Red tests + generic Inspector scopes/surface fixes | luna56 | pending |
| Named palettes/color tokens + explicit per-value links and canonical integration | luna56 | pending |
| Focused/full tests and native Compose browser acceptance | luna56 | pending |
| Exact task diff, independent review, scoped repairs, final report | controller / reviewer | pending |

## Evidence and acceptance

Report `docs/superpowers/verification/2026-10-28-inspector-tokens-mode-links.md` with commands/cwd/env/exit, red+green, exact baseline/final hashes and diff. Require real Playwright CLI red before user-visible fixes. Pointer inspection on chart/table/header/white wrappers, target changes and previews; generic scopes across at least two distinct tables, column header+all body cells only, sibling columns unaffected, no field names. Custom secondary palette+singlecolor creation/reuse/update in multiple controls, separate/linked modes, reference safety/import/export/reload/history. Link from each mode, confirmation/cancel, active-value merge, subsequent edits, unlink independent values, reset/undo/redo, state-specific links. Exported CSS tested as actual computed styles, not only strings. MCP inventory and applicable auth/protocol tests.

Reuse prior unaffected evidence; final builder type-check/unit/build and applicable PHP/Compose E2E once settled. Known baseline failures: css-entrypoint dirty dashboard import; PHP source-literal assertion PreviewInspectorBridgeTest114; storage-error UI assertion ftb021. Report honestly rather than silently changing unrelated behavior.
