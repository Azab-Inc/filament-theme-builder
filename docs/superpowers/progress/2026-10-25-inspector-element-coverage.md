# Inspector element coverage

## Goal and scope

User asks to inspect breadcrumbs, table titles, filter funnels, and fine-grained elements across every demo page. Extend selection, not the set of editable properties. Preserve safe selector/protocol boundaries, authorized iframe messages, disable cleanup, navigation/reload lifecycle, and existing editing behavior. Do not add dependencies or change unrelated prototypes/worktree files.

## Baseline and decisions

- Branch: `dev`; baseline HEAD: `d60e0b6`.
- Existing resolver is an ordered selector list: broad ancestors can win over nearer elements and newly introduced components require manual additions.
- A fine-grained target with no safe styling selector must remain selectable but explicitly unavailable for raw editing; do not fabricate semantic editability or relax selector validation.
- Shared markup should be covered by one target-resolution boundary rather than per-page lists. Audit page families and record actual route/element coverage, gaps, and inaccessible workflows honestly.
- No ticket/status changes or commits authorized by this brief. Preserve all pre-existing dirty files.

## Tasks

| Task | Owner | Status |
| --- | --- | --- |
| Live page inventory and red-capable regressions | implementer | complete; 34 authenticated GET routes audited |
| Resolver/evidence integration and tests | implementer | complete; review finding corrected and red/green evidence recorded |
| Independent correctness/spec and quality review | reviewer | passed; no remaining blockers |

## Verification

Implementation report: `docs/superpowers/verification/2026-10-25-inspector-element-coverage.md`.
The canonical Compose URL was reachable. Authentication followed the existing FTB-054 login helper. The 34-URL authenticated audit is supplemented with concrete shared Filament resource-shell mapping for unvisited CRUD siblings. The latest review blocker is fixed: only registry selectors actually present in the evidence candidate list can resolve, and their terminal selector must identify the selected target. The bridge now emits verified ancestor-to-target candidates from actual DOM classes; the global-search input remains isolated from the Product name mapping and raw selector. Red/green protocol/raw evidence, real Product and global-search pointer tests (2/2), focused unit tests (19/19), type-check/build, hashes, and scope are recorded in the verification report. Earlier 20/20 suite evidence remains valid for unaffected cases; only affected mapping checks were rerun. No full suite, route audit, unrelated check, or commit was repeated/created.

## Next action

Final scoped independent review passed correctness/spec and quality. Controller reconciled working-tree status and `git diff --check` passed. Implementation is ready for user validation, uncommitted. The unrelated full-suite CSS expectation failure and documented route-audit limits remain disclosed; preserve unrelated dirty paths.
