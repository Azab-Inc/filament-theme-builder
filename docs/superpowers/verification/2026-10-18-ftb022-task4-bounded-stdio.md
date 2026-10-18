# FTB022 Task 4 — Bounded stdio verification

Implemented the application-owned `ftb:mcp` command with the installed Laravel MCP `Transport` interface and a direct `LocalThemeServer`. The server has an empty tool registry. A per-process `ProcessScope` is stored in the application container before server construction.

The transport reads newline-delimited JSON-RPC in bounded 8 KiB chunks, with the approved `6,291,456 + 65,536` byte line and response limits, a 30-second per-message read deadline, strict UTF-8/JSON validation, truncated-EOF detection, partial-write handling, and clean EOF shutdown. Protocol output is newline-delimited on stdout; unexpected failures emit only a generic diagnostic on stderr.

`ftb:mcp` is available only when `FTB_LOCAL_MCP_ENABLED=true` and `APP_ENV` is `local` or `testing`. Laravel discovers `app/Console/Commands` unconditionally, so the gated command class is under `app/Mcp/Commands` and is explicitly registered by `AppServiceProvider` only when both conditions hold.

Verification: `php artisan test --filter='BoundedStdioTransportTest|ServeLocalThemeMcpTest'` (10 tests, 20 assertions); focused Pint check; `vendor/bin/phpstan analyse --no-progress` (0 errors). Feature coverage launches a real `php artisan ftb:mcp` subprocess, initializes the MCP server, lists empty tools, checks stdout/stderr separation and EOF exit, and confirms disabled/production registration is absent.

No dependencies were added. Browser pairing, relay routes, and MCP tools remain out of scope.
