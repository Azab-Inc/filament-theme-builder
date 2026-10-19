# Filament Theme Builder — Implementation Tickets

**Status vocabulary:** ready-for-agent / in-progress / blocked / done  
**Branch policy before 1.0:** feature branches merge into dev; dev is the active integration and alpha-deployment branch.  
**Ticket style:** each ticket is intended to be a narrow, verifiable vertical slice that can fit in one fresh implementation context.

## How to use this file

- Work tickets whose blockers are all complete.
- Keep ticket IDs stable because SPECS.md deep-links to these anchors.
- When a ticket is implemented, update its status and check its acceptance criteria.
- If a ticket discovers new first-party Filament UI coverage, add that coverage to COVERAGE.md and add or split a ticket rather than silently expanding scope.
- New theme-control coverage should generally include registry coverage, a showcase fixture, and automated verification.
- Deferred color-picker and named-palette design: [FTB-051](#ftb-051) / [GitHub #51](https://github.com/Azab-Inc/filament-theme-builder/issues/51).
- Builder value padlock design: [FTB-052](#ftb-052) / [GitHub #52](https://github.com/Azab-Inc/filament-theme-builder/issues/52).
- Deferred builder component/composable refactor: [FTB-053](#ftb-053) / [GitHub #53](https://github.com/Azab-Inc/filament-theme-builder/issues/53).
- Urgent hierarchical padding design: [FTB-054](#ftb-054) / [GitHub #54](https://github.com/Azab-Inc/filament-theme-builder/issues/54).

## Dependency map

Demo-showcase delivery order (prose delivery order (not hard dependency blockers)): **Phase 1 → FTB-011 → FTB-012 → FTB-013 → FTB-014 → FTB-015 → FTB-016 → FTB-017 → FTB-018**. The dependency map below remains the source of hard blockers. The demo-complete gate is satisfied by current Compose evidence: FTB-009A/B/010, FTB-011, FTB-013, FTB-014, FTB-015, FTB-016, FTB-017, and FTB-018 are done; FTB-012 remains partial solely for theme-density integration and is explicitly not a blocker. Operational FTB-027 and FTB-028 are done, with FTB-028's full-suite documentation-mount gap recorded in its report. Phase 1 owns the branded existing dashboard shell, four commerce widgets (`CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`, `RecentOrdersWidget`, `LowStockWidget`), resource icons, and representative badges. FTB-015 owns the Showcase navigation/index, search/profile/authentication/tenant surfaces and must integrate (not duplicate) Phase 1 widgets/navigation. The official demo is research inspiration only; identity is independent; do not copy official-demo branding, content, or presentation.

```text
FTB-001
├── FTB-002
│   ├── FTB-009A ── FTB-009B ── FTB-010
│   ├── FTB-027 (parallel operational ticket)
│   ├── FTB-028 (parallel operational ticket; blocked by FTB-009A and FTB-027)
│   └── FTB-035
└── FTB-003
    ├── FTB-004 ── FTB-024 ── FTB-026
    │             └── FTB-025 ── FTB-026
    ├── FTB-005
    │   ├── FTB-011
    │   ├── FTB-012
    │   ├── FTB-013
    │   ├── FTB-014
    │   ├── FTB-015
    │   ├── FTB-020
    │   └── FTB-031
    ├── FTB-006 ── FTB-007 ── FTB-008
    │   ├── FTB-017
    │   ├── FTB-018
    │   └── FTB-032
    ├── FTB-019
    ├── FTB-021 ── FTB-022 ── FTB-029 ── FTB-030
    └── FTB-023

Coverage/showcase tickets feed FTB-033 visual regression.
Runtime + persistence + tests feed FTB-034 Jenkins and FTB-035 production.
All public-alpha prerequisites feed FTB-038.
Complete first-party coverage feeds FTB-039, then FTB-040.
FTB-041 is independent and can start immediately.

Phase 2 is release-blocked until all approved Phase 1 requirements and FTB-040
are complete. The eight Phase 2 slices below are vertical implementation
tickets, not horizontal test tickets. P2 identifiers are product requirements
from `docs/phase-2/PRD.md`; the implementation tickets are FTB-042 through
FTB-049. The package identity/namespace/Composer coordinates remain an
explicit release blocker and must not be invented in these tickets.
```

---

<a id="ftb-052"></a>

## FTB-052 — Add strict per-value builder padlocks

**Status:** blocked
**Blocked by:** FTB-003 functionality stabilization; the unchanged demo-first gate and remaining Phase 1 requirements (including FTB-018); existing foundation/control projection stabilization; [FTB-022](#ftb-022) versioned JSON import/export and migration boundary. FTB-012's density-only partial status is not a blocker.
**Gate note:** local root guidance and tracker issue states may be stale or inconsistent; the root demo-first gate remains in force until its documented acceptance criteria and evidence are resolved. Tracker status alone does not mark the gate complete.
**Spec:** [Builder Value Padlocks](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md), including [lock semantics](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#2-user-visible-contract), [persistence and migration](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#3-state-persistence-and-migration), [MCP and authorization](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#5-mcp-and-authorization-contract), and [testing](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#7-testing-and-observable-seams).
**GitHub:** [#52](https://github.com/Azab-Inc/filament-theme-builder/issues/52)
**Review fixed point:** `66c8b6e543717f41266b8c100d7cdeaa291dbdb1` (refresh before implementation review if functionality changes).

### What to build

Give every editable builder value a left-side padlock. A lock snapshots the currently resolved effective value—including inherited/CSS-variable values and each generated palette shade—and strictly prevents direct edits, pickers, regeneration, reset, undo/redo, and bulk operations from changing it until explicit unlock. Unlocked values continue to apply in mixed operations, which report skipped locked fields. Unlock only permits future edits and does not silently restore or regenerate anything.

### <a id="ftb-052-lock-semantics"></a>Lock semantics

- [ ] The lock inventory is generated from the complete editable registry/control inventory beyond foundations: icons/resource overrides, fonts, runtime/branding values, raw/component/variant/state paths, aliases, light/dark values, and typography composites are covered; no editable control is silently omitted.
- [ ] Every field has a reusable left-side lock control with stable field naming, keyboard support, `aria-pressed`, accessible label, protection tooltip, and non-color-only locked styling.
- [ ] Locking resolves and stores the effective current value; source expression/provenance remains informational. Missing, malformed, ambiguous, or unresolved values fail without guessing or empty overwrite.
- [ ] Aliases share one canonical lock identity; light/dark values are separate; typography locks the whole composite value; every generated shade 50–950, including 500, can be independently locked.
- [ ] A centralized guard protects direct edits, pickers, selectors, regeneration, per/group reset, undo/redo, and bulk theme/preset/import operations. Explicit unlock is the only protection-state change, and unlock does not restore or regenerate the value.
- [ ] Mixed operations update unlocked values, preserve locked effective values, and report every skipped field and reason.

### <a id="ftb-052-persistence-and-migration"></a>Persistence and migration

- [ ] Versioned lock metadata is included in canonical theme JSON, local autosave, reload/bootstrap, and JSON export/import; old themes migrate to all unlocked.
- [ ] Metadata validates schema/version, canonical paths, value compatibility, source metadata, and integrity hashes. Invalid, stale, duplicate, unknown, or unsafe metadata fails safely without damaging the current theme.
- [ ] Current locks take precedence when merging imported locked/unlocked fields. Serialized locks are restored at bootstrap after validation.
- [ ] Migration preview, exact-key acceptance, and JSON export parity are tested; no keys are added silently.
- [ ] Generated shade projection/materialization freezes the locked shade in actual preview and effective export, while unlocked peer shades still regenerate normally when the base changes.

### <a id="ftb-052-mcp-coverage"></a>MCP coverage

- [ ] Purpose-built MCP discovery/read/preview/apply capabilities expose editable values, effective values, and lock state through the capability inventory.
- [ ] Lock, unlock, and multi-value apply mutations require explicit preview confirmation and revalidate authorization, current state, resolution, compatibility, and locks at apply time.
- [ ] MCP uses the same centralized service as UI, cannot bypass locks or authorization, rejects untrusted selectors/CSS payloads, and reports partial skips.
- [ ] Authorization, malformed input, stale apply, and actual AI-client transport evidence are tested and documented; this is not claimed as UI-only behavior.

### <a id="ftb-052-verification"></a>Verification

- [ ] TDD unit/component tests cover the complete inventory, snapshot/materialization failures, all shade locks, aliases, modes, typography, every blocked operation, partial application, migration, persistence, malformed metadata, stale async rechecks, preview projection, and export parity.
- [ ] Playwright verifies inventory, left-side controls, keyboard/tooltip accessibility, lock/unlock, shade regeneration, reset, undo/redo, import, reload, mode separation, aliases, composite typography, partial reporting, and visible preview/export freezing.
- [ ] MCP capability discovery, confirmation, authorization, revalidation, lock/unlock, partial skip, and AI-client verification pass.
- [ ] Existing demo-first gate, foundation stability prerequisite, and unrelated worktree changes remain intact; no parent issue is modified and no dependency is added.

---

<a id="ftb-001"></a>

## FTB-001 — Bootstrap the sibling-app monorepo

**Status:** done
**Blocked by:** None (can start immediately)

### What to build

Create the repository foundation as one monorepo containing an independent Vue 3 builder application and an independent Laravel 13 / Filament 5 demo application. The local developer experience must support Laravel Sail and simple root-level commands so a contributor can start, test, and build the project without learning two unrelated command sets.

### Acceptance criteria

- [ ] The repository contains independently runnable builder and demo applications.
- [ ] The builder uses Vue 3, Vite, Pinia, and npm.
- [ ] The demo uses Laravel 13, PHP 8.5, Filament 5, and Laravel Sail.
- [ ] Root developer commands exist for setup, development, tests, E2E, and production build.
- [ ] A fresh checkout can be brought to a working local state using documented commands.
- [ ] No GitHub Actions configuration is introduced.
- [ ] Basic smoke tests prove both applications boot.

---

<a id="ftb-002"></a>

## FTB-002 — Deliver the real public Filament preview shell

**Status:** done
**Blocked by:** [FTB-001](#ftb-001)

### What to build

Provide a real Filament 5 preview application that can be embedded by the builder and navigated publicly without authentication. Also provide a real demo login screen whose visible helper text advertises the working credentials user / password, while keeping login optional for the normal preview experience.

### Acceptance criteria

- [x] The Filament panel is reachable publicly without logging in.
- [x] The preview is embeddable by the builder.
- [x] A real login page exists.
- [x] The login page visibly displays Username: user and Password: password.
- [x] Those credentials authenticate successfully.
- [x] Logging out does not prevent continued access to the public preview.
- [x] A subtle notice location exists for future demo-reset messaging.
- [x] The preview exposes a safe bridge hook for later builder communication.

---

<a id="ftb-003"></a>

## FTB-003 — Make the first theme edit work end to end

**Status:** done
**Blocked by:** [FTB-001](#ftb-001), [FTB-002](#ftb-002)

### What to build

Implement the canonical versioned theme state, a Pinia-backed editor state, iframe messaging, and dynamic preview CSS injection so a user can change one global theme value in Vue and see the real Filament preview update immediately without a Vite rebuild or Laravel request. Include undo/redo and debounced local autosave for this first end-to-end slice.

### Acceptance criteria

- [x] Theme state includes an explicit schemaVersion.
- [x] The builder can change at least the global primary color.
- [x] The preview updates immediately through client-side messaging.
- [x] Normal edits do not require a page reload, Laravel request, or asset rebuild.
- [x] Undo and redo work for the edit.
- [x] The current draft is automatically persisted to local storage with a short debounce.
- [x] Reloading the builder restores the current draft.
- [x] The preview accepts messages only from allowed origins/configuration.

---

<a id="ftb-004"></a>

## FTB-004 — Export a usable minimal vanilla theme.css

**Status:** done
**Blocked by:** [FTB-003](#ftb-003), demo-complete gate ([FTB-009A](#ftb-009), [FTB-009B](#ftb-009b), [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015))

### What to build

Turn canonical theme state into readable vanilla CSS and let the user copy or download a minimal theme.css that reproduces the current explicit changes in a normal Filament 5 custom theme.

### Acceptance criteria

- [x] Vanilla CSS is the default export syntax. Evidence: `vanilla-css-export.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] Minimal export emits only explicit overrides rather than every default. Evidence: `vanilla-css-export.spec.ts`.
- [x] Exported CSS is readable, grouped, and commented. Evidence: `vanilla-css-export.spec.ts`.
- [x] The file begins with a small Generated with Filament Theme Builder attribution. Evidence: `vanilla-css-export.spec.ts`.
- [x] Copy and download actions are available. Evidence: `App.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] The exported first-slice theme reproduces the previewed primary-color edit in the validated Filament 5 projection contract. Evidence: exporter and Compose preview integration tests.
- [x] No minification is applied to the downloaded source. Evidence: `vanilla-css-export.spec.ts`.

---

<a id="ftb-005"></a>

## FTB-005 — Deliver complete global foundations editing

**Status:** done
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Expand the editor from the first color edit into the complete global foundation controls: semantic colors, surfaces, light/dark values, palette shade generation and overrides, typography, spacing scale, density, radii, borders, and shadows.

### Acceptance criteria

- [x] Primary, success, warning, danger, info, and gray palettes are editable. Evidence: `builder/src/__tests__/foundation-defaults.spec.ts`, `builder/src/__tests__/App.spec.ts`, and `e2e/theme-foundations.spec.ts` cover the six palette controls.
- [x] Page, sidebar, topbar, card/elevated, input, border, and text layers are editable. Evidence: typed default/control coverage in `foundation-defaults.spec.ts` and the rendered control/reset coverage in `App.spec.ts` and `e2e/theme-foundations.spec.ts`.
- [x] Relevant values can differ between light and dark mode. Evidence: independent defaults and light/dark resolution in `foundation-defaults.spec.ts` and `theme-state.spec.ts`; Compose Playwright verifies mode projection in `theme-foundations.spec.ts`.
- [x] A base color can generate a 50–950 palette. Evidence: `builder/src/__tests__/palette-generator.spec.ts` and `foundation-defaults.spec.ts` assert all eleven shades and deterministic generation.
- [x] Individual generated shades can be overridden. Evidence: `palette-generator.spec.ts`, `theme-state.spec.ts`, and the Compose Playwright shade override/reset journey in `e2e/theme-foundations.spec.ts`.
- [x] System fonts, curated Google Fonts, and custom font-family names are represented. Evidence: `App.spec.ts` and `e2e/theme-foundations.spec.ts` exercise system, curated-name, and custom-name choices; the same E2E test verifies no font loading.
- [x] Density presets include Compact, Default, and Spacious. Evidence: `foundation-defaults.spec.ts`, `theme-state.spec.ts`, and the density controls in `App.spec.ts`/`e2e/theme-foundations.spec.ts`.
- [x] Global spacing scale, radius, border, and shadow controls are available. Evidence: `App.spec.ts` and `e2e/theme-foundations.spec.ts` cover controls, edits, persistence, and resets.
- [x] Preview changes remain immediate. Evidence: `e2e/theme-foundations.spec.ts` verifies real iframe updates/events without reload or non-GET traffic; `builder/src/__tests__/foundation-projection.spec.ts` and `demo/tests/Feature/FilamentPanelTest.php` cover the validated bridge contract.
- [x] Reset-to-default behavior works for every foundation control. Evidence: per-control reset rendering in `App.spec.ts`, store reset/history coverage in `theme-state.spec.ts`, and the Compose Playwright reset/persistence journey in `e2e/theme-foundations.spec.ts`.

FTB-005 evidence was recorded after these fresh checks: `cd builder && npm run type-check && npm run test:unit -- --run && npm run build` (121 unit tests); `docker compose -f compose.dev.yaml exec -T demo-php php artisan test tests/Feature/FilamentPanelTest.php` (7 tests, 43 assertions); `docker compose -f compose.dev.yaml exec -T demo-php php artisan test` (148 tests, 1,394 assertions); `docker compose -f compose.dev.yaml exec -T demo-php vendor/bin/pint --test` (277 files); `docker compose -f compose.dev.yaml exec -T demo-php vendor/bin/phpstan analyse` (251 files, no errors); `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/theme-foundations.spec.ts` (3 passed); and Compose `/api/health` (`{"status":"ok"}`). The full Playwright command was also run: the three FTB-005 tests passed, while nine unrelated existing tests failed because they hard-code unavailable host ports 4173/4174; this does not leave an FTB-005 acceptance gap.

Final hardening wave evidence (2026-10-12): V3 nested payload validation now requires every foundation record, rejects unknown/malformed/non-finite/unsafe values and override identities, and the bridge accepts only exact inventory tuples. The inventory has an explicit classification and absence reason for all 100 FTB-005 controls; UI statuses read that inventory and no longer serialize `explicitPaths`; curated fonts use the shared finite allowlist. Fresh final-pass checks: builder type-check, 126 unit tests, builder production build, focused Compose PHP bridge suite (7 tests, 50 assertions), full Compose PHP suite (148 tests, 1,401 assertions), Pint (277 files), PHPStan (251 files), foundation Playwright (3 passed), and `/api/health` (`{"status":"ok"}`).

FTB-012 density integration and FTB-018 branding/runtime consumption remain separate work. This status does not lift the demo-first gate or claim completion of those tickets.

---

<a id="ftb-006"></a>

## FTB-006 — Implement the semantic theme-control registry and inheritance

**Status:** done
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Create the version-aware registry that maps semantic Filament UI concepts to stable selectors and supported controls. Implement inheritance from Global to Component to Variant to State, with explicit overrides only when a child departs from its inherited value.

### Acceptance criteria

- [x] Registry entries have stable semantic IDs independent of display labels. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — “keeps labels independent from stable semantic IDs” checks stable IDs and labels.
- [x] Entries can declare one or more Filament selectors and supported controls. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — registry metadata and malformed selector/control tests.
- [x] Registry metadata records the Filament compatibility baseline. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — compatibility rejection and conflicting-baseline tests.
- [x] Theme values inherit Global → Component → Variant → State. Evidence: `builder/src/__tests__/theme-resolver.spec.ts` — “resolves Global → Component → Variant → State and nearest parent fallback”.
- [x] Child controls default to Inherit. Evidence: `builder/src/__tests__/theme-state.spec.ts` — “stores Inherit as absence and reset removes only the selected override”.
- [x] Resetting an override returns it to inherited behavior rather than copying the parent value. Evidence: `builder/src/__tests__/theme-state.spec.ts` — reset resolves to legacy global after override removal; `builder/src/__tests__/theme-resolver.spec.ts` — inheritance resolution and explicit-equal-value tests.
- [x] Minimal export can distinguish inherited values from explicit overrides. Evidence: `builder/src/__tests__/theme-serialization.spec.ts` — “minimal serialization keeps only sparse explicit overrides” checks explicit-equal child retention and inherited-copy absence.
- [x] A representative component demonstrates all four inheritance levels. Evidence: `builder/src/__tests__/theme-resolver.spec.ts` — the `button.primary.background` fixture resolves global, component, variant, and state contributions. This is a tested domain example, not a user-visible UI demonstration.
- [x] Registry lookup can resolve an element to a semantic theme target. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — unique selector matches to `button.primary`, `button.secondary`, and `global.primary`, alongside deterministic no-match and ambiguous results.

FTB-006 evidence is limited to the tested registry, resolver, serialization, migration, persistence, and history domain contract. It does not claim a user-visible Inspector or full theme-editor UI; Inspector behavior remains FTB-007.

Remediation evidence: `theme-state.spec.ts` verifies canonical `colors.primary` inheritance without synthetic overrides and duplicate-payload quarantine; `theme-resolver.spec.ts` verifies typed invalid-request/invalid-state results and duplicate identity rejection; `theme-serialization.spec.ts` verifies invalid scope requests are rejected before traversal; `theme-registry.spec.ts` verifies cloned, normalized immutable constraint metadata.

---

<a id="ftb-007"></a>

## FTB-007 — Add semantic Inspector mode

**Status:** done
**Blocked by:** [FTB-006](#ftb-006)

### What to build

Let the user enter Inspector mode, hover real Filament elements, see a visible highlight, select an element, and jump directly to the matching semantic controls while preserving a clear semantic breadcrumb.

### Acceptance criteria

- [x] Inspector mode can be toggled without breaking normal preview navigation.
- [x] Hovered inspectable elements receive a temporary outline.
- [x] The selected element remains visibly outlined.
- [x] Selection resolves through the semantic registry where possible.
- [x] The editor navigates to the matching category/control automatically.
- [x] A semantic breadcrumb is displayed, with canonical labels for mapped controls and bridge evidence for selector-only matches.
- [x] Selecting nested elements chooses a sensible semantic target rather than the most deeply nested DOM node by default.
- [x] Inspector communication works across the builder/preview iframe boundary.

Evidence: `builder/src/__tests__/App.spec.ts`,
`builder/src/__tests__/inspector-protocol.spec.ts`,
`e2e/ftb-007-inspector.spec.ts`, `e2e/ftb-007-bridge.spec.ts`, and
`demo/tests/Feature/PreviewInspectorBridgeTest.php`. The capability contract is
recorded as `preview.inspector` (read-only / UI-only, no MCP mutation tool) in
`docs/ai-operability/demo-showcase-capability-inventory.md`.

---

<a id="ftb-008"></a>

## FTB-008 — Add advanced raw-element styling to Inspector

**Status:** done
**Blocked by:** [FTB-007](#ftb-007)

### What to build

Extend Inspector so a user can style an element even when the curated registry is incomplete. The system should propose a stable selector, expose advanced raw-element controls alongside semantic controls, and warn when a reliable selector cannot be identified.

### Acceptance criteria

- [x] Semantic and Advanced controls are both available for a selected element. Evidence: `App.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] Stable Filament classes are preferred when proposing selectors. Evidence: `raw-overrides.spec.ts`.
- [x] Brittle structural selectors are avoided when a semantic selector exists. Evidence: `raw-overrides.spec.ts`.
- [x] The UI warns when the proposed selector is likely fragile. Evidence: `raw-overrides.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] A user can edit/replace the proposed selector. Evidence: `App.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] Raw element overrides become part of canonical theme state. Evidence: `theme-state.spec.ts` and `theme-serialization.spec.ts`.
- [x] Raw overrides participate in undo/redo, persistence, JSON export, and CSS export. Evidence: builder unit/export tests and Compose Playwright coverage.
- [x] Raw overrides do not silently overwrite semantic registry data. Evidence: `theme-state.spec.ts` and `App.spec.ts`.

Review-blocker remediation evidence for `e4ef5fa` (2026-10-14): builder unit
tests (223 passed), type-check, and production build pass; CSS download bytes,
clipboard content, canonical JSON `rawOverrides`, reload/reset, deterministic
section/rule ordering, selector-rename conflict handling, and clean Filament
fixture parity are covered by `App.spec.ts`, `theme-state.spec.ts`,
`vanilla-css-export.spec.ts`, and the six Compose Playwright tests in
`e2e/ftb-008-raw-inspector.spec.ts`. The bridge rejects unsafe selectors,
unsafe values, duplicate selectors, and preserves valid ordering in browser
behavior; PHP bridge tests pass (4 tests, 48 assertions).

---

<a id="ftb-009"></a>

## FTB-009A — Build the realistic e-commerce demo domain

**Status:** done
**Blocked by:** [FTB-002](#ftb-002)

### What to build

Define and persist a coherent e-commerce demo domain rich enough to exercise Filament without turning the preview into unrelated kitchen-sink data. This is the first slice of the former FTB-009; its existing anchor remains stable.

### Acceptance criteria

- [x] All entities in [SPECS.md §14](./SPECS.md#14-demo-domain) are represented, including customers, addresses, products, categories, variants, tags, reviews, orders, order items, payments, refunds, shipments, inventory, suppliers, discounts, and appropriate notes/activity/status history. See [`EcommerceSchemaTest`](./demo/tests/Feature/Domain/EcommerceSchemaTest.php).
- [x] Migrations, Eloquent models, and relationships implement the complete domain graph. See [`EcommerceRelationshipsTest`](./demo/tests/Feature/Domain/EcommerceRelationshipsTest.php).
- [x] Factories and deterministic seeders produce repeatable, non-production disposable demo data. See [`EcommerceSeedTest`](./demo/tests/Feature/Domain/EcommerceSeedTest.php).
- [x] The model graph naturally includes BelongsTo, HasMany, BelongsToMany, and polymorphic relationships.

---

<a id="ftb-009b"></a>

## FTB-009B — Build core CRUD resources and navigation

**Status:** done
**Blocked by:** [FTB-009A](#ftb-009)

### What to build

Expose the seeded e-commerce domain through useful core Filament CRUD resources and coherent navigation.

### Acceptance criteria

- [x] Seed data is deterministic enough for screenshots and repeatable tests (covered by [`EcommerceSeedTest`](./demo/tests/Feature/Domain/EcommerceSeedTest.php)).
- [x] All 17 entities in [SPECS.md §14](./SPECS.md#14-demo-domain) have list/create/edit/view resource surfaces; [`EntityResourcesTest`](./demo/tests/Feature/Filament/Resources/EntityResourcesTest.php) is the executable matrix.
- [x] Core resources expose meaningful lists, create/edit forms, view states, badges, images, money, and status values.
- [x] Core resources are grouped in coherent admin navigation; navigation and public dashboard are covered by `EntityResourcesTest` and [`FilamentPanelTest`](./demo/tests/Feature/FilamentPanelTest.php).
- [x] Navigation feels like one coherent admin application.
- [x] Demo data is explicitly non-production and disposable.

---

<a id="ftb-010"></a>

## FTB-010 — Demonstrate Relation Managers and Nested Resources

**Status:** done
**Blocked by:** [FTB-009B](#ftb-009b)

### What to build

Use the e-commerce model to demonstrate Filament relationship UI as real workflows after the domain and core CRUD resources are ready, including representative Relation Managers, Nested Resources, and explicit relationship actions.

### Acceptance criteria

- [x] At least one resource contains multiple meaningful Relation Managers.
- [x] Nested Resources are used where full-page related editing is appropriate.
- [x] Attach and detach actions are explicitly available where applicable.
- [x] Associate and dissociate actions are explicitly available where applicable.
- [x] Related-record create/edit actions are demonstrated where appropriate.
- [x] Relationship tables contain filters/actions/states useful for theming.
- [x] Relationship forms and modals are represented.
- [x] The coverage manifest distinguishes Relation Managers from Nested Resources. See [SPECS.md §15](./SPECS.md#15-relation-managers-and-nested-resources), [`RelationshipWorkflowsTest`](./demo/tests/Feature/Filament/Resources/RelationshipWorkflowsTest.php), and [`demo-panel.spec.ts`](./e2e/demo-panel.spec.ts).

---

<a id="ftb-011"></a>

## FTB-011 — Cover Forms and Schemas visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create a Forms & Schemas showcase containing every visually distinct first-party Filament 5 form/schema component and layout that matters for theming, and connect those elements to the semantic theme registry.

### Acceptance criteria

- [x] `ShowcaseFormsPage` contains named fixtures `ProductEditorForm` (text, price, select, toggle, date, upload), `CustomerContactForm` (address/contact fields), and `OrderStatusForm` (status and validation states), with relevant registry targets.
- [x] `ProductEditorForm` demonstrates `SectionGridLayout`, `WizardStepsLayout`, and `TabbedFormLayout` as distinct surfaces, not identical API permutations.
- [x] Applicable default, filled, focused, disabled, and validation-error states have a deterministic representation.
- [x] Registry entries exist for the relevant themable surfaces.
- [x] Global/component/variant/state inheritance is demonstrable on the production `form.product-name` target (`.fi-fo-text-input .fi-input`, `background-color`) through the canonical resolver/store and the real focused forms showcase; evidence: `theme-registry.spec.ts`, `theme-resolver.spec.ts`, `theme-state.spec.ts`, and the Compose Playwright forms acceptance test.
- [x] Duplicate API permutations that render identically are not added just to inflate coverage.

Implementation: `0aac781` (`Feature: add forms and schemas showcase`); verification: [`FormsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Completed: native fixtures and selector-only registry coverage include every visually distinct Filament 5.9 form/schema surface with a vendor/runtime CSS root, including the verified Fieldset/Grid, Repeater, Radio, ToggleButtons, Builder, Checkbox, CheckboxList, CodeEditor, ColorPicker, KeyValue, MarkdownEditor, ModalTableSelect, OneTimeCodeInput, RichEditor, Slider, TagsInput, Actions, Callout, EmptyState, Form, FusedGroup, Icon, Image, Text, UnorderedList, Tabs, and Wizard surfaces. DatePicker/DateTimePicker/TimePicker and Select/MultiSelect/MorphToSelect intentionally share one registry entry where Filament renders the same surface; non-visual Hidden, Placeholder, ViewField, Html, Group, and embedded/runtime-only components are not duplicated as visual targets. Deterministic native default/filled/optional-null, focused, disabled, and validation-error evidence is covered by `FormsShowcaseTest` and the Compose Playwright forms acceptance tests. Forced-state controls remain outside this ticket and belong to FTB-016.

---

<a id="ftb-012"></a>

## FTB-012 — Cover Tables visually

**Status:** partial
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create a Tables showcase and realistic table fixtures covering all visually distinct first-party Filament table states and capabilities relevant to theme design.

### Acceptance criteria

- [x] `TablesShowcase` contains a native read-only `ProductsTableFixture` with text, image, badge/icon, and distinct column treatments using deterministic seeded products and order counts.
- [x] The fixture demonstrates search, sorting, filters, grouping, pagination, summaries, and column toggling.
- [x] Row selection, bulk actions, row actions, and reorder support are represented where installed; read-only actions require confirmation and do not mutate seeded records.
- [x] Empty and loading states, invalid filters, missing image/relationship data, long names, mobile layout, and selection reset are covered deterministically.
- [x] Coverage is registered in `COVERAGE.md` with Livewire and Playwright sources for table surfaces, rows, headers, controls, and relevant states.
- [x] Table density/spacing changes visibly respond to theme controls. Evidence: `builder/src/__tests__/foundation-projection.spec.ts` covers the verified `.fi-ta` projection tuple, and `e2e/theme-foundations.spec.ts` verifies Compact/Default/Spacious changes on the native Products/Orders/Inventory tables in the Compose preview iframe without reload or non-GET traffic. The bridge uses only verified Filament 5.9 `.fi-ta-header`, `.fi-ta-header-cell`, `.fi-ta-text`, `.fi-ta-icon`, `.fi-ta-image`, and `.fi-ta-cell.fi-ta-selection-cell` selectors.

The native tables and interaction contract are implemented. Density integration is limited to the evidence-backed table selectors above; unrelated Filament controls remain unchanged and FTB-011 partial/native themability gaps are not claimed here.

Implementation: `293b7aa` (`Feature: add tables showcase fixtures`); verification: [`TablesShowcaseTest`](./demo/tests/Feature/Filament/Showcase/TablesShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

---

<a id="ftb-013"></a>

## FTB-013 — Cover Infolists visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create an Infolists showcase containing every visually distinct first-party entry/layout needed for theme design, wired to the semantic registry.

### Acceptance criteria

- [x] `ShowcaseInfolistsPage` contains `OrderDetailsInfolist`, `CustomerProfileInfolist`, and `ProductDetailsInfolist`, including the verified runtime-available first-party entries identified in COVERAGE.md.
- [x] `OrderDetailsInfolist` and `CustomerProfileInfolist` demonstrate distinct section/group layouts without identical API permutations.
- [x] Common states such as empty/null, badges, icons, images, and rich text are demonstrated where visually distinct.
- [x] Registry entries exist for relevant surfaces and states, including both native RepeatableEntry modes.
- [x] Infolists respond correctly to light/dark and global foundation changes on real rendered entries.

Implementation: `31c4110` (`Feature: add infolists showcase fixtures`); verification: [`InfolistsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/InfolistsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Evidence: `InfolistsShowcaseTest` (6 passing tests, 53 assertions), the three focused `e2e/demo-showcase.spec.ts` tests, and the Compose-only foundation integration test in `e2e/theme-foundations.spec.ts` (real light/dark infolist colors and primary badge projection). Vendor/runtime review found the optional Filament `CodeEntry` class but no installed `phiki/phiki` runtime; it is documented as unavailable rather than guessed, copied, or added as a dependency. Shared schema layout selectors remain covered by the existing form registry by design.

---

<a id="ftb-014"></a>

## FTB-014 — Cover Actions, Modals, and Notifications visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create showcase fixtures and registry coverage for Filament actions, buttons, dropdown/action groups, modals, confirmation flows, and notifications across their distinct semantic variants and states.

### Acceptance criteria

- [x] `ShowcaseActionsPage` contains `OrderActionsFixture` and `ProductActionsFixture` with primary, danger, success, warning, info, gray, outline, icon-only, disabled, and loading variants where applicable.
- [x] `DeleteProductConfirmationModal` and `OrderStatusModal` demonstrate representative sizes, headers, footers, forms, destructive confirmation, and loading/action states.
- [x] `OrderStatusNotification`, `InventoryWarningNotification`, and `ActionFailureNotification` demonstrate semantic status styles and layout variations.
- [x] Registry entries expose component, variant, and state-level theming.
- [x] `showcase.notifications` and modal fixtures can be forced visible for theme work without timing-sensitive interaction; forcing is presentation-only and does not persist data.

Implementation: `ca160d1` (`Feature: add actions modals and notifications showcase`); verification: [`ActionsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Evidence: `ActionsShowcaseTest` (7 passing tests, 114 assertions), the focused Compose Playwright actions/notifications suite (7 passing tests, including forced-visible modal/notification and modal loading coverage), and `builder/src/__tests__/theme-registry.spec.ts` (13 passing tests). The installed Filament 5.9 runtime is the compatibility baseline; no third-party compatibility dependency was added. FTB-016 remains the owner of generalized `ShowcaseStateControls` and is not implied by these presentation-only query tokens.

---

<a id="ftb-015"></a>

## FTB-015 — Cover Widgets, Navigation, Search, and auth/tenant UI

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Add visually distinct first-party widgets, sidebar/topbar/navigation patterns, global search, profile/authentication, and tenant-oriented UI to the showcase even when the public demo does not naturally require those flows.

### Acceptance criteria

- [x] Phase 1 provides `DemoShowcaseDashboard` with the branded existing dashboard shell, four widgets (`CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`, `RecentOrdersWidget`, `LowStockWidget`), resource icons, and `RepresentativeBadgeSet`, all backed by deterministic commerce data. Evidence: `DashboardShowcaseTest`, `e2e/demo-showcase.spec.ts`.
- [x] `ShowcaseIndexPage` is the FTB-015-owned entry for the showcase; FTB-015 integrates (not duplicate) Phase 1 widgets/navigation, and adds `ShowcaseSidebarNavigation`, `GlobalSearchSurface`, `ProfileMenuSurface`, `LoginSurface`, and controlled `TenantSwitcherSurface`. Evidence: `NavigationShowcaseTest`, `e2e/demo-showcase.spec.ts`.
- [x] Global search UI is represented. Evidence: native Ctrl+K search and result assertions in `e2e/demo-showcase.spec.ts`.
- [x] Login/profile/authentication UI is represented. Evidence: `FilamentPanelTest`, `NavigationShowcaseTest`, `e2e/demo-showcase.spec.ts`.
- [x] Tenant-switching UI is represented in a controlled showcase state where applicable. Evidence: no-persistence assertions in `NavigationShowcaseTest` and `e2e/demo-showcase.spec.ts`.
- [x] Registry entries cover the relevant themable surfaces. Evidence: `builder/src/__tests__/theme-registry.spec.ts`, `e2e/theme-registry-selectors.spec.ts`.
- [x] The showcase does not require visitors to actually belong to tenants or maintain personal accounts. Evidence: `AdminPanelProvider::hasTenancy()` remains false and no-write test coverage.

Implementation: `388c545` (`Feature: integrate Filament showcase navigation surfaces`); verification: [`NavigationShowcaseTest`](./demo/tests/Feature/Filament/Showcase/NavigationShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Completed: deterministic dashboard/widget fixtures, the single ShowcaseIndexPage entry, native navigation/search/profile/login integration, controlled tenant presentation, and verified FTB-015 registry selectors. FTB-016 still owns generalized forced states and is not implied by this ticket.

---

<a id="ftb-016"></a>

## FTB-016 — Add deterministic forced-state controls

**Status:** done
**Blocked by:** [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-014](#ftb-014), [FTB-015](#ftb-015)

### What to build

Give showcase pages controls that intentionally force otherwise transient states such as hover, focus, loading, disabled, validation error, open modal, selected row, empty data, and visible notifications.

### Acceptance criteria

- [x] `ShowcaseStateControls` deterministically switches named surfaces `FormValidationState`, `FormFocusState`, `TableEmptyState`, `TableLoadingState`, `TableSelectedRowState`, `ActionLoadingState`, `ModalOpenState`, and `NotificationVisibleState` (plus representative hover/disabled states).
- [x] Forced states are deterministic and suitable for screenshot testing.
- [x] FTB-016 owns forcing these visual states; state controls are presentation-only, do not persist data, and expose no MCP mutation tool for changing showcase state or demo records.
- [x] Inspector can target the forced state and resolve the correct semantic breadcrumb.
- [x] Theme state can override state-level values and visibly demonstrate inheritance.

---

<a id="ftb-017"></a>

## FTB-017 — Add icon packs and semantic icon replacement

**Status:** done
**Blocked by:** [FTB-006](#ftb-006), [FTB-015](#ftb-015)

### What to build

Let users alter the visual icon system with global pack/style presets and individual semantic Filament icon overrides while keeping exports understandable.

### Acceptance criteria

- [x] `IconPackConfiguration` offers the default pack and multiple alternative pack/style presets; `SemanticResourceIconOverrides` can replace individual resource icons after pack selection.
- [x] Individual semantic icons can be overridden after choosing a pack.
- [x] Icon changes preview immediately.
- [x] Icon configuration is part of theme JSON.
- [x] Required non-CSS configuration is surfaced in PanelProvider/config export rather than faked with brittle CSS.
- [x] FTB-017 owns icon configuration and its PanelProvider/config export path; icons are not duplicated as separate dashboard/showcase work.
- [x] Reset restores inherited/default icon behavior.

---

<a id="ftb-018"></a>

## FTB-018 — Add panel branding and runtime configuration controls

**Status:** done
**Blocked by:** [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Support appearance-related panel settings that are not purely CSS, including app name, logos, dark logo, favicon, logo height, brand typography, content/layout options, and other agreed visual PanelProvider settings. Preview instantly where safe and perform controlled preview reloads when true runtime configuration is required.

### Acceptance criteria

- [x] `PanelBrandingSettings` names app name, light/dark logos, favicon, logo height, brand typography, content width, and sidebar behavior, classifying each as CSS-previewable or PanelProvider/runtime configuration.
- [x] Light/dark logos can be represented.
- [x] Favicon and logo height configuration are represented.
- [x] Agreed layout settings such as content width/sidebar behavior are represented.
- [x] Purely visual settings use immediate preview emulation where safe.
- [x] Runtime-only settings trigger a controlled preview update/reload.
- [x] Theme state clearly distinguishes CSS settings from PanelProvider/runtime settings.
- [x] FTB-018 final evidence: Compose PHP suite (165 tests, 1,558 assertions), builder verification, dedicated branding journey, and full Compose Playwright suite (69 passed, 3 skipped by explicit environment gates) pass. The full foundation matrix no longer times out: the Compose dev stack disables the minimized Debugbar pointer interceptor, and showcase dashboard widgets load immediately in the iframe.

---

<a id="ftb-019"></a>

## FTB-019 — Add responsive preview and before/after comparison

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003), [FTB-002](#ftb-002)

### What to build

Give the user desktop, tablet, and mobile viewport presets, arbitrary draggable preview width, and a draggable split comparison between stock Filament and the current customized theme.

### Acceptance criteria

- [ ] Desktop, tablet, and mobile presets are available.
- [ ] The preview width can be dragged to arbitrary supported widths.
- [ ] Current width is visible to the user.
- [ ] Before/after mode compares untouched Filament with the current theme.
- [ ] Split position can be dragged.
- [ ] Inspector behavior remains understandable in custom-theme view.
- [ ] Responsive state persists for the current editing session.

---

<a id="ftb-020"></a>

## FTB-020 — Ship starter theme presets

**Status:** ready-for-agent  
**Blocked by:** [FTB-005](#ftb-005)

### What to build

Provide a small curated set of distinct editable theme presets while keeping stock Filament as the first-visit default.

### Acceptance criteria

- [ ] Stock Filament is the default initial theme.
- [ ] Approximately five to eight presets are available.
- [ ] Presets include distinct directions such as Minimal, Soft, Sharp, Corporate, Midnight, Colorful, and Compact.
- [ ] A preset is represented by normal canonical theme state rather than special-case CSS.
- [ ] Applying a preset replaces the current theme.
- [ ] The user is warned before overwriting modified work.
- [ ] Every preset works in light and dark mode or explicitly defines its supported behavior.

---

<a id="ftb-021"></a>

## FTB-021 — Manage multiple named local themes

**Status:** done
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Turn local persistence from one autosaved draft into a small anonymous local project manager where users can create, rename, duplicate, delete, reopen, and autosave multiple themes.

### Acceptance criteria

- [x] Users can create multiple named local themes. Evidence: `local-theme-store.spec.ts` and the focused Compose journey `e2e/ftb-021-local-themes.spec.ts`.
- [x] Themes can be renamed, duplicated, deleted, and opened. Evidence: `local-theme-store.spec.ts`, `LocalThemeManager.spec.ts`, and the focused Compose journey.
- [x] Editing autosaves to the active local theme with a debounce. Evidence: `local-theme-persistence.spec.ts`, `local-theme-persistence-switch.spec.ts`, and the focused Compose reload journey.
- [x] The current theme is clearly identified. Evidence: `LocalThemeManager.spec.ts` and the focused Compose active-marker journey.
- [x] Destructive deletion asks for confirmation. Evidence: `LocalThemeManager.spec.ts` and the focused Compose delete-confirmation journey.
- [x] Theme history/undo applies to the active theme without corrupting other saved themes. Evidence: `local-theme-persistence-history.spec.ts`, `local-theme-store.spec.ts`, and the focused Compose reopen/history journey.

FTB-021 verification evidence: builder type-check, full unit suite (79 files, 336 tests), and production build pass. The historical focused Compose run recorded 4 passes before this fix wave; the requested fresh focused rerun was incomplete because `http://127.0.0.1:4175` refused connections. The fresh full-suite command remains incomplete: the runner was terminated by the execution harness after 1,200,000 ms while the Compose gateway returned 502s; it had observed 1 passed, 57 failed, 39 fail-fast skips, and 16 not started out of 113, with no Playwright exit status. Compose recovery then failed because both Node services hit npm registry ETIMEDOUT errors, so no terminal full-suite count exists. Exact failures and fix-wave evidence are recorded in `.superpowers/sdd/2026-10-16-multiple-local-themes/task-9-report.md`; this is not evidence against FTB-021 because the gateway was unavailable. The FTB-020 preset-isolation criterion/journey is deferred because FTB-020 is not implemented; no preset capability or unsupported claim is included here. Local-theme MCP remains deferred to FTB-048.

Latest final-HEAD verification: canonical `compose.dev` stack healthy. The combined command `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-021-local-themes.spec.ts e2e/local-theme-manager.spec.ts` completed with 5 passed (56.0s). The earlier combined run had 4 passed / 1 timeout; the isolated test passed, and the latest combined rerun is clean. Root `npm test` also passed its latest 18 scripts: 338 builder tests, type-check, Pint, PHPStan, and 169 Laravel tests. The earlier full Playwright suite remains incomplete as documented above; this evidence does not claim a full E2E pass.

---

<a id="ftb-022"></a>

## FTB-022 — Add versioned JSON import/export and migrations

**Status:** done
**Blocked by:** [FTB-021](#ftb-021)

### What to build

Let users download and import the editable canonical theme representation. Define schema migrations so older JSON themes can be upgraded sequentially rather than breaking when the builder evolves.

### Acceptance criteria

- [x] Editable themes can be exported as canonical JSON.
- [x] JSON includes schemaVersion; canonical V4 export parity is preserved.
- [x] Valid V1–V4 JSON themes import as fresh browser-local themes after explicit confirmation.
- [x] Invalid or unsupported payloads produce safe errors without damaging current work.
- [x] Sequential migration infrastructure migrates V1 → V2 → V3 → V4.
- [x] Migration tests prove older fixtures open as the current schema.
- [x] Imported themes preserve supported semantic, raw, icon, and runtime state; nonempty custom CSS is explicitly rejected.
- [x] Local MCP list/export/import-preview and browser-confirmed import parity are covered by the capability inventory.

FTB-022 implementation and acceptance evidence: [`versioned theme import and MCP verification`](./docs/superpowers/verification/2026-10-18-versioned-theme-import-mcp.md). The evidence records bounded V1–V4 migration, crash-safe fresh import, the import UI, bounded `ftb:mcp` stdio, exact seven-tool registration, private relay lifecycle/routes, explicit browser confirmation, real Compose stdio/Playwright acceptance, and regression checks. Local-theme MCP supersedes FTB-021's FTB-048 deferral only for the listed capabilities; the relay remains disabled unless explicitly enabled in local/testing.

---

<a id="ftb-023"></a>

## FTB-023 — Add Advanced Custom CSS passthrough

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Provide an Advanced Custom CSS editor whose contents are appended after generated CSS, previewed live, stored in canonical theme state, and exported with the theme.

### Acceptance criteria

- [ ] Custom CSS can be edited and previewed.
- [ ] Custom CSS is applied after generated CSS.
- [ ] JavaScript and style-tag injection are not accepted as executable content.
- [ ] Custom CSS participates in local persistence, JSON import/export, and sharing.
- [ ] Undo/redo works for custom CSS edits at a sensible granularity.
- [ ] The UI clearly labels this as an advanced escape hatch rather than the primary editing workflow.

---

<a id="ftb-024"></a>

## FTB-024 — Add Fully Explicit vanilla CSS export

**Status:** ready-for-agent  
**Blocked by:** [FTB-004](#ftb-004), [FTB-006](#ftb-006)

### What to build

Add a second export strategy that writes the complete selected theme configuration rather than only explicit differences, while preserving the existing Minimal mode as the recommended compact option.

### Acceptance criteria

- [ ] Export UI offers Minimal and Fully Explicit modes.
- [ ] Minimal remains available and behaves as before.
- [ ] Fully Explicit resolves inherited values and writes the complete selected theme representation.
- [ ] Generated output remains grouped and readable.
- [ ] Both modes reproduce the same visual result for the same theme.
- [ ] Tests cover inheritance resolution differences between the two modes.

---

<a id="ftb-025"></a>

## FTB-025 — Add Tailwind @apply export

**Status:** ready-for-agent  
**Blocked by:** [FTB-004](#ftb-004), [FTB-006](#ftb-006)

### What to build

Provide Tailwind @apply as an alternative export syntax while keeping vanilla CSS as default. The Tailwind exporter should remain genuinely utility-oriented rather than silently falling back to large blocks of vanilla declarations.

### Acceptance criteria

- [ ] Export syntax selector offers Vanilla CSS and Tailwind @apply.
- [ ] Vanilla CSS remains the default.
- [ ] The Tailwind exporter uses @apply for generated component rules.
- [ ] Custom or arbitrary values are represented through appropriate Tailwind-compatible utilities/definitions rather than arbitrary silent vanilla fallback.
- [ ] Minimal and Fully Explicit strategies both work with Tailwind export.
- [ ] Exported Tailwind theme is verified against the supported Filament/Tailwind baseline.
- [ ] Unsupported transformations produce an explicit warning rather than incorrect output.

---

<a id="ftb-026"></a>

## FTB-026 — Deliver complete export and installation guidance

**Status:** ready-for-agent  
**Blocked by:** [FTB-018](#ftb-018), [FTB-024](#ftb-024), [FTB-025](#ftb-025)

### What to build

Make export a complete handoff from the visual builder into a user's real Filament project by providing theme.css, tailored installation steps, relevant PanelProvider snippets, and an optional complete AdminPanelProvider example.

### Acceptance criteria

- [ ] Copy and download flows work for both CSS syntaxes and both export strategies.
- [ ] The user can copy only the relevant PanelProvider method calls.
- [ ] The user can optionally view/copy a complete example AdminPanelProvider.
- [ ] Snippet mode is presented as the safer default for existing projects.
- [ ] Installation guidance adapts to the selected export/runtime features.
- [ ] Custom font-family guidance explains that the font must be loaded by the user's application.
- [ ] Export does not imply that users should overwrite unrelated provider configuration.
- [ ] A clean reference Filament project can follow the instructions successfully.

---

<a id="ftb-027"></a>

## FTB-027 — Make demo uploads real but safely bounded

**Status:** done
**Blocked by:** [FTB-002](#ftb-002)

### What to build

Allow the public demo to exercise real Filament upload UI while constraining file type and storage abuse.

### Acceptance criteria

- [x] JPEG, PNG, WebP, and PDF uploads are accepted.
- [x] Other file types are rejected.
- [x] Maximum upload size is 5 MB per file.
- [x] Maximum temporary storage attributable to one anonymous user is 25 MB.
- [x] Global temporary upload storage never intentionally exceeds 500 MB.
- [x] When storage approaches the ceiling, oldest files are purged until usage is approximately 400 MB.
- [x] Upload paths cannot execute uploaded content as application code.
- [x] Quota/error states are understandable in the UI.

---

<a id="ftb-028"></a>

## FTB-028 — Reset demo state every ten minutes without breaking the showcase

**Status:** done
**Blocked by:** [FTB-009A](#ftb-009), [FTB-027](#ftb-027)

### What to build

Restore the demo from a known-good SQLite snapshot every ten minutes, clean temporary uploads, and constrain destructive actions so the public demo remains useful between resets.

### Acceptance criteria

- [x] A deterministic known-good demo database snapshot exists.
- [x] Scheduler restoration runs every ten minutes.
- [x] Restoration is atomic enough that normal visitors do not see a half-restored database.
- [x] Temporary demo uploads are removed during cleanup.
- [x] The UI displays Demo data resets every 10 minutes.
- [x] Destructive actions that could make the showcase unusable are simulated or constrained.
- [x] Create/edit/action UI still behaves realistically enough for theming.
- [x] Automated tests verify reset behavior.

---

<a id="ftb-029"></a>

## FTB-029 — Create temporary server-backed theme sharing

**Status:** ready-for-agent  
**Blocked by:** [FTB-002](#ftb-002), [FTB-022](#ftb-022)

### What to build

Allow a user to publish the current canonical theme payload to a small persistent share store and receive a clean /theme/<id> URL that another visitor can open and continue editing.

### Acceptance criteria

- [ ] Shares use a persistent SQLite store separate from the disposable demo database.
- [ ] A share contains a versioned canonical theme payload.
- [ ] Maximum payload size is 256 KB.
- [ ] Creating a share returns a non-guessable public ID.
- [ ] /theme/<id> loads the shared theme into the builder.
- [ ] Opening a share does not overwrite existing local themes without an explicit user action/clear behavior.
- [ ] Share storage is not affected by the ten-minute demo reset.

---

<a id="ftb-030"></a>

## FTB-030 — Add anonymous share identity, expiry, rate limits, and expiry UX

**Status:** ready-for-agent  
**Blocked by:** [FTB-029](#ftb-029)

### What to build

Harden sharing for anonymous public hosting by combining a keyed hash of normalized IP with a random browser UUID, enforcing one active share per identity and a five-identity ceiling per IP hash, updating an existing identity's URL in place, rate limiting mutations, and expiring shares after five days.

### Acceptance criteria

- [ ] Raw IP addresses are never persisted for share ownership.
- [ ] IP identity uses a server-secret keyed hash.
- [ ] Browser identity uses a random local UUID.
- [ ] One browser identity has at most one active share.
- [ ] One IP hash has at most five active browser identities/shares.
- [ ] Re-sharing from the same identity updates the same public URL.
- [ ] Share mutation is limited to one operation per hour per identity.
- [ ] Shares expire after five days and are purged.
- [ ] Opening a valid share displays a toast indicating the remaining lifetime in human-friendly days/time.
- [ ] An expired share shows a friendly expired-theme screen with a path to start a new theme.
- [ ] NAT/shared-network users can have separate browser identities within the five-share IP ceiling.

---

<a id="ftb-031"></a>

## FTB-031 — Add non-blocking accessibility contrast guidance

**Status:** ready-for-agent  
**Blocked by:** [FTB-005](#ftb-005)

### What to build

Analyze relevant foreground/background theme combinations and surface WCAG-style contrast warnings without preventing creative or intentionally unconventional exports.

### Acceptance criteria

- [ ] Relevant text/surface combinations display contrast status.
- [ ] Warnings update as colors change.
- [ ] The user can understand which pair is problematic.
- [ ] Warnings do not block preview, save, share, or export.
- [ ] The tool does not claim that contrast checking alone certifies the whole theme as accessible.

---

<a id="ftb-032"></a>

## FTB-032 — Publish and render the Filament coverage manifest

**Status:** ready-for-agent  
**Blocked by:** [FTB-006](#ftb-006)

### What to build

Create the public source-of-truth coverage manifest and an interactive in-app coverage view showing supported, partial, and missing first-party Filament 5 visual features.

### Acceptance criteria

- [ ] COVERAGE.md exists and uses stable semantic feature identifiers.
- [ ] Entries can express supported, partial, and missing coverage.
- [ ] Entries can reference relevant semantic registry concepts/showcase areas.
- [ ] The builder renders an interactive coverage page derived from the same source of truth or a generated equivalent.
- [ ] Coverage includes Relation Managers and Nested Resources separately.
- [ ] Coverage includes authentication/profile/tenant UI.
- [ ] The manifest records the minimum supported and latest tested Filament versions.
- [ ] The manifest is usable as the objective 1.0 gate.

---

<a id="ftb-033"></a>

## FTB-033 — Establish Playwright E2E and visual regression coverage

**Status:** ready-for-agent  
**Blocked by:** [FTB-007](#ftb-007), [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015), [FTB-016](#ftb-016), [FTB-019](#ftb-019), [FTB-026](#ftb-026)

### What to build

Create high-level browser tests around the real builder/iframe boundary and deterministic screenshot regression coverage for the showcase so upstream Filament markup/style changes are detected.

### Acceptance criteria

- [ ] Playwright runs the critical user journey from edit to preview to export.
- [ ] Inspector selection is tested across the iframe boundary.
- [ ] Light/dark and representative responsive widths are tested.
- [ ] Deterministic screenshots exist for the main showcase families.
- [ ] Forced component states are included in visual regression.
- [ ] Screenshot fixtures use deterministic demo data.
- [ ] Test failures clearly distinguish behavior failures from visual diffs.
- [ ] Chromium is the primary CI browser while code remains compatible with modern evergreen browsers.

---

<a id="ftb-034"></a>

## FTB-034 — Build the single parameterized Jenkins pipeline

**Status:** ready-for-agent  
**Blocked by:** [FTB-033](#ftb-033), [FTB-035](#ftb-035)

### What to build

Create one Jenkins pipeline that builds and tests the repository on every relevant run and deploys only when explicitly requested. Add hourly detection of new Filament releases that invokes the same pipeline with deployment disabled.

### Acceptance criteria

- [ ] One Jenkinsfile/pipeline is the CI/CD source of truth.
- [ ] Pipeline runs PHP/Laravel tests, builder tests, build steps, Playwright, and visual regression.
- [ ] Manual runs expose a simple DEPLOY boolean parameter.
- [ ] DEPLOY=false never updates the public environment.
- [ ] DEPLOY=true deploys only after all required stages pass.
- [ ] Until 1.0, deployment targets the current dev branch build.
- [ ] Jenkins checks hourly for a newer supported Filament release.
- [ ] A detected release runs dependency update/build/tests with DEPLOY=false.
- [ ] No GitHub Actions workflow is added.

---

<a id="ftb-035"></a>

## FTB-035 — Provide production Docker deployment with Octane + FrankenPHP

**Status:** ready-for-agent  
**Blocked by:** [FTB-001](#ftb-001), [FTB-002](#ftb-002), [FTB-028](#ftb-028), [FTB-030](#ftb-030)

### What to build

Provide the production deployment topology for a VPS using Laravel Octane on FrankenPHP with FrankenPHP's integrated Caddy, compiled Vue assets, a separate scheduler container, persistent share storage, and disposable demo storage.

### Acceptance criteria

- [ ] Production does not require a permanent Node process.
- [ ] FrankenPHP/Caddy serves the builder assets and Laravel routes according to the agreed URL layout.
- [ ] Laravel runs through Octane/FrankenPHP.
- [ ] Scheduler runs independently from request workers.
- [ ] shares.sqlite is persistent across deploys and demo resets.
- [ ] Demo SQLite state and temporary uploads can be safely reset.
- [ ] Octane worker configuration avoids leaking request-specific state between visitors.
- [ ] Worker recycling/restart behavior is configured.
- [ ] A production deployment can be performed from documented commands on a clean VPS host with Docker.

---

<a id="ftb-036"></a>

## FTB-036 — Add Microsoft Clarity with privacy controls

**Status:** ready-for-agent  
**Blocked by:** [FTB-001](#ftb-001)

### What to build

Integrate Microsoft Clarity for basic product analytics while providing appropriate disclosure/consent behavior and avoiding unnecessary capture of sensitive editor content.

### Acceptance criteria

- [ ] Clarity can be enabled through deployment configuration.
- [ ] Appropriate privacy disclosure/consent handling is present where required.
- [ ] Theme/custom-CSS editor content is excluded or masked from analytics capture where reasonably possible.
- [ ] Product analytics do not become an identity/account system.
- [ ] Local development can run without Clarity.

---

<a id="ftb-037"></a>

## FTB-037 — Publish contributor and architecture documentation

**Status:** ready-for-agent  
**Blocked by:** [FTB-001](#ftb-001), [FTB-032](#ftb-032)

### What to build

Provide the repository documentation required for outside contributors to understand the sibling-app architecture, branch policy, coverage rules, testing expectations, and how to add theme-control coverage.

### Acceptance criteria

- [ ] README explains product purpose, local setup, and current release state.
- [ ] CONTRIBUTING explains feature-branch → dev workflow before 1.0.
- [ ] ARCHITECTURE documents the builder/demo boundary, theme state, registry, preview bridge, persistence, and deployment at a stable conceptual level.
- [ ] Contribution guidance requires appropriate registry/showcase/test coverage for new UI theming support.
- [ ] Documentation explicitly states that Jenkins is used and GitHub Actions are not.
- [ ] Documentation points to the separate future docs-site repository as out of scope for this repo.

---

<a id="ftb-038"></a>

## FTB-038 — Harden and publish the public Alpha

**Status:** ready-for-agent  
**Blocked by:** [FTB-026](#ftb-026), [FTB-028](#ftb-028), [FTB-030](#ftb-030), [FTB-031](#ftb-031), [FTB-033](#ftb-033), [FTB-034](#ftb-034), [FTB-035](#ftb-035), [FTB-036](#ftb-036), [FTB-037](#ftb-037)

### What to build

Prepare a public Alpha that is genuinely useful even though the full Filament 5 coverage manifest is not yet complete. Confirm operational limits, privacy messaging, core editing/export flows, and safe deployment.

### Acceptance criteria

- [ ] A first-time visitor can edit a stock Filament theme and export usable CSS.
- [ ] Inspector, light/dark, responsive preview, undo/redo, local save, JSON import/export, and sharing are usable.
- [ ] Public demo reset/upload limits work under real hosted conditions.
- [ ] Clarity/privacy behavior is deployed as intended.
- [ ] The hosted product identifies itself as Filament Theme Builder with the subtitle Build your Filament theme visually.
- [ ] Footer reads An open-source project from Azaber.
- [ ] The UI does not imply official ownership by the Filament project.
- [ ] Alpha limitations and current coverage are visible.
- [ ] Deployment originates from dev via Jenkins with DEPLOY=true.

---

<a id="ftb-039"></a>

## FTB-039 — Complete and verify the Filament 5 coverage contract

**Status:** ready-for-agent  
**Blocked by:** [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015), [FTB-016](#ftb-016), [FTB-017](#ftb-017), [FTB-018](#ftb-018), [FTB-032](#ftb-032), [FTB-033](#ftb-033)

### What to build

Close every remaining gap in the public Filament 5 coverage manifest and perform an integration verification that every visually distinct first-party feature has a real fixture and a supported theming path through the semantic registry or advanced Inspector.

### Acceptance criteria

- [ ] No first-party Filament 5 visual feature identified by the manifest remains Missing.
- [ ] Any Partial entry has been resolved or explicitly documented as non-themable/identical with justification.
- [ ] Every covered feature has a real demo/showcase fixture.
- [ ] Every relevant feature can be themed semantically or through the supported advanced path.
- [ ] Light/dark behavior is verified across the coverage set.
- [ ] Screenshot regression coverage is updated for the final coverage set.
- [ ] Minimum supported and latest tested Filament versions are current.
- [ ] The coverage manifest objectively indicates readiness for 1.0.

---

<a id="ftb-040"></a>

## FTB-040 — Cut the 1.0 release

**Status:** ready-for-agent  
**Blocked by:** [FTB-038](#ftb-038), [FTB-039](#ftb-039)

### What to build

Graduate the project from the 0.x Alpha/Beta lifecycle to the first stable 1.0 release once the agreed acceptance contract is satisfied.

### Acceptance criteria

- [ ] All 1.0 product acceptance criteria in PRD.md are satisfied.
- [ ] COVERAGE.md indicates complete first-party Filament 5 visual coverage.
- [ ] Jenkins passes against the current supported Filament version.
- [ ] Vanilla/Tailwind and Minimal/Fully Explicit exports are validated.
- [ ] Shared themes, reset behavior, upload limits, and production persistence are validated.
- [ ] Public documentation reflects stable 1.0 behavior.
- [ ] main receives the stable release according to the agreed branch policy.
- [ ] A 1.0.0 release/tag is created only after the stable branch is verified.

---

<a id="ftb-041"></a>

## FTB-041 — Keep resource navigation count badges synced to the primary color

**Status:** ready-for-agent
**Blocked by:** None (can start immediately)

### What to build

Keep every resource sidebar count badge visually consistent with the configured primary color, including after navigation and page reload.

### Acceptance criteria

- [ ] All resource sidebar count badges use the primary color consistently.
- [ ] Badge colors remain correct after navigating between resources.
- [ ] Badge colors remain correct after reloading the page.
- [ ] Regression coverage verifies the primary-color styling for all resource sidebar count badges and its stability after navigation and reload.

---

<a id="phase-2-filament-dashboard-composer-integration"></a>

# Phase 2 — Filament Dashboard Composer Integration

All Phase 2 tickets are **blocked** by [FTB-040](#ftb-040) and by completion of
all approved Phase 1 requirements: FTB-009A, FTB-009B, FTB-010, FTB-011,
FTB-012, FTB-013, FTB-014, FTB-015, FTB-016, FTB-017, and FTB-018. The
demo-first gate alone is insufficient. Package identity, namespace, and
Composer coordinates are also release-blocking and intentionally deferred.

The review fixed point for this planning publication is
`f348ac2c504e627690324eea0595f2245c9d215c`; it must be refreshed after Phase
1 and FTB-040 before implementation review.

<a id="ftb-042"></a>

## FTB-042 — Package installation and protected collapsible dock

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§2](./docs/phase-2/SPECS.md#2-product-boundary-and-activation), [§3](./docs/phase-2/SPECS.md#3-authoritative-panel-identity-and-embedded-ui), [§10](./docs/phase-2/SPECS.md#10-accessibility-and-panel-continuity)
**GitHub issue:** [#42](https://github.com/Azab-Inc/filament-theme-builder/issues/42)
**PRD requirements:** [P2-001–P2-005](./docs/phase-2/PRD.md#61-activation-and-authorization), [P2-010–P2-013](./docs/phase-2/PRD.md#62-embedded-panel-experience), [P2-070–P2-073](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Deliver the Composer development-package installation and local-only activation
flow inside a user's own authorized Filament panel. Embed the compiled builder
in a collapsible/resizable dock while keeping the actual panel visible and
usable. Preserve the panel's existing authentication, authorization, tenant,
CSRF, origin, and endpoint protections without adding a second permission
system.

### Acceptance criteria

- [ ] Installation works in a host application using the approved baseline and
      does not require the repository demo.
- [ ] The integration activates only in the local environment with
      `FILAMENT_THEME_BUILDER=true`; the flag is never treated as credentials.
- [ ] Existing authorized panel users can access the dock without an extra
      product gate; unauthorized users cannot.
- [ ] The panel remains visible and operable while the dock is open, resized,
      or collapsed.
- [ ] Multiple panels do not share authoritative identity, preview state, or
      authorization context.
- [ ] Keyboard and accessibility behavior is covered in the same vertical
      slice.

<a id="ftb-043"></a>

## FTB-043 — Preview and sessionStorage draft lifecycle

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§4](./docs/phase-2/SPECS.md#4-browser-session-draft-lifecycle), [§6](./docs/phase-2/SPECS.md#6-shared-generator-and-tailwind-4-compatibility), [§10](./docs/phase-2/SPECS.md#10-accessibility-and-panel-continuity)
**GitHub issue:** [#43](https://github.com/Azab-Inc/filament-theme-builder/issues/43)
**PRD requirements:** [P2-014–P2-015](./docs/phase-2/PRD.md#62-embedded-panel-experience), [P2-030–P2-032](./docs/phase-2/PRD.md#64-preview-and-guidance), [P2-070](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Provide the browser-local preview loop and active draft lifecycle. Use the
approved same-tab `sessionStorage` semantics, restore only valid state for the
authoritative panel, and keep preview-only state separate from project-file
save state.

### Acceptance criteria

- [ ] Preview output and save output use the same deterministic generator.
- [ ] Drafts persist across same-tab panel navigation and reload.
- [ ] Separate browser tabs do not share the active draft.
- [ ] Draft storage is scoped to host origin and authoritative panel identity.
- [ ] Invalid, stale, malformed, or cross-panel drafts are quarantined safely.
- [ ] Explicit discard removes only the current draft and restores saved/stock
      preview state.
- [ ] The UI distinguishes draft, generated preview, compiled/applied, and
      saved states.

<a id="ftb-044"></a>

## FTB-044 — Source discovery, CSS creation, and setup guidance

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§5](./docs/phase-2/SPECS.md#5-source-discovery-and-setup-guidance), [§6](./docs/phase-2/SPECS.md#6-shared-generator-and-tailwind-4-compatibility), [§13](./docs/phase-2/SPECS.md#13-verification-contract)
**GitHub issue:** [#44](https://github.com/Azab-Inc/filament-theme-builder/issues/44)
**PRD requirements:** [P2-020–P2-028](./docs/phase-2/PRD.md#63-theme-source-discovery), [P2-033–P2-035](./docs/phase-2/PRD.md#64-preview-and-guidance)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Implement safe theme-source discovery and explicit CSS-target creation. Resolve
the registered panel source first, then searchable project stylesheets, while
containing paths to the configured project root and rejecting symlinks. Keep
registered application CSS naturally active in the panel, but never inject
arbitrary discovered CSS into the builder. Provide manual setup guidance for
registration, PHP, Vite, or build steps.

### Acceptance criteria

- [ ] Registered editable theme source resolution precedes filesystem search.
- [ ] Search supports CSS, SCSS, and Sass discovery, but only CSS is a
      selectable save target.
- [ ] Dependencies, generated outputs, backups, traversal, outside-root paths,
      null bytes, and symlinked components/targets are rejected.
- [ ] Unrecognized CSS recommends creating a new CSS file; declining uses
      documented defaults.
- [ ] An unmarked CSS file is a valid Append starting point and receives the
      initial managed block after existing contents.
- [ ] Tailwind 4 Sass inputs are rejected with actionable guidance.
- [ ] Hostile CSS is treated as text/metadata and cannot execute, import remote
      resources, or enter the builder through discovery.
- [ ] No PHP, registration, Vite, dependency, or build mutation occurs
      automatically.

<a id="ftb-045"></a>

## FTB-045 — Confirm, append, and preserve complete prior contents

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042), [FTB-043](#ftb-043), [FTB-044](#ftb-044); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§7](./docs/phase-2/SPECS.md#7-confirmation-and-append-persistence), [§13](./docs/phase-2/SPECS.md#13-verification-contract), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules)
**GitHub issue:** [#45](https://github.com/Azab-Inc/filament-theme-builder/issues/45)
**PRD requirements:** [P2-040–P2-043, P2-046–P2-047](./docs/phase-2/PRD.md#65-save-safety), [P2-070–P2-072](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Deliver the explicit confirmation and safe Append flow. Show the target,
generated diff, affected panels, mode, hashes, and recovery implications.
Append must preserve all existing contents, create or update one versioned
managed comment section, and handle repeated conflicts without duplicating or
overwriting unrelated CSS.

### Acceptance criteria

- [ ] Confirmation identifies target path, panel context, generated diff,
      affected panels, mode, and source/output hashes.
- [ ] Shared stylesheets require an explicit conflict acknowledgement.
- [ ] Every Append operation first creates a unique, no-clobber `old-` backup
      containing the complete current file before any target mutation.
- [ ] The initial Append to an unmarked CSS file creates one managed section
      only after that backup is durable, without removing existing contents.
- [ ] Managed markers contain versioned round-trip metadata and hashes.
- [ ] Malformed, nested, or duplicate markers fail closed without guessing.
- [ ] Repeated Append updates the existing managed section exactly once.
- [ ] Content outside the managed section remains byte-for-byte preserved.
- [ ] No source, backup, or unrelated user file is removed automatically.

<a id="ftb-046"></a>

## FTB-046 — Replace, journaled writes, and active failure recovery

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-045](#ftb-045); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§8](./docs/phase-2/SPECS.md#8-replace-transaction-and-recovery-contract), [§13](./docs/phase-2/SPECS.md#13-verification-contract), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules)
**GitHub issue:** [#46](https://github.com/Azab-Inc/filament-theme-builder/issues/46)
**PRD requirements:** [P2-044–P2-049](./docs/phase-2/PRD.md#65-save-safety), [P2-072](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Deliver complete Replace behavior and the journaled filesystem transaction.
Replace intentionally writes a complete generated CSS scaffold at the original
path after uniquely renaming the original to an `old-` backup containing the
entire old file. Locks,
file hashes, single-use confirmation binding, permission revalidation, failed
output retention, and active recovery must protect against partial failure and
concurrent edits.

### Acceptance criteria

- [ ] Replace uniquely renames the original to a full-content `old-` backup
      without clobbering an existing backup.
- [ ] Replace writes complete buildable CSS at the original path; preserving
      append-only directives is not a Replace requirement.
- [ ] Confirmation is bound to user/panel, target, hashes, mode, expiry, and a
      single-use nonce.
- [ ] Apply revalidates authorization, activation, containment, symlink policy,
      hashes, lock ownership, and target mode.
- [ ] Journal states record staged output, backup, commit, and recovery status.
- [ ] Partial failure preserves prior file, backup, failed/staged output, and
      journal; it never cleans up by deletion.
- [ ] Recovery restores the old file by copying from the retained backup when
      safe, leaves that backup intact, and otherwise marks explicit
      recovery-required without claiming success.
- [ ] Concurrent edits prevent unreviewed writes and never modify another
      user's files.

<a id="ftb-047"></a>

## FTB-047 — Shared saved/compiled state across panels

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-045](#ftb-045), [FTB-046](#ftb-046); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§6](./docs/phase-2/SPECS.md#6-shared-generator-and-tailwind-4-compatibility), [§8](./docs/phase-2/SPECS.md#8-replace-transaction-and-recovery-contract), [§11](./docs/phase-2/SPECS.md#11-package-and-consumer-architecture)
**GitHub issue:** [#47](https://github.com/Azab-Inc/filament-theme-builder/issues/47)
**PRD requirements:** [P2-030–P2-035](./docs/phase-2/PRD.md#64-preview-and-guidance), [P2-040, P2-049](./docs/phase-2/PRD.md#65-save-safety)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Make generated preview, saved project state, and compiled/applied panel state
coherent across multiple panels in a host application. Use authoritative panel
identity and shared generator results without allowing one panel's draft,
registration, or applied CSS state to leak into another.

### Acceptance criteria

- [ ] Panel identity is resolved from the host Filament runtime rather than
      caller-supplied identifiers.
- [ ] Preview and saved output report the same generator/schema/output hashes.
- [ ] Saved, compiled/applied, stale, and recovery-required states are distinct.
- [ ] Multiple panels sharing a stylesheet show affected-panel impact before
      save and do not silently claim isolated effects.
- [ ] Existing Vite/HMR remains the only project feedback path.
- [ ] No automatic install, registration, PHP edit, or build is performed.

<a id="ftb-048"></a>

## FTB-048 — Local MCP parity and capability inventory

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-044](#ftb-044), [FTB-045](#ftb-045), [FTB-046](#ftb-046); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§9](./docs/phase-2/SPECS.md#9-local-mcp-parity), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules)
**GitHub issue:** [#48](https://github.com/Azab-Inc/filament-theme-builder/issues/48)
**PRD requirements:** [P2-060–P2-064](./docs/phase-2/PRD.md#66-local-mcp-and-ai-operability)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Expose local MCP discovery, preview, and confirmation-save behavior through the
same services and protections as the UI. Authenticate through the host's
authenticated local MCP session/request and resolve the same panel context;
the feature flag is never a credential and MCP receives no extra privileges.

### Acceptance criteria

- [ ] MCP and UI use the same source resolution, generator, validation,
      authorization, locking, journal, and filesystem safety boundaries.
- [ ] MCP preview returns structured target, diff, hashes, affected panels,
      risks, and confirmation requirements.
- [ ] Save requires explicit confirmation and revalidates permission, hashes,
      lock, nonce, activation, and containment before mutation.
- [ ] Unauthenticated or unauthorized MCP requests are rejected.
- [ ] Replay, stale confirmation, cross-panel, and concurrent-change cases are
      denied without mutation.
- [ ] Capability inventory records operation, authorization, confirmation,
      target scope, and evidence.
- [ ] The supported AI-client flow is verified before MCP support is claimed.

<a id="ftb-049"></a>

## FTB-049 — Consumer installation, isolation, and Jenkins release verification

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042), [FTB-043](#ftb-043), [FTB-044](#ftb-044), [FTB-045](#ftb-045), [FTB-046](#ftb-046), [FTB-047](#ftb-047), [FTB-048](#ftb-048); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§11](./docs/phase-2/SPECS.md#11-package-and-consumer-architecture), [§12](./docs/phase-2/SPECS.md#12-published-vertical-slices-and-ticket-mapping), [§13](./docs/phase-2/SPECS.md#13-verification-contract), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules), [§15](./docs/phase-2/SPECS.md#15-out-of-scope), [§16](./docs/phase-2/SPECS.md#16-release-conditions), [§18](./docs/phase-2/SPECS.md#18-publication-and-implementation-handoff)
**GitHub issue:** [#49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)
**PRD requirements:** [P2-001](./docs/phase-2/PRD.md#61-activation-and-authorization), [P2-010](./docs/phase-2/PRD.md#62-embedded-panel-experience), [P2-030–P2-035](./docs/phase-2/PRD.md#64-preview-and-guidance), [P2-064](./docs/phase-2/PRD.md#66-local-mcp-and-ai-operability), [P2-073](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Verify the complete package as a consumer-facing release candidate. Run
isolated Jenkins consumer applications against the approved initial baseline:
PHP 8.5, Laravel 13, Filament 5, Livewire 4, and Tailwind 4. Establish exact
minimum/latest evidence, panel isolation, installation behavior, protected
activation, browser journeys, MCP verification, and release-blocking package
identity checks without introducing GitHub Actions.

### Acceptance criteria

- [ ] Clean consumer applications install the package as a Composer development
      dependency without the repository demo.
- [ ] Isolated Jenkins fixtures verify the exact minimum and latest tested
      versions for the approved PHP/Laravel/Filament/Livewire/Tailwind baseline.
- [ ] Consumer tests cover local-only activation, authorized access, panel
      continuity, draft isolation, discovery, Append, Replace, recovery, and
      MCP parity.
- [ ] Multiple panel instances and unrelated consumer files remain isolated.
- [ ] Jenkins is the release verification path; no GitHub Actions workflow is
      added.
- [ ] Package identity, namespace, and Composer coordinates are explicitly
      selected before release; no placeholder identity is published.
- [ ] No readiness or release claim is made while FTB-040, Phase 1, package
      identity, or exact compatibility evidence remains incomplete.

---

<a id="ftb-050"></a>

## FTB-050 — Promote editor panel navigation modes A and B

**Scope slug:** `editor-layout-modes-promotion`

**Status:** done

**Blocked by:** [FTB-003](#ftb-003) functionality stabilization; Phase 1/demo-first gate ([FTB-009A](#ftb-009), [FTB-009B](#ftb-009b), [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015)); completion of remaining Phase 1 requirements [FTB-016](#ftb-016), [FTB-017](#ftb-017), and [FTB-018](#ftb-018); stabilization of existing builder functionality, including the current foundation/control projection work. FTB-012 remains partial only for theme-density integration and is not a gate blocker. Re-evaluate existing blockers before work; this ticket introduces no parent.

**Spec:** [Editor Layout Modes Promotion](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md), especially [dual-mode geometry](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#dual-mode-contract-and-layout-geometry), [real theme controls](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#real-theme-controls-and-binding), [accessibility](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#accessibility), [promotion and prototype cleanup](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#promotion-and-prototype-cleanup), and [Playwright acceptance](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#playwright-acceptance-and-test-seams).

**Prototype reference:** [`ThrowawayThemePrototype.vue`](./builder/src/components/ThrowawayThemePrototype.vue), gated by `?prototype=1&variant=A|B|C`; preserve all three visual variants unchanged. Production promotes A and B only; C is out of scope.

**GitHub issue:** [#50](https://github.com/Azab-Inc/filament-theme-builder/issues/50)

**Review fixed point:** `1416388f7b313c51298830d786277b19c35dc195`

### What to build

After the existing gate and functionality stabilization are satisfied and a
separate explicit approval is recorded, promote two navigation modes inside the
builder's existing editor side panel: A (Sidebar), with a vertical internal
navigation rail beside the selected editor content; and B (Top navigation),
with horizontal internal tabs (such as Navigation, Foundations, Components)
above the selected content. An accessible segmented/radio toggle switches only
the panel navigation mode while preserving draft/theme/UI state and keeping the
same real iframe document alive. The overall builder/editor/demo split and the
demo's placement and iframe behavior are unchanged by this toggle. Existing
canonical state, editor behavior, and live-preview bridge remain authoritative.
C is explicitly not a production mode. After verification, remove only the
prototype switcher/query path and replace it with the production A/B toggle;
keep the prototype A/B/C visual references intact.

### Acceptance criteria

- [x] Production replacement begins only after the specified blockers are complete and promotion is explicitly approved.
- [x] Sidebar mode presents a vertical navigation rail inside the editor side panel, beside its selected section content; Top navigation mode presents horizontal section tabs inside that same panel above its selected content.
- [x] An accessible segmented/radio “Editor navigation” toggle selects Sidebar or Top navigation and supports keyboard operation.
- [x] Switching panel navigation modes does not change the overall builder/editor/demo split, move/resize/hide the real Filament demo, or reload/navigate its iframe.
- [x] Switching modes preserves canonical draft/theme state, unsaved edits, selected editor section/control, and relevant UI state; the same iframe document remains alive.
- [x] Existing theme controls in both modes display and mutate real canonical state; no inert or static mock controls/values are promoted.
- [x] At desktop, intermediate, and narrow widths, panel navigation and content remain reachable within the existing editor panel without page-level horizontal overflow; the live demo remains in its existing placement and usable.
- [x] Semantic structure, keyboard/focus behavior, zoom/reflow, iframe naming, and automated accessibility checks meet the design contract.
- [x] Playwright verifies real state-to-iframe updates, responsive panel behavior, accessibility-relevant interaction, and iframe continuity and unchanged placement.
- [x] Playwright verifies each panel mode at responsive widths, Sidebar→Top navigation→Sidebar state/draft persistence, keyboard-accessible mode switching, real state-to-iframe updates, and iframe document continuity.
- [x] After approval and verification, remove the prototype switcher/query path from production and replace it with the real A/B toggle; preserve prototype visual references A/B/C unchanged. No prototype-only content leaks into production; C is not selectable as a production mode.
- [x] No third-party dependency or new MCP capability is introduced; existing functionality remains the priority.

FTB-050 evidence (2026-10-15): production unit/type/build checks passed (`235` builder unit tests); the dedicated Playwright suite passed `4` tests at 1280×900, 900×900, and 640×900 with no page horizontal overflow and unchanged iframe geometry/document; screenshots and live measurements recorded during verification were panel/iframe `511.125/693.875` px at 1280, `351.53125/473.46875` px at 900, and `292.5/292.5` px at 640, with 773/755/755 px heights respectively. Full Compose Playwright passed `88` tests with `3` pre-existing opt-in skips. Full PHP passed `169` tests/1,639 assertions, Pint passed 296 files, PHPStan passed 265 files, and `/api/health` returned `{"status":"ok"}`. `ThrowawayThemePrototype.vue` remains unchanged; production no longer imports or exposes its query gate. No MCP capability or dependency was added.

Accessibility follow-up (2026-10-15): builder type-check, production build, and all `235` unit tests passed. The dedicated FTB-050 Playwright suite passed all `10` tests, including deterministic duplicate-ID/dangling-ARIA-reference checks, tablist/tab/tabpanel contract checks in both modes, hidden inactive panels, keyboard selection/focus, and `:focus-visible`. Full Compose Playwright passed `94` tests with `3` existing opt-in skips (`97` total); all three responsive viewport checks, iframe continuity, and dependent editor navigation tests passed. Sidebar now uses vertical arrow-key navigation and Top mode uses horizontal arrow-key navigation. `ThrowawayThemePrototype.vue` remains unchanged and no dependency was added.

Reachability follow-up (2026-10-15): the dedicated FTB-050 200% zoom test passed twice at a 640px viewport, asserting the document's `scrollWidth` does not exceed its `clientWidth` (no overflow concealment), focus/visibility/in-viewport reachability of all seven export and Inspector header actions, Undo/Redo, both navigation-mode radios, and all four navigation tabs. The full Compose Playwright suite passed `94` tests with `3` existing opt-in skips (`97` total). Builder type-check, all `235` unit tests, and production build passed. The 900px editor/demo side-by-side check remains passing; no CSS changes were needed.

---

<a id="ftb-051"></a>

## FTB-051 — Add native color pickers and named Tailwind palette choices

**Scope slug:** `color-picker-tailwind-palette-selection`

**Priority:** high

**Status:** blocked

**Blocked by:** FTB-003 functionality stabilization; current Phase 1/demo-first gate ([FTB-009A](#ftb-009), [FTB-009B](#ftb-009b), [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015)); remaining Phase 1 requirements [FTB-016](#ftb-016), [FTB-017](#ftb-017), and [FTB-018](#ftb-018); existing foundation/control projection stabilization work; and verification/closure of the existing accepted hex/alpha behavior as noted in spec §9. The approved palette source is Tailwind CSS **4.3.3**, already declared in `demo/package.json` and resolved in `demo/package-lock.json`; implementation must record its license/attribution metadata. FTB-012 remains partial only for density integration and is not a gate blocker.

**Spec:** [Color Picker and Tailwind Palette Selection](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md), especially [field coverage](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#1-user-visible-behavior-and-field-coverage), [palette source/version decision](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#2-palette-contract-and-explicit-provenance-decision), [editing/validation semantics](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#3-editing-validation-and-preservation-semantics), [accessibility](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#4-accessibility-and-interaction-contract), [state and preview projection](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#5-state-preview-bridge-and-projection-boundary), [responsive/performance](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#6-responsive-behavior-and-performance), [unit and Playwright verification](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#7-observable-test-seams-and-acceptance-verification), [failure/compatibility](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#8-compatibility-failure-and-operational-behavior), [blockers](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#9-sequencing-and-blockers), and [out of scope](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#10-out-of-scope).

**GitHub issue:** [#51](https://github.com/Azab-Inc/filament-theme-builder/issues/51)

**Review fixed point:** `f4b8228923af1d08447588b38b8d447b1c6705b7` (planning baseline only; refresh before implementation review).

### What to build

Add a native browser color picker and a searchable named Tailwind color palette button to every existing editable color field. A named choice immediately sets only that field, while preserving its current label, ID, mode, validation, reset/undo/redo, persistence, and projection behavior. Keep CSS variable/token references intact unless the user explicitly replaces them. The local palette dataset must be deterministic and dependency-free. The feature remains blocked until all listed delivery gates and the palette provenance/version decision are resolved.

### Acceptance criteria

- [ ] Every existing editable color field—including palette bases/editable shades, page/surface, sidebar, topbar, card/elevated, input, borders, and text colors, with each existing light/dark value—exposes a native picker and a named-palette button without changing existing labels, field IDs, or mode behavior. See [§1](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#1-user-visible-behavior-and-field-coverage).
- [ ] The palette is accessible by family and shade, searchable by family/shade/full token name, includes the approved 50–950 stops, applies a chosen name immediately to the targeted field, and behaves deterministically. See [§2](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#2-palette-contract-and-explicit-provenance-decision).
- [ ] Exact upstream palette source/version, data snapshot, license, and attribution are recorded; the approved source is Tailwind CSS 4.3.3 and the implementation adds no runtime dependency or network request for palette data. See [§2](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#2-palette-contract-and-explicit-provenance-decision) and [§8](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#8-compatibility-failure-and-operational-behavior).
- [ ] Existing valid hex and alpha handling, invalid/incomplete input behavior, recovery, reset, one-edit undo/redo, persistence, and validation semantics are preserved. See [§3](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#3-editing-validation-and-preservation-semantics).
- [ ] Opening or dismissing the picker never silently rewrites CSS variable/token references; native picker incompatibility leaves the existing value unchanged. See [§3](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#3-editing-validation-and-preservation-semantics).
- [ ] Keyboard navigation, visible focus, field-specific accessible names, Escape, outside-click dismissal, focus restoration, and narrow viewport/reflow behavior pass accessibility verification. See [§4](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#4-accessibility-and-interaction-contract) and [§6](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#6-responsive-behavior-and-performance).
- [ ] Valid selections use the existing canonical state and validated preview bridge path; no unsupported selectors/tokens, direct style mutation, schema change, or invalid projection is introduced. See [§5](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#5-state-preview-bridge-and-projection-boundary).
- [ ] Unit/component tests and Playwright tests cover complete field inventory, data/search, input validation, token preservation, modes, reset/history/persistence, mapped preview behavior, keyboard/dismissal, responsive behavior, and no generated arbitrary Tailwind class strings. See [§7](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#7-observable-test-seams-and-acceptance-verification).
- [ ] No new MCP operation is introduced; capability inventory records this UI-only enhancement, and any existing AI edit path remains subject to shared validation/authorization/confirmation rules. See [§7](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#7-observable-test-seams-and-acceptance-verification).
- [ ] No new color fields, CSS generation/projection targets, backend services, or third-party dependency are added. See [§10](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#10-out-of-scope).

---

<a id="ftb-053"></a>

## FTB-053 — Refactor builder into components, composables, and utilities

**Scope slug:** `builder-component-composable-refactor`

**Priority:** normal refactor

**Status:** done

**Blocked by:** None. FTB-003, the Phase 1/demo-first gate, and foundation/control stabilization prerequisites are satisfied. FTB-050, FTB-051, and FTB-052 remain separate coordination concerns.

**Spec:** [Refactor builder into components, composables, and utilities](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md), especially [boundaries and invariants](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#2-boundaries-and-invariants), [service migration inventory](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#3-current-service-migration-inventory), [App.vue decomposition](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#4-appvue-decomposition-contract), [behavior preservation](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#5-behavior-preservation-contract), and [verification](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#6-test-and-verification-contract).

**GitHub:** [#53](https://github.com/Azab-Inc/filament-theme-builder/issues/53)

**Review fixed point:** `8ef2524` (implementation verification point).

### What to build

Decompose the oversized `App.vue` into cohesive visual components and focused `useX` composables, and migrate all 15 current `src/services` modules to `src/utils` or `src/composables` according to their actual boundary. Split foundation recovery into pure recovery logic plus injected storage/browser orchestration. Use one expand-contract sequence in this single ticket: establish parity seams, migrate consumers, retire any temporary facade, delete `src/services`, and verify the complete application end to end. Builder styling may use only the explicitly approved minimal Tailwind CSS 4.3.3 build pipeline (`tailwindcss` and `@tailwindcss/vite` dev dependencies plus the Vite plugin); preserve the one-time `src/main.ts` `app.css` import and theme/utilities-only CSS imports, with no Preflight and no other added third-party dependencies.

### Acceptance criteria

- [x] `App.vue` is a composition shell; toolbar, export/status, recovery, foundations, modes, typography, layout, branding/uploads, icons, semantic controls, raw Inspector, and preview-frame responsibilities live in cohesive components/composables.
- [x] All 15 services are classified and migrated; pure functions remain plain and Vue/browser-free, Vue/lifecycle/browser orchestration uses focused `useX` composables, and no `src/services` references or unused compatibility facade remain.
- [x] Pinia remains the single canonical state/history/persistence authority. Effective values, provenance, reset/inherit, light/dark, alpha, responsive, and decimal-spacing semantics are unchanged. Models, DTOs, and registries remain in their designated folders.
- [x] Existing DOM IDs, ARIA labels/roles, data hooks, CSS selectors, preview origin/source/schema/message semantics, runtime refresh, clipboard fallback, download cleanup, uploads/quota errors, recovery paths, and prototype no-effect behavior remain unchanged.
- [x] Existing JSON, CSS, icon PHP, branding JSON/PHP, schema, color, selector, and export semantics retain golden parity; no product feature, third-party dependency beyond the approved Tailwind CSS 4.3.3 builder CSS pipeline, backend service, MCP capability, or gate relaxation is introduced. Tailwind is imported once by `src/main.ts` through `src/app.css`; that stylesheet imports only Tailwind theme and utilities layers and does not enable Preflight.
- [x] All shared/domain types declared in `App.vue` or composables are moved into dedicated `.model.ts`/`.dto.ts` files; type-boundary tests/checks prevent the editor's shared navigation/section types from being redeclared in those implementation files.
- [x] Repeated field-row markup/mutation logic is described before extracting a focused shared control; components use typed props/emits/refs without a monolithic `useApp` or excessive prop drilling.
- [x] TDD unit/component tests, type-check, build, and Playwright CLI/MCP verification cover utility parity, lifecycle cleanup/multiple mounts, real iframe edit/Inspector behavior, exports, branding uploads/errors, recovery, native defaults, history, and no leaked listeners.
- [x] Implementation refreshes the fixed point, preserves concurrent worktree changes, and records unchanged AI-operability capability inventory and evidence without adding tools.

**Completion evidence (2026-10-16):** 70 builder test files / 269 tests passed; type-check and production build passed; final builder audit found no files over 100 lines and no named type declarations outside dedicated model/DTO files; Compose Playwright smoke, Inspector, exports, branding/icons, foundation mutation, and FTB-050 layout-mode checks passed with zero browser errors.

---

<a id="ftb-054"></a>

## FTB-054 — Add hierarchical padding controls (Urgent)

**Scope slug:** `hierarchical-padding-controls`

**Priority:** high (urgent)

**Status:** blocked (approved planning only)

**Blocked by:** FTB-003 functionality stabilization and the unchanged demo-first gate; genuine FTB-006 registry/inheritance extension; FTB-022 versioned canonical JSON migration; and active FTB-053 work only when it touches the same core seams. FTB-053 is a coordination constraint, not a new dependency cycle. Existing FTB-004 vanilla CSS and canonical JSON parity are acceptance requirements, not a new blocker. FTB-012 remains partial only for density integration and is not silently closed. FTB-052 is future coordination only unless its implementation is present.

**Coordination, not blockers:** FTB-024 Fully Explicit vanilla export and FTB-025 Tailwind `@apply` export integrate conditionally if those future modes exist; neither is required or implemented by this urgent ticket.

**Spec:** [Hierarchical Padding Controls](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md), especially [coverage](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#2-verified-target-coverage-contract), [canonical inheritance](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#4-canonical-value-and-inheritance-contract), [preview/export parity](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#6-preview-and-export-parity), [MCP](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#9-mcp-and-capability-inventory-contract), and [verification](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#10-test-and-verification-contract).

**GitHub:** [#54](https://github.com/Azab-Inc/filament-theme-builder/issues/54)

**Review fixed point:** `880e2ff6c536a44429b6f2fefbd7b8d99ee4996e` (2026-10-15 planning baseline; refresh the actual full `dev` HEAD before implementation review).

### What to build

Give users semantic padding controls that inherit from global default through section, individual component, and existing variant/state scopes. Users can edit linked all-sides padding or independent edges, see effective values and their source, reset explicit values back to inheritance/native Filament behavior, and observe immediate real-demo preview plus CSS/JSON export parity. The implementation must cover every verified mapped visual target without blanket DOM selectors or duplicate nested padding.

### Acceptance criteria

- [ ] A validated registry coverage matrix identifies stable target IDs, exact verified Filament selectors, group/visual boundaries, compatibility evidence, supported edges/units, and supported/unmapped/excluded status for global, Forms, Tables, Buttons, and other mapped registry groups. It includes concrete input, textarea, select, table container/header/header-cell/cell, and button targets where the real Filament fixtures verify them; it does not invent fake selectors or style icons, checkbox/radio internals, `html`, `body`, menus, or arbitrary wrappers.
- [ ] The editor presents an explicit registry-driven tree: Global; Forms with Default, Input, Textarea, and Select; Tables with Default, Header, and Cell; Buttons with Default; and other verified groups. Variant/state controls remain beneath their mapped component target, while unsupported groups are identified rather than rendered as fake controls.
- [ ] Padding stores four optional canonical edges; omission differs from explicit zero; each edge resolves most-specific inheritance through global → section → component → variant → state; effective value, source, explicitness, and native/unmapped status are exposed without persisting resolved copies. Parent changes preserve child explicit overrides and reset removes only the selected explicit edge/record.
- [ ] Linked editing intentionally writes all four edges as one history entry; separate editing changes only the selected edge; switching presentation modes never silently overwrites heterogeneous edges and clearly represents mixed values. Existing density, spacing scale, light/dark, color, raw override, branding, and unrelated semantic state remain unchanged.
- [ ] Values reuse the existing raw visual-value allowlist: unitless zero, nonzero numeric lengths with currently allowed units, and existing bounded nonnegative spacing lists where applicable; semantic spacing-scale choices resolve to canonical validated CSS lengths and never emit literal token names. Actual emitted CSS values are validated for finiteness, allowed syntax, and injection safety; no arbitrary `calc(...)`, `var(...)`, URL, declaration, or executable content is accepted, and unsupported input is rejected rather than silently coerced. Per-edge values remain individual declarations, not a composite shorthand.
- [ ] The real Filament iframe updates immediately through the shared canonical preview path. Playwright computed-style evidence proves all four edges for global/Forms input/textarea/select/Tables container-header-cell/Buttons targets, native-before/after reset, no duplicate nested padding, keyboard/narrow/zoom behavior, and no reload or non-GET mutation.
- [ ] Existing FTB-004 vanilla CSS and canonical JSON exports use the same resolver/registry result as preview. Padding inheritance is semantic, not DOM inheritance: preview and minimal CSS materialize resolved explicit global/section/component/variant/state values on each mapped target's verified selector. Reset recomputes the next explicit ancestor value or removes the declaration for native fallback. JSON retains only sparse explicit edges, including zero; native/unmapped values are not emitted. Future Fully Explicit/Tailwind exporters integrate only if available and are not prerequisites. Old-theme migration preserves all unrelated theme state.
- [ ] Unit/store tests cover registry evidence, per-edge inheritance, source/effective resolution, parent preservation, native fallback, linked/separate history, reset/undo/redo, persistence, old JSON migration, validation quarantine, and preview/CSS/JSON parity. If FTB-052 exists, padding lock identities prevent locked per-edge bulk changes; padlocks are not otherwise implemented here.
- [ ] Purpose-built MCP discovery/read/preview/confirm/set/reset capabilities use the same services, authorization, validation, resolver, export, and lock boundaries as the UI; confirmation and apply-time revalidation are tested with invalid/stale/unauthorized cases and an actual AI-client journey. The capability-to-tool inventory records this coverage and logs contain no sensitive values or arbitrary payloads.
- [ ] The implementation refreshes the full review fixed point, preserves unrelated dirty worktree changes, adds no third-party dependency/server service, does not modify or close parent tickets, and does not claim the demo-first gate or FTB-012 complete.

---

<a id="ftb-055"></a>

## FTB-055 — Add Filament panel topbar visibility control

**Scope slug:** `filament-topbar-visibility`

**Priority:** normal

**Status:** blocked (planning only; not ready-for-agent)

**Blocked by:** FTB-018 runtime/PanelProvider foundation and FTB-006 canonical theme-state, inheritance, and export foundation, pending prerequisite readiness review/evidence, plus existing repository gates. This Phase 1 runtime control is not blocked by a blanket all-Phase-1 release rule, and it introduces no parent ticket or dependency cycle.

**Spec:** [Filament topbar visibility](./SPECS.md#filament-topbar-visibility)

**GitHub:** [#55](https://github.com/Azab-Inc/filament-theme-builder/issues/55)

**Review fixed point:** `5bd91bdb305c5c3873662fdaf55c750ba6522425` (actual full `dev` HEAD at planning publication; refresh before implementation review).

### What to build

Add a Show/Hide control in the builder's Panel/runtime group for the **Filament host panel topbar**. This is not the builder editor toolbar, topbar color styling, sidebar mode, or top navigation, and it must not be implemented as a blanket root CSS filter. The control must remain available in the builder while the host topbar is hidden and must re-enable the topbar without losing theme state.

Use sparse tri-state canonical semantics: unset/inherited preserves the current host/native default; explicit values are strict booleans (`true` or `false`, never truthy strings). Existing JSON that lacks the field migrates with no change. Reset removes the explicit value and returns to the native/current default. The setting participates in canonical autosave/reload, JSON import/export, validation, reset, undo/redo, and controlled runtime preview refresh.

The preview must use the existing runtime-refresh protocol. It may clear the active Inspector document only as the documented existing side effect, while retaining the editor draft and existing origin/protocol and runtime-side-effect guards. Verify real Filament 5.9 behavior with live DOM evidence for desktop/mobile, sidebar, and top-navigation combinations. Preserve native search, profile/user, notification, sidebar/mobile controls, and top-navigation contents; do not invent an alternate menu or artificially move hidden contents. Warn and preserve the selected setting for unsupported/conflicting combinations rather than silently changing it. The official Filament 5 `PanelProvider` contract is `->topbar(false)`; the installed runtime is authoritative.

PanelProvider export emits `->topbar(true)` or `->topbar(false)` as valid PHP booleans and omits the call when inherited. CSS export and installation instructions must not claim that CSS alone hides the actual Filament topbar.

### Acceptance criteria

- [ ] The accessible builder control is in the Panel/runtime group, remains mutable when the host topbar is hidden, and is distinct from the builder's own toolbar, sidebar/top-navigation mode, and topbar color controls.
- [ ] Unset/true/false state is canonical and strictly validated; old JSON without the field is unchanged after migration; reset returns to the native/current default; autosave, reload, JSON import/export, invalid-state recovery, undo, and redo preserve the semantics.
- [ ] Controlled preview refresh follows the existing bridge protocol, retains the editor draft, applies origin/protocol guards, and records the existing Inspector-document side effect without broad CSS hiding.
- [ ] Real Filament DOM Playwright evidence confirms removal/restoration on desktop and mobile, including sidebar and top-navigation combinations, while recording native search, profile/user, notification, sidebar/mobile, and top-navigation behavior.
- [ ] PanelProvider export tests assert `->topbar(true)` and `->topbar(false)`, valid PHP booleans, omission for inherited, and no CSS-only hiding claim.
- [ ] Any unsupported/conflicting navigation combination warns without silently changing the selected topbar value or promising an alternate menu UI.
- [ ] Purpose-built MCP discovery/read/preview/confirm/set/reset uses the same domain services, authorization, strict validation, confirmation, and apply-time revalidation as the UI. Capability inventory coverage, meaningful authorization tests, and actual AI-client verification are required; no UI-only mutation shortcut or unsupported capability claim is added.
- [ ] No third-party dependency, server service, parent-ticket edit, or unrelated worktree change is introduced; implementation refreshes the recorded full fixed point and does not claim FTB-012 or any unrelated release gate complete.

---

<a id="ftb-056"></a>

## FTB-056 — Make all text colors customizable throughout Filament

**Scope slug:** `component-text-color-controls`

**Priority:** normal

**Status:** blocked (planning only; not ready-for-agent)

**Blocked by:** the genuine demo-first gate and existing foundation/control projection stabilization; verified FTB-006 registry/inheritance extension; and the FTB-022 canonical JSON/migration boundary. FTB-053 is coordination only when shared builder seams are touched. FTB-051 and FTB-052 are reusable-control/padlock coordination only when those capabilities exist, not new dependency cycles. FTB-031 remains separate, non-blocking contrast guidance. FTB-024/FTB-025 are future export coordination only and are not required to start this feature.

**Spec:** [Component text-color controls](./SPECS.md#component-text-color-controls)

**GitHub:** [#56](https://github.com/Azab-Inc/filament-theme-builder/issues/56)

**Related tickets:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-007](#ftb-007), [FTB-008](#ftb-008), [FTB-016](#ftb-016), [FTB-022](#ftb-022), [FTB-031](#ftb-031), [FTB-051](#ftb-051), [FTB-052](#ftb-052), [FTB-053](#ftb-053), [FTB-054](#ftb-054)

**Review fixed point:** `7e506177994f5785147ed98a869ed27b4b53834a` (actual full `dev` HEAD at planning publication; refresh before implementation review).

### What to build

Make every text color throughout the Filament application customizable, not just headings or existing mapped controls. This includes body/heading/widget/card/stat text and chart labels/legends; button/action labels across variants, sizes, and states; badges, links, navigation/sidebar/topbar items, breadcrumbs, tabs, menus, tooltips, user/tenant controls; form values/options/placeholders/labels/legends/hints/help/errors/validation/affixes/upload/rich-editor text; table headers/cells/summaries/filters/sorting/pagination; empty/loading/error states; notifications, modals, slide-overs, infolists; authentication/profile/showcase surfaces; and all other application-rendered text. This is a minimum list, not an exhaustive whitelist.

Add missing registry mappings, semantic controls, fixtures, and preview/export support as part of this ticket. A target being currently unmapped is not a reason to exclude it or close the ticket as complete. Verify real selectors or the actual text-rendering mechanism rather than guessing, applying one root color, or requiring manual Advanced/raw CSS as the solution.

Use the existing shared color field/picker and Tailwind choices from FTB-051 when available, and integrate FTB-052 value locks when present without making either ticket a hard blocker. Build a focused component/composable from the repository's existing boundaries; do not grow a monolithic `App.vue` implementation, add a competing inheritance resolver, or add dependencies.

### Contract

- [ ] An exhaustive coverage matrix inventories all application-rendered text across routes, components, nested slots, dynamic overlays, interaction states, and light/dark modes. Each entry links its verified selector or rendering mechanism, semantic editor control, effective color/source, and real preview/export evidence. Missing mappings and controls are implemented, not excluded.
- [ ] Automated inventory checks fail for uncovered in-scope text targets. Newly discovered text is added and implemented; an unsupported/unmapped row remains an open acceptance gap. Representative browser journeys alone cannot satisfy complete coverage.
- [ ] Sparse inheritance/resolution is global foundation → component → variant → state. Each supported component exposes effective value and source. Group/category controls exist only where the registry has a common verified layer. Native defaults are preserved when unset; semantic badge/error colors are not erased by blanket styling.
- [ ] Light/dark values are independent. Actual normal/hover/focus/active/selected/disabled states are covered wherever applicable. `::placeholder`, child labels, text-fill properties, SVG text, and chart/editor renderer text use their verified rendering mechanism; no class names or state mappings are invented.
- [ ] Button text foreground is separate from button background. Inherited text does not implicitly recolor icon families; icons change only where an existing registry/design contract explicitly verifies that behavior.
- [ ] Canonical state remains sparse and preserves old-theme migration, validation, autosave/reload, undo/redo, reset, preview bridge, and vanilla foreground export. Themes without this scope retain unrelated values unchanged; invalid values fail safely and stale applies cannot overwrite newer state.
- [ ] Preview uses the existing iframe protocol with no full reload, network mutation, or raw CSS injection. Export reproduces each target's verified rendering mechanism; renderer/configuration-based text has a matching integration/export path and is never misrepresented as controllable by CSS alone.
- [ ] Purpose-built MCP discovery/read/preview/confirm/set/reset uses the same registry, resolver, validation, authorization, confirmation, and apply-time revalidation as the UI. Capability inventory and actual AI-client evidence are required; this is not UI-only behavior.

### Verification

- [ ] TDD unit/store/resolver tests cover the complete inventory, inheritance/source/effective values, mode/state separation, child slots and placeholder specificity, native fallback, unrelated numeric and non-color values remaining untouched, invalid input, stale apply, persistence/migration, reset, undo/redo, and export parity.
- [ ] Playwright against the real Filament iframe verifies computed colors for representative primary/secondary/hover/disabled buttons, form values/placeholders/labels, table headers/cells, navigation links, badges, widgets, modal/notification/infolist text, native-before/after reset, no reload/non-GET mutation, and clean native baseline behavior.
- [ ] MCP discovery, preview confirmation, authorization, apply revalidation, and AI-client verification pass. No third-party dependency, prototype, unrelated app/style/test change, parent-ticket edit, or gate relaxation is introduced.
