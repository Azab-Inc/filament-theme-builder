# FTB-028 implementation report

## Status

Done. Runtime, database-state, scheduler, browser, static-analysis, and Compose-health evidence was collected after the dependency volume was refreshed. No dependency installation was performed.

## Implemented

- Added `demo/database/demo-snapshot.sqlite` as the known-good seeded SQLite snapshot.
- Added `DemoResetService` with an exclusive lock, same-directory temporary copy, atomic rename, and full temporary-upload cleanup.
- Made `demo:reset` report database restoration and upload cleanup failures/results.
- Added ten-minute scheduling with scheduler overlap protection.
- Preserved the separate share store by keeping reset scope limited to the demo database and temporary uploads.
- Added the public showcase reset notice: “Demo data resets every 10 minutes.”
- Added focused PHP and Playwright-first tests for reset behavior, scheduler visibility, cleanup, share preservation, and UI disclosure.
- Marked FTB-028 done after the remaining acceptance criteria were verified.

## Evidence collected

- `docker compose -f compose.dev.yaml exec -T demo-php php artisan test --filter=Reset`: 4 tests, 13 assertions passed.
- `docker compose -f compose.dev.yaml exec -T demo-php php artisan schedule:list`: `demo:reset` is registered as `*/10 * * * *` and has `withoutOverlapping` coverage in `ComposeRuntimeTest`.
- Tinker-only database verification used fresh processes for each mutation/reset boundary. The seeded aggregate was restored twice as `{User: 1, Customer: 2, Product: 2, Order: 2, OrderItem: 3}`, with product SKUs `DEMO-CHAIR-001`/`DEMO-LAMP-001` and order numbers `DEMO-ORDER-1001`/`DEMO-ORDER-1002`. Mutated product names were restored to `Demo Oak Chair` on both resets.
- The same Tinker verification created two temporary upload fixtures; each reset reported one deletion and ended with zero temporary files and no `*.reset-*` files.
- The configured persistent share store was absent in this Compose runtime (`shares_store: not-present`); the focused reset test separately proves an existing persistent share file is unchanged.
- `COMPOSE_E2E=1 DEMO_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/demo-showcase.spec.ts`: 23 passed, 2 explicit upload-limit skips. The reset disclosure and realistic showcase create/edit/action flows passed.
- `vendor/bin/pint --parallel --test`: 275 files passed. `vendor/bin/phpstan analyse`: 249 files, no errors.
- Both Compose files pass `config --quiet`; final `docker compose -f compose.dev.yaml ps` reports builder-vite, demo-php, and demo-vite healthy, with the gateway running.
- Changed PHP files pass `php -l`; `git diff --check` passes.

## Remaining gaps

- The full PHP suite reports 141 passed and 3 pre-existing documentation/inventory failures because the Compose `demo-php` bind mount does not expose the repository-level `docs/` directory at `/var/www/docs`. Those failures are outside FTB-028 and do not affect the focused reset tests.
- The live Compose share store is not provisioned yet; preservation is covered by the reset test's isolated persistent-file fixture and the reset scope excludes the configured share path.
