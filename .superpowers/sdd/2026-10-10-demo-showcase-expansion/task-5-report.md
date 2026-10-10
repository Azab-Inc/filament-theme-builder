# Task 5 report: Forms and Schemas fixtures

## Implementation

- Added `FormsShowcase`, a discovered native Filament 5 `Page` at `/demo/admin/forms-showcase`.
- Composed the page with native `Schema`, `Section`, `Wizard`, `Repeater`, `Builder`, `RichEditor`, `Tabs`, and reactive conditional fields.
- Kept all mutations in request-scoped Livewire form state with deterministic local fixture values; no records, uploads, dependencies, or external content were added.
- Added focused Livewire and Playwright coverage for controls, deterministic filled/null states, long text, disabled state, conditional visibility, light/dark rendering, server validation, and keyboard focus order.

## TDD evidence

The new tests were written before the page implementation and run red:

- `php artisan test --filter=FormsShowcaseTest` failed with the expected missing route/class failures.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'forms'` failed because the showcase route and controls were absent.

## Verification

- `cd demo && php artisan test --filter=FormsShowcaseTest`: **passed** (3 tests, 23 assertions).
- `cd demo && php artisan test`: **passed** (86 tests, 944 assertions).
- `cd demo && ./vendor/bin/pint --test app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/FormsShowcaseTest.php`: **passed**.
- `cd demo && ./vendor/bin/phpstan analyse`: **passed**.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'forms'`: **passed** (2 tests).

## Concern

Initial full-file Playwright runs intermittently failed the login setup assertion (`/demo/admin/login` remained loaded). The test harness now uses one authenticated storage state and file-backed sessions for the Playwright-started server; repeated full-file runs pass.

## Review fixes

- Added a deterministic `filled_fixture` value to the mounted form state and asserted it in both Livewire and browser coverage.
- Reduced the long-text fixture limit to 180 characters and added a Livewire test proving overflow returns a `max` validation error instead of being silently accepted.
- Added browser interaction coverage for Wizard progression, Repeater add/edit, Builder block selection/editing, and RichEditor content editing.
- Added browser assertions for light/dark form control styling and the named Campaign brief region.
- Reused one authenticated Playwright storage state for the showcase file, avoiding repeated Livewire login races between tests.
- Configured the Playwright-started demo server to use file sessions instead of SQLite-backed sessions.

## Review verification

- `cd demo && php artisan test tests/Feature/Filament/Showcase/FormsShowcaseTest.php`: **passed** (4 tests, 29 assertions).
- `cd demo && vendor/bin/pint --test && vendor/bin/phpstan analyse --memory-limit=1G`: **passed**.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'forms' --workers=1`: **passed** (3 tests).
- `npx playwright test e2e/demo-showcase.spec.ts --workers=1`: **passed** twice consecutively (7 tests per run).
