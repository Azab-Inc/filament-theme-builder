# Task 6 report: Tables fixtures

## Implementation

- Added discovered native Filament 5 `TablesShowcase` at `/demo/admin/tables-showcase`.
- Added deterministic seeded-product table coverage with image, text, badge, icon, relationship, search, sort, filter, grouping, pagination, summary, column manager, selection/bulk action, confirmed row action, responsive layout, loading indicator, and stable `id` ordering.
- Kept canonical commerce records read-only. Reorder support uses the installed Filament API against an isolated showcase-product mapping table.
- Added safe handling for empty results, invalid filters, missing images/relationships, long names, and selected-row reset.
- Updated `COVERAGE.md`, `TICKETS.md`, and the SDD progress ledger from test evidence.

## TDD evidence

Tests were written before implementation and run red:

- `php artisan test --filter=TablesShowcaseTest` failed with the expected missing route/component failures.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'tables'` failed because the showcase route and controls were absent.

## Verification

- `cd demo && php artisan test --filter=TablesShowcaseTest`: **passed** (5 tests, 37 assertions).
- `cd demo && php artisan test`: **passed** (92 tests, 987 assertions).
- `cd demo && ./vendor/bin/pint --test app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/TablesShowcaseTest.php`: **passed**.
- `cd demo && ./vendor/bin/phpstan analyse`: **passed**.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'tables'`: **passed** (2 tests).

## Concern

- The full Playwright suite remains red outside this task: `demo-panel.spec.ts` expects an exact `Products` navigation link that is not present in the current panel, causing that serial block to stop. With one worker, 15 tests passed, 1 failed, 3 were skipped, and 5 did not run. The focused tables tests pass.
- The AI capability inventory records the three implemented read-only table fixtures; no MCP read tool is available for this presentation-only surface.

## Review fixes

- Replaced the disabled reorder declaration with a real reorderable native table backed by `showcase_table_products`, an isolated fixture-order table seeded from the canonical products. Reordering updates only `position` on those mapping rows; Livewire coverage proves canonical product names remain unchanged.
- Added native `OrdersTableFixture` and `InventoryTableFixture` widgets with deterministic seeded queries, relationship/image/icon/badge columns, filters, grouping, pagination, summaries, and safe empty states.
- Added behavioral coverage for sort state and query order, grouping, pagination, selection reset, row and bulk confirmation/no-mutation, reorder/no-mutation, invalid filters, loading status, accessible headers/actions, column toggle state, responsive mobile behavior, and the three rendered table surfaces.
- Diagnosed the full-suite navigation failure: it is in the pre-existing `demo-panel.spec.ts` expectation for exact `Products`; the current panel renders the seeded resource badge as `Products 2`. The new tables page does not alter that resource link, so the unrelated test was not weakened or changed.
- Corrected FTB-012 documentation to describe the implemented three-table scope and marked the ticket `partial` because the separate theme-density response criterion remains outside this task.

## Review-fix verification

- `cd demo && php artisan test --filter=TablesShowcaseTest`: **passed** (7 tests, 60 assertions).
- `cd demo && php artisan test`: **passed** (94 tests, 1,010 assertions).
- `cd demo && ./vendor/bin/pint --test ...`: **passed**.
- `cd demo && ./vendor/bin/phpstan analyse`: **passed**.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'tables' --workers=1`: **passed** (3 tests).
- `npx playwright test --workers=1`: **16 passed, 1 unrelated pre-existing failure, 3 skipped, 5 not run**; failure is the exact `Products` navigation label expectation described above.
