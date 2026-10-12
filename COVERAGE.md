# Demo panel coverage

This is the implemented demo-panel coverage record, not the complete
first-party Filament visual coverage gate described by FTB-032/039.

## Domain and resource coverage

The schema/model/relationship contract covers the 17 SPECS §14 entities plus
their pivots and polymorphic notes. `EcommerceSchemaTest`,
`EcommerceRelationshipsTest`, and `EcommerceSeedTest` cover table existence,
foreign-key behavior, both-side relation resolution, factories, fixed business
keys, deterministic dates, and idempotent seeding.

## Core resources

The demo panel exposes the 17 Task 5 entity resources: customers, addresses,
products, categories, product variants, tags, reviews, orders, order items,
payments, refunds, shipments, order status histories, inventory, suppliers,
discounts, and notes. Their list/create/edit/view surfaces are covered by
`EntityResourcesTest`.

## Relation-manager coverage

Identifier: `relation-manager`

- Customer: addresses, orders, and reviews manager tabs and seeded tables.
- Product: variants, categories, and tags manager tabs and seeded tables.
- Categories and tags: searchable tables, filters, attach, detach, and bulk
  detach actions; tests verify pivot changes without deleting either record.
- Customer orders: associate and dissociate actions; tests verify the foreign
  key transitions and preserve the customer and other related records.
- Livewire renders seeded table records for all six managers, not only the
  parent tabs.
- Playwright performs category and tag detach/attach cycles, verifies modal
  and table mutation states, and checks all Customer manager tables.

## Nested-resource coverage

Identifier: `nested-resource`

- `Orders/Resources/OrderItems/OrderItemResource` uses Filament 5's dedicated
  `BelongsToParent` nested-resource convention and explicit `items` parent
  relationship.
- Full-page parent-scoped order-item list/create/edit/view routes are covered.
- Nested forms omit `order_id`; Livewire tests cover forced parent creation,
  attempted reparenting, update/delete, view rendering, and cross-parent route
  rejection. Playwright covers the nested table and view route.

## Public and navigation coverage

- `FilamentPanelTest` covers the public dashboard, login contract, seeded
  credentials, authenticated profile, and logout behavior.
- `EntityResourcesTest` covers the four CRUD surfaces for every entity and the
  Catalog/Sales/Customers/Operations navigation groups.
- `e2e/demo-panel.spec.ts` covers public navigation, product/order presentation,
  customer/product manager tabs, attach/detach, and nested order-item pages.
- `e2e/smoke.spec.ts` covers the builder iframe, public panel, login/logout,
  preview message origin filtering, and Compose gateway/API/asset behavior.

## FTB-027 upload safety coverage

Identifier: `ftb-027-upload-safety`

- `TemporaryUploadStorageTest` covers all four allowed MIME/extension pairs,
  rejected PHP/SVG/executable pairs, the 5 MB service boundary, anonymous
  owner quota, oldest-first global purge, generated private paths, and file
  permissions using real temporary files.
- `MaintenanceConfigurationTest` asserts the production defaults of 5 MB per
  file, 25 MB per anonymous owner, 500 MB global storage, 400 MB cleanup
  target, and the private default root.
- `FilamentPanelTest` proves the anonymous upload fixture is public while the
  broader forms showcase remains protected.
- `e2e/demo-showcase.spec.ts` covers invalid MIME feedback and, on the explicit
  test-safe Compose limits, anonymous quota and oversized-file UI errors.

Relation Managers and Nested Resources are deliberately recorded as separate
categories above; neither substitutes for a core entity resource.

## Phase 1 and demo-showcase coverage contract

The showcase identity is independent. The official demo is research inspiration
only; do not copy its identity, branding, content, or presentation. The sequence
Phase 1 → FTB-011 → … → FTB-018 is prose delivery order, not a set of additional
hard dependency blockers; the dependency graph in TICKETS.md defines blockers.
Phase 1 owns the branded existing dashboard shell, four commerce widgets,
resource icons, and representative badges. FTB-015 later owns the Showcase
navigation/index, search/profile/authentication/tenant surfaces and integrates
(does not duplicate) Phase 1 widgets/navigation. Stable IDs below are the source
identifiers for fixtures and tests; they do not claim that planned showcase
coverage has already shipped. FTB-009A/B/010 are done and provide the demo
domain, resources, and relationship workflows.

| Stable ID | Status | Route/page/widget | Visual distinction | Data source | Forced-state support | Corresponding test |
| --- | --- | --- | --- | --- | --- | --- |
| `phase-1` | planned | `DemoShowcaseDashboard` | Branded existing dashboard shell, resource icons, representative badges | Deterministic demo seed | Dashboard presentation only | `DemoShowcaseCapabilityInventoryTest`; dashboard feature tests |
| `dashboard.stats` | planned | `CommerceStatsOverviewWidget` | Value, label, icon, trend and representative status badge | Seeded orders/products/inventory | Values fixed by deterministic seed | Dashboard feature tests |
| `dashboard.revenue-orders-chart` | planned | `RevenueOrdersChartWidget` | Series, axes, legend, tooltips | Seeded order totals and dates | Deterministic seeded chart period | Dashboard feature tests |
| `dashboard.recent-orders` | planned | `RecentOrdersWidget` | Compact table with status and money columns | Seeded orders and customers | Seeded result set | Dashboard feature tests |
| `dashboard.low-stock` | planned | `LowStockWidget` | Threshold/status badge presentation | Seeded inventory and products | Seeded low-stock rows | Dashboard feature tests |
| `showcase.forms` | partial | `/demo/admin/forms-showcase` (`ShowcaseFormsPage`, implemented as `FormsShowcase`) | Named product, customer, and order schemas with Section/grid, Fieldset/Grid, Wizard, Tabs, Repeater, Radio, and ToggleButtons layouts; native text, price, select, toggle, date, private local image representation, address/contact, nested contact, and status validation controls | Fixed non-persisting fixture data | Filled, disabled, optional-null, server-validation, nested validation, long-text, and keyboard-focus behavior in the native page; no forced-state controls | `FormsShowcaseTest`; `e2e/demo-showcase.spec.ts` (`forms and schemas`) |
| `showcase.tables` | implemented | `ShowcaseTablesPage` → `/demo/admin/tables-showcase` (`TablesShowcase`) | Responsive native product table with image/text/badge/icon columns, grouping, summaries, controls, safe read-only actions, and verified density spacing | Seeded demo products with order counts and nullable supplier/image relationships | Empty, loading, invalid-filter, missing-related-data, long-name, selected-row reset, and Compact/Default/Spacious density preview | `TablesShowcaseTest`; `e2e/demo-showcase.spec.ts` (`tables`); `e2e/theme-foundations.spec.ts` (`native ... table density`) |
| `showcase.infolists` | partial | `/demo/admin/infolists-showcase` (`InfolistsShowcase`) | Read-only customer profile, order and product details; text/image/icon/badge/color/key-value entries, rich text, repeatable and bullet lists, Fieldset/Tabs/Flex layouts | Seeded customer, order, and product records with fixed presentation values | Seeded representative values; nullable image/supplier/customer/variant and empty relationship labels; no forced-state controls | `InfolistsShowcaseTest`; `e2e/demo-showcase.spec.ts` (`infolists showcase`) |
| `showcase.actions` | planned | `ShowcaseActionsPage` | Order/product actions, destructive confirmation, open modal | Fixed non-production fixture records | `ActionLoadingState`, `ModalOpenState` | Showcase feature tests |
| `showcase.notifications` | planned | `OrderStatusNotification`, `InventoryWarningNotification`, `ActionFailureNotification` | Success/warning/danger styles and layout variants | Fixed message payloads | `NotificationVisibleState`; no persistence | Showcase feature tests |
| `showcase.navigation` | planned | `ShowcaseIndexPage` plus FTB-015 shared navigation integration | Search, profile/auth, controlled tenant surface; reuse Phase 1 navigation/widgets | Panel configuration and fixed showcase identity | Active/collapsed/search UI presentation | Showcase feature tests |
| `showcase.states` | planned | `ShowcaseStateControls` | Form, table, action, modal, and notification state surfaces | In-memory presentation controls | Deterministic; presentation-only | Showcase feature tests |
| `panel.icons` | planned | `IconPackConfiguration`, `SemanticResourceIconOverrides` | Default/alternative packs and resource icon replacement | Theme and PanelProvider configuration | Preview configuration only | Builder/theme export tests |
| `panel.branding` | planned | `PanelBrandingSettings` | App name, light/dark logos, favicon, logo height, typography, content width/sidebar behavior | Theme plus PanelProvider/runtime config | CSS preview or controlled runtime reload | Builder/theme export tests |

### Named showcase fixtures

- **Phase 1/dashboard:** `DemoShowcaseDashboard` composes exactly four commerce
  widgets: `CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`,
  `RecentOrdersWidget`, and `LowStockWidget`. `ResourceIconSet` and
  `RepresentativeBadgeSet` are part of this phase's shell contract.
- **FTB-011 forms:** `ShowcaseFormsPage` (implemented as `FormsShowcase`) provides named `ProductEditorForm`,
  `CustomerContactForm`, and `OrderStatusForm` fixtures. `ProductEditorForm`
  demonstrates distinct native `SectionGridLayout`, `FieldsetGridLayout`, `WizardStepsLayout`,
  `TabbedFormLayout`, `RepeaterContactLayout`, `RadioContactControl`, and
  `ToggleButtonsStatusControl` surfaces; its image representation is private local storage restricted to
  JPEG/PNG and submissions are not persisted. The FTB-006 semantic
  registry/inheritance remains partial for native themability, with the Product
  name text input as the single verified editable target. `form.product-name`
  maps `.fi-fo-text-input .fi-input` to `background-color`; Global → Component
  → Variant → State (focus) inheritance, reset-to-inherit, forged-scope
  rejection, and foundation preservation are covered by the builder unit tests
  and the Compose Playwright forms acceptance test. No forced-state control is
  claimed.

Builder registry slice evidence (2026-10-12): shared targets are
`form.section` (`.fi-section`), `form.field` (`.fi-fo-field`),
`form.control.text` (`.fi-fo-text-input`, `.fi-input`),
`form.control.select` (`.fi-fo-select`, `.fi-select-input`),
`form.control.toggle` (`.fi-fo-toggle`, `.fi-toggle`),
`form.control.date` (`.fi-fo-date-time-picker`),
`form.control.textarea` (`.fi-fo-textarea`),
`form.control.file-upload` (`.fi-fo-file-upload`),
`form.layout.wizard` (`.fi-sc-wizard`, `.fi-sc-wizard-header-step-btn`,
`.fi-sc-wizard-step`), `form.layout.tabs` (`.fi-tabs`, `.fi-tabs-item`),
`form.control.radio` (`.fi-fo-radio`, `.fi-radio-input`),
`form.control.toggle-buttons` (`.fi-fo-toggle-buttons`, `.fi-fo-toggle-buttons-input`),
`form.layout.fieldset` (`.fi-fieldset`), `form.layout.grid` (`.fi-grid`), and
`form.layout.repeater` (`.fi-fo-repeater`).
Selectors were verified against the running demo's Filament `v5.9.0` markup by
role/label/context assertions in `e2e/demo-showcase.spec.ts`; registry and
lookup evidence are in `builder/src/__tests__/theme-registry.spec.ts`. These
production form entries are selector-only coverage: they intentionally expose
empty controls, variants, and states because no native Filament theme control
mapping has been proven. Resolver/reset/parent-change behavior uses the
separate `form.test.fixture` in `builder/src/__tests__/theme-resolver.spec.ts`;
that deterministic fixture remains test-only; the Product name target is the
only production control mapping. Fixture names remain evidence only; no
forced-state controls are claimed.
- **FTB-012 tables:** `TablesShowcase` provides a compact read-only
  `ProductsTableFixture` backed by deterministic seeded products and order
  counts, plus native `OrdersTableFixture` and `InventoryTableFixture` widgets.
  The fixtures own search/sort/filter/group/pagination/summary/column-toggle,
  selection/bulk-action, row-action, isolated reorder, responsive,
  empty/loading, and missing relationship/image samples without duplicating
  CRUD. Compose Playwright verified Filament 5.9 table spacing selectors are
  `.fi-ta`, `.fi-ta-ctn`, `.fi-ta-header`, `.fi-ta-header-cell`, `.fi-ta-row`,
  `.fi-ta-cell`, `.fi-ta-text`, `.fi-ta-icon`, and `.fi-ta-image`; the bridge
  maps only `.fi-ta-header`, `.fi-ta-header-cell`, `.fi-ta-text`,
  `.fi-ta-icon`, `.fi-ta-image`, and `.fi-ta-cell.fi-ta-selection-cell`.
  Compact/Default/Spacious changes are measured on the native Products,
  Orders, and Inventory fixtures in `e2e/theme-foundations.spec.ts` without
  reloads or non-GET requests. No global Filament density variable is claimed.
- **FTB-013 infolists:** `InfolistsShowcase` provides `CustomerProfileInfolist`,
  `OrderDetailsInfolist`, and `ProductDetailsInfolist` as named schemas on the
  existing showcase page (not separate CRUD pages). Native entry
  samples include ColorEntry, KeyValueEntry, text/image/icon/badge entries,
  rich prose, repeatable rows, and TextEntry's native bulleted list variant;
  Fieldset, Tabs, and Flex provide distinct layouts. Light/dark contrast and a
  narrow viewport are covered by Compose Playwright. Registry entries for
  `.fi-in-color`, `.fi-in-icon`, `.fi-in-image`, `.fi-in-key-value`, `.fi-in-text`,
  and `.fi-sc-flex` are selector-only. Layout classes shared with forms are
  covered by the existing form entries and are not mapped a second time. Native
  global-foundation response and exhaustive visually-distinct entry/layout
  coverage are not yet proven; FTB-013 remains partial.
- **FTB-014 actions/notifications:** `ShowcaseActionsPage` provides
  `OrderActionsFixture`, `ProductActionsFixture`, `DeleteProductConfirmationModal`,
  and `OrderStatusModal`; notification fixtures are `OrderStatusNotification`,
  `InventoryWarningNotification`, and `ActionFailureNotification`.
- **FTB-015 integration:** `ShowcaseIndexPage` integrates Phase 1 widgets and
  navigation, adding `ShowcaseSidebarNavigation`, `GlobalSearchSurface`,
  `ProfileMenuSurface`, `LoginSurface`, and `TenantSwitcherSurface` without
  duplicating dashboard/navigation fixtures.
- **FTB-016 states:** `ShowcaseStateControls` controls `FormValidationState`,
  `FormFocusState`, `TableEmptyState`, `TableLoadingState`,
  `TableSelectedRowState`, `ActionLoadingState`, `ModalOpenState`, and
  `NotificationVisibleState`, plus representative hover/disabled states.
- **FTB-017/018 panel settings:** `IconPackConfiguration`,
  `SemanticResourceIconOverrides`, and `PanelBrandingSettings` separate icon
  configuration from runtime branding/export classification.

Commerce mutation fixtures, if provided in action/table samples, retain the
existing panel authorization and server validation. Destructive or status-change
operations require confirmation; they use the existing resource/domain service
and model path. Read/view operations and dashboard/showcase reads are read-only.
Forced states and presentation controls are not domain mutations and expose no
MCP mutation tool.
