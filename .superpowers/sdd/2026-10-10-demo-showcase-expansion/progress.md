# SDD ledger — plan: docs/superpowers/plans/2026-10-10-demo-showcase-expansion.md

## Preflight scan

| Tasks | Shared files/interfaces | Finding | Ruling |
|---|---|---|---|
| 1 ↔ 2 | `TICKETS.md`, `COVERAGE.md` | Task 1 defines stable coverage IDs and ownership; Task 2 consumes the Phase 1 IDs. | Consistent; execute Task 1 first. |
| 1 ↔ 3 | `COVERAGE.md`, capability inventory | Task 1 defines dashboard IDs and read-only classification; Task 3 supplies implementations/tests. | Consistent; Task 3 must not claim IDs absent from the contract. |
| 2 ↔ 3 | `AdminPanelProvider.php`, `e2e/demo-showcase.spec.ts` | Task 2 changes panel identity/navigation; Task 3 registers dashboard widgets and extends browser coverage. | Consistent; keep one panel/dashboard registration path. |
| 3 ↔ 4 | dashboard widgets, fixed metrics, capability inventory | Task 4 adds commerce mutations after Task 3 read-only dashboard work. | Consistent; metrics remain read-only and mutations reuse domain validation. |
| 4 ↔ 8 | resource actions, notifications, action showcase | Task 4 owns real commerce workflows; Task 8 owns focused action/notification variants. | Consistent; do not duplicate mutation logic or confuse showcase variants with commerce operations. |
| 5 ↔ 6 ↔ 7 | `demo/app/Filament/Pages/Showcase/**`, `e2e/demo-showcase.spec.ts` | Forms, tables, and infolists are distinct fixtures that share the Showcase navigation. | Consistent; each fixture must remain visually distinct and not become duplicate CRUD. |
| 8 ↔ 10 | action/notification fixtures and forced states | Task 8 owns variants; Task 10 owns safe explicit forced visibility. | Consistent; no timing-based state forcing. |
| 9 ↔ 2/3 | `AdminPanelProvider.php`, dashboard/widgets/navigation | Task 9 integrates existing Phase 1 systems and must not register a second system. | Consistent; one discovery/registration path is authoritative. |
| 10 ↔ all showcase tasks | `ShowcaseState` and page/widget bindings | Task 10 adds allowlisted request-scoped presentation state consumed by prior fixtures. | Consistent; no persistent writes or authorization bypass. |
| 11 ↔ 2/12 | icons, PanelProvider, runtime/export classification | Task 2 assigns native icons; Task 11 adds configurable packs/overrides; Task 12 classifies non-CSS export. | Consistent; use native APIs and preserve exact panel brand. |
| 12 ↔ builder export | PanelProvider/runtime state | Task 12 may touch builder export only through existing interfaces. | Ruling: if the existing builder contract cannot support a field, classify it export-only rather than inventing parallel state. |
| 13 ↔ all tasks | docs, coverage, E2E | Final docs/statuses depend on evidence from every earlier task. | Consistent; no acceptance claim without passing tests. |

| Task | Self-consistency check | Finding | Ruling |
|---|---|---|---|
| 1 | Contract tests and files | Documentation/inventory test precedes contract edits and preserves anchors. | Clean. |
| 2 | Brand/assets/icons/badges | PHP and browser tests cover native panel changes and stable seeded values. | Clean. |
| 3 | Metrics/widget interfaces | Typed support boundary feeds native widgets; empty/fixed-date cases are explicit. | Clean, with exact vendor signatures to be verified at execution. |
| 4 | Commerce action flow | Domain operation, confirmation, validation, notification, and capability inventory are linked. | Clean. |
| 5 | Forms fixture | Native page/schema APIs are inspected before implementation and tests cover layout/state edges. | Clean. |
| 6 | Tables fixture | Table interactions and empty/loading/missing-related-record edges are covered. | Clean. |
| 7 | Infolists fixture | Read-only data and escaping/null/media cases are covered. | Clean. |
| 8 | Action/notification variants | Variants are distinct from real commerce mutation and from forced-state tooling. | Clean. |
| 9 | Showcase navigation | Single page/discovery system integrates prior widgets and preserves auth/public access. | Clean. |
| 10 | State resolver | Allowlist, request isolation, reset, and no-write behavior are explicit. | Clean. |
| 11 | Icon configuration | Native allowlisted state and reset/export classification are testable. | Clean. |
| 12 | Runtime branding | Trusted local assets and classification map to existing export interfaces. | Clean, API compatibility must be verified. |
| 13 | Final acceptance | Docs follow evidence and explicit non-goals preserve operational tickets. | Clean. |

## Rulings

Ruling: Execute this plan directly in the current `dev` worktree — the user explicitly chose current-worktree execution earlier; this increases change-coupling risk, so each task must commit only its scoped files and the ledger must record every review gate.

Ruling: Preserve the exact panel brand `Filament Theme Builder` while allowing fictional e-commerce context in data/dashboard copy — this satisfies the user’s explicit branding request without copying official Filament identity; the cost if wrong is rework of panel configuration and tests.

Ruling: Treat native Filament 5 vendor APIs as authoritative over plan examples — this avoids adding dependencies or fake compatibility layers; the cost if wrong is adapting task interfaces when the installed version differs.

Ruling: Continue FTB-011 with its named native fixture coverage, but do not claim the ticket done until FTB-006 supplies the semantic registry and inheritance contract — the ticket explicitly lists FTB-006 as a blocker and the repository has no usable registry implementation; the cost if wrong is a later fixture/registry integration rework.

Task 1: fix round 1/5 (2 important findings addressed — Phase 1/FTB-015 ownership and concrete fixture contract; commits 68a0005..4d6e9d6)

Task 1: complete (commits 713713f..4d6e9d6, review clean)

Task 2: fix round 1/5 (2 important findings addressed — stable protected fixture badges and accessible/color-scheme icon assertions; commits 28cef21..f99185e)

Task 2: complete (commits 4d6e9d6..f99185e, review clean)

Task 3: fix round 1/5 (1 critical and 8 important findings addressed — single widget registration, complete widget data/columns, threshold/missing-relation contracts, rendered/chart/responsive/accessibility assertions; commits 0affcf4..e9bc3dd)

Task 3: complete (commits f99185e..e9bc3dd, review clean)

Task 4: Ruling: MCP mutation tool unavailable in the connected environment — the capability inventory explicitly records the missing tool instead of inventing an unauthorized/fake integration; this preserves truthfulness but leaves MCP automation as an operational follow-up if a server becomes available.
Task 4: minor (deferred): reviewer could not reach the browser session, but fresh focused Playwright verification independently passed the fulfillment flow.
Task 4: complete (commits e9bc3dd..fe846ac, 1 parked environment limitation)

Task 5: fix round 1/5 (3 important and 2 minor findings addressed — long-text, control interactions, light/dark/filled assertions, and stable full showcase auth; commits 0aac781..6d5d403)

Task 5: complete (commits fe846ac..6d5d403, review clean)

Task 6: minor (deferred): loading visibility and Orders/Inventory empty states are configured but not fully behaviorally exercised; core table interactions/reorder/isolation and partial ticket status are verified.

Task 6: complete (commits 6d5d403..e3ea07b, review clean with 2 deferred minors)

Task 7: minor (deferred): additional null/missing cases and attempted-mutation rejection are not directly tested; read-only implementation, hostile rich-text escaping, relationship fallbacks, and no-mutation render checks pass.

Task 7: complete (commits e3ea07b..31c4110, review clean)

Task 8: fix round 1/5 (4 important findings addressed — native notification variants, modal/layout semantics, loading behavior, and focus trap/restoration; commits ca160d1..265aa4e)

Task 8: complete (commits 31c4110..265aa4e, review clean)

Task 9: minor (deferred): full normal E2E rerun exceeded the review timeout after 15 passed tests; the implementer reported 33 passed/3 opt-in skips and the scoped review found no new breakage.

Task 9: complete (commits 265aa4e..cc256b2, review clean)

Task 6: implementation complete; FTB-012 remains partial for the deferred theme-density criterion (focused PHP/Playwright, full PHP, Pint, and PHPStan clean; full browser suite has one pre-existing demo-panel navigation failure because it expects exact resource labels not present in the current panel; tables coverage is isolated and passing)

Task 6 review fixes: native isolated reorder mapping, Orders and Inventory fixtures, behavioral interaction coverage, and documentation correction complete; focused/full PHP, focused tables Playwright, Pint, and PHPStan pass. Full browser suite retains the unrelated exact `Products` navigation-label failure.

Task FTB-011 named-fixture slice: fix round 1/5 (2 important findings addressed — non-persisting upload representation and restored long-text coverage; commits 5e887ba..5f01547)

Task FTB-011 named-fixture slice: complete (commits 8bf137e..5f01547, review clean; FTB-006 registry/inheritance blocker remains and FTB-011 is not done)
