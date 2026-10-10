# Architecture

This document records the implemented demo-panel boundary. It does not describe
the future upload/reset or production deployment work in FTB-027/028.

## Sibling applications

The repository contains a Vue builder (`builder/`) and a Laravel 13 / Filament
5 demo (`demo/`). The builder hosts the editor and embeds the demo's public
`/demo/admin` panel. The panel is public for previewing, while login remains
available at `/demo/admin/login`; profile pages still require the seeded demo
user.

## Demo domain and data flow

The e-commerce model is defined by the domain migrations in
`demo/database/migrations/` and Eloquent models in `demo/app/Models/`. The
primary aggregate paths are:

- Customers own addresses, orders, and reviews.
- Suppliers own products; products have variants, inventory, reviews, notes,
  categories, tags, and order items.
- Categories are self-referential and products connect to categories and tags
  through pivots.
- Orders belong to customers, addresses, and optional discounts; they contain
  order items, payments, shipments, status history, and polymorphic notes.
- Payments contain refunds. Notes use the `noteable` polymorphic relation.

`DatabaseSeeder` composes `UserSeeder` and `EcommerceDemoSeeder`. The demo
seeder uses stable business keys (`DEMO-CHAIR-001`, `DEMO-ORDER-1001`, etc.), a
fixed reference date, and `updateOrCreate`/`sync` so repeated seeding remains
disposable and idempotent. It is not production data.

Schema, relationship, and seed contracts are executable in
`demo/tests/Feature/Domain/`.

## Filament resource boundary

`AdminPanelProvider` owns the `demo/admin` panel, navigation discovery, preview
bridge render hook, authentication middleware, and panel-level colors. Each of
the 17 domain entities has its own Filament resource under
`demo/app/Filament/Resources/`, with separate schema, table, page, and
infolist concerns where needed. Entity resources are the core CRUD surface:
list, create, edit, and view routes are not replaced by relationship UI.

Relationship UI is supplemental. Customer and Product edit pages expose the
representative Relation Managers. The nested Order Items resource is scoped to
an Order and owns full-page related list/create/edit/view routes. Attach/detach
and associate/dissociate actions mutate pivots or foreign keys without deleting
the parent records.

The boundary is verified by the Laravel Livewire tests in
`demo/tests/Feature/Filament/Resources/` and public browser flows in
`e2e/demo-panel.spec.ts`. The builder/demo iframe and origin allowlist are
covered by `e2e/smoke.spec.ts`.

## Acceptance contract

The source-of-truth implementation requirements remain in
[`SPECS.md`](./SPECS.md), especially §§14–15. Milestone status and evidence
links are maintained in [`TICKETS.md`](./TICKETS.md). FTB-027 and FTB-028 are
still separate operational tickets and are not implied by this foundation.
