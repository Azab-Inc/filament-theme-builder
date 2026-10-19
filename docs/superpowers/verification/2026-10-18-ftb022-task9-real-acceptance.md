# FTB-022 Task 9 real acceptance verification

## Result

**Task 9 live MCP stdio acceptance is now verified.** The initial Compose invocation failed after initialize because private relay directory ownership was compared with `getmyuid()` (the owner of the mounted PHP script, UID 1000) instead of the process effective UID (root in the Compose container). Relay storage is now validated against `posix_geteuid()`, with `getmyuid()` used only when the POSIX function is unavailable. Repository/root/descendant rejection, 0700 permissions, atomic writes, and lock behavior remain unchanged.

## MCP runtime and direct stdio attempt

- Installed package: `laravel/mcp` **v1.0.1** (Composer metadata in `demo-php`).
- The MCP initialize response reported protocol **2025-11-25** and server name `Filament Theme Builder Local` version `1.0.0`.
- Command/transport: application-owned `php artisan ftb:mcp`, served via `BoundedStdioTransport` over stdin/stdout. Local-only registration was enabled for the test invocation.
- Initial requested shorthand `docker compose exec -T demo-php php artisan ftb:mcp` cannot be resolved in this repository without specifying its compose file (`no configuration file provided`). Used `docker compose -f compose.dev.yaml exec -T ... demo-php php artisan ftb:mcp`.
- Actual attempted command was piped four real newline-delimited JSON-RPC messages: `initialize` (client protocol `2025-03-26`), `notifications/initialized`, `tools/list`, and `tools/call` (`local_theme_pair` with `pairing_id: unknown`). Invocation:

  ```sh
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"task9-acceptance","version":"1"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"local_theme_pair","arguments":{"pairing_id":"unknown"}}}' | docker compose -f compose.dev.yaml exec -T -e APP_ENV=local -e FTB_LOCAL_MCP_ENABLED=true demo-php php artisan ftb:mcp
  ```

- Initial result (before fix): exit **1**, only initialize response on stdout and `ftb:mcp: stdio_server_error` on stderr. Root cause was confirmed: container process effective UID is 0, while `getmyuid()` in the mounted application reports script owner UID 1000; the default `/tmp/ftb-local-theme-relay` is root-owned and mode 0700.
- Post-fix exact command (same request sequence, with no `FTB_LOCAL_RELAY_PATH` override):

  ```sh
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"task9-acceptance","version":"1"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"local_theme_pair","arguments":{"pairing_id":"unknown"}}}' | docker compose -f compose.dev.yaml exec -T -e APP_ENV=local -e FTB_LOCAL_MCP_ENABLED=true demo-php php artisan ftb:mcp
  ```

- Result: exit **0**; stdout emitted initialize (id 1), `tools/list` (id 2, seven tools with strict schemas), and `local_theme_pair` call (id 3) returning `{"error":"pairing_required"}`. Stderr was empty. The server protocol response was `2025-11-25`.
- Exact schemas are verified by this live exchange, including the seven tool names, strict input schemas, and unknown-pair denial.

## Compose Playwright

Command:

```sh
COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts e2e/ftb-022-relay-pairing.spec.ts e2e/ftb-022-versioned-theme-import-mcp.spec.ts
```

Result: **5 passed**.

- Pairing endpoint test confirmed the tab key is sent in `X-FTB-Tab-Key`, absent from the JSON body and response.
- Browser relay import canceled without local theme creation/opening; one new theme created only after explicit confirmation; stale revision rejected before authorization/apply and mutation.
- Browser local-file import checked preview isolation, cancel preserving collection and `localStorage`, malformed JSON preserving collection and `localStorage`, then successful explicit confirmation.
- These tests use routed relay responses rather than a live MCP process. The browser/MCP relay journey was **not** demonstrated.
- Disconnect/revoke, relay malformed/oversized/CSS rejection, and a direct no-apply-bypass browser/MCP journey were **not** covered by these Playwright files. Related security/schema behavior has unit/feature-test evidence in Task 7 and the regression suite; this report does not characterize those as browser acceptance.

## Tests, types, build, and static analysis

- `docker compose -f compose.dev.yaml exec -T demo-php php artisan test --filter=ServeLocalThemeMcpTest` — **4 passed, 31 assertions**, including command gating, stderr-only malformed diagnostics, and test-process initialize/list/call.
- `docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test` — **253 passed, 2,185 assertions** after aligning subprocess relay fixtures with effective runtime identity.
- Builder suite in Compose (`docker compose ... exec -T builder-vite npm run test:unit -- --run`) — **not viable in that service container**: 9 failures all from files absent in its mounted `/app` (demo preview bridge, demo Tailwind theme, and root e2e evidence); 431 tests passed. This is container layout failure, not test assertion failure.
- Host workspace `npm run test:unit -- --run` from `builder/` — **98 files, 440 tests passed**.
- Host `npm run type-check` from `builder/` — **passed**.
- Host `npm run build` from `builder/` — **passed**, including type-check.
- `docker compose -f compose.dev.yaml exec -T demo-php composer lint:check` — **passed, 406 files**.
- `docker compose -f compose.dev.yaml exec -T demo-php php -d memory_limit=512M vendor/bin/phpstan analyse --no-progress` — **passed, 0 errors**.

## Scope and caveats

The code change is limited to effective-user ownership validation, and the stdio subprocess test now creates its relay directory with the process effective UID (rather than the mounted test-script owner). The unrelated worktree changes present before the fix were preserved. This report verifies the requested live initialize/list/call sequence; the browser route-proxy and coverage caveats above remain unchanged.
