# Remaining implementation order

Snapshot: GitHub open issues and [`TICKETS.md`](./TICKETS.md), checked 2026-11-01 on `dev`. This is a recommended sequence, not a change to ticket scope, priority, blockers, or release gates. Each FTB link below opens the local ticket; the corresponding GitHub issue is `https://github.com/Azab-Inc/filament-theme-builder/issues/<number>`. Verify current tracker status, the ticket body, evidence, and the worktree before starting a slice.

## First: reconcile existing work

GitHub reports issues #1–#8, #11, #13–#18, #21, #22, #27, #28, #50 and #53 **open**, while their local tickets say **done**. Reconcile each issue against its local completion notes and actual verification; synchronize and close only when its approved scope and required evidence are complete. Do not reimplement or silently mark them complete based on local status alone. FTB-009 and FTB-010 are already closed on GitHub; FTB-009 includes local subtickets FTB-009A/B. FTB-051 is closed; its later follow-up is FTB-057.

The repository's demo-first gate is evidenced satisfied for FTB-009A/B, FTB-010, FTB-011, and FTB-013 through FTB-018. FTB-012 remains partial only for theme-density integration and is not a demo-first blocker. This does not waive any ticket-specific dependency or the stricter Phase 2 release gate.

## 1. Stabilize and finish active work

1. [FTB-060](./TICKETS.md#ftb-060) — Diagnose and repair verification failures and timeouts; record reproducible results. This is recommended first to establish a reliable feedback loop, not a newly imposed hard dependency.
2. [FTB-058](./TICKETS.md#ftb-058) — Finish and isolate the existing Inspector scopes, named colors, and mode-link work; verify persistence, mode behavior, exports and MCP. Related: FTB-007, FTB-008, FTB-022, FTB-052.
3. [FTB-057](./TICKETS.md#ftb-057) — Finish the theme-palette/native-picker follow-up, including integration with existing token work. Related: FTB-051 and FTB-058.
4. [FTB-059](./TICKETS.md#ftb-059) — Complete integrated verification of sidebar icon selection and label-color inheritance. Related: FTB-007, FTB-008, FTB-056. Ensure icon overrides and non-color properties behave correctly.
5. [FTB-054](./TICKETS.md#ftb-054) — Complete the urgent, already-in-progress hierarchical padding work. Coordinate shared files with FTB-058 rather than running concurrent writers. Related: FTB-006, FTB-022, FTB-052, FTB-053; FTB-024/025 are conditional export coordination, not blockers.

These slices overlap an extensive dirty worktree: preserve unrelated changes and verify the tested integrated state. Actual AI-client MCP evidence is still required where the ticket specifies it. Synchronize issue bodies, local ticket status, verification and commit references when a ticket genuinely completes.

## 2. Builder and coverage foundations

The following are recommended in order within each dependency chain; independent items can proceed in parallel if their actual prerequisites are met and work does not conflict.

1. [FTB-012](./TICKETS.md#ftb-012) — Finish the remaining table theme-density integration and verify the full table contract. This matters to later full coverage and Phase 2 even though it does not block the demo-first gate.
2. [FTB-052](./TICKETS.md#ftb-052) — Strict per-value padlocks, after its stated stabilization and FTB-022 prerequisites are verified. FTB-058 mode links are related but are not a substitute for padlocks.
3. [FTB-055](./TICKETS.md#ftb-055) — Topbar visibility, after FTB-018/006 prerequisite readiness is evidenced; currently planning/blocked.
4. [FTB-056](./TICKETS.md#ftb-056) — Comprehensive text color controls, after its documented registry/inheritance, JSON/migration and stabilization prerequisites are evidenced. FTB-059 is a sidebar-specific icon exception, not permission to recolor unrelated icons.
5. [FTB-019](./TICKETS.md#ftb-019) — Responsive and before/after preview. Related: FTB-002/003; needed by FTB-033.
6. [FTB-020](./TICKETS.md#ftb-020) — Starter presets. Related: FTB-005.
7. [FTB-023](./TICKETS.md#ftb-023) — Advanced custom CSS. Related: FTB-003.
8. [FTB-031](./TICKETS.md#ftb-031) — Accessibility contrast guidance. Related: FTB-005; needed for Alpha.
9. [FTB-032](./TICKETS.md#ftb-032) — Public coverage manifest and view. Related: FTB-006; needed by FTB-037/039.
10. [FTB-041](./TICKETS.md#ftb-041) — Resource navigation badge colors; independently actionable, coordinate sidebar work with FTB-059.

## 3. Export, sharing, and operations

1. [FTB-024](./TICKETS.md#ftb-024) — Fully Explicit vanilla CSS export; prerequisites FTB-004/006.
2. [FTB-025](./TICKETS.md#ftb-025) — Tailwind `@apply` export; prerequisites FTB-004/006. Can proceed alongside FTB-024 when shared seams permit.
3. [FTB-026](./TICKETS.md#ftb-026) — Export and installation guidance, after FTB-018, FTB-024 and FTB-025.
4. [FTB-029](./TICKETS.md#ftb-029) → [FTB-030](./TICKETS.md#ftb-030) — Server-backed theme sharing, then identity/expiry/rate limits; FTB-029 requires FTB-002/022.
5. [FTB-035](./TICKETS.md#ftb-035) — Production deployment after FTB-001/002, FTB-028 and FTB-030.
6. [FTB-036](./TICKETS.md#ftb-036) — Privacy-controlled analytics; independent after FTB-001. Follow the ticket's consent and privacy requirements.
7. [FTB-037](./TICKETS.md#ftb-037) — Contributor and architecture documentation, after FTB-001/032.

## 4. Integration, Alpha, and 1.0

1. [FTB-033](./TICKETS.md#ftb-033) — Playwright and visual regression after its listed Inspector/showcase prerequisites, including FTB-012, FTB-019 and FTB-026. Confirm the ticket-specific FTB-012 requirement rather than treating the demo-first exception as a blanket waiver.
2. [FTB-034](./TICKETS.md#ftb-034) — Jenkins pipeline after FTB-033 and FTB-035.
3. [FTB-038](./TICKETS.md#ftb-038) — Public Alpha after its documented export, reset, sharing, accessibility, test, deployment, analytics and documentation prerequisites: FTB-026, 028, 030, 031, 033–037.
4. [FTB-039](./TICKETS.md#ftb-039) — Complete Filament coverage after the listed showcase tickets, FTB-032 and FTB-033; close remaining partials with evidence.
5. [FTB-040](./TICKETS.md#ftb-040) — Cut 1.0 only after FTB-038 and FTB-039 and the release acceptance criteria are satisfied.

## 5. Phase 2: Composer integration

All Phase 2 tickets require FTB-040 **and all approved Phase 1 requirements**, including completed FTB-012. The package identity, namespace and Composer coordinates must be explicitly decided before release; the demo-first gate alone does not authorize Phase 2 release.

1. [FTB-042](./TICKETS.md#ftb-042) — Package installation and protected dock.
2. [FTB-043](./TICKETS.md#ftb-043) and [FTB-044](./TICKETS.md#ftb-044) — Preview/draft lifecycle and source discovery, each after FTB-042.
3. [FTB-045](./TICKETS.md#ftb-045) — Confirm and append, after FTB-042/043/044.
4. [FTB-046](./TICKETS.md#ftb-046) — Replace, journal and recovery, after FTB-045.
5. [FTB-047](./TICKETS.md#ftb-047) and [FTB-048](./TICKETS.md#ftb-048) — Shared panel state and local MCP parity after their documented FTB-044/045/046 prerequisites.
6. [FTB-049](./TICKETS.md#ftb-049) — Consumer installation and release verification after FTB-042 through FTB-048 and package identity decisions.

## Execution rules

Use each ticket's acceptance criteria as authoritative, preserve light/dark isolation, use TDD and applicable real Compose Playwright coverage, and maintain MCP discovery, authorization, confirmation and actual-client verification where required. Recheck live issue state and local evidence before starting or closing; this snapshot does not supersede tracker policy.
