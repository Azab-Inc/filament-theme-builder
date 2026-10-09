# Filament Theme Builder

A visual theme builder for FilamentPHP, with a live Vue builder and an independent Laravel/Filament demo panel.

## Prerequisites

- For the Docker Compose workflows: Docker Engine/Desktop with the Docker Compose plugin. No host Node.js, PHP, or Composer installation is required.
- For the legacy npm/Sail workflow: Linux, macOS, or WSL2 (native Windows shells are not supported by these npm scripts), Node.js 24.12+ (or 22.18+) with npm, and PHP 8.5+ with Composer. Docker with the Compose plugin is also required by Sail.

## Repository layout

- `builder/` — independent Vue 3/Vite application and unit tests
- `demo/` — independent Laravel 13, Filament 5, Composer and Vite application
- `compose.dev.yaml` / `compose.prod.yaml` — single-origin Docker Compose runtime (see below)
- Root npm scripts — contributor workflow and browser smoke tests; root tooling does not combine the sibling dependency trees

## Docker Compose runtime (single origin)

The Compose files are the canonical way to run the complete application from one
origin, and they are independent of the npm/Sail workflow documented in the next
section. Each stack starts both parts of the application through a single
gateway:

- `docker compose -f compose.dev.yaml up` — development stack with hot reload, gateway at `http://127.0.0.1:4175`
- `docker compose -f compose.prod.yaml up` — production stack with prebuilt static assets, gateway at `http://localhost:9080` (published on all interfaces by default; override with `GATEWAY_HOST`)

Both gateways serve the same single-origin routes:

| Route | Served by |
| --- | --- |
| `/` | the Vue builder |
| `/demo/admin/*` | the Filament admin panel |
| `/api/*` | the Laravel API |

Neither command needs a prior `npm run setup`: a one-shot `bootstrap` service
installs demo Composer dependencies (dev stack only), copies `.env.example` to
`.env` when missing, generates `APP_KEY` only when none is present, and runs
migrations before the gateway is allowed to start.

### Development stack (hot reload)

```sh
docker compose -f compose.dev.yaml up
```

- The Caddy gateway binds `127.0.0.1:4175` (override with `GATEWAY_PORT`) and reverse-proxies the builder Vite dev server, the demo Vite dev server (under `/_demo-vite/*`) and the per-request FrankenPHP demo container, so `/`, `/demo/admin/*` and `/api/*` all resolve on that one origin.
- Hot reload: edits under `builder/` and `demo/` frontend sources are picked up by Vite HMR, and PHP edits are served fresh on the next request — no image rebuild or stack restart is needed.
- Node runs inside the stack as the Vite dev servers; the host only needs Docker to run it.

### Production stack (static assets, no Node at runtime)

```sh
docker compose -f compose.prod.yaml up
```

- The image is built with the builder and demo assets already compiled; at runtime only `bootstrap` (one-shot), `demo` (FrankenPHP with integrated Caddy and Laravel Octane workers) and `scheduler` run. No Node container runs in production — there is no Vite dev server and no hot reload, only the prebuilt files under `/build/*` and the builder's hashed assets.
- The gateway is published on `0.0.0.0:9080` by default, so `http://localhost:9080` works; override the bind with `GATEWAY_HOST` and the port with `GATEWAY_PORT`. Vite's `/hot` marker is not exposed (it returns 404).
- Persisted share data: the named volume `shares_db` is mounted at `/var/lib/shares` and holds `shares.sqlite`, so share records survive restarts. The demo SQLite database, private/public uploads, framework cache and logs are likewise kept in named volumes (`demo_db`, `demo_storage`, `uploads`, `framework_storage`, `logs`).

### Stopping the stacks

```sh
docker compose -f compose.dev.yaml down
docker compose -f compose.prod.yaml down
```

Named volumes are retained by default, so share data and demo state survive a
`down`/`up` cycle; add `-v` only when you explicitly want to delete them.

### Playwright against a running Compose stack

Playwright never starts the Compose stacks. With a stack already running, opt
in with `COMPOSE_E2E=1` and select the gateway tests with `--grep gateway`
(Playwright's Chromium must be installed once with `npx playwright install
chromium`):

```sh
# development gateway; COMPOSE_BASE_URL defaults to http://127.0.0.1:4175
COMPOSE_E2E=1 npm run e2e -- --grep gateway

# production gateway; COMPOSE_PROD_E2E=1 adds the production-only assertions
COMPOSE_E2E=1 COMPOSE_PROD_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:9080 npm run e2e -- --grep gateway
```

`COMPOSE_BASE_URL` should point at your gateway origin if you changed
`GATEWAY_PORT` (`http://localhost:9080` and `http://127.0.0.1:9080` address the
same production gateway). Without `COMPOSE_E2E=1`, `npm run e2e` behaves exactly
as before: it launches its own dev servers and skips the Compose tests.

## Local npm/Sail workflow

This is the original contributor workflow and remains fully supported alongside
the Compose runtime above; the commands below do not start or stop either
Compose stack.

```sh
npm run setup  # install each dependency tree; initialize demo .env, key, SQLite and migrations
npm run dev    # run Vue, Sail, and demo Vite assets; Ctrl-C stops all services
npm test       # builder unit tests and type check, plus demo Composer quality/tests
npm run e2e    # Playwright Chromium smoke checks for builder and Filament login
npm run build  # production builds for builder and demo assets
```

The Sail app is served on port 8000 by default. If that port is occupied, use `APP_PORT=8001 npm run dev` (update `APP_URL` in `demo/.env` to match if you need app-generated absolute URLs).
All development servers bind to loopback only: builder at `http://127.0.0.1:5173`, demo Vite assets at `http://127.0.0.1:5174`, and Filament login at `http://127.0.0.1:8000/demo/admin/login` by default. Ports 5173 and 5174 are strict and fail instead of silently selecting another port.

After setup, install Playwright's Chromium browser once with `npx playwright install chromium`; on Linux hosts missing browser system libraries, use `npx playwright install --with-deps chromium`. The demo login route is checked as a rendered Filament page; this workflow does not add public panel access or demo credentials.

Jenkins is the project's planned/used CI. Do not add GitHub Actions.
