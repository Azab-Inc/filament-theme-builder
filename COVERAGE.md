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
