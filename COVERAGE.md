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
- Customer orders: dissociate action; tests verify the nullable foreign key and
  preserve the customer and other related records.
- Playwright covers the manager tabs, category attach modal state, table state,
  and visible detach action.

## Nested-resource coverage

Identifier: `nested-resource`

- `Orders/Resources/OrderItems/OrderItemResource` uses Filament 5's dedicated
  `BelongsToParent` nested-resource convention and explicit `items` parent
  relationship.
- Full-page parent-scoped order-item list/create/edit routes are covered.
- Livewire tests cover create, update, parent ownership, and cross-parent
  route rejection; Playwright covers the nested route and table heading.
