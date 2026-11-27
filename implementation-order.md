# Remaining implementation order

Snapshot: GitHub open issues and [`TICKETS.md`](./TICKETS.md), checked 2026-11-18 on `dev`. This is a recommended sequence, not a change to ticket scope, priority, blockers, or release gates. Each FTB link below opens the local ticket; the corresponding GitHub issue is `https://github.com/Azab-Inc/filament-theme-builder/issues/<number>`. Verify current tracker status, the ticket body, evidence, and the worktree before starting a slice.

**2026-11-18 update:** Added the Filament component/variant coverage epic [FTB-070](./TICKETS.md#ftb-070) and slices [FTB-071](./TICKETS.md#ftb-071)–[FTB-075](./TICKETS.md#ftb-075), filed as GitHub [#72](https://github.com/Azab-Inc/filament-theme-builder/issues/72)–[#77](https://github.com/Azab-Inc/filament-theme-builder/issues/77) and tracked in project #30 as Backlog. They are backed by the [component/variant coverage spec](./docs/superpowers/specs/2026-11-18-filament-component-variant-coverage-design.md) and [chart theming spec](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md), committed in `f8cf70c`. These slices are recommended before FTB-039 but do not change any recorded blocker list or replace FTB-039's closure criteria.

## First: reconcile existing work

Panel configuration planning: [FTB-087](./TICKETS.md#ftb-087) / [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89) requires a complete inventory and child issues before sequencing implementation. [FTB-088](./TICKETS.md#ftb-088) / [#90](https://github.com/Azab-Inc/filament-theme-builder/issues/90) covers top navigation, [FTB-089–102](./TICKETS.md#ftb-089) navigation/layout, [FTB-103–127](./TICKETS.md#ftb-103) runtime/authentication, [FTB-128–157](./TICKETS.md#ftb-128) tenancy/search/styling, and [FTB-158–180](./TICKETS.md#ftb-158) menus/notifications/auth routes/registrations; coordinate FTB-018/055. See [initial research](./docs/research/2026-11-18-panel-properties.md).

**Phase decision:** Non-visual panel configuration children are deferred to Composer package Phase 2; see the [exact ticket list](./TICKETS.md#ftb-087). They inherit the Phase 2 gate below and any ticket-specific prerequisites. Other GitHub issues are labelled `Phase 1`, including the umbrella for its online-builder work; the umbrella still spans both phases. Phase 1 features also need porting to the Composer package in Phase 2. This classification does not alter the sequence or prerequisites.

**Live Export handoff (2026-11-19):** Coordinate FTB-026 and FTB-087 under the [production-ready PanelProvider export contract](./TICKETS.md#production-panel-provider-export) before closing applicable visual configuration slices. Require portable consumer PHP from the requesting draft, correct false/inherited semantics, separation from demo adapters, preservation of host configuration, test-first concurrent copy/download UI and clean-reference runtime plus applicable MCP verification. Mirrored in #26, #89 and all 46 open `visual config` issue bodies in Project #30; existing gates and statuses remain in force.

**Online preview prerequisite (2026-11-19):** Establish the shared [multi-user preview isolation contract](./TICKETS.md#deployed-preview-isolation) under #89 before implementing dependent visual panel controls; it also applies to FTB-018/055. Each applicable child must verify request/worker isolation, visitor/tab independence, navigation/Livewire context propagation and its installed API lifecycle, with failing-first regression coverage and passing concurrent production Compose browser plus applicable MCP checks. The contract is mirrored in #89 and all 46 open `visual config` issue bodies linked from Project #30. Existing phase gates and statuses remain in force.

GitHub reports issues #1–#8, #11, #13–#18, #21, #22, #27, #28, #50 and #53 **open**, while their local tickets say **done**. Reconcile each issue against its local completion notes and actual verification; synchronize and close only when its approved scope and required evidence are complete. Do not reimplement or silently mark them complete based on local status alone. FTB-009 and FTB-010 are already closed on GitHub; FTB-009 includes local subtickets FTB-009A/B. FTB-051 is closed; its later follow-up is FTB-057.

The repository's demo-first gate is evidenced satisfied for FTB-009A/B, FTB-010, FTB-011, and FTB-013 through FTB-018. FTB-012 remains partial only for theme-density integration and is not a demo-first blocker. This does not waive any ticket-specific dependency or the stricter Phase 2 release gate.

## 1. Stabilize and finish active work

User-requested narrow regression: [FTB-181](./TICKETS.md#ftb-181) / [#183](https://github.com/Azab-Inc/filament-theme-builder/issues/183) is Done (local `5a26a76`, not pushed). Density preset spacing synchronization and reset were verified with failing-first unit/Compose browser regressions, type-check, full units and alternate-output production build; original output permission limitations are retained in the ticket. Existing UI changes were preserved; does not alter other ticket gates. [Evidence](./TICKETS.md#ftb-181).

1. [FTB-060](./TICKETS.md#ftb-060) — Completed and closed 2026-11-02; verification evidence is linked in the ticket.
2. [FTB-058](./TICKETS.md#ftb-058) — Completed 2026-11-03 on draft [PR #62](https://github.com/Azab-Inc/filament-theme-builder/pull/62): Inspector scopes, named colors, mode links and actual MCP/browser verification pass. [Evidence](./docs/verification/ftb-058/README.md). Awaiting owner integration; related parent tickets retain their separate scope.
3. [FTB-057](./TICKETS.md#ftb-057) — Done 2026-11-25 in implementation commit `59ee76a`; focused units, type-check, alternate-output build, and four real Compose color-reference journeys pass. Shared MCP stale-operation and capability-inventory test gaps remain documented as unrelated follow-up evidence. Related: FTB-051 and FTB-058.
4. [FTB-059](./TICKETS.md#ftb-059) — Done 2026-11-25: integrated sidebar icon selection, label-color inheritance, icon override precedence, state/mode/history/reset/export behavior, non-color isolation, and applicable MCP raw-inspector verification pass. Related: FTB-007, FTB-008, FTB-056.
5. [FTB-054](./TICKETS.md#ftb-054) — Done 2026-11-26, subsequently committed in local `5a26a76` (not pushed): focused padding/MCP checks, real iframe journeys, alternate-output build, and actual stdio MCP discovery/preview/confirm/set/read/reset journey pass. Original verification limitations are retained in the ticket. Coordinate shared files with FTB-058. Related: FTB-006, FTB-022, FTB-052, FTB-053; FTB-024/025 are conditional export coordination, not blockers.
6. [FTB-182](./TICKETS.md#ftb-182) — Open / Testing after reassessment: implementation `5a26a76` and state/mode-link repair `568cb78` are local, not pushed. Full builder units/type/normal build and focused PHP/browser pass; collision status and mode/state/reset/malformed-boundary acceptance evidence remain incomplete. [Criterion map](./docs/verification/ftb-182.md). Coordinate FTB-008, FTB-022, FTB-004 and FTB-058; GitHub [#184](https://github.com/Azab-Inc/filament-theme-builder/issues/184) remains in Project #30 Testing.

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
11. [FTB-070](./TICKETS.md#ftb-070) — Filament component/variant coverage umbrella. Recommended child order: [FTB-071](./TICKETS.md#ftb-071) inventory and variant editing seams → [FTB-072](./TICKETS.md#ftb-072) chart CSS appearance → [FTB-073](./TICKETS.md#ftb-073) series palettes and chart types → [FTB-074](./TICKETS.md#ftb-074) variants/fixtures and structured Inspector targets; [FTB-075](./TICKETS.md#ftb-075) export follows FTB-073 and coordinates with FTB-024/025/026. Charts are first because canvas rendering exposes the selector gap most clearly; non-chart family controls remain follow-up scope. FTB-071 metadata feeds the FTB-032 manifest, but FTB-039 remains the final coverage closure.

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

   Initial verification-only Jenkins wiring is now present under the approved retrospective slice; live Jenkins is unverified and full deployment/release-monitoring scope plus prerequisites remain outstanding. [Evidence](./docs/verification/2026-11-27-agent-retrofit.md).
3. [FTB-038](./TICKETS.md#ftb-038) — Public Alpha after its documented export, reset, sharing, accessibility, test, deployment, analytics and documentation prerequisites: FTB-026, 028, 030, 031, 033–037.
4. [FTB-039](./TICKETS.md#ftb-039) — Complete Filament coverage after the listed showcase tickets, FTB-032 and FTB-033; finish the FTB-070–FTB-075 slices first where they cover the chart/component gaps, then close remaining partials with evidence. FTB-070 does not replace this ticket's acceptance criteria.
5. [FTB-040](./TICKETS.md#ftb-040) — Cut 1.0 only after FTB-038 and FTB-039 and the release acceptance criteria are satisfied.

## 5. Phase 2: Composer integration

All Phase 2 tickets require FTB-040 **and all approved Phase 1 requirements**, including completed FTB-012. The package identity, namespace and Composer coordinates must be explicitly decided before release; the demo-first gate alone does not authorize Phase 2 release.

1. [FTB-042](./TICKETS.md#ftb-042) — Package installation and protected dock.
2. [FTB-043](./TICKETS.md#ftb-043) and [FTB-044](./TICKETS.md#ftb-044) — Preview/draft lifecycle and source discovery, each after FTB-042.
3. [FTB-045](./TICKETS.md#ftb-045) — Confirm and append, after FTB-042/043/044.
4. [FTB-046](./TICKETS.md#ftb-046) — Replace, journal and recovery, after FTB-045.
5. [FTB-047](./TICKETS.md#ftb-047) and [FTB-048](./TICKETS.md#ftb-048) — Shared panel state and local MCP parity after their documented FTB-044/045/046 prerequisites.
6. [FTB-049](./TICKETS.md#ftb-049) — Consumer installation and release verification after FTB-042 through FTB-048 and package identity decisions.

## 6. Builder stylesheet compliance

Behavior-preserving refactor of the builder's own chrome against [builder/src/styles/AGENTS.md](./builder/src/styles/AGENTS.md). It does not change the exported user-theme format, Filament runtime surfaces, or any demo-first or Phase 2 gate, and it can run in parallel with feature work when the shared stylesheet files are not being written concurrently. Preserve unrelated dirty worktree changes in `builder/src/styles`.

1. [FTB-077](./TICKETS.md#ftb-077) — Capture computed-style and screenshot baselines, then format the two minified prototype stylesheets in a standalone `Autogen:` commit.
2. [FTB-078](./TICKETS.md#ftb-078) — Add `tokens.css`, the `@utility` catalog, the base reset block, and the permanent compliance guard.
3. [FTB-079](./TICKETS.md#ftb-079), [FTB-080](./TICKETS.md#ftb-080), and [FTB-082](./TICKETS.md#ftb-082) — Convert editor chrome, control surfaces, and legacy prototype sheets; serialize writers that touch shared tokens.
4. [FTB-081](./TICKETS.md#ftb-081) — Split and convert the dashboard-first editor stylesheet after the editor and control slices land.
5. [FTB-083](./TICKETS.md#ftb-083) — Split and convert the visual prototype stylesheet after FTB-082.
6. [FTB-076](./TICKETS.md#ftb-076) — Umbrella audit: full guard, units, type-check, build, export goldens, five-mode/two-width browser evidence, and one read-only review.

Spec: [Builder Stylesheet Tailwind Compliance](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md); plan: [implementation](./docs/superpowers/plans/2026-11-18-builder-stylesheet-tailwind-compliance.md).

## 7. Border-side controls

Added 2026-11-18 after verifying that current border controls had no top/right/bottom/left selection. [FTB-084](./TICKETS.md#ftb-084) / [#88](https://github.com/Azab-Inc/filament-theme-builder/issues/88) is the umbrella; both slices are saved in commit `4562f2e` and all three records are Open / Testing in project #30. The full-unit gate remains blocked by concurrent stylesheet token naming; see [verification](./docs/verification/ftb-084-border-sides.md). [Spec](./docs/superpowers/specs/2026-11-18-border-side-controls-design.md), [issue index](./ISSUES.md).

1. [FTB-085](./TICKETS.md#ftb-085) / [#87](https://github.com/Azab-Inc/filament-theme-builder/issues/87) — Verify existing FTB-006/022 evidence; inventory native border-bearing targets and coordinate FTB-071. Settle the schema/migration and precedence contract, then deliver semantic controls with preview, persistence/export and MCP verification. Recommended within builder/coverage foundations before FTB-039; unrelated chart work is not a prerequisite.
2. [FTB-086](./TICKETS.md#ftb-086) / [#86](https://github.com/Azab-Inc/filament-theme-builder/issues/86) — After FTB-085, extend raw Inspector using its shared edge semantics. Verify existing FTB-008/022/058 integration and coordinate FTB-052/062 guards/reset without treating their unimplemented features as present.
3. Close FTB-084 only after both vertical slices meet all acceptance and actual verification requirements. Do not treat this documentation task as feature implementation or gate completion.

## Execution rules

**Onboarding tour complete (2026-11-19):** FTB-067 / #69 → FTB-068 / #70 → FTB-069 / #71 and umbrella FTB-066 / #68 are delivered together. See [integrated verification](./TICKETS.md#ftb-066) for passing unit/type/build/browser checks, tested viewport/mode/layout matrix, and environment limitations. This completion does not alter other feature gates.

Use each ticket's acceptance criteria as authoritative, preserve light/dark isolation, use TDD and applicable real Compose Playwright coverage, and maintain MCP discovery, authorization, confirmation and actual-client verification where required. Keep CSS-addressable chart appearance separate from renderer-backed chart types and series palettes; the latter require generated PHP/config and mode-sync integration, not CSS-only claims. Recheck live issue state and local evidence before starting or closing; this snapshot does not supersede tracker policy.
