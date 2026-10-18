# FTB022 Task 4 — Bounded stdio verification

Implemented the application-owned `ftb:mcp` command with the installed Laravel MCP `Transport` interface and a direct `LocalThemeServer`. The server has an empty tool registry. A per-process `ProcessScope` is stored in the application container before server construction.

The transport reads newline-delimited JSON-RPC with the approved `6,291,456 + 65,536` byte line and response limits. Each requested input chunk is capped at the remaining message budget plus one byte; line length is checked before input is appended to the frame buffer. Reads use nonblocking mode for every stream type and a per-message 30-second deadline, without stream-type checks. UTF-8/JSON/object validation is centralized at `StdioJsonRpcFrame`; malformed, oversized, timed-out, and truncated input fails with safe categories. Responses are size-checked including the newline before frame materialization, then written in bounded partial-write chunks with a deadline. Protocol output is newline-delimited on stdout; unexpected failures emit only a generic diagnostic on stderr.

`ftb:mcp` is available only when `FTB_LOCAL_MCP_ENABLED=true` and `APP_ENV` is `local` or `testing`. Laravel discovers `app/Console/Commands` unconditionally, so the gated command class is under `app/Mcp/Commands` and is explicitly registered by `AppServiceProvider` only when both conditions hold.

Hardening tests cover actual `MAX_LINE_BYTES + 1`, one-chunk overflow without frame-buffer overrun, delayed custom-stream timeout, UTF-8/message errors, truncated EOF, response boundary including newline, and forced partial writes. The real subprocess test sends `initialize`, `notifications/initialized`, and `tools/list`; it verifies exactly two valid JSON-RPC response lines, empty tools, clean stdout/stderr separation, and clean EOF exit. A malformed-input subprocess check verifies that its generic diagnostic is stderr-only. Disabled and production registration are also tested.

Verification: focused MCP tests passed (16 tests, 34 assertions); full `php artisan test` passed (185 tests, 1,683 assertions); focused Pint check passed; `vendor/bin/phpstan analyse --no-progress` passed (0 errors). Compose invocation `docker compose -f compose.dev.yaml exec -T -e APP_ENV=local -e FTB_LOCAL_MCP_ENABLED=true demo-php php artisan ftb:mcp` returned valid initialize and empty tools/list responses; an initialized notification produced no response line.

No dependencies were added. Browser pairing, relay routes, and MCP tools remain out of scope.
