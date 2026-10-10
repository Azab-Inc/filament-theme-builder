# Demo panel coverage

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
