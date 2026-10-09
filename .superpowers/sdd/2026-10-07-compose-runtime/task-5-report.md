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
