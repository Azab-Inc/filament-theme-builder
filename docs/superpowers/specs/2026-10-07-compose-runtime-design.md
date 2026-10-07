# Compose Runtime Design — Full-Stack Docker Compose (Dev + Prod)

**Date:** 2026-10-07 (rev. 1)
**Status:** Proposed design spec (open decisions resolved; awaiting user review — implementation not started)
**Scope:** Root `compose.dev.yaml` and `compose.prod.yaml` running the `builder/` Vue app and `demo/` Laravel/Filament app as one product behind a single origin.
**References:** [AGENTS.md](../../../AGENTS.md) (Application Runtime), [SPECS.md](../../../SPECS.md) §2–3 (Public routing, Production runtime), [TICKETS.md](../../../TICKETS.md#ftb-035) (FTB-035), [Laravel 13 Octane docs](https://laravel.com/docs/13.x/octane), [Laravel 13 Deployment docs](https://laravel.com/docs/13.x/deployment), [FrankenPHP docs](https://frankenphp.dev/docs/laravel/).

---

## 1. Goals

- Two commands, zero host setup beyond Docker: `docker compose -f compose.dev.yaml up` and `docker compose -f compose.prod.yaml up` each start the complete stack (builder + demo) and self-bootstrap.
- One origin, one URL layout in both environments:
  - `/` — builder (Vue);
  - `/demo/admin/*` — Filament admin panel;
  - `/api/*` — Laravel API surface.
- Dev: hot reload for both apps, Caddy as the reverse-proxy gateway.
- Prod: compiled builder assets served statically, no dev servers/Node at runtime, FrankenPHP's integrated Caddy + Laravel Octane serving Laravel, plus a dedicated scheduler container.
- No new dependencies or services beyond the explicitly consented set: **Laravel Octane, FrankenPHP, Caddy, scheduler**. (No Redis, no external DB, no second web server, no GitHub Actions; the bootstrap step below reuses the same images.)

## 2. Settled decisions

These decisions were previously open and are now fixed; they govern every section below.

1. **Filament lives at `demo/admin` in the application itself.** The Filament panel `path` is configured to `demo/admin`, so the app generates `/demo/admin/...` URLs natively. Gateways **never strip the `/demo` prefix** in either environment; they proxy `/demo/*` through unchanged.
2. **Dev PHP runtime is FrankenPHP's per-request server.** The dev `demo` PHP service runs the official `dunglas/frankenphp` image with `frankenphp php-server -r public/` (per-request PHP, no long-lived workers). Laravel code changes are picked up on the next request with no watcher. Octane watch mode is explicitly avoided because it requires the unapproved `chokidar` npm dependency (Laravel Octane docs: `--watch` needs Node + chokidar).
3. **The Laravel `/` welcome route is removed or relocated.** `demo/routes/web.php` currently registers `Route::view('/', 'welcome')`. In the unified layout `/` belongs to the builder, so this route must be relocated (e.g., under `/demo/`) or removed as an **implementation change** tracked with this work — not an open question.
4. **Bootstrap is deterministic and single-writer.** A dedicated one-shot `bootstrap` service performs dependencies/env/key/migrations; app and scheduler services start only after it completes successfully (see §3.3).
5. **Dev demo Vite is a separate internal service.** Demo JS/CSS hot reload runs in its own internal `demo-vite` container; its dev-server URLs and HMR websocket are exposed only through the Caddy gateway under a dedicated path prefix (§2.1, §4).

## 3. Architecture

### 3.1 Development — `compose.dev.yaml`

```text
host ── :${GATEWAY_PORT:-4175} ──► caddy (reverse proxy gateway)
                                     ├── /                        ──► builder-vite (:5173, HMR websocket)
                                     ├── /_demo-vite/*  (+ ws)    ──► demo-vite (internal, HMR websocket)
                                     ├── /demo/*        (no strip) ──► demo-php  (frankenphp php-server, public/)
                                     ├── /api/*         (no strip) ──► demo-php
                                     └── /build/*, /demo/* static  ──► demo-php (Laravel public/ assets)
          bootstrap     : one-shot; composer install, .env, key, migrate; then exits 0
          builder-vite  : Vite dev server for builder/, bind-mount, strict port 5173, HMR
          demo-php      : dunglas/frankenphp image, `frankenphp php-server -r public/`, bind-mount demo/
          demo-vite     : Vite dev server for demo/ assets, internal only (no host port)
```

- Caddy is the only process bound to the host gateway port; all app containers stay on the internal network.
- **Prefixes are never rewritten.** Because Filament's panel path is `demo/admin`, the request URL Caddy forwards is exactly the URL Laravel expects.
- **Demo Vite through Caddy:** demo Vite is configured with a dedicated `base`/server path (e.g. `/_demo-vite/`) so its asset URLs (`/_demo-vite/@vite/client`, `/_demo-vite/@fs/...`) and its HMR websocket resolve under that prefix only — no collision with the builder's root-level Vite HMR websocket. Caddy `reverse_proxy` handles `Upgrade`/`Connection` for both Vite instances; matching `handle` blocks route `/_demo-vite/*` to `demo-vite` and everything else per the table above. This `base` change to `demo/vite.config.js` is an implementation change (§7).
- `builder/` and `demo/` source trees are bind-mounted: builder edits hot-reload via Vite HMR, demo PHP edits on next request, demo JS/CSS via demo-vite HMR.

### 3.2 Production — `compose.prod.yaml`

```text
host ── :${GATEWAY_PORT:-9080} ──► frankenphp (integrated Caddy + Laravel Octane)
                                     ├── /                ──► static compiled builder assets (built into image)
                                     ├── /demo/*          ──► Laravel (Octane worker, prefix forwarded unchanged)
                                     └── /api/*           ──► Laravel (Octane worker)
          bootstrap    : one-shot; migrate --force + optimize; then exits 0
          scheduler    : same demo image, `php artisan schedule:work`, started after bootstrap
```

- FrankenPHP's integrated Caddy is the **only** web server (per SPECS.md §3: no second Caddy proxy in production). It is the gateway, serving the three-route layout from a custom Caddyfile passed via Octane's `--caddyfile`.
- The builder's compiled `dist/` is baked into the runtime image (multi-stage build: Node build stage → PHP/FrankenPHP runtime stage) and served by Caddy's `file_server` (`/` → `index.html`, immutable caching for hashed `/assets/*`). No Node process runs at runtime.
- Laravel runs via `php artisan octane:frankenphp`. `/demo/*` and `/api/*` are proxied to the Octane worker with the prefix intact; the app's own routes (panel path `demo/admin`) match the incoming path directly.
- Workers: explicit `--workers` sized for the VPS; `--max-requests` set for graceful worker recycling (default 500 acceptable initially) to bound memory growth (SPECS.md §3, FTB-035).

### 3.3 Services and bootstrap ordering

| Service | `compose.dev.yaml` | `compose.prod.yaml` |
|---|---|---|
| `bootstrap` | one-shot: `composer install`, `.env` from `.env.example` if absent, `key:generate` if `APP_KEY` empty, `migrate --force`; exits 0 | one-shot: same, plus `migrate --force` and `php artisan optimize` (prod deps baked into image, so no install); exits 0 |
| `gateway` | `caddy` image, binds `${GATEWAY_PORT:-4175}` | n/a — FrankenPHP's integrated Caddy is the gateway, binds `${GATEWAY_PORT:-9080}` |
| `builder` | `builder-vite` Node/Vite container, bind-mount `builder/`, strict port 5173, HMR | no separate container — compiled assets baked into the `demo` image and served by integrated Caddy |
| `demo` | `demo-php` (`frankenphp php-server -r public/`, bind-mount `demo/`) + `demo-vite` internal Vite container | FrankenPHP + Octane container, image built from `demo/` with compiled builder + demo assets |
| `scheduler` | not required in dev (tasks can be run on demand via `artisan schedule:run`) | separate container, same image/env/volumes as `demo`, command overridden to `php artisan schedule:work` |

**Deterministic bootstrap (both environments):**

1. `bootstrap` runs first and alone: idempotent steps in a fixed order —
   1. `composer install` (prod: baked/skipped or `--no-dev --optimize-autoloader`),
   2. `.env` creation from `.env.example` when absent,
   3. `php artisan key:generate` when `APP_KEY` is empty,
   4. `php artisan migrate --force`,
   5. prod only: `php artisan optimize`.
2. `gateway`, `demo`, and `scheduler` declare `depends_on: bootstrap: condition: service_completed_successfully`. The scheduler can therefore never start (or re-run cleanup tasks) before migrations complete; there is exactly one writer for migrations.
3. `bootstrap` exits 0; on failure the stack does not start app services.

No host-side `npm`/`composer`/`php` commands are required for either compose file.

## 4. Routing and data flow

Single-origin route table (identical path space in dev and prod; **no prefix stripping anywhere**):

| Path | Dev target | Prod target |
|---|---|---|
| `/`, `/theme/<id>` | `builder-vite` (HMR ws at `/`) | static compiled builder assets (`file_server`) |
| `/_demo-vite/*` + HMR ws | `demo-vite` (dedicated Vite `base`) | n/a (no dev server) |
| `/demo/admin/*` | `demo-php` (`frankenphp php-server`), Filament panel path `demo/admin` | Octane worker via integrated Caddy |
| `/api/*` | `demo-php` | Octane worker via integrated Caddy |
| other `/demo/*` | `demo-php` (Laravel routes + `public/` static assets) | Octane worker / Caddy static |

1. Browser requests `http://localhost:<gateway>/` → builder served with HMR (dev) or hashed static assets (prod).
2. Builder calls the backend on the **same origin** under `/api/*` (no CORS) and embeds/links Filament at `/demo/admin/*`.
3. Filament URLs come out as `/demo/admin/...` because the panel `path` is `demo/admin`; Caddy forwards the path unchanged.
4. **Implementation change:** the existing Laravel `/` welcome route in `demo/routes/web.php` is relocated (e.g. `/demo/welcome`) or removed so the builder exclusively owns `/` (§2, decision 3; §7).
5. Scheduler runs cron-equivalent tasks (demo reset, share expiry cleanup, upload cleanup per SPECS.md §3) outside the request path, after `bootstrap`.

## 5. Ports and environment

| Variable | Default | Applies to |
|---|---|---|
| `GATEWAY_PORT` | dev `4175`, prod `9080` | host port for the single public entrypoint (configurable per environment; defaults are baked into each compose file) |
| `APP_URL` | derived from gateway port (`http://localhost:<port>`) | Laravel URL generation; must match the gateway or app-generated absolute URLs break |
| internal Vite ports | 5173 (builder), demo-vite internal | dev only, internal network; only the gateway publishes a host port |
| `APP_KEY`, `APP_DEBUG`, `APP_ENV` | generated / `false` / environment-appropriate | self-bootstrapped by `bootstrap` or injected; `APP_DEBUG=false` in prod |

- Dev binds to loopback (`127.0.0.1:${GATEWAY_PORT:-4175}`); prod binds configurable (default all interfaces on `9080`; TLS termination is out of scope — see Risks/Non-goals).
- Strict-port behavior for the builder's Vite server (fail rather than pick another port) is preserved inside its container.

## 6. Persistence

Per SPECS.md §3:

| Data | Lifetime | Mechanism |
|---|---|---|
| `shares.sqlite` | **persistent** across deploys and demo resets | named volume mounted into `demo` and `scheduler` |
| `demo.sqlite` | disposable/rebuildable | container-local or explicitly resettable named volume |
| demo uploads (temp) | disposable/rebuildable | named volume, cleared by scheduler task |
| `storage/` (logs, framework cache/views) | shared between `demo` and `scheduler` | named volume (both services mount it so scheduler tasks and web workers agree) |
| builder `dist/`, vendor, `.env` | image-internal in prod; bind-mounted in dev | build-time artifact vs. bind mount |

`demo` and `scheduler` must share the same volume set and environment to avoid split-brain (e.g., scheduler resetting a database the web container does not see).

## 7. Implementation changes tracked by this spec

Application/config edits required by the settled decisions (made during implementation, not by this document):

1. Set the Filament panel `path` to `demo/admin` (generates unified URLs; no gateway rewriting).
2. Remove or relocate the Laravel `/` welcome route so the builder owns `/`.
3. Set a dedicated `base` (and HMR path) for the demo Vite dev server (e.g. `/_demo-vite/`) so its assets/HMR route cleanly through the Caddy gateway without colliding with the builder's root Vite websocket.
4. Create root `compose.dev.yaml` and `compose.prod.yaml` (services + bootstrap ordering per §3.3) and any Caddyfile(s).
5. Octane production config (`config/octane.php`, custom Caddyfile, `--workers`/`--max-requests`).

## 8. Testing / TDD

Per repository AGENTS.md, every feature/bug fix is test-first; user-visible behavior gets a Playwright test before implementation.

1. **Failing tests first:**
   - Playwright CLI smoke spec asserting: gateway root serves the builder; `/demo/admin/...` renders the Filament login page; an `/api/*` route responds on the same origin; `/` does not return the Laravel welcome page. Parameterize the base URL so one spec covers dev (4175) and prod (9080) gateways.
   - Extend root setup/Node tests (`scripts/setup.test.mjs`) with unit-level assertions for any bootstrap helper logic (idempotent env/key/migrate ordering).
2. **Verify expected failure** (compose files don't exist / routes 404), then implement the smallest change.
3. **Verification after implementation:**
   - `docker compose -f compose.dev.yaml up` → Playwright smoke passes against `127.0.0.1:4175`; edit a builder source file and a demo JS/CSS file and confirm HMR rebuilds; edit a demo PHP file and confirm it is served fresh (per-request server).
   - `docker compose -f compose.prod.yaml up` on a clean state → Playwright smoke passes against `:9080`; confirm no Node process/container exists at runtime; confirm `bootstrap` completed before `scheduler` started and the scheduler executes tasks; restart/recreate containers and confirm `shares.sqlite` survives while demo state can be reset.
   - Existing `npm test` / `npm run e2e` suites continue to pass (this design must not break the current Sail/npm workflow until it is deliberately retired).

## 9. Risks (remaining)

The Filament path mechanism, dev PHP runtime, `/` route collision, and bootstrap race are **settled** (§2) and no longer open. Remaining explicit risks:

- **TLS:** production HTTPS/`443` termination is not specified (host-level proxy or Caddy auto-HTTPS on the FrankenPHP gateway is a deployment decision; `OCTANE_HTTPS` must then be set).
- **Octane state safety:** long-lived workers require Octane-safe code (no request state in singletons/statics); SPECS.md §3 mandates worker recycling — `--max-requests` must be explicitly configured, and existing code needs an Octane-safety pass (FTB-035 acceptance criteria).
- **Existing npm/Sail workflow coexistence:** root npm scripts currently drive Sail + Vite on ports 8000/5173/5174. Whether compose replaces or coexists with that workflow (and which README instructions change) is deferred to the implementation ticket.
- **Filament 5 path verification:** setting the panel path to `demo/admin` should be verified against Filament 5's routing/generate-URL behavior and `APP_URL` before full rollout (mechanism settled; verification is an implementation task).
- **Vite-through-proxy fragility:** demo Vite `base`/HMR routing through Caddy (and builder HMR at `/`) is a common breakage point; the Playwright smoke spec must assert asset and HMR endpoints, not just document HTML.
- **Env/config drift:** `APP_URL` must track `GATEWAY_PORT`; misconfiguration yields working pages with broken absolute links — cover with a smoke assertion.

## 10. Non-goals

- No changes to application code, compose files, manifests, or tests by this spec (design-only artifact; §7 lists changes for the implementation phase).
- No third-party services/packages beyond the consented Octane, FrankenPHP, Caddy, and scheduler; no Redis, MySQL/Postgres, queue workers, or reverse-proxy alternatives (Nginx/Traefik). Chokidar/Octane-watch is explicitly excluded.
- No second Caddy instance in production (SPECS.md §3).
- No CI changes (Jenkins only; no GitHub Actions).
- No TLS/domain/CDN design, no Kubernetes/orchestration, no horizontal scaling plan.
- No change to the canonical theme-state format or builder/demo application behavior beyond the routing-path reconciliation listed in §7.
- No host package installation requirements (Docker + Compose plugin is the only prerequisite for the compose workflows).
