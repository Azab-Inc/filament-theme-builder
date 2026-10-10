# Task 3 Report

## Status

Complete.

## Commit

`6a1921e Feature: add deterministic commerce dashboard widgets`

## Files

- Added typed `DashboardMetrics` with a fixed reference date, integer-cent totals, deterministic seven-day series, stable ordering, eager-loaded relationships, and safe empty collections.
- Added native Filament 5 stats, chart, recent-orders, and low-stock table widgets.
- Registered the widgets in `AdminPanelProvider`.
- Added Livewire/PHP coverage for seeded aggregates, exact stats count, ordering, links, determinism, and empty states.
- Added Playwright dashboard coverage for accessible sections, fixed values, chart naming, resource links, and mobile layout.

## Tests and results

- RED phase: focused PHP and dashboard Playwright tests failed before implementation because `DashboardMetrics` and dashboard widgets did not exist.
- `cd demo && php artisan test --filter=DashboardShowcaseTest` — passed (4 tests, 26 assertions).
- `cd demo && php artisan test` — passed (72 tests, 864 assertions).
- `npx playwright test e2e/demo-showcase.spec.ts --grep dashboard` — passed (1 test).
- `npx playwright test e2e/demo-showcase.spec.ts` — passed (3 tests).
- `cd demo && ./vendor/bin/pint --test app/Filament/Support app/Filament/Widgets tests/Feature/Filament/DashboardShowcaseTest.php` — passed.
- `cd demo && ./vendor/bin/phpstan analyse --memory-limit=1G` — passed.
- Fresh SQLite migration/seed twice produced identical aggregate JSON: `{"revenue_cents":40600,"orders_count":2,"customers_count":2,"products_count":2,"low_stock_count":1}`.

## Assumptions

- Low stock means inventory quantity at or below 10 units, matching the seeded showcase threshold implied by the 8-unit and 12-unit fixtures.
- The dashboard period is seven calendar days ending at `2026-10-10 12:00:00`, inclusive.
- Showcase metrics intentionally use `showcaseFixture()` records and exclude visitor-created records.

## Risks

- The low-stock threshold is currently a dashboard boundary constant because the domain schema has no persisted threshold field.
- Chart revenue is intentionally represented as integer cents in the data contract; currency formatting remains a presentation concern in the stats/table widgets.
