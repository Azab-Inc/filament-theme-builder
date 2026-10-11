# Demo-First Roadmap Design

**Status:** Approved architectural direction  
**Specification:** [SPECS.md](../../../SPECS.md), especially §§14–20, 35, and 41  
**Tickets:** FTB-002, FTB-003, FTB-009A, FTB-009B, FTB-010, FTB-011–018, FTB-027, FTB-028

## Context

The demo has the FTB-002 shell, FTB-009A domain, FTB-009B core resources, FTB-010 relationship workflows, and showcase slices FTB-011 and FTB-013–015. FTB-012 is partial: only theme-density integration remains. FTB-027/028 remain pending operational work; existing cleanup/reset commands do not prove those tickets complete.

FTB-003 is done and provides the first builder edit end to end. The approved **demo-first** milestone has since delivered the listed demo-complete gate. FTB-012 remains partial only for theme-density integration; FTB-016/017/018 and operational FTB-027/028 remain pending demo work.

## Approved milestone sequence

### FTB-009A — Demo data and domain

Build the persistent demo domain from every entity in SPECS §14: customers, addresses, products, categories, variants, tags, reviews, orders, order items, payments, refunds, shipments, status history, inventory, suppliers, discounts, and useful notes/activity. Add Laravel migrations, Eloquent models, explicit relationships, factories, and deterministic, realistic seed data. Include BelongsTo, HasMany, BelongsToMany, and polymorphic relationships where they naturally fit the domain. Keep demo data explicitly non-production and disposable.

This slice establishes and verifies the data graph; it does not require the complete Filament resource experience. Seed determinism is a contract for repeatable local runs, automated tests, and screenshot fixtures.

### FTB-009B — Core Filament resources

Build the core Filament resources and coherent navigation on the FTB-009A domain. Provide meaningful list, create/edit, and view experiences with representative forms, tables, badges/statuses, images, and formatted money. The resources should make the e-commerce back office legible as one application, not a collection of unrelated showcase pages. Relationship-specific UI coverage belongs to FTB-010.

### FTB-010 — Relationship workflows

Use representative resources to cover both Relation Managers and Nested Resources, choosing a Relation Manager when records naturally belong within a parent and a Nested Resource when related records warrant full-page editing. Include usable relationship forms, tables, filters/actions/states and modals, plus explicit attach/detach and associate/dissociate workflows. Record these as distinct coverage types in the coverage manifest, consistent with SPECS §§15 and 34.

### FTB-027 / FTB-028 — Parallel operational work

These may proceed in parallel with domain/resource work where prerequisites allow; FTB-028 depends on the completed seedable domain and FTB-027 upload safeguards as stated in TICKETS.md. Continue from existing partial cleanup/reset commands rather than treating them as finished. Complete and test FTB-027's accepted file types, 5 MB per-file limit, 25 MB anonymous-user quota, 500 MB global ceiling with oldest-first purge toward about 400 MB, safe non-executable storage, and understandable quota errors. Complete FTB-028's known-good deterministic SQLite snapshot, ten-minute scheduled reset, atomic-enough restoration, upload cleanup, reset notice, constrained destructive actions, and automated reset verification. Keep `shares.sqlite` separate and unaffected, per SPECS §19.

## Builder sequencing gate

After FTB-003, remaining builder feature work is blocked until **FTB-009A, FTB-009B, FTB-010, FTB-011, FTB-013, FTB-014, and FTB-015 are done**. FTB-012 is explicitly partial only for theme-density integration and does not block the next builder phase. FTB-016/017/018 and operational FTB-027/028 remain separate pending demo work, not prerequisites to this gate.

## Documentation

Update the existing project documentation as implementation lands, particularly TICKETS.md status/dependencies, ARCHITECTURE.md where runtime/domain behavior changes, and COVERAGE.md for resource and relationship coverage. Maintain consistency with SPECS.md: the spec remains the implementation contract; this document records milestone sequencing and boundaries, not new domain scope. Keep the required README, PRD, SPECS, TICKETS, CONTRIBUTING, ARCHITECTURE, and COVERAGE set aligned as required by SPECS §41. Do not create a documentation website in this repository.

## Testing and verification

- Verify migrations and relationships against the actual database; test key relationship persistence and expected cardinalities.
- Verify factories and seeders produce a coherent dataset deterministically across repeated database rebuilds.
- Exercise core resource list/create/edit/view paths and representative relationship UI actions, including attach/detach and associate/dissociate.
- Test FTB-027 validation, quota boundaries, global cleanup behavior, and upload path safety; test FTB-028 reset repeatability/atomicity, upload cleanup, reset messaging, and destructive-action constraints.
- Use Playwright against the real builder/Filament iframe for representative demo navigation and resource/relationship states; use deterministic seed data for stable screenshots. Keep tests focused on external behavior, consistent with SPECS §35.
- Run relevant Laravel tests and the repository's supported build/test checks; verify the public demo remains accessible without authentication and login still works.

## Explicit non-goals

- No further builder feature implementation before the three-ticket FTB-009A/009B/010 gate clears.
- No unrelated kitchen-sink entities or attempt to cover every Filament API permutation; prioritize coherent, representative flows and visually distinct surfaces.
- No production commerce behavior, production customer/order data, or persistent user-authored demo data; the demo is disposable.
- No changes to the approved SPECS domain, the two-application boundary, or separate persistent share-store lifecycle.
- No arbitrary plugin coverage, new package/dependency requirement, or documentation website as part of this roadmap.
