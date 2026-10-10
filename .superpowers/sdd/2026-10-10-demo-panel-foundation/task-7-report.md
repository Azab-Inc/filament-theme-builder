# Task 7 report

## Status

Review remediation is complete and the required acceptance checks now pass.
FTB-009A, FTB-009B, and FTB-010 remain marked done based on the verified
executable contracts. FTB-027 and FTB-028 remain `ready-for-agent` and are
explicitly out of scope.

## Commit

This report is included in the scoped documentation commit; the final commit
hash is recorded in the task response because a commit cannot contain its own
hash.

## Files

- `TICKETS.md` — milestone statuses, checked criteria, SPECS links, and test
  evidence links.
- `ARCHITECTURE.md` — demo domain/data-seed and Filament resource boundaries.
- `COVERAGE.md` — domain, 17 core resources, Relation Managers, Nested
  Resources, public panel, navigation, and browser coverage.
- `.superpowers/sdd/2026-10-10-demo-panel-foundation/task-7-report.md` — this
  verification report.

## Verification commands and results

- `composer test` from `demo/` — **failed** at the pre-existing Larastan step
  with 47 `missingType.generics` errors in domain model relationship methods;
  Pint passed and PHPUnit was not reached by this Composer script.
- `composer run lint:check` from `demo/` — **passed**.
- `composer run types:check` from `demo/` — **failed**, same 47 pre-existing
  Larastan generic relationship-type errors.
- `php artisan test` from `demo/` — **passed**, 60 tests, 503 assertions.
- `php artisan migrate:fresh --seed --force`, followed by two
  `php artisan db:seed --force` runs and table-count comparison — **passed**;
  counts were identical, with stable business keys and expected counts for
  users, customers, addresses, products, categories, variants, tags, reviews,
  orders, order items, payments, refunds, shipments, status histories,
  inventories, suppliers, discounts, and notes.
- `php artisan route:list --path=demo/admin` — **passed**; 76 panel routes
  were listed, including public dashboard/login, 17 entity resource routes,
  and nested order-item routes.
- `COMPOSE_E2E=1 npx playwright test e2e/demo-panel.spec.ts` against the
  default Compose gateway port — **failed before test execution** because the
  suite's fixed `4174` demo URL was not the Compose gateway's `4175` port.
- `GATEWAY_PORT=4174 docker compose -f compose.dev.yaml up -d`, then
  `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4174 npx playwright test
  e2e/demo-panel.spec.ts` — **2 passed, 1 failed**; the product detail image
  assertion resolved the correct image but it was hidden in the Compose
  rendering. The same test passed in the documented normal two-server run.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4174 npx playwright test
  e2e/smoke.spec.ts` — **4 passed, 4 failed, 1 skipped**; the failures were
  expected fixed-port mismatch for builder `4173` and the same-origin preview
  allowlist assertion when the gateway was used as the demo origin.
- `npx playwright test e2e/demo-panel.spec.ts e2e/smoke.spec.ts` — **passed**,
  9 tests, 3 Compose-only tests skipped. This is the complete normal smoke and
  demo-panel run.
- `docker compose -f compose.dev.yaml up --build -d`, then
  `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test
  e2e/smoke.spec.ts --grep 'compose gateway'` — **passed**, 2 tests.
- `node --test scripts/demo-first-roadmap.test.mjs` — **passed**, 4 tests.
- `git diff --check` — **passed**.
- `docker compose -f compose.dev.yaml down` — **passed**; the verification
  stack was stopped.

## Assumptions

- Existing Task 1–6 tests are the acceptance contract for the three demo slices;
  Task 7 adds no executable production behavior.
- The normal Playwright configuration is the authoritative full demo-panel and
  existing smoke run; Compose-specific smoke checks are run with the gateway
  environment required by the existing test configuration.

## Risks and concerns

- The original Task 7 run had 47 Larastan generic-type failures and a hidden
  Compose image; both are resolved in the remediation below.
- The demo-panel Playwright suite now accepts `DEMO_BASE_URL` so the same
  assertion can run against the Compose gateway without changing its required
  visibility check, and runs its shared-state tests serially without a manual
  worker override. The smoke suite retains its separate Compose opt-in.

## Task 7 review remediation

### Changes

- Added `/demo-images/*` to the Compose demo-asset proxy so the deterministic
  local SVGs are served by Laravel/FrankenPHP as `image/svg+xml` instead of
  falling through to the Vite HTML shell. The existing `toBeVisible()` image
  assertion was preserved.
- Made `e2e/demo-panel.spec.ts` use `DEMO_BASE_URL` for the Compose gateway.
- Added Larastan generic return annotations for all domain relationships and
  corrected two factory expressions exposed by the stricter analysis.

## Task 7 re-review remediation

### Root cause and change

The demo-panel tests share one seeded SQLite/application state while the
relationship flow performs attach/detach and navigation mutations. Running the
three tests fully parallel caused an intermittent timeout while opening the
seeded order record, even though the record was present. The suite now uses
Playwright's scoped `serial` describe mode. This is an explicit suite-level
isolation rule; it does not rely on an undocumented CLI `--workers=1` override,
weaken assertions, or skip tests.

### Verification

- `docker compose -f compose.dev.yaml up --build -d && DEMO_BASE_URL=http://127.0.0.1:4175 COMPOSE_E2E=1 npx playwright test e2e/demo-panel.spec.ts` — **passed**, 3/3, with the default suite configuration selecting one worker for the serial group.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/smoke.spec.ts --grep 'compose gateway'` — **passed**, 2/2.
- `docker compose -f compose.dev.yaml down` — **passed**; Compose services were stopped before the normal smoke run.
- `npx playwright test e2e/smoke.spec.ts` — **passed**, 6/6 with 3 expected Compose-only skips.
- `npx playwright test e2e/demo-panel.spec.ts` — **passed**, 3/3 with no CLI worker override.
- `composer test` from `demo/` — **passed**: Pint passed, PHPStan passed with 0 errors, PHPUnit passed with 60 tests and 503 assertions.

### Re-review self-review

- The relationship, nested-resource, attach/detach, associate/dissociate, and
  image visibility assertions are unchanged.
- Serial isolation is scoped only to `e2e/demo-panel.spec.ts`; other Playwright
  suites retain their existing parallel configuration.
- FTB-009A/B/010 remain complete because the default Compose demo E2E,
  normal smoke tests, Composer suite, and focused demo suite now pass.
- FTB-027/028 remain incomplete and were not modified.

### Fix verification

- `composer test` from `demo/` — **passed**: Pint passed, PHPStan passed with
  0 errors, PHPUnit passed with 60 tests and 503 assertions.
- `composer run lint:check` — **passed**.
- `composer run types:check` — **passed**, 0 errors.
- `php artisan test` — **passed**, 60 tests and 503 assertions.
- `php artisan migrate:fresh --seed --force && php artisan db:seed --force` —
  **passed**; migration and repeat seeding completed, and
  `php artisan route:list --path=demo/admin` listed 76 routes.
- `npx playwright test e2e/demo-panel.spec.ts e2e/smoke.spec.ts` — one
  parallel relationship-run timeout occurred during a concurrent normal run;
  the isolated acceptance runs below passed. No application failure was
  reproduced.
- `npx playwright test e2e/demo-panel.spec.ts --workers=1` — **passed**, 3/3.
- `npx playwright test e2e/smoke.spec.ts` — **passed**, 6/6 with 3 expected
  Compose-only skips.
- `docker compose -f compose.dev.yaml down && docker compose -f
  compose.dev.yaml up --build -d && DEMO_BASE_URL=http://127.0.0.1:4175
  COMPOSE_E2E=1 npx playwright test e2e/demo-panel.spec.ts` — **passed**, 3/3.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test
  e2e/smoke.spec.ts --grep 'compose gateway'` — **passed**, 2/2.
- `git diff --check` — **passed** after the final changes.
- Compose was stopped after verification with `docker compose -f
  compose.dev.yaml down`.

### Self-review

- The product image assertion remains a strict visibility assertion; only the
  asset routing and test base URL were corrected.
- Static analysis is green without ignores, baselines, casts, or widened
  types. Relationship annotations identify the related model and declaring
  model for every domain relation.
- FTB-027 and FTB-028 were not implemented or marked complete.
- The only changes are the Compose route, demo E2E base URL, domain/factory
  static contracts, and this report; unrelated worktree changes were not
  staged.

## Task 7 final stabilization

### Root cause and change

The serial relationship suite still performed a fresh login for every test,
which left the shared database-backed session vulnerable to session churn
between tests. The authenticated Playwright context is now scoped to the
worker, while each test receives a fresh page and navigates to the dashboard.
The public navigation test continues to use an unauthenticated page.

The relationship flow was also split into focused category, tag, customer,
and nested-order tests. This keeps each test's strict rendered-row assertions
focused while retaining serial ordering for the shared attach/detach state.

### Verification

- `DEMO_BASE_URL=http://127.0.0.1:4175 COMPOSE_E2E=1 npx playwright test
  e2e/demo-panel.spec.ts` — **passed**, 6/6.
- The same default Compose demo command was run five consecutive times —
  **passed**, 30/30 tests.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test
  e2e/smoke.spec.ts --grep 'compose gateway'` — **passed**, 2/2.
- `npx playwright test e2e/demo-panel.spec.ts e2e/smoke.spec.ts` — **passed**,
  12/12 executed tests, with 3 expected Compose-only skips after Compose was
  stopped.
- `composer test` from `demo/` — **passed**: Pint passed, PHPStan passed with
  0 errors, PHPUnit passed with 60 tests and 503 assertions.
- `php artisan test` from `demo/` — **passed**, 60 tests and 503 assertions.
- `git diff --check` — **passed**.
- Compose was stopped after verification with `docker compose -f
  compose.dev.yaml down`.

### Self-review

- No retries, sleeps, skipped tests, weakened assertions, or CLI worker
  overrides were added.
- Authentication is reused only within the demo-panel worker fixture; each
  authenticated test still receives a fresh page and strict assertions.
- The public navigation test remains independent of the authenticated fixture.
