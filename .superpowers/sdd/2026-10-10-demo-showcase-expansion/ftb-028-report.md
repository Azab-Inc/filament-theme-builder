# FTB-028 implementation report

## Status

Round 1 follow-up complete for the FTB-028 acceptance scope. Focused runtime, database-state, scheduler, browser, static-analysis, and Compose-health evidence passed. The full PHP suite is not green because the Compose demo container still cannot mount repository-level documentation; that baseline remains explicitly recorded below. No dependency installation was performed.

## Implemented

- Added `demo/database/demo-snapshot.sqlite` as the known-good seeded SQLite snapshot.
- Added `DemoResetService` with a non-blocking exclusive lock, same-directory temporary copy, atomic rename, and failure-aware temporary-upload cleanup.
- Made `demo:reset` report database restoration and fail when upload removals fail.
- Made the canonical development Compose `demo-php` process supervise `schedule:work` alongside FrankenPHP without adding a service or dependency.
- Added fixture-aware Delete actions while preserving ordinary record deletion; existing bulk protection remains enforced by the model/domain boundary.
- Replaced direct PDO share cleanup with the Eloquent `Share` model and Laravel schema/query APIs.
- Preserved the separate share store by keeping reset scope limited to the demo database and temporary uploads.
- Added the public showcase reset notice: “Demo data resets every 10 minutes.”
- Added focused PHP and Playwright-first tests for reset behavior, scheduler visibility, cleanup, share preservation, and UI disclosure.
- Kept FTB-028 marked done for its focused acceptance criteria; full-suite baseline failures are not represented as green.

## Evidence collected

- `docker compose -f compose.dev.yaml exec -T demo-php php artisan test --filter='(ComposeRuntimeTest|DemoResetTest|fixture_delete_actions)'`: 14 tests, 62 assertions passed; reset coverage now includes the committed snapshot, Eloquent aggregates, lock contention, deterministic repeat, and failed cleanup reporting.
- `node --test scripts/compose-bootstrap.test.mjs`: 9 tests passed, including the actual dev Compose scheduler wrapper contract.
- `docker compose -f compose.dev.yaml exec -T demo-php php artisan schedule:list`: all three maintenance commands are registered as `*/10 * * * *`; `docker compose ... top demo-php` showed the wrapper, `php artisan schedule:work`, and FrankenPHP concurrently.
- Tinker-only database verification used fresh processes for each mutation/reset boundary. The seeded aggregate was restored twice as `{User: 1, Customer: 2, Product: 2, Order: 2, OrderItem: 3}`, with product SKUs `DEMO-CHAIR-001`/`DEMO-LAMP-001` and order numbers `DEMO-ORDER-1001`/`DEMO-ORDER-1002`. Two manual product mutations restored to `Demo Oak Chair`; one temporary upload was removed on the first reset.
- The configured persistent share store was absent in this Compose runtime (`shares_store: not-present`); the focused reset test separately proves an existing persistent share file is unchanged.
- `COMPOSE_E2E=1 DEMO_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/demo-showcase.spec.ts`: 24 passed, 2 explicit upload-limit skips. The reset disclosure and protected seeded Delete UI passed.
- `vendor/bin/pint --parallel --test`: 277 files passed. `vendor/bin/phpstan analyse --memory-limit=512M`: 251 files, no errors.
- Both Compose files pass `config --quiet`; final `docker compose -f compose.dev.yaml ps` reports builder-vite, demo-php, and demo-vite healthy, with the gateway running.
- Changed PHP files pass `php -l`; `git diff --check` passes.

## Remaining gaps

- The full PHP suite reports 145 passed and 3 pre-existing documentation/inventory failures because the Compose `demo-php` bind mount does not expose repository-level `TICKETS.md`/`docs/` paths at the locations expected by those tests. The focused reset/action tests pass; the full suite is not claimed green.
- The live Compose share store is not provisioned yet; preservation is covered by the reset test's isolated persistent-file fixture and the reset scope excludes the configured share path.

## Round 1 follow-up

- Corrected the runtime claim: `compose.dev.yaml` now runs the scheduler in the existing `demo-php` container rather than merely registering schedules.
- Added Eloquent snapshot schema/aggregate assertions, two restore cycles, lock contention coverage, and explicit cleanup-failure coverage.
- Added browser coverage proving seeded product deletion is disabled while existing PHP coverage proves ordinary records remain deletable and bulk fixture deletion remains blocked.
- Manual database verification used Laravel Tinker only; no SQL or sqlite CLI was used.
