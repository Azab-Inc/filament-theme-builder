# Task 5 report: production FrankenPHP stack

## Status

Complete. The production stack now builds the Vue builder and Laravel/Vite assets in isolated Node stages, then runs only PHP/FrankenPHP/Octane in the final image.

## Implemented

- Added the multi-stage production `Dockerfile` with PHP extensions required by Octane, including `pcntl`.
- Added Octane's published `config/octane.php` and staged only the `laravel/octane` Composer dependency delta.
- Added the integrated FrankenPHP Caddyfile:
  - builder SPA at `/` with fallback;
  - immutable `/assets/*` caching;
  - unchanged `/demo/*`, `/api/*`, and Laravel asset paths through the Octane worker.
- Added production Compose services for one-shot bootstrap, demo, and scheduler.
- Added named volumes for the demo database, shares database, uploads, framework storage, private storage, and runtime APP_KEY handoff.
- Kept the production bind configurable with `GATEWAY_PORT`, defaulting to `9080`.
- Set production `APP_DEBUG=false`, explicit Octane `--workers=2`, and `--max-requests=500`.
- Disabled the inherited HTTP healthcheck on the scheduler, which does not expose an HTTP server.
- Excluded local `.env` files from the Docker build context.
- Updated the Compose smoke assertion to check built demo assets in production while retaining the dev Vite assertion.

## TDD / verification evidence

- Initial Compose config red check was recorded, but the interrupted partial attempt had already made `docker compose -f compose.prod.yaml config --quiet` pass; it did not provide the expected absent-file failure.
- Initial runtime red check exposed missing `pcntl`, then the FrankenPHP Caddyfile variable name and worker-routing issues, and finally the missing shared runtime APP_KEY handoff. Each was corrected.
- `docker compose -f compose.prod.yaml config --quiet`: pass.
- `docker compose -f compose.prod.yaml up -d --build`: pass.
- Production Playwright command:
  `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:9080 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'`
  Result: **2 passed**.
- Runtime API check: `GET /api/health` returned `{"status":"ok"}`.
- Builder root and `/demo/admin/login` both returned HTTP 200.
- `docker top` showed only `php artisan octane:frankenphp` plus FrankenPHP/Caddy for demo and `php artisan schedule:work` for scheduler.
- Final image/container check found no Node executable/runtime.
- Scheduler logs showed `No scheduled commands are ready to run.`
- Persistence check passed for shares and uploads across stack recreation.
- Resettable-volume check passed after removing/recreating demo DB/private/upload volumes; the shares marker persisted.
- Staged Composer files validate successfully and contain only Octane plus its three required lock packages; existing Debugbar changes remain unstaged.

## Concerns

- The demo npm install reports five critical audit findings from the existing frontend dependency graph; no package changes were made because adding/updating dependencies was outside this task.
- TLS was intentionally not tested, per the brief.

## Fix round: reviewer findings

### Implemented

- Added Laravel maintenance commands and registered all three with the independent scheduler every ten minutes:
  - `demo:reset` restores a configured file-backed snapshot atomically and safely reports when no snapshot is configured;
  - `shares:cleanup-expired` only deletes records when the persistent SQLite database exposes the expected `shares.expires_at` schema;
  - `uploads:cleanup` removes expired files from the configured temporary-upload directory and safely reports when absent.
- Added cached configuration for maintenance paths and retention settings.
- Added a shared `logs` named volume to bootstrap, demo, and scheduler.
- Made the production host binding configurable through `GATEWAY_HOST`, retaining `127.0.0.1` as the default and `GATEWAY_PORT` as the existing port override.
- Removed stale copied Laravel bootstrap caches from the production image build, preventing dev-only Debugbar providers from entering a `--no-dev` image.
- Removed Composer from the final image after dependency installation/autoload generation.
- Explicitly removed `public/hot` from the production image and return HTTP 404 for `/hot` instead of falling through to the builder SPA.
- Extended Playwright coverage for compiled production assets and Vite hot-file isolation.

### TDD / verification evidence

- Red check before implementation: `php artisan test tests/Feature/ComposeRuntimeTest.php` — **1 failed, 1 error** because maintenance commands/schedules did not exist.
- `composer --working-dir=demo run test` — **pass**: Pint, PHPStan, and **9 tests / 26 assertions**.
- `npm test` — **pass**: root Node tests **7 passed**, builder Vitest **1 passed**, Vue type-check, Pint, PHPStan, and PHPUnit.
- `docker build --tag filament-theme-builder-prod .` — **pass**.
- `docker compose -f compose.prod.yaml config --quiet` — **pass**.
- `GATEWAY_HOST=0.0.0.0 GATEWAY_PORT=9191 docker compose -f compose.prod.yaml config` resolved `host_ip: 0.0.0.0`, `published: "9191"`, and the shared `logs` volume.
- `docker compose -f compose.prod.yaml up -d` — **pass**; demo became healthy and scheduler remained running.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:9080 npx playwright test e2e/smoke.spec.ts --grep 'gateway'` — **3 passed**.
- Production API check returned `{"status":"ok"}`.
- Production `/hot` check returned **404**.
- Final image check confirmed `/usr/bin/composer`, Node executables, and `/var/www/html/public/hot` are absent.
- Scheduler logs reported `No scheduled commands are ready to run.`

### Fix-round concerns

- The repository still has no share/upload domain schema in this task's current application surface; the maintenance commands therefore no-op observably until their configured snapshot, temporary-upload directory, or expected shares schema exists. No unsupported domain schema was invented.
