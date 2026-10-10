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
only; do not copy its identity, branding, content, or presentation. Phase 1 is
the dashboard plus shared showcase shell and precedes FTB-011 through FTB-018.
Stable IDs below are the source identifiers for fixtures and tests; they do not
claim that planned showcase coverage has already shipped. FTB-009A/B/010 are
done and provide the demo domain, resources, and relationship workflows.

| Stable ID | Status | Route/page/widget | Visual distinction | Data source | Forced-state support | Corresponding test |
| --- | --- | --- | --- | --- | --- | --- |
| `phase-1` | planned | Dashboard and shared showcase shell | Independent showcase chrome and commerce dashboard | Deterministic demo seed | Presentation state only | `DemoShowcaseCapabilityInventoryTest`; showcase tests to be added with implementation |
| `dashboard.stats` | planned | Dashboard stats widgets | Distinct value, label, icon, and trend treatments | Seeded orders/products/inventory | Values fixed by deterministic seed | `DemoShowcaseCapabilityInventoryTest`; dashboard feature tests |
| `dashboard.revenue-orders-chart` | planned | Dashboard revenue/orders chart | Series, axes, legend, and tooltips | Seeded order totals and dates | Deterministic seeded chart period | Dashboard feature tests |
| `dashboard.recent-orders` | planned | Dashboard recent-orders table | Compact table with status and money columns | Seeded orders and customers | Seeded result set | Dashboard feature tests |
| `dashboard.low-stock` | planned | Dashboard low-stock widget | Threshold/status presentation | Seeded inventory and products | Seeded low-stock rows | Dashboard feature tests |
| `showcase.forms` | planned | Forms showcase page | First-party inputs, schema layouts, validation | Fixed showcase fixture data | Default/filled/focused/disabled/error presentation | Showcase feature tests |
| `showcase.tables` | planned | Tables showcase page | Distinct columns, filters, grouping, summaries, pagination | Seeded commerce records | Empty/loading/selection presentation | Showcase feature tests |
| `showcase.infolists` | planned | Infolists showcase page | Entry and section/layout variants | Seeded customer/order/product records | Null and representative value presentation | Showcase feature tests |
| `showcase.actions` | planned | Actions/modals showcase page | Action variants, groups, modal sizes and confirmation | Fixed non-production fixture records | Deterministic modal/action visibility | Showcase feature tests |
| `showcase.notifications` | planned | Notification fixtures | Semantic status and layout variants | Fixed message payloads | Explicitly force visible; no persistence | Showcase feature tests |
| `showcase.navigation` | planned | Shared panel shell | Sidebar/topbar, groups, active item, badge, breadcrumb, search, profile, controlled tenant UI | Panel configuration and fixed showcase identity | Active/collapsed/search UI presentation | Showcase feature tests |
| `showcase.states` | planned | Showcase state controls | Hover/focus/loading/disabled/error/empty/selected states | In-memory presentation controls | Deterministic; presentation-only | Showcase feature tests |
| `panel.icons` | planned | Panel icon configuration | Default/alternative packs and semantic overrides | Theme and PanelProvider configuration | Preview configuration only | Builder/theme export tests |
| `panel.branding` | planned | Panel branding settings | App name, light/dark logos, favicon, logo height and layout | Theme plus PanelProvider/runtime config | CSS preview or controlled runtime reload | Builder/theme export tests |

Commerce mutation fixtures, if provided in action/table samples, retain the
existing panel authorization and server validation. Destructive or status-change
operations require confirmation; they use the existing resource/domain service
and model path. Read/view operations and dashboard/showcase reads are read-only.
Forced states and presentation controls are not domain mutations and expose no
MCP mutation tool.
