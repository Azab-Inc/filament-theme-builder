# Task 7 report

## Status

Documentation integration is complete. FTB-009A, FTB-009B, and FTB-010 are
marked done based on the existing executable contracts. FTB-027 and FTB-028
remain `ready-for-agent` and are explicitly out of scope.

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

- Larastan currently fails on 47 relationship return-type generic annotations;
  this was present before Task 7 and no application code was changed to hide it.
- The Compose gateway variant exposes a hidden product image to the existing
  visibility assertion, although the normal browser run passes. The fixed-port
  assumptions in `demo-panel.spec.ts` and portions of `smoke.spec.ts` also make
  the full suites unsuitable for a single Compose gateway without environment
  or test-configuration work, which is outside this documentation-only task.
