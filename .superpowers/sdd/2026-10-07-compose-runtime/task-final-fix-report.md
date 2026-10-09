# Final Compose runtime review fix report

## Review findings addressed

### Important

1. **Whitespace-only APP_KEY injection**
   - Bootstrap now unsets blank injected values before Laravel commands run.
   - Valid injected keys are persisted into `.env` so the dev PHP sibling service, which reads the shared application files, receives the same key.
   - The production `/runtime/APP_KEY` handoff only writes a valid key from the injection or `.env`; it never writes a whitespace-only value.
   - The production entrypoint ignores whitespace-only environment values and restores a nonblank persisted runtime key.
   - Behavioral coverage executes the real shell scripts and verifies generated-key handoff, persisted injected keys, and production entrypoint restoration.

2. **Production host binding**
   - The default production publication is now `0.0.0.0:9080`.
   - `GATEWAY_HOST` and `GATEWAY_PORT` remain configurable.
   - README examples and binding descriptions now match the Compose configuration.

### Minor

3. **Bootstrap failure propagation**
   - The test harness now makes the migration stub fail and verifies the real bootstrap process exits non-zero, in addition to retaining the `set -eu` contract assertion.

4. **Maintenance cleanup safety**
   - Share cleanup catches invalid/unreadable SQLite inspection failures and reports a successful no-op.
   - Upload cleanup continues to no-op for invalid/non-directory paths.
   - Focused Laravel feature tests cover both cases.

5. **Production compiled asset coverage**
   - Production Playwright now parses the rendered builder HTML, requires a generated hashed `/assets/` JavaScript or CSS reference, and fetches that exact referenced asset successfully.

6. **README prerequisites**
   - Compose workflows explicitly require Docker/Compose only.
   - Node, PHP, Composer, and host-shell requirements are scoped to the legacy npm/Sail workflow.

## TDD evidence

- Red: new host-binding, runtime-handoff, invalid-SQLite, and asset assertions failed against the pre-fix implementation.
- Red: the new bootstrap injected-key persistence assertion failed before persistence was implemented.
- Red: the real bootstrap failure harness exercised a failing migration command and observed non-zero propagation.
- Green: focused Node and Laravel suites passed after the fixes.

## Verification

- `docker compose -f compose.dev.yaml config --quiet` — passed.
- `docker compose -f compose.prod.yaml config --quiet` — passed.
- Default production config resolved `host_ip=0.0.0.0`, `published=9080`.
- Configurability check with `GATEWAY_HOST=127.0.0.1 GATEWAY_PORT=9191` resolved `127.0.0.1:9191`.
- Dev Compose stack rebuilt and ran with `APP_KEY='   '`.
- Dev gateway Playwright: 2 passed, 1 production-only skipped.
- Production Compose stack rebuilt and ran.
- Production gateway Playwright: 3 passed, including rendered builder asset fetch.
- `npm test` — passed: root Node tests 11/11, builder Vitest 1/1, Vue type-check, Pint, PHPStan, PHPUnit 11 tests / 30 assertions.
- `composer run test` in `demo/` — passed: Pint, PHPStan, PHPUnit 11 tests / 30 assertions.
- `npm run e2e` — passed: legacy builder and Filament tests 2/2; Compose tests skipped as expected without `COMPOSE_E2E=1`.
- Shell syntax and `git diff --check` — passed.

## Scope

- No packages or services were added.
- Existing routes, service names, Compose workflows, and legacy npm/Sail workflow were preserved.
- Pre-existing unrelated worktree changes were not staged.

## Concerns

- Docker emitted orphan-container warnings while switching between the dev and production Compose projects; the requested gateway checks still passed. The stacks should be stopped with their respective Compose files after verification.
- Existing frontend audit notices and optional Fontaine warning remain outside this fix wave; no dependency changes were made.
