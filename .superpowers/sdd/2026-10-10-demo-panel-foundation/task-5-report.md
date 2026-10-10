# Task 5 report

## Status

Complete. All 17 standalone Filament resources have generated list/create/edit/view pages, representative validated forms, searchable/sortable tables, navigation groups, relationship selectors, status badges, integer-cent money formatting, seeded public product images, and view infolists.

## Commit

`2798c85` (`Feature: add e-commerce Filament resources`).

## Files

- Added the generated Filament resource/page/schema/table/infolist files under `demo/app/Filament/Resources/` for all 17 entities.
- Added shared, configuration-backed schema/table/infolist support in `demo/app/Filament/Support/`.
- Added `demo/tests/Feature/Filament/Resources/EntityResourcesTest.php`.
- Added `e2e/demo-panel.spec.ts`.
- Updated `demo/app/Models/Note.php` so polymorphic target fields are safely mass assignable by the resource form.
- Updated `demo/database/seeders/EcommerceDemoSeeder.php` with deterministic public product image URLs.

## Tests/results

- `php artisan test --filter=EntityResourcesTest`: 20 passed, 167 assertions.
- `php artisan test`: 46 passed, 386 assertions.
- `npx playwright test e2e/demo-panel.spec.ts --grep 'demo panel'`: 2 passed.
- `composer run lint:check`: passed.
- `vendor/bin/phpstan analyse app/Filament/Resources app/Filament/Support --no-progress`: passed.
- Full `composer run types:check` remains blocked by pre-existing missing generic annotations in domain model relationship methods; no errors remain in the changed Filament/support paths.

## Assumptions

- Existing panel authentication remains required for resource routes; the dashboard remains public as established by the existing panel contract.
- Remote Unsplash URLs are acceptable as seeded public image URLs because no upload/storage infrastructure is available or required for this task.
- Notes expose polymorphic target type/id as safe text fields; nested/morph relation workflows remain outside this task and belong to the relationship UI ticket.

## Risks

- The demo image URLs depend on the external Unsplash service being reachable during a browser session.
- Full-project PHPStan still requires a separate domain-model generic-annotation cleanup.

## Review-fix report

### Fixes applied

- Replaced the shared `filters([])` placeholder with entity-specific status, relationship, and date filters for all 17 tables.
- Added `HasEagerLoadedRelations` and configured every relationship used by a table column through the resource query.
- Extended the 17-resource Livewire data-provider test to assert create count increments and persisted representative values.
- Added invalid product form coverage for required, numeric/currency, status, and URL validation, while retaining nullable review relationship coverage.
- Replaced remote Unsplash assumptions with deterministic SVGs in `demo/public/demo-images/`; the seeder derives absolute image URLs from `APP_URL`, and Playwright starts the demo with the matching URL.
- Made order/payment money columns and infolists derive currency from each record, while retaining USD for entities without a currency field.
- Expanded order/payment infolists with relationship, money, and status entries.

### Verification commands and output

- `php artisan test --filter=EntityResourcesTest`: **23 passed, 239 assertions**.
- `php artisan test`: **49 passed, 458 assertions**.
- `npx playwright test e2e/demo-panel.spec.ts --grep 'demo panel'`: **2 passed**.
- `composer run lint:check`: **passed**.
- `vendor/bin/phpstan analyse app/Filament/Resources app/Filament/Support --no-progress`: **passed, 0 errors**.

### Remaining concern

- The repository-wide `composer run types:check` continues to report pre-existing missing generic annotations in domain model relationship methods; the changed resource/support paths pass targeted PHPStan.
