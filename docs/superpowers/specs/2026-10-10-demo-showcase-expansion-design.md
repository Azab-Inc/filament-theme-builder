# Demo Showcase Expansion Design

**Date:** 2026-10-10  
**Status:** Approved design  
**Scope:** Improve the real Filament 5 e-commerce demo as a useful theme-preview surface, beginning with its dashboard and visual identity. This document supplements, and does not replace, [`SPECS.md`](../../../SPECS.md) and [`TICKETS.md`](../../../TICKETS.md).

## Context and current gaps

The repository already has the demo-first foundation: public Filament panel access, deterministic e-commerce entities and seeders, CRUD resources, grouped navigation, and relationship workflows (FTB-009A, FTB-009B, FTB-010 are done). The current panel still largely presents Filament defaults: built-in account/info widgets, no custom dashboard charts or commerce summary, repeated resource icons, no intentional panel branding, and mostly default CRUD actions. There is no focused showcase area for distinct first-party Filament surfaces or reliable controls for transient states.

The detailed baseline and upstream comparison are in [`docs/research/2026-10-10-filament-demo-showcase.md`](../../research/2026-10-10-filament-demo-showcase.md). The approved coverage contract remains [`SPECS.md` §16–18](../../../SPECS.md#16-showcase-coverage); the executable order and acceptance criteria remain FTB-011–018 in [`TICKETS.md`](../../../TICKETS.md).

## Product identity and approach

The demo is a clearly independent, fictional e-commerce administration example built with Filament. The panel brand is **Filament Theme Builder**. The demo may use fictional e-commerce data and shop context, but a shop name must not replace Filament Theme Builder as the panel brand. It must not copy Filament’s official demo name, logo, distinctive branding, or imply affiliation or endorsement. Use locally maintained SVG assets (light/dark logo variants and favicon) that are original to this repository. Keep branding configurable through native panel configuration so later FTB-018 can expose it as theme state; do not make the builder itself shop-branded.

Extend the existing e-commerce domain and Filament panel in small ticket-sized slices. All preview surfaces must be genuine Filament components backed by the existing application/domain, not static HTML mockups or copied upstream demo code. Prefer native Filament 5 panel, page, widget, table, action, notification, and navigation APIs. Add no package or third-party dependency.

## Phase 1: dashboard and visible identity

Make the public dashboard immediately communicate a coherent working shop while remaining useful for visual theming:

- Apply the Filament Theme Builder panel brand with original local brand assets and appropriate dark-mode logo and favicon behavior. Fictional shop names may appear in the e-commerce context or data, but must not replace the panel brand.
- Replace placeholder/repeated resource navigation icons with distinct, semantically appropriate Filament icons. Add stable resource navigation badges/counts using seeded domain records and semantic colors; counts must be deterministic and must not expose mutable visitor/session state.
- Add four dashboard statistic cards: total revenue, orders, customers, and products (with a meaningful low-stock count or trend comparison as appropriate to the existing data). Labels, values, and comparison periods are fixed by deterministic seeded data and consistently calculated.
- Add a revenue/orders chart over a fixed, documented period, using the installed Filament chart widget API and deterministic aggregates.
- Add a recent-orders table with stable ordering, useful customer/date/total/status columns, and links to real order records.
- Add a low-stock products table with stable ordering, product/stock/status details, and links to real product records.
- Keep the layout responsive and each widget independently understandable. Empty or absent data must render a safe, legible empty state rather than erroring.

Dashboard values are derived from the seeded e-commerce records through ordinary read-only queries, not hard-coded display-only numbers. Avoid time-relative queries whose output changes between runs; any period boundary uses a fixed reference date or seeded timestamps.

## Real commerce actions, modals, and notifications

Expose a small set of useful, non-destructive e-commerce workflows through real Filament actions, for example viewing order details, marking an order fulfilled, or changing an order status. Actions use the domain model and validation, explain their effect, and show success/failure notifications through Filament’s notification API. Where confirmation or form input is appropriate, render a real Filament modal or slide-over with accessible labels, validation feedback, and clear cancel/confirm affordances. Destructive operations that could compromise the public demonstration are not exposed as unrestricted actions.

These production-like workflows belong on relevant resource pages and do not replace FTB-014’s focused coverage of action/button variants, modal layouts, and notification styles. Forced visible/open variants belong to FTB-016, not timing-dependent action side effects.

## Focused Showcase area and deterministic states

Provide a clearly named, grouped Showcase navigation area, separate from operational shop resources. It is a curated index/landing surface that links to real Filament examples and provides context about what each example demonstrates. It must not become a duplicate copy of the entire upstream demo or a kitchen-sink CRUD section. Use it to organize the focused fixtures delivered by FTB-011–016; keep the commerce dashboard and core shop workflows recognizable as the primary demo.

Transient visual states (including focus, disabled/loading, validation error, empty/selected table, open modal, and visible notification) must be controlled intentionally and reproducibly by FTB-016 mechanisms. State forcing is presentation/test setup only: it cannot persistently mutate demo records, bypass authorization/validation, run hidden destructive actions, or depend on sleeps, random data, or notification timing. Use explicit state identifiers/parameters with safe allowlists; default public navigation must remain in normal application state. Reset/cleanup must restore the ordinary fixture state.

## Delivery sequence and boundaries

The demo-first prerequisite is satisfied in the approved order: FTB-009A → FTB-009B → FTB-010. Proceed with existing tickets and their explicit blockers; this design does not reopen those tickets or expand the e-commerce domain.

1. **Phase 1 foundation:** dashboard widgets, distinct navigation icons/count badges, original local branding, and a few real commerce actions/modals/notifications. Keep each deliverable assigned to the matching existing tickets: dashboard/navigation to FTB-015, icons to FTB-017, and runtime branding to FTB-018; action foundations may be delivered with the relevant FTB-014 slice.
2. **FTB-011:** focused Forms & Schemas fixtures, avoiding equivalent CRUD-form duplication.
3. **FTB-012:** visually distinct Tables fixtures and interactions.
4. **FTB-013:** Infolists fixtures.
5. **FTB-014:** curated Actions, Modals, and Notifications coverage, including real variants and interaction patterns.
6. **FTB-015:** Widgets, Navigation, Search, and controlled authentication/profile/tenant UI; incorporate the Phase 1 dashboard and navigation work rather than creating a second widget/navigation system.
7. **FTB-016:** deterministic, safe forced-state controls across supported showcase surfaces.
8. **FTB-017:** icon packs/styles and semantic icon replacement, with non-CSS configuration represented correctly.
9. **FTB-018:** panel branding and appearance/runtime options, classifying preview-emulatable, refresh-required, and export-only behavior as SPECS requires.

Ticket dependency blockers remain authoritative; this ordering is a coherent delivery sequence, not permission to bypass blockers or change ticket status. COVERAGE.md and FTB-032/039 remain the source of truth for identified first-party visual coverage, and FTB-033 owns broader Playwright visual regression integration.

## Data, accessibility, security, and edge cases

- Use existing deterministic factories/seeders and fixed timestamps/ordering so the same database produces the same statistics, chart points, badges, table rows, and screenshots. Do not introduce randomness or real customer data.
- Preserve public preview behavior while respecting any existing authorization rules. Validate action inputs server-side; escape user-controlled content through normal Laravel/Filament rendering; never treat demo interactions as trusted merely because the data is disposable.
- Keep destructive operations constrained/simulated where needed to preserve the showcase between scheduled resets. Do not couple preview-only forced states to persistent database writes. The existing demo reset lifecycle and the separate persistent share store remain unchanged.
- Make navigation badges and chart/table information understandable without color alone. Provide meaningful headings/accessible labels, keyboard-operable actions and dialogs, visible focus, status text, and sensible contrast. Empty, zero, missing-related-record, stale-count, and validation-error cases must not break rendering.
- SVG branding assets are repository-local, static, and trusted; do not accept or render arbitrary uploaded SVG for panel branding.
- Avoid request/visitor-specific mutable statics or long-lived singleton state, consistent with Octane safety in SPECS. Every new user-visible capability must be represented in the existing capability-to-tool inventory and have appropriate MCP access if it adds product operations; MCP must share domain validation/authorization, provide confirmation for mutations, and never grant access beyond the UI. Showcase-only presentation controls must not become privileged data operations.

## Verification and documentation

Add PHP feature tests for dashboard/widget registration and rendered values, deterministic aggregates/badges, empty-data handling, and real action validation/authorization/notification outcomes. Add Livewire component tests for widget tables, action/modal interaction, and forced-state isolation where supported by the existing test setup. Add Playwright coverage against the real public Filament panel for dashboard visibility, navigation/branding, responsive rendering, representative action/modal/notification flows, and deterministic showcase state. Screenshot assertions should use seeded data and explicit forced states rather than wall-clock timing.

Update the relevant FTB-011–018 acceptance criteria/status in `TICKETS.md` only as implementation actually completes; update `COVERAGE.md` for each newly supported visually distinct first-party surface, and keep `SPECS.md` aligned if the approved contract changes. Document the demo’s independent identity, local asset conventions, data/reset safety, showcase navigation, and test commands in the appropriate repository documentation. This design task itself changes only this document.

## Explicit non-goals

- Reproducing the official Filament demo’s name, logo, layouts, data, source, or exact look.
- Replacing or expanding the completed FTB-009 domain, CRUD resources, or FTB-010 relationship workflows.
- Building all showcase fixtures or every first-party Filament API in Phase 1.
- Adding dependencies, a frontend mock implementation, or a separate static showcase application.
- Exposing unrestricted destructive, payment-processing, account, tenant, or real-world commerce operations.
- Changing demo authentication/public-access policy, reset cadence, production topology, persistent share storage, or builder product identity.
- Replacing the ticket dependency graph, coverage contract, or FTB-032/033/039 responsibilities.
