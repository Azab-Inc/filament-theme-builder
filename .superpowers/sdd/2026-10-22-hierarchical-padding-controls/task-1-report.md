# FTB054 Task 1 report

## Scope and boundary

Implemented only the registry evidence/target contract, parsed-catalog validation,
runtime evidence checks, and Compose packaging boundary. No UI, schema/V5 state,
MCP feature, resolver, projection, or bridge behavior was added.

Before abstraction, the repeated concern was target metadata being declared in
multiple registry families while selector/evidence/unit/variant/state validation
must remain identical. The boundary is one neutral JSON catalog validated once,
then attached to existing `RegistryEntry.paddingTargets`; it is not a second
registry. Unsupported rows remain metadata with no active selectors and cannot
produce controls.

## Findings and decisions

- The production Compose file uses the repository-root `Dockerfile`; the brief's
  `demo/Dockerfile` path does not exist. Production packaging therefore uses a
  single `COPY builder/src/registry/filament-padding-targets.json ...` in the
  canonical root Dockerfile.
- Development mounts that same file read-only only into `demo-php`.
- The PHP resource path is a repository symlink to the canonical builder catalog,
  so host feature tests and the runtime packaging contract do not create a second
  catalog payload.
- Catalog compatibility is `5.9.0`; target counts are dated evidence, not runtime
  totals. Table evidence targets the first TD containing `.fi-ta-text` or
  `.fi-ta-image`; generic `.fi-ta-cell` padding is excluded.
- Hover and focus-visible button padding remains explicitly unmapped because the
  nonmutating runtime check did not establish supported pseudo-state mappings.

## Red/green evidence

1. RED: focused Vitest initially failed because
   `padding-registry-validation` and padding metadata did not exist; the existing
   validation test also failed because duplicate padding identities were not yet
   enforced.
2. GREEN: focused registry/catalog tests passed after the model, catalog,
   attachment, freeze, and validation implementation: 13 tests passed.
3. GREEN: catalog parity tests passed: 5 tests passed.
4. The first Playwright attempt correctly exposed an unauthenticated setup
   mistake. After adding the existing login wait and URL assertion, the real
   Compose evidence test passed: 1 test passed.

## Verification

- `npm run test:unit -- --run --maxWorkers=2` — 119 files, 497 tests passed.
- `npm run type-check` — passed.
- `npm run build` — passed.
- `composer test` — Pint passed, PHPStan passed, 258 tests / 2,255 assertions passed.
- `COMPOSE_E2E=1 npx playwright test e2e/ftb-054-padding-evidence.spec.ts` — 1 passed.
- `php artisan test --filter=PreviewPaddingCatalogTest` — 1 test / 4 assertions passed.
- `docker compose -f compose.dev.yaml config` and production config — passed.
- `git diff --check` — passed.

## Intended changed files

`Dockerfile`, `compose.dev.yaml`, the requested registry/model/validation files,
the neutral catalog, registry/catalog/parity tests, the PHP packaging test, the
nonmutating Playwright evidence test, and this report. Existing dirty
`.gitignore`, `builder/AGENTS.md`, `builder/src/App.vue`,
`demo/tests/Feature/FilamentPanelTest.php`, Studio files, and unrelated plans
were not staged.

## Commit

Feature: add verified padding target registry
