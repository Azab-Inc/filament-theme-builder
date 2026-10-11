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

## Dependency map

Demo-showcase delivery order: **Phase 1 → FTB-011 → FTB-012 → FTB-013 → FTB-014 → FTB-015**. The demo-complete gate is satisfied when FTB-009A/B/010/011/013/014/015 are done; FTB-012 remains partial solely for theme-density integration and is not a blocker. Remaining builder feature work remains blocked by this gate and FTB-003. FTB-016/017/018 and operational FTB-027/028 remain separate pending demo work. Phase 1 owns the branded existing dashboard shell, four commerce widgets (`CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`, `RecentOrdersWidget`, `LowStockWidget`), resource icons, and representative badges. FTB-015 owns the Showcase navigation/index, search/profile/authentication/tenant surfaces and integrates (does not duplicate) Phase 1 widgets/navigation. The official demo is research inspiration only; identity is independent; do not copy official-demo branding, content, or presentation.

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
```

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

**Status:** blocked
**Blocked by:** [FTB-003](#ftb-003), demo-complete gate ([FTB-009A](#ftb-009), [FTB-009B](#ftb-009b), [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015))

### What to build

Turn canonical theme state into readable vanilla CSS and let the user copy or download a minimal theme.css that reproduces the current explicit changes in a normal Filament 5 custom theme.

### Acceptance criteria

- [ ] Vanilla CSS is the default export syntax.
- [ ] Minimal export emits only explicit overrides rather than every default.
- [ ] Exported CSS is readable, grouped, and commented.
- [ ] The file begins with a small Generated with Filament Theme Builder attribution.
- [ ] Copy and download actions are available.
- [ ] The exported first-slice theme reproduces the previewed primary-color edit in a clean Filament 5 test application.
- [ ] No minification is applied to the downloaded source.

---

<a id="ftb-005"></a>

## FTB-005 — Deliver complete global foundations editing

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Expand the editor from the first color edit into the complete global foundation controls: semantic colors, surfaces, light/dark values, palette shade generation and overrides, typography, spacing scale, density, radii, borders, and shadows.

### Acceptance criteria

- [ ] Primary, success, warning, danger, info, and gray palettes are editable.
- [ ] Page, sidebar, topbar, card/elevated, input, border, and text layers are editable.
- [ ] Relevant values can differ between light and dark mode.
- [ ] A base color can generate a 50–950 palette.
- [ ] Individual generated shades can be overridden.
- [ ] System fonts, curated Google Fonts, and custom font-family names are represented.
- [ ] Density presets include Compact, Default, and Spacious.
- [ ] Global spacing scale, radius, border, and shadow controls are available.
- [ ] Preview changes remain immediate.
- [ ] Reset-to-default behavior works for every foundation control.

---

<a id="ftb-006"></a>

## FTB-006 — Implement the semantic theme-control registry and inheritance

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Create the version-aware registry that maps semantic Filament UI concepts to stable selectors and supported controls. Implement inheritance from Global to Component to Variant to State, with explicit overrides only when a child departs from its inherited value.

### Acceptance criteria

- [ ] Registry entries have stable semantic IDs independent of display labels.
- [ ] Entries can declare one or more Filament selectors and supported controls.
- [ ] Registry metadata records the Filament compatibility baseline.
- [ ] Theme values inherit Global → Component → Variant → State.
- [ ] Child controls default to Inherit.
- [ ] Resetting an override returns it to inherited behavior rather than copying the parent value.
- [ ] Minimal export can distinguish inherited values from explicit overrides.
- [ ] A representative component demonstrates all four inheritance levels.
- [ ] Registry lookup can resolve an element to a semantic theme target.

---

<a id="ftb-007"></a>

## FTB-007 — Add semantic Inspector mode

**Status:** ready-for-agent  
**Blocked by:** [FTB-006](#ftb-006)

### What to build

Let the user enter Inspector mode, hover real Filament elements, see a visible highlight, select an element, and jump directly to the matching semantic controls while preserving a clear semantic breadcrumb.

### Acceptance criteria

- [ ] Inspector mode can be toggled without breaking normal preview navigation.
- [ ] Hovered inspectable elements receive a temporary outline.
- [ ] The selected element remains visibly outlined.
- [ ] Selection resolves through the semantic registry where possible.
- [ ] The editor navigates to the matching category/control automatically.
- [ ] A breadcrumb such as Button › Primary › Default is displayed.
- [ ] Selecting nested elements chooses a sensible semantic target rather than the most deeply nested DOM node by default.
- [ ] Inspector communication works across the builder/preview iframe boundary.

---

<a id="ftb-008"></a>

## FTB-008 — Add advanced raw-element styling to Inspector

**Status:** ready-for-agent  
**Blocked by:** [FTB-007](#ftb-007)

### What to build

Extend Inspector so a user can style an element even when the curated registry is incomplete. The system should propose a stable selector, expose advanced raw-element controls alongside semantic controls, and warn when a reliable selector cannot be identified.

### Acceptance criteria

- [ ] Semantic and Advanced controls are both available for a selected element.
- [ ] Stable Filament classes are preferred when proposing selectors.
- [ ] Brittle structural selectors are avoided when a semantic selector exists.
- [ ] The UI warns when the proposed selector is likely fragile.
- [ ] A user can edit/replace the proposed selector.
- [ ] Raw element overrides become part of canonical theme state.
- [ ] Raw overrides participate in undo/redo, persistence, JSON export, and CSS export.
- [ ] Raw overrides do not silently overwrite semantic registry data.

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

- [ ] `ShowcaseFormsPage` contains named fixtures `ProductEditorForm` (text, price, select, toggle, date, upload), `CustomerContactForm` (address/contact fields), and `OrderStatusForm` (status and validation states), with relevant registry targets.
- [ ] `ProductEditorForm` demonstrates `SectionGridLayout`, `WizardStepsLayout`, and `TabbedFormLayout` as distinct surfaces, not identical API permutations.
- [ ] Applicable default, filled, focused, disabled, and validation-error states have a deterministic representation.
- [ ] Registry entries exist for the relevant themable surfaces.
- [ ] Global/component/variant/state inheritance is demonstrable on representative form controls.
- [ ] Duplicate API permutations that render identically are not added just to inflate coverage.

Implementation: `0aac781` (`Feature: add forms and schemas showcase`); verification: [`FormsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

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
- [ ] Table density/spacing changes visibly respond to theme controls.

The native tables and interaction contract are implemented. The remaining density/theme-control criterion belongs to the later theme integration work and is intentionally not claimed here.

Implementation: `293b7aa` (`Feature: add tables showcase fixtures`); verification: [`TablesShowcaseTest`](./demo/tests/Feature/Filament/Showcase/TablesShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

---

<a id="ftb-013"></a>

## FTB-013 — Cover Infolists visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create an Infolists showcase containing every visually distinct first-party entry/layout needed for theme design, wired to the semantic registry.

### Acceptance criteria

- [ ] `ShowcaseInfolistsPage` contains `OrderDetailsInfolist`, `CustomerProfileInfolist`, and `ProductDetailsInfolist`, including the visually distinct first-party entries identified in COVERAGE.md.
- [ ] `OrderDetailsInfolist` and `CustomerProfileInfolist` demonstrate distinct section/group layouts without identical API permutations.
- [ ] Common states such as empty/null, badges, icons, images, and rich text are demonstrated where visually distinct.
- [ ] Registry entries exist for relevant surfaces and states.
- [ ] Infolists respond correctly to light/dark and global foundation changes.

Implementation: `31c4110` (`Feature: add infolists showcase fixtures`); verification: [`InfolistsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/InfolistsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

---

<a id="ftb-014"></a>

## FTB-014 — Cover Actions, Modals, and Notifications visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create showcase fixtures and registry coverage for Filament actions, buttons, dropdown/action groups, modals, confirmation flows, and notifications across their distinct semantic variants and states.

### Acceptance criteria

- [ ] `ShowcaseActionsPage` contains `OrderActionsFixture` and `ProductActionsFixture` with primary, danger, success, warning, info, gray, outline, icon-only, disabled, and loading variants where applicable.
- [ ] `DeleteProductConfirmationModal` and `OrderStatusModal` demonstrate representative sizes, headers, footers, forms, destructive confirmation, and loading/action states.
- [ ] `OrderStatusNotification`, `InventoryWarningNotification`, and `ActionFailureNotification` demonstrate semantic status styles and layout variations.
- [ ] Registry entries expose component, variant, and state-level theming.
- [ ] `showcase.notifications` and modal fixtures can be forced visible for theme work without timing-sensitive interaction; forcing is presentation-only and does not persist data.

Implementation: `ca160d1` (`Feature: add actions modals and notifications showcase`); verification: [`ActionsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

---

<a id="ftb-015"></a>

## FTB-015 — Cover Widgets, Navigation, Search, and auth/tenant UI

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Add visually distinct first-party widgets, sidebar/topbar/navigation patterns, global search, profile/authentication, and tenant-oriented UI to the showcase even when the public demo does not naturally require those flows.

### Acceptance criteria

- [ ] Phase 1 provides `DemoShowcaseDashboard` with the branded existing dashboard shell, four widgets (`CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`, `RecentOrdersWidget`, `LowStockWidget`), resource icons, and `RepresentativeBadgeSet`, all backed by deterministic commerce data.
- [ ] `ShowcaseIndexPage` is the FTB-015-owned entry for the showcase; FTB-015 integrates (not duplicates) the Phase 1 dashboard widgets/navigation and adds `ShowcaseSidebarNavigation`, `GlobalSearchSurface`, `ProfileMenuSurface`, `LoginSurface`, and controlled `TenantSwitcherSurface`.
- [ ] Global search UI is represented.
- [ ] Login/profile/authentication UI is represented.
- [ ] Tenant-switching UI is represented in a controlled showcase state where applicable.
- [ ] Registry entries cover the relevant themable surfaces.
- [ ] The showcase does not require visitors to actually belong to tenants or maintain personal accounts.

Implementation: `388c545` (`Feature: integrate Filament showcase navigation surfaces`); verification: [`NavigationShowcaseTest`](./demo/tests/Feature/Filament/Showcase/NavigationShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

---

<a id="ftb-016"></a>

## FTB-016 — Add deterministic forced-state controls

**Status:** ready-for-agent  
**Blocked by:** [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-014](#ftb-014), [FTB-015](#ftb-015)

### What to build

Give showcase pages controls that intentionally force otherwise transient states such as hover, focus, loading, disabled, validation error, open modal, selected row, empty data, and visible notifications.

### Acceptance criteria

- [ ] `ShowcaseStateControls` deterministically switches named surfaces `FormValidationState`, `FormFocusState`, `TableEmptyState`, `TableLoadingState`, `TableSelectedRowState`, `ActionLoadingState`, `ModalOpenState`, and `NotificationVisibleState` (plus representative hover/disabled states).
- [ ] Forced states are deterministic and suitable for screenshot testing.
- [ ] FTB-016 owns forcing these visual states; state controls are presentation-only, do not persist data, and expose no MCP mutation tool for changing showcase state or demo records.
- [ ] Inspector can target the forced state and resolve the correct semantic breadcrumb.
- [ ] Theme state can override state-level values and visibly demonstrate inheritance.

---

<a id="ftb-017"></a>

## FTB-017 — Add icon packs and semantic icon replacement

**Status:** ready-for-agent  
**Blocked by:** [FTB-006](#ftb-006), [FTB-015](#ftb-015)

### What to build

Let users alter the visual icon system with global pack/style presets and individual semantic Filament icon overrides while keeping exports understandable.

### Acceptance criteria

- [ ] `IconPackConfiguration` offers the default pack and multiple alternative pack/style presets; `SemanticResourceIconOverrides` can replace individual resource icons after pack selection.
- [ ] Individual semantic icons can be overridden after choosing a pack.
- [ ] Icon changes preview immediately.
- [ ] Icon configuration is part of theme JSON.
- [ ] Required non-CSS configuration is surfaced in PanelProvider/config export rather than faked with brittle CSS.
- [ ] FTB-017 owns icon configuration and its PanelProvider/config export path; icons are not duplicated as separate dashboard/showcase work.
- [ ] Reset restores inherited/default icon behavior.

---

<a id="ftb-018"></a>

## FTB-018 — Add panel branding and runtime configuration controls

**Status:** ready-for-agent  
**Blocked by:** [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Support appearance-related panel settings that are not purely CSS, including app name, logos, dark logo, favicon, logo height, brand typography, content/layout options, and other agreed visual PanelProvider settings. Preview instantly where safe and perform controlled preview reloads when true runtime configuration is required.

### Acceptance criteria

- [ ] `PanelBrandingSettings` names app name, light/dark logos, favicon, logo height, brand typography, content width, and sidebar behavior, classifying each as CSS-previewable or PanelProvider/runtime configuration.
- [ ] Light/dark logos can be represented.
- [ ] Favicon and logo height configuration are represented.
- [ ] Agreed layout settings such as content width/sidebar behavior are represented.
- [ ] Purely visual settings use immediate preview emulation where safe.
- [ ] Runtime-only settings trigger a controlled preview update/reload.
- [ ] Theme state clearly distinguishes CSS settings from PanelProvider/runtime settings.
- [ ] FTB-018 owns runtime branding and export classification; runtime-only settings remain distinct from CSS and use a controlled preview update/reload.

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

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Turn local persistence from one autosaved draft into a small anonymous local project manager where users can create, rename, duplicate, delete, reopen, and autosave multiple themes.

### Acceptance criteria

- [ ] Users can create multiple named local themes.
- [ ] Themes can be renamed, duplicated, deleted, and opened.
- [ ] Editing autosaves to the active local theme with a debounce.
- [ ] The current theme is clearly identified.
- [ ] Destructive deletion asks for confirmation.
- [ ] Theme history/undo applies to the active theme without corrupting other saved themes.

---

<a id="ftb-022"></a>

## FTB-022 — Add versioned JSON import/export and migrations

**Status:** ready-for-agent  
**Blocked by:** [FTB-021](#ftb-021)

### What to build

Let users download and import the editable canonical theme representation. Define schema migrations so older JSON themes can be upgraded sequentially rather than breaking when the builder evolves.

### Acceptance criteria

- [ ] Editable themes can be exported as JSON.
- [ ] JSON includes schemaVersion.
- [ ] Valid JSON themes can be imported as local editable themes.
- [ ] Invalid or unsupported payloads produce a friendly error without damaging current work.
- [ ] Sequential migration infrastructure exists, e.g. v1 → v2 → v3.
- [ ] A migration test proves an older fixture opens as the current schema.
- [ ] Imported themes preserve semantic, raw, icon, runtime, and custom-CSS state as applicable.

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

**Status:** ready-for-agent  
**Blocked by:** [FTB-002](#ftb-002)

### What to build

Allow the public demo to exercise real Filament upload UI while constraining file type and storage abuse.

### Acceptance criteria

- [ ] JPEG, PNG, WebP, and PDF uploads are accepted.
- [ ] Other file types are rejected.
- [ ] Maximum upload size is 5 MB per file.
- [ ] Maximum temporary storage attributable to one anonymous user is 25 MB.
- [ ] Global temporary upload storage never intentionally exceeds 500 MB.
- [ ] When storage approaches the ceiling, oldest files are purged until usage is approximately 400 MB.
- [ ] Upload paths cannot execute uploaded content as application code.
- [ ] Quota/error states are understandable in the UI.

---

<a id="ftb-028"></a>

## FTB-028 — Reset demo state every ten minutes without breaking the showcase

**Status:** ready-for-agent  
**Blocked by:** [FTB-009A](#ftb-009), [FTB-027](#ftb-027)

### What to build

Restore the demo from a known-good SQLite snapshot every ten minutes, clean temporary uploads, and constrain destructive actions so the public demo remains useful between resets.

### Acceptance criteria

- [ ] A deterministic known-good demo database snapshot exists.
- [ ] Scheduler restoration runs every ten minutes.
- [ ] Restoration is atomic enough that normal visitors do not see a half-restored database.
- [ ] Temporary demo uploads are removed during cleanup.
- [ ] The UI displays Demo data resets every 10 minutes.
- [ ] Destructive actions that could make the showcase unusable are simulated or constrained.
- [ ] Create/edit/action UI still behaves realistically enough for theming.
- [ ] Automated tests verify reset behavior.

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
