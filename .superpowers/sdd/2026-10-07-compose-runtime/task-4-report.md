# Task 4 report: Development Docker runtime and gateway

## Implemented

- Added `Dockerfile.dev` from the official `dunglas/frankenphp:1-php8.5` image. It installs the Composer executable from the official Composer image and the PHP `intl`, `pdo_sqlite`, and `zip` extensions; the working directory is `/var/www/html`.
- Added `compose.dev.yaml` with the required `bootstrap`, `builder-vite`, `demo-php`, `demo-vite`, and `gateway` services. Builder/demo source trees are bind-mounted, dependencies are stored in named volumes, and only gateway publishes `127.0.0.1:${GATEWAY_PORT:-4175}:80`.
- Bootstrap invokes the existing `scripts/compose-bootstrap.sh`; `demo-php` and gateway wait for bootstrap completion. `demo-php` runs exactly `frankenphp php-server -r public/`. `APP_URL` is set from the gateway port and `APP_KEY` passes through only when provided by the host, otherwise the generated `.env` key is used.
- Added `docker/Caddyfile.dev` routing `/_demo-vite/*` to demo Vite, `/demo/*`, `/api/*`, and Laravel public/Filament static paths to demo PHP, with other requests going to builder Vite. All routes preserve their path; normal `reverse_proxy` handles both Vite WebSocket upgrades.
- Added `server.origin` to `demo/vite.config.js`, sourced from `VITE_DEV_SERVER_ORIGIN`, because serving demo Vite via Caddy requires the hot file to point to the gateway instead of a container-only address.

## Test-first red check

Before creating the Compose file, ran both specified commands:

```sh
docker compose -f compose.dev.yaml config --quiet
docker compose -f compose.dev.yaml up --build -d
```

Both failed as expected because `compose.dev.yaml` did not exist.

## Verification

- `docker compose -f compose.dev.yaml config --quiet` — passed.
- `docker compose -f compose.dev.yaml up --build -d` — completed; the first invocation exceeded the shell tool's time limit while images/dependencies were being fetched, and a subsequent invocation completed successfully.
- `docker compose -f compose.dev.yaml ps --format '{{.Service}} {{.State}} {{.Ports}}'` — gateway and three app services running; bootstrap exited successfully. Only gateway has a published host port, `127.0.0.1:4175->80/tcp`.
- `docker compose -f compose.dev.yaml exec -T gateway caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile` — valid configuration.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'` — 2 passed.
- Independently verified builder root, `/demo/admin/login`, `/api/health`, and `/_demo-vite/@vite/client` return successful responses. The demo Vite hot file contains `http://127.0.0.1:4175/_demo-vite`.
- Browser WebSocket verification loaded `/_demo-vite/@vite/client` and observed successful Vite `connected` messages on both `ws://127.0.0.1:4175/_demo-vite/?token=...` and the builder's root WebSocket.
- Confirmed all Filament fonts, CSS, JavaScript, and Debugbar static URLs returned HTTP 200 through the gateway.
- For freshness checks, temporarily changed builder Vue, demo JS/CSS, and added a temporary Laravel route. Gateway requests returned each marker on the next request; all test-only edits were reverted. (Tailwind removes standalone comment/unknown theme tokens, so the CSS check used a temporary change to the existing `--font-sans` value.)

## Issue found and corrected

The first Playwright run returned HTTP 500 for Filament login although the API and Vite client worked. Laravel logs showed `MissingAppKeyException`: Compose had set `APP_KEY` to an empty string, overriding the generated key in `.env`. Changed the environment declaration to pass `APP_KEY` through only when present; with no host key set, Laravel now uses the generated `.env` value. The focused Playwright run then passed.

## Scope and concerns

- No production files or third-party packages/services were added. The Composer executable is copied from the official Composer image; the Vite services use the official Node image.
- The Composer and npm install logs included upstream package deprecation/audit notices; no dependency manifests or locks were changed by this task.
- The unrelated pre-existing worktree changes (`TICKETS.md`, Composer manifest/lock, AGENTS/skills-lock files, and `demo/storage/debugbar/`) were preserved and not included.

## Review round 1 fix

### Changes

- Gateway now directly depends on bootstrap with `condition: service_completed_successfully`.
- Added readiness checks using only installed runtimes: Node's built-in `fetch()` checks the builder root and demo Vite client; PHP's built-in HTTP stream checks `/api/health`. Gateway depends on all three with `condition: service_healthy`.
- Preserved service names, routes, ports, volumes and all other runtime behavior; no packages or services added.

### Commands and output

```sh
docker compose -f compose.dev.yaml config --quiet
```

Output: no output; exit status `0`.

```sh
docker compose -f compose.dev.yaml up --build -d
```

Output excerpt showing readiness gates before gateway startup:

```text
Container filament-theme-builder-demo-php-1 Healthy
Container filament-theme-builder-builder-vite-1 Healthy
Container filament-theme-builder-demo-vite-1 Healthy
Container filament-theme-builder-gateway-1 Starting
Container filament-theme-builder-gateway-1 Started
```

```sh
docker inspect $(docker compose -f compose.dev.yaml ps -q builder-vite demo-vite demo-php) --format '{{.Name}}={{.State.Health.Status}}'
```

Output:

```text
/filament-theme-builder-builder-vite-1=healthy
/filament-theme-builder-demo-php-1=healthy
/filament-theme-builder-demo-vite-1=healthy
```

```sh
COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'
```

Output:

```text
Running 2 tests using 2 workers
✓ compose gateway serves demo Vite client and proxied API on same origin
✓ compose gateway serves builder and same-origin Filament
2 passed (3.7s)
```

```sh
docker compose -f compose.dev.yaml ps --format '{{.Service}} {{.State}} {{.Ports}}'
```

Output:

```text
builder-vite running 5173/tcp
demo-php running 80/tcp, 443/tcp, 2019/tcp, 443/udp
demo-vite running 5173/tcp
gateway running 443/tcp, 2019/tcp, 443/udp, 127.0.0.1:4175->80/tcp
```

Only gateway publishes a host port.
