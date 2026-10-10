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
| `showcase.forms` | planned | `ShowcaseFormsPage` | Product, customer, and order editing schema surfaces | Fixed showcase fixture data | `FormFocusState`, `FormValidationState`, disabled and filled representations | Showcase feature tests |
| `showcase.tables` | planned | `ShowcaseTablesPage` | Products, orders, and inventory tables | Seeded commerce records | `TableEmptyState`, `TableLoadingState`, `TableSelectedRowState` | Showcase feature tests |
| `showcase.infolists` | planned | `ShowcaseInfolistsPage` | Order, customer, and product detail entries/layouts | Seeded customer/order/product records | Null and representative value presentation | Showcase feature tests |
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
- **FTB-011 forms:** `ShowcaseFormsPage` provides `ProductEditorForm`,
  `CustomerContactForm`, and `OrderStatusForm`; layout surfaces are
  `SectionGridLayout`, `WizardStepsLayout`, and `TabbedFormLayout`.
- **FTB-012 tables:** `ShowcaseTablesPage` provides `ProductsTableFixture`,
  `OrdersTableFixture`, and `InventoryTableFixture`. The orders table owns
  search/sort/filter/group/pagination/summary/column-toggle samples.
- **FTB-013 infolists:** `ShowcaseInfolistsPage` provides `OrderDetailsInfolist`,
  `CustomerProfileInfolist`, and `ProductDetailsInfolist`.
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
