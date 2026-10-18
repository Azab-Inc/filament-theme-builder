# FTB022 Task 7: local theme MCP tools evidence

## Registered MCP contract

- `docker compose -f compose.dev.yaml exec -T demo-php composer show laravel/mcp --format=json` reports `laravel/mcp` **v1.0.1**. Tools subclass installed `Laravel\Mcp\Server\Tool`; registration is only on the direct `LocalThemeServer`.
- Exact tools: `local_theme_pair`, `local_theme_list`, `local_theme_export`, `local_theme_import_preview`, `local_theme_import_status`, `local_theme_operation_status`, `local_theme_disconnect`.
- The serialized `tools/list` schemas require exact known fields and `additionalProperties:false`. They expose no process, owner, session, `confirmed`, `force`, `apply`, or confirmation-token arguments. The import document is capped at 1 MiB and fixed to `filament-theme.json`.
- Pairing remains pending until browser approval; only the `ProcessScope` created by `ftb:mcp` is used for binding. Async list/export/import are authorized through the bound relay pair. Import status is the import-only alias; common status serves all operation kinds. Export results are consumed once by the owning live MCP process.

## Security and behavior coverage

- `LocalThemeMcpProcessScopeTest` uses two separate `php artisan ftb:mcp` subprocesses over the same private relay store. The test's browser relay helper creates and approves the pairing before subprocess A starts; A's command-created `ProcessScope` binds the pair and successfully lists themes. Separately launched subprocess B is denied pair/list/operation-status calls against A's pair with only `pairing_required`, then binds its own separately approved pair and lists successfully. The test asserts B's recorded process ID differs from A's and that B did not add an operation to A's pair. This does not claim subprocess A remains alive during browser approval. `LocalThemeToolSessionIsolationTest` separately verifies denial when a pairing is rebound to a different browser session.
- Actual import-preview calls cover bounded raw payload, `confirmed`/`force`/`apply`/skip/token bypass arguments, pending state, and absence of raw payload/secrets from tool responses and captured log levels.
- Browser preview digest mismatch leaves the operation pending; stale grant revision and replayed grant consumption are rejected; replaying an import result with a different record ID is denied.
- `LocalThemeToolImportRelayTest` submits CSS-bearing bytes through the MCP preview tool, reads them through the authenticated relay payload endpoint, and sends the browser's `invalid_theme` result through the authenticated `/operations/{id}/result` endpoint. It verifies rejected status, payload cleanup, no `recordId`, and the import-only/common MCP status responses. This is a relay-contract integration test, not a browser UI or Pinia apply end-to-end test (that remains Task 8).
- Builder migration test `theme-import-service.spec.ts` confirms nonempty custom CSS is rejected as `nonempty_custom_css_rejected`.

## Verification

- Focused review tests: **17 passed, 233 assertions**, including the subprocess and relay-route integrations.
- Focused command: `docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test --filter='LocalThemeToolsTest|LocalThemeMcpProcessScopeTest|LocalThemeToolSessionIsolationTest|LocalThemeToolImportBoundaryTest|LocalThemeToolImportRelayTest|LocalThemeToolImportGrantTest|LocalThemeToolImportReplayTest|LocalThemeToolImportSecurityTest|LocalThemeToolSchemaTest|ServeLocalThemeMcpTest'`.
- Full Laravel suite: **252 passed, 2,184 assertions**. Compose requires `FTB_LOCAL_MCP_ENABLED=false` and `APP_URL=http://localhost:8000` for relay tests' default-disabled and localhost-origin assumptions.
- Full suite command: `docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test`.
- Pint: `composer lint:check` — **passed, all 403 PHP files**.
- PHPStan: `php -d memory_limit=512M vendor/bin/phpstan analyse` — **passed, 0 errors**. The Compose default 128 MiB PHP memory limit is insufficient.
- CSS migration coverage: `docker compose -f compose.dev.yaml exec -T builder-vite npm run test:unit -- --run src/__tests__/theme-import-service.spec.ts` — **9 passed**.
- Stdio smoke: `ServeLocalThemeMcpTest::test_command_serves_registered_tools_and_call_over_clean_stdio` performs `initialize`, `tools/list`, and `tools/call`; it asserts the exact seven names/schemas, generic unknown-pair response, clean stdout/stderr, and normal command exit.
- A direct Compose `demo-php` stdio exchange also performed `initialize`, `tools/list`, and `tools/call` against `ftb:mcp`; it returned seven exact tool names, strict schemas, the generic pairing denial, exit code 0, and empty stderr.
- Direct exchange transcript: `initialize` (id 1) → complete; `notifications/initialized` → no response; `tools/list` (id 2) → the seven names above; `tools/call` (id 3, `local_theme_pair`, `{ "pairing_id": "unknown" }`) → `{ "error": "pairing_required" }` in structured content. Process exit 0; stderr empty.
