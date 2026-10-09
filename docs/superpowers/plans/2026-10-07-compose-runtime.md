# Compose Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide complete single-origin dev and production Compose stacks for the Vue builder and Laravel/Filament demo, self-bootstrapped and tested through Playwright.

**Architecture:** Development uses Caddy as the sole host-facing gateway, separate Vite services for builder and demo, and FrankenPHP's per-request PHP server. Production uses one multi-stage FrankenPHP image with integrated Caddy/Octane serving compiled builder assets and Laravel, plus a scheduler; a one-shot bootstrap gates app processes and owns migrations. Neither gateway rewrites `/demo`.

**Tech Stack:** Docker Compose, Caddy, FrankenPHP, Laravel 13, Laravel Octane, Filament 5, Vue/Vite, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-compose-runtime-design.md`

## Global Constraints

- Host workflows: `docker compose -f compose.dev.yaml up` and `docker compose -f compose.prod.yaml up`; Docker + Compose plugin only host prerequisite.
- Paths: `/` builder, `/demo/admin/*` Filament, `/api/*` Laravel; never strip `/demo`.
- Dev gateway default is loopback `127.0.0.1:4175`; prod default is `9080`, configurable with `GATEWAY_PORT`.
- Production has no Node runtime and no second Caddy; FrankenPHP's integrated Caddy is the gateway.
- Bootstrap is one-shot and sole migration writer; app and prod scheduler wait for successful completion.
- Persist `shares.sqlite`; share demo storage and upload volumes between web and scheduler; demo DB and temporary uploads are disposable.
- Only consented additions: Laravel Octane, FrankenPHP, Caddy, scheduler. No Redis, other services/packages, CI additions, TLS design, or chokidar/Octane watch.
- Keep existing npm/Sail workflows working; update docs/workflows only where needed and do not add GitHub Actions.
- TDD: write and run failing test before implementation; user-visible behavior gets Playwright coverage first.

---

## File map

| Path | Responsibility |
|---|---|
| `demo/composer.json`, `demo/composer.lock` | Laravel Octane dependency and locked version (Octane consent already granted). |
| `demo/app/Providers/Filament/AdminPanelProvider.php`, `demo/routes/web.php` | Native `demo/admin` panel URL and remove the root welcome-route collision. |
| `demo/vite.config.js` | Isolate demo Vite base, asset URLs, and HMR websocket below `/_demo-vite/`. |
| `scripts/compose-bootstrap.sh` | Idempotent environment/key/migration/production optimize sequence, usable by both images. |
| `scripts/compose-bootstrap.test.mjs`, `package.json` | Unit-level bootstrap ordering/conditional behavior, run by root `npm test`. |
| `Dockerfile.dev`, `Dockerfile` | Development FrankenPHP image and production multi-stage builder+demo runtime image. |
| `docker/Caddyfile.dev`, `demo/Caddyfile` | Dev reverse proxy routes and integrated production FrankenPHP Caddy routing. |
| `compose.dev.yaml`, `compose.prod.yaml` | Full local and production service graphs, dependencies, ports, environment and volumes. |
| `playwright.config.ts`, `e2e/smoke.spec.ts` | Opt-in gateway smoke tests parameterized for dev and prod, including Vite endpoints. |
| `README.md` | Document both compose commands, their ports and the preserved legacy npm/Sail workflow. |

Do not edit current unrelated worktree changes. In particular, `demo/composer.json` and `demo/composer.lock` are already modified before this plan; inspect and preserve their existing changes when implementing the Octane delta.

## Task 1: Establish gateway Playwright tests (red first)

**Files:** Modify `playwright.config.ts`, `e2e/smoke.spec.ts`.

**Interfaces:** Test base URL comes from `COMPOSE_BASE_URL`, default `http://127.0.0.1:4175`. In normal `npm run e2e`, keep existing webServers and legacy smoke assertions. Compose smoke is explicitly enabled with `COMPOSE_E2E=1`; production URL is supplied by environment. Do not make Playwright start both compose stacks itself.

- [ ] **Step 1: Add gateway test cases before configuration/runtime changes.** In `e2e/smoke.spec.ts`, retain existing two tests and add:

```ts
const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test('compose gateway serves builder and same-origin Filament', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const response = await page.goto(composeBaseUrl)
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).not.toContainText('Laravel')

  const admin = await page.request.get(`${composeBaseUrl}/demo/admin/login`)
  expect(admin.ok()).toBeTruthy()
  await page.goto(`${composeBaseUrl}/demo/admin/login`)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/email address/i)).toBeVisible()
})

test('compose gateway serves demo Vite client and proxied API on same origin', async ({ request }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const client = await request.get(`${composeBaseUrl}/_demo-vite/@vite/client`)
  expect(client.ok()).toBeTruthy()
  expect(client.headers()['content-type']).toContain('javascript')
  const api = await request.get(`${composeBaseUrl}/api/health`)
  expect(api.ok()).toBeTruthy()
})
```

The API path above is a concrete endpoint requirement; add a minimal Laravel `/api/health` route returning `response()->json(['status' => 'ok'])` in a dedicated routes file if none exists and register it through Laravel's existing routing bootstrap. This route is only a health surface and adds no dependency.

- [ ] **Step 2: Run red against absent dev gateway.** Run `COMPOSE_E2E=1 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'`. Expected: gateway connection refused at `127.0.0.1:4175` (the two legacy tests are excluded by grep).
- [ ] **Step 3: Keep this test-only change isolated until the runtime tasks implement each assertion.** Do not call it passing yet; later run it against dev and prod.

## Task 2: Add bootstrap helper and tests

**Files:** Create `scripts/compose-bootstrap.sh`, create `scripts/compose-bootstrap.test.mjs`, modify `package.json`.

**Interfaces:** Script accepts `APP_DIR` default `/var/www/html` and `BOOTSTRAP_PRODUCTION` default `0`. It runs fixed ordered commands, skips composer install in production (dependencies baked into image), creates `.env` only if absent, generates key only when `APP_KEY` is empty, runs `php artisan migrate --force`, and production-only `php artisan optimize`. Use `set -eu`; propagate failures. Root test is `node --test scripts/setup.test.mjs scripts/compose-bootstrap.test.mjs`.

- [ ] **Step 1: Add failing tests** using node:test, reading script source and asserting command order and guards:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const script = await readFile(new URL('./compose-bootstrap.sh', import.meta.url), 'utf8').catch(() => '')

test('bootstrap installs dev dependencies before env, key, migrations and optimize', () => {
  const install = script.indexOf('composer install')
  const env = script.indexOf('.env.example')
  const key = script.indexOf('key:generate')
  const migrate = script.indexOf('migrate --force')
  const optimize = script.indexOf('artisan optimize')
  assert.ok(install >= 0 && env > install && key > env && migrate > key && optimize > migrate)
  assert.match(script, /BOOTSTRAP_PRODUCTION/)
  assert.match(script, /APP_KEY/)
})

test('bootstrap propagates command failure', () => {
  assert.match(script, /set -eu/)
})
```

- [ ] **Step 2: Run red.** Run `node --test scripts/compose-bootstrap.test.mjs`; expected assertion failure because script is absent.
- [ ] **Step 3: Implement the shell script** with conditional production install/optimize, safe `.env` copy and empty-key check, in the required sequence. No independent migrations from service entrypoints.
- [ ] **Step 4: Run green.** Run `node --test scripts/compose-bootstrap.test.mjs`; expected both pass. Update root `test` script to include this test and run `npm test` after the plan's final integration.
- [ ] **Step 5: Commit** `git add scripts/compose-bootstrap.sh scripts/compose-bootstrap.test.mjs package.json && git commit -m "Feature: add deterministic compose bootstrap"`.

## Task 3: Align Laravel routes and demo Vite

**Files:** Modify `demo/app/Providers/Filament/AdminPanelProvider.php`, `demo/routes/web.php`, add/register `demo/routes/api.php` if not registered, modify Laravel 13 routing bootstrap file (inspect `demo/bootstrap/app.php`), modify `demo/vite.config.js`, modify/create Laravel feature tests under `demo/tests/Feature/`.

**Interfaces:** Filament panel path is exactly `demo/admin`. Root `GET /` has no Laravel welcome route. `GET /api/health` returns JSON `{"status":"ok"}`. Vite uses base `/_demo-vite/`; HMR uses a path under that prefix. Confirm Vite's actual HMR URL rather than assuming an option works.

- [ ] **Step 1: Add Laravel feature tests:** test panel route `/demo/admin/login` returns success and has sign-in form; `/` is not the Laravel welcome view (expect 404); `/api/health` returns exact JSON.
- [ ] **Step 2: Run focused tests red.** `cd demo && php artisan test --filter='ComposeRuntime'`; expected panel/health routes fail or 404.
- [ ] **Step 3: Configure panel `->path('demo/admin')`, remove the root welcome route, add health route using the existing Laravel 13 route registration, and configure demo Vite base/HMR prefix.** Do not relocate welcome route unless existing tests or product references require preserving it; spec allows removal.
- [ ] **Step 4: Verify Filament path and health.** `cd demo && php artisan test --filter='ComposeRuntime'`; expected all pass. Also run a Vite dev server and request `/_demo-vite/@vite/client`; confirm it responds and that HMR websocket path remains prefixed.
- [ ] **Step 5: Commit** only these Laravel/Vite files and tests as `Feature: align demo routes for unified gateway`.

## Task 4: Development Docker runtime and gateway

**Files:** Create `Dockerfile.dev`, `docker/Caddyfile.dev`, `compose.dev.yaml`; modify `demo/vite.config.js` only if verification from Task 3 requires proxy-specific HMR host settings.

**Interfaces:** Services: `bootstrap`, `builder-vite`, `demo-php`, `demo-vite`, `gateway`. Only gateway publishes `127.0.0.1:${GATEWAY_PORT:-4175}:80`. Builder Vite uses internal 5173 strict port; demo Vite internal only. PHP command is exactly `frankenphp php-server -r public/`. Route requests without stripping path; Caddy forwards websocket upgrades by normal `reverse_proxy` behavior. All app containers use the Compose network.

- [ ] **Step 1: Define verification commands as the red check:** `docker compose -f compose.dev.yaml config --quiet` and `docker compose -f compose.dev.yaml up --build -d`; before files exist expected Compose reports file not found.
- [ ] **Step 2: Implement `Dockerfile.dev`** from official `dunglas/frankenphp`, install only required PHP extensions/system runtime necessities, working directory `/var/www/html`, and launch command provided by compose. Do not add an unconsented package/service.
- [ ] **Step 3: Implement Caddy routing:** `/_demo-vite/*` → `demo-vite:5173`, `/demo/*` and `/api/*` → `demo-php:80`, remaining root → `builder-vite:5173`; preserve full path on every upstream. Include websocket proxy for both Vite servers. Static `/build/*` and demo public resources remain reachable from demo PHP path.
- [ ] **Step 4: Implement Compose services and bootstrap dependency gate.** Bind-mount `builder/` and `demo/`; dev bootstrap runs `composer install`, env/key/migrate once; `gateway` and `demo-php` wait for `service_completed_successfully`. Set `APP_URL` from gateway port; do not expose upstream ports.
- [ ] **Step 5: Validate config and boot.** Run `docker compose -f compose.dev.yaml config --quiet`, then `docker compose -f compose.dev.yaml up --build -d`; expected valid graph and services healthy/running. Run `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'`; expected pass.
- [ ] **Step 6: Verify HMR and PHP freshness:** modify a builder source file, demo JS/CSS, and a PHP route/view in separate checks; verify Vite responses/rebuild and PHP's next-request result. Revert test-only edits before commit.
- [ ] **Step 7: Commit** `Dockerfile.dev`, `docker/Caddyfile.dev`, `compose.dev.yaml` and any scoped config changes as `Feature: add compose development stack`.

## Task 5: Production FrankenPHP image, Caddyfile, and Compose

**Files:** Create `Dockerfile`, `demo/Caddyfile`, `compose.prod.yaml`; add `demo/config/octane.php` only if Octane package does not publish the required config; modify `demo/.env.example` only for required environment defaults.

**Interfaces:** Multi-stage Node build compiles builder assets and demo Vite assets; final image is FrankenPHP/PHP only (no Node). Runtime starts `php artisan octane:frankenphp` with explicit `--workers` and `--max-requests=500` and custom Caddyfile. Integrated Caddy serves builder `dist/` at `/` with SPA fallback and immutable caching for hashed assets, forwards `/demo/*` and `/api/*` without stripping, and serves demo public assets. Scheduler uses the same image/env/mount set, command `php artisan schedule:work`. Prod port defaults `9080` and configurable host binding.

- [ ] **Step 1: Add the production Playwright assertions in Task 1 before implementation and run red against absent `127.0.0.1:9080`;** expected connection refused.
- [ ] **Step 2: Add Octane dependency using the already-approved Composer permission.** Run from `demo/`: `composer require laravel/octane`; inspect resulting supported FrankenPHP server config and publish `config/octane.php` only if needed. No other composer package may be added without fresh consent.
- [ ] **Step 3: Implement multi-stage `Dockerfile`.** Build builder with existing builder lockfile/package scripts and demo assets with demo lockfile; final stage includes application, composer production dependencies, built assets, necessary writable Laravel directories, and FrankenPHP only. Ensure builder assets are addressable at Caddy's configured document root without Node at runtime.
- [ ] **Step 4: Implement `demo/Caddyfile` and Octane entrypoint.** Route `/demo/*`, `/api/*` and Laravel public static resources to Octane/Laravel per supported FrankenPHP Caddyfile format; serve builder root and fallback. Preserve prefixes. Set explicit worker count and max requests; no second Caddy container.
- [ ] **Step 5: Implement `compose.prod.yaml`.** One-shot bootstrap skips composer install and performs env/key/migrate/optimize; demo and scheduler depend on successful bootstrap. `demo` and `scheduler` share identical environment and volumes. Add named volumes for shares DB, demo DB/resettable storage, uploads and shared framework storage. Bind only `GATEWAY_PORT:-9080`; no Node service.
- [ ] **Step 6: Red/green validate.** Before new files expected `docker compose -f compose.prod.yaml config --quiet` failure. Once implemented run `docker compose -f compose.prod.yaml config --quiet`; then `docker compose -f compose.prod.yaml up --build -d`; run `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:9080 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'`; expected pass on clean state.
- [ ] **Step 7: Check runtime properties:** `docker compose -f compose.prod.yaml ps`; inspect running containers/processes to confirm no Node runtime and only integrated Caddy, bootstrap completed before scheduler, scheduler log shows schedule worker running. Recreate stack and verify share DB named volume contents persist while demo DB/uploads can be reset. Do not test TLS; explicitly out of scope.
- [ ] **Step 8: Commit** production image, Caddyfile and compose files as `Feature: add FrankenPHP production stack`.

## Task 6: Parameterized Playwright and bootstrap integration

**Files:** Modify `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`, `scripts/compose-bootstrap.test.mjs` as needed.

- [ ] **Step 1: Add one same-origin `/api/health` assertion** and check that Filament-generated form/static asset URLs (including root-level `/css/filament`, `/js/filament`, `/fonts/filament`, and `/livewire*` paths supported by the Caddy route table) resolve successfully on the same origin; assert demo Vite HTML asset URL and client endpoint use `/_demo-vite/`, never root `/@vite/client`.
- [ ] **Step 2: Run legacy browser tests unchanged.** `npm run e2e`; expected existing builder at 4173 and Filament login at 4174 still pass.
- [ ] **Step 3: Run gateway test in both modes** with respective stacks already running: `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'` and same with port `9080`; expected all assertions pass.
- [ ] **Step 4: Run unit and app suites:** `npm test`, `npm --prefix builder run type-check`, `npm --prefix builder run test:unit -- --run`, `npm --prefix builder run build`, `composer --working-dir=demo run test`; expected pass.
- [ ] **Step 5: Commit** only test/config additions as `Tests: cover compose gateway stacks`.

## Task 7: README and workflow documentation

**Files:** Modify `README.md` only if compose usage is not already explained sufficiently; modify root scripts only if needed to expose an opt-in gateway test command. Do not change CI.

- [ ] **Step 1: Add README documentation** for both exact compose commands, dev `http://127.0.0.1:4175`, prod `http://localhost:9080`, single-origin paths, persisted share data, and how to run Playwright against an already-running stack.
- [ ] **Step 2: Explicitly retain npm/Sail workflow documentation and commands** (`npm run dev`, `npm test`, `npm run e2e`, `npm run build`); do not silently replace the existing 8000/5173/5174 workflow.
- [ ] **Step 3: Verify commands/documentation and full suite:** `npm test && npm run e2e && npm run build`; then separately run both Compose configs and gateway Playwright tests as above.
- [ ] **Step 4: Commit** `README.md` and any narrowly scoped root script change as `Docs: document compose runtime workflows`.

## Implementation handoff checks

- [ ] Run `docker compose -f compose.dev.yaml down` and `docker compose -f compose.prod.yaml down` after integration checks, retaining named volumes unless the explicit reset behavior is under test.
- [ ] Run `git status --short` and ensure only task files were staged; preserve existing `TICKETS.md`, Composer manifest/lock, AGENTS, skills-lock, and debugbar worktree changes. Do not stage unrelated modifications.

## Self-review against spec

| Spec section / requirement | Plan location | Status |
|---|---|---|
| §1 goal, single origin, dev HMR/prod static assets, no extra services | Global constraints; Tasks 4–5 | Covered |
| §2.1 Filament path and no prefix strip | Task 3; Tasks 4–5 | Covered |
| §2.2 per-request dev FrankenPHP, no Octane watch/chokidar | Task 4 | Covered |
| §2.3 remove Laravel `/` welcome route | Task 3 | Covered |
| §2.4 one-shot deterministic bootstrap and dependency conditions | Task 2; Tasks 4–5 | Covered |
| §2.5 isolated demo Vite base/HMR prefix | Tasks 3–4, 6 | Covered |
| §3.1 dev service graph, loopback 4175, proxy paths | Task 4 | Covered |
| §3.2 single production FrankenPHP integrated Caddy, Node-free runtime, workers | Task 5 | Covered |
| §3.3 bootstrap order; scheduler only prod | Tasks 2, 4–5 | Covered |
| §4 root/admin/API/static routing and scheduler duties | Tasks 1, 3–6 | Covered; existing scheduled cleanup tasks must be verified rather than invented |
| §5 port defaults, APP_URL, strict Vite, prod binding | Tasks 4–5 | Covered |
| §6 share persistence, demo/upload disposal, shared storage/env | Task 5 | Covered; precise existing DB/share/upload paths must be confirmed from repository before volume declarations |
| §7 Filament, route, Vite, compose/Caddy, Octane config | Tasks 2–5 | Covered |
| §8 failing tests, HMR/PHP freshness, both stacks, persistence, existing workflows | Tasks 1–7 | Covered |
| §9 TLS out of scope; Octane safety/recycling; legacy compatibility; Filament path and APP_URL verification | Tasks 3, 5–7; Global constraints | Covered; Octane safety pass and exact deployment worker sizing are validation concerns |
| §10 no extra packages/services, CI, TLS, host dependencies | Global constraints; Task 7 | Covered |

**Gaps/consent:** Octane was explicitly approved by the task. The spec permits FrankenPHP, Caddy, and scheduler; no additional package/service is proposed. If implementation discovers an additional runtime package or service is necessary, stop and obtain explicit user consent. No CI workflow changes are planned. Two implementation details require repository inspection before execution, not a design change: exact database/upload/share paths for volume targets and supported Vite proxy HMR options. Do not guess; resolve from the existing app/config and verify using the stated tests. The spec text labels itself “awaiting user review,” but the requester has identified it as approved; this plan treats it as approved. Existing worktree modifications are unrelated and must be preserved.
