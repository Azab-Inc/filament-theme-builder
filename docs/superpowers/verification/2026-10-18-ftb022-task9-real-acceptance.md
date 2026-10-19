# FTB-022 Task 9 real acceptance verification

## Result

**Task 9 live MCP/browser acceptance is verified for the covered journey.** The initial Compose invocation failed after initialize because private relay directory ownership was compared with `getmyuid()` (the mounted script owner UID 1000) instead of the process effective UID (root in the Compose container). `PrivateRelayDirectory` now fails closed if `posix_geteuid()` is unavailable and uses only `posix_geteuid()` for ownership. It does not substitute `getmyuid()`. The default path remains `/tmp/ftb-local-theme-relay`; canonical path, private mode, atomic writes, and locking protections are unchanged.

## MCP runtime and direct stdio attempt

- Installed package: `laravel/mcp` **v1.0.1** (Composer metadata in `demo-php`). Compose PHP reports POSIX available, effective UID `0`, and default path `/tmp/ftb-local-theme-relay`.
- The MCP initialize response reported protocol **2025-11-25** and server name `Filament Theme Builder Local` version `1.0.0`.
- Command/transport: application-owned `php artisan ftb:mcp`, served via `BoundedStdioTransport` over stdin/stdout. Local-only registration was enabled for the test invocation.
- Initial requested shorthand `docker compose exec -T demo-php php artisan ftb:mcp` cannot be resolved in this repository without specifying its compose file (`no configuration file provided`). Used `docker compose -f compose.dev.yaml exec -T ... demo-php php artisan ftb:mcp`.
- Actual attempted command was piped four real newline-delimited JSON-RPC messages: `initialize` (client protocol `2025-03-26`), `notifications/initialized`, `tools/list`, and `tools/call` (`local_theme_pair` with `pairing_id: unknown`). Invocation:

  ```sh
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"task9-acceptance","version":"1"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"local_theme_pair","arguments":{"pairing_id":"unknown"}}}' | docker compose -f compose.dev.yaml exec -T -e APP_ENV=local -e FTB_LOCAL_MCP_ENABLED=true demo-php php artisan ftb:mcp
  ```

- Initial result (before the effective-UID fix): exit **1**, initialize only on stdout and `ftb:mcp: stdio_server_error` on stderr. Container process effective UID was 0, mounted PHP script owner was UID 1000, while the default relay directory was root-owned and mode 0700.
- Post-fix direct exchange (same request sequence, no `FTB_LOCAL_RELAY_PATH` override):

  ```sh
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"task9-acceptance","version":"1"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"local_theme_pair","arguments":{"pairing_id":"unknown"}}}' | docker compose -f compose.dev.yaml exec -T -e APP_ENV=local -e FTB_LOCAL_MCP_ENABLED=true demo-php php artisan ftb:mcp
  ```

- Result: exit **0**; stdout contained three newline-delimited JSON-RPC responses and no diagnostics. Stderr was empty. Initialize negotiated server protocol `2025-11-25`; notification had no response. `tools/list` returned seven strict tools; unknown `local_theme_pair` call returned structured `{ "error": "pairing_required" }`.

### Direct exchange transcript (schema fields abbreviated only in the tools/list excerpt)

```text
-> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"task9-acceptance","version":"1"}}}
<- {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-11-25","serverInfo":{"name":"Filament Theme Builder Local","version":"1.0.0"},"capabilities":{"tools":{"listChanged":false},"resources":{"listChanged":false},"prompts":{"listChanged":false}}}}
-> {"jsonrpc":"2.0","method":"notifications/initialized"}
   (no response)
-> {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
<- {"jsonrpc":"2.0","id":2,"result":{"tools":["local_theme_pair","local_theme_list","local_theme_export","local_theme_import_preview","local_theme_import_status","local_theme_operation_status","local_theme_disconnect"]}}
-> {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"local_theme_pair","arguments":{"pairing_id":"unknown"}}}
<- {"jsonrpc":"2.0","id":3,"result":{"structuredContent":{"error":"pairing_required"},"isError":false}}
exit=0; stderr=""
```

All schemas use `additionalProperties:false`. `pair`/`list`/`disconnect` require `pairing_id` (string, max 120, `^[A-Za-z0-9_-]{1,120}$`); export additionally requires bounded `theme_id`; import preview requires `pairing_id`, `raw_json` (1–1,048,576 bytes), fixed `filename:"filament-theme.json"`, and `proposed_name` (1–120); both status tools require a 64-character lowercase-hex `operation_id`. No `confirmed`, `force`, `apply`, owner/process/session selector, or confirmation-token property is exposed.

## Compose Playwright

Command:

```sh
COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts e2e/ftb-022-relay-pairing.spec.ts e2e/ftb-022-versioned-theme-import-mcp.spec.ts
```

Result: **6 passed**, including a new persistent real-stdio + actual-browser/relay integration test.

- Pairing endpoint test confirmed the tab key is sent in `X-FTB-Tab-Key`, absent from the JSON body and response.
- Browser relay import canceled without local theme creation/opening; one new theme created only after explicit confirmation; stale revision rejected before authorization/apply and mutation.
- Browser local-file import checked preview isolation, cancel preserving collection and `localStorage`, malformed JSON preserving collection and `localStorage`, then successful explicit confirmation.
- `real ftb:mcp import previews, cancels, rejects stale state, confirms once, and revokes` launches the persistent `docker compose exec -T demo-php php artisan ftb:mcp` process. It pairs through the actual Compose builder and Laravel relay endpoints (no mocked/routed relay responses), approves in the UI, then imports the bounded 51-byte V1 fixture.
- The live journey asserts invalid JSON is rejected with no collection or `localStorage` mutation; cancel rejects without mutation; stale revision is rejected before apply; explicit confirmation creates exactly one theme; repeat import status returns the same record ID; browser list operation returns its result once and omits it on the second status read; reload preserves the single imported theme; browser disconnect causes a subsequent MCP list call to return `pairing_required`.
- The test submits no confirmation/bypass fields and only the browser confirm button invokes apply. The separate pairing Playwright test verifies the tab key is header-only and absent from the request body/response.
- Browser live E2E does not exercise a >1 MiB MCP payload or CSS-bearing V4 document. Existing Laravel feature tests cover oversized MCP input, CSS rejection through the authenticated relay result route, strict schema/bypass denial, and process isolation. The full suite also runs `LocalThemeMcpProcessScopeTest`, which proves two distinct `ftb:mcp` subprocesses cannot use another process's approved pair/operation.

## Tests, types, build, and static analysis

- `docker compose -f compose.dev.yaml exec -T demo-php php artisan test --filter='RelayStoreTest|ServeLocalThemeMcpTest'` — **14 passed, 48 assertions**. No-POSIX behavior is exercised in a subprocess with `disable_functions=posix_geteuid`; default path and supported-runtime POSIX availability are asserted.
- `docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test` — **256 passed, 2,189 assertions**, including two-process process-scope isolation, stdio, schema, relay, oversized/CSS, and confirmation bypass coverage.
- `npm run test:unit -- --run && npm run type-check && npm run build` from `builder/` — **98 files / 440 tests passed; type-check passed; production build passed**.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts e2e/ftb-022-relay-pairing.spec.ts e2e/ftb-022-versioned-theme-import-mcp.spec.ts` — **6 passed** against the live Compose stack.
- Compose builder-vite full suite was also attempted earlier, but that service mount lacks the sibling `demo/` and root `e2e/` files used by cross-repository tests (9 `ENOENT` failures); the complete builder suite passes from the host workspace as reported above.
- `docker compose -f compose.dev.yaml exec -T demo-php composer lint:check` — **passed, 406 PHP files**.
- `docker compose -f compose.dev.yaml exec -T demo-php php -d memory_limit=512M vendor/bin/phpstan analyse --no-progress` — **passed, 0 errors**.

## Scope and caveats

The PHP production change is limited to failing closed when the effective-UID API is unavailable. Tests additionally cover default path preservation and a supported-runtime POSIX requirement. The E2E helper uses bounded JSON-RPC frames and bounded stderr, records no raw import payload or tab key, and the integration test uses the real browser UI plus server relay routes. No browser/MCP transport, route, or authorization interface was changed. Existing unrelated worktree edits were preserved.

## 2026-10-19 repeat verification

These are fresh reruns after the runtime-identity change. The exact combined filter that had been implicated in an earlier report passed:

```sh
docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test --filter='LocalThemeMcpProcessScopeTest|ServeLocalThemeMcpTest'
```

Result: **5 passed, 61 assertions**. This covers the separate-process ownership boundary, command registration gating, stderr-only malformed-input diagnostics, and actual subprocess initialize/list/call.

Focused Task 9 Laravel suite:

```sh
docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test tests/Unit/Mcp tests/Feature/Mcp
```

Result: **96 passed, 584 assertions**.

Other fresh results:

- `npm run test:unit -- --run && npm run type-check && npm run build` from `builder/` — **98 files / 440 tests passed; type-check and production build passed**.
- Compose Playwright command above — final rerun **6 passed**; the live MCP/browser relay journey passed.
- `docker compose -f compose.dev.yaml exec -T demo-php composer lint:check` — **406 PHP files passed**.
- `docker compose -f compose.dev.yaml exec -T demo-php php -d memory_limit=512M vendor/bin/phpstan analyse --no-progress` — **0 errors**.
- Repeated direct newline JSON-RPC `initialize`, `notifications/initialized`, `tools/list`, and unknown `local_theme_pair` call — **exit 0**, three JSON stdout lines, empty stderr, protocol `2025-11-25`, seven strict schemas, unknown-pair denial `{ "error": "pairing_required" }`.

One initial full Playwright rerun had a transient failure in the browser-relay confirmation test: the page snapshot contained only the Vue DevTools toggle, so the pairing button never appeared. The same test passed when rerun alone, and the complete six-test Compose Playwright command then passed. The cause of that one blank-app observation was not established; no source change was made for it.

A prior run was also reported to have encountered a transient HTTP **403** during relay acceptance. No 403 appeared in the outputs of these reruns; the combined and focused Laravel suites are not a reproduction of every browser request. Its exact request/endpoint and root cause were not established, so this evidence does not claim the earlier 403 was fixed or that a 403 is impossible.
