# FTB-058 completion evidence — 2026-11-03

Issue: [#58](https://github.com/Azab-Inc/filament-theme-builder/issues/58).
Draft PR: [#62](https://github.com/Azab-Inc/filament-theme-builder/pull/62), targeting `dev`.
Implementation commits: `8239f07`, `6402dba`.

## Verified scope

- Generic table header/body/row and bounded physical-column targets, explicit parent-surface selection, chart/container surfaces, and exact child targeting.
- Named colors and generated custom palettes, bounded references, validation, schema-7 migration from legacy themes, persistence, live preview, and canonical JSON/CSS export.
- Per-value light/dark links for semantic/raw/foundation/palette/token contexts, active-mode replacement confirmation, unlinking, linked edits, reset, undo/redo, and independent modes.
- Purpose-built `local_theme_token_operation` MCP discovery, read/export, token CRUD, edits, reset, link/unlink. Intents execute the same browser domain actions and canonical validation as the UI. PHP forwards bounded intents rather than implementing a second theme validator.
- Pairing/session/process authorization, browser confirmation, original-intent and preview-candidate digests, revision-bound apply grants, apply-time revalidation, and acknowledgement retry idempotence.

This follow-up does not complete the broader FTB-007/008/022/052 tickets.

## Environment and reconstruction

Isolated worktree: `/home/swagoverlord/repos/filament-theme-builder-ftb-058`.
Branch: `feature/complete-inspector-scopes-named-colors-and-mode-links`.
Base: fetched `origin/dev`, `bde1807`. Final tested source is committed as `6402dba`; subsequent changes are completion documentation and screenshots only.

The original dirty checkout was read-only input. The prior exact feature artifact was reconstructed into the isolated branch, preserving the committed FTB-060 fixes. Tests were rerun against this branch; the old dirty-worktree results are historical, not substituted for final evidence.

The canonical Compose stack runs as the separate project `ftb058` on port `4188`. The original port-4175 stack was preserved. To avoid rebuilding already installed runtime dependencies, an external Compose override selected the existing local images:

```yaml
services:
  bootstrap:
    image: filament-theme-builder-bootstrap:latest
  demo-php:
    image: filament-theme-builder-demo-php:latest
```

Provisioning (repository root, exit 0, all services healthy):

```sh
GATEWAY_PORT=4188 docker compose -p ftb058 -f compose.dev.yaml -f /tmp/opencode/ftb058-compose.yaml up -d --no-build --wait --wait-timeout 600
docker exec ftb058-demo-php-1 php artisan db:seed --force
```

No third-party dependency or service was added. Existing lockfile dependencies were installed by the standard bootstrap/node entrypoints and root `npm ci`.

## RED → GREEN and diagnosis

- Initial intent regression test failed because the shared intent module did not exist; it passed after browser-domain routing was implemented.
- Review reproduced action/target mismatches and invalid palette shades being silently treated as base updates. Strict action/target/field validation now rejects these inputs without mutation; regression tests pass.
- Browser relay tests cover forged byte lengths/digests, candidate digest mismatch, stale revision, authorization failure, and lost acknowledgement retries without duplicate application.
- The first broad builder attempt emitted excessive Vue warnings from undeclared attributes passed to the fragment-root color popover and produced no completion summary. Removing those stale attributes restored a completed run. This attempt is not counted as a pass.
- The next completed broad run reported 619 passed/4 failed. The remaining contracts were repaired: explicit native replacement tests, new provenance export expectation, and a focused intent-application composable keeping the Pinia façade under 100 lines. Final full run passes below.
- PHP's initial full run reported 265 passed/4 failed: three inventory/tool-registration contracts needed updating, and the default-disabled test inherited Compose's enabled runtime flag. Tests run with the documented testing environment below; no authentication bypass or test skip was introduced.
- The first combined browser run reported 11 passed/12 failed. Stale prototype URLs, hardcoded port 4175, toolbar menus, and child/parent picking fixtures were corrected. Parent tests now explicitly choose parent surfaces; exact child selection remains intact. Final affected browser run passes all 19 tests.

## Final verification

All commands below exited 0. Root commands run from the isolated worktree. The one-shot Node container mounts the full workspace and both dependency volumes so sibling-source/Filament CSS parity checks use the actual project layout.

### Full builder suite — 625 tests / 135 files, 292.10 seconds

```sh
docker run --rm -v /home/swagoverlord/repos/filament-theme-builder-ftb-058:/workspace -v ftb058_builder_node_modules:/workspace/builder/node_modules -v ftb058_demo_node_modules:/workspace/demo/node_modules -w /workspace/builder node:24-alpine npm run test:unit -- --run --testTimeout=20000
```

### Builder type-check and production build — passed, 252 modules

```sh
docker exec -w /app ftb058-builder-vite-1 npm run type-check
docker exec -w /app ftb058-builder-vite-1 npm run build
```

### Full PHP suite — 269 tests / 2,330 assertions, 104.90 seconds

```sh
docker exec -e APP_URL=http://localhost:8000 -e FTB_PREVIEW_ALLOWED_ORIGINS=http://localhost:8000 -e FTB_LOCAL_MCP_ENABLED=false ftb058-demo-php-1 php artisan test --compact
```

The complete suite includes origin/session/process isolation, confirmation, replay/concurrency, preview bridge, migration envelopes, inventory, and stdio registration. Later PHP edits were formatting and environment-value typing only; the invalidated seams were rerun (14 tests / 612 assertions).

### Formatting, static analysis and root contracts — passed

```sh
docker exec ftb058-demo-php-1 vendor/bin/pint --test
docker exec ftb058-demo-php-1 vendor/bin/phpstan analyse --no-progress
node --test scripts/setup.test.mjs scripts/compose-bootstrap.test.mjs scripts/demo-first-roadmap.test.mjs
git diff --check
```

Pint: 410 files pass. PHPStan: no errors. Root contracts: 18 tests pass.

### Affected Compose integration — 19 tests, 2.2 minutes

```sh
COMPOSE_PROJECT_NAME=ftb058 GATEWAY_PORT=4188 COMPOSE_BASE_URL=http://127.0.0.1:4188 COMPOSE_E2E=1 npx playwright test e2e/ftb-007-bridge.spec.ts e2e/ftb-007-inspector.spec.ts e2e/ftb-008-raw-inspector.spec.ts e2e/ftb-022-versioned-theme-import-mcp.spec.ts
```

This includes genuine pointer/keyboard Inspector interaction, origin/source/version rejection, exact picking and parent selection, live raw edits, CSS download/copy, exported CSS applied to a clean Filament fixture, and the existing real stdio MCP import/confirmation/revoke journey.

### Feature browser acceptance — 3 tests pass

```sh
COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4188 npx playwright test e2e/inspector-tokens-mode-links.spec.ts
```

These prove generic column header/body styling without field-specific selectors, chart parent targeting, named-token reuse/live updates/reload, and raw active-dark linking/unlinking.

### Actual MCP-client/browser journey — 1 test pass, 3.0 minutes

```sh
COMPOSE_PROJECT_NAME=ftb058 GATEWAY_PORT=4188 COMPOSE_BASE_URL=http://127.0.0.1:4188 COMPOSE_E2E=1 npx playwright test e2e/ftb-058-token-operation-mcp.spec.ts
```

The real JSON-RPC client starts `php artisan ftb:mcp` over Docker stdio, initializes, discovers tools, pairs with browser consent, creates a named color/custom palette, assigns references, edits non-color values and positional columns, links/unlinks/resets, reads through canonical export, tests cancel/stale rejection, verifies saved reload, and revokes access. No mocked relay routes are used in this journey.

## Visual evidence

Both captures use viewport `2000×1100`, light mode, the same seeded dashboard/data, top scroll, and closed Tools menu. The comparison is before/after the confirmed MCP edits in the same live application, not a synthetic image or a claim of a pre-feature code screenshot. Pairing identifiers are not shown.

- [Before confirmed edits](./mcp-before.png)
- [After named-token/sidebar/padding/column edits](./mcp-after.png)

## Independent review

Reviewer session `ses_e5ea84062ffe3sZcjZGBRYUUwa`: final bounded review **PASS**. The prior MCP contract and shared-validation blockers were resolved by canonical browser execution. The final malformed-target/shade findings were fixed with RED/GREEN regressions. No outstanding blocker remains.

The PR remains draft for the owner's review. Nothing was merged or deployed.
