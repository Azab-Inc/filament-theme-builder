# FTB-022 versioned theme import and local MCP verification

## Contract and scope

FTB-022 implements canonical versioned JSON import/export and local browser MCP parity. Imports accept schema versions 1–4, migrate sequentially to V4, reject nonempty custom CSS and future/invalid formats, and create a fresh browser-local theme only after explicit confirmation. Existing theme records/history remain unchanged. The local relay is not hosted MCP, account authentication, or an FTB-048 package; it is disabled by default and in production.

The approved implementation plan is `docs/superpowers/plans/2026-10-18-versioned-theme-import-mcp.md`; the contract is `docs/superpowers/specs/2026-10-17-versioned-theme-import-mcp-design.md`. Task-specific test and runtime evidence is also recorded in `docs/superpowers/verification/2026-10-18-ftb022-task2-crash-safe-import.md` through `...task9-real-acceptance.md`.

## Implementation contract evidence

- Import limit is 1,048,576 UTF-8 bytes before browser decode/parse and independently before relay forwarding. Pure migration edges are V1→V2→V3→V4. Canonical V4 export parity and invalid state/custom CSS rejection are covered by focused Vitest tests.
- `importFreshLocalTheme` flushes pending active state, writes a prepared `ftb-theme-import:<operationId>` marker, verifies imported state/history/index/active publication, and completes the marker only after verified publication. Deterministic record IDs, digests, history fingerprints, retry and interrupted-write rollback/recovery are covered by failure-injection tests.
- UI preview is isolated; name editing, cancel, validation, and explicit confirmation use the Pinia fresh-theme boundary. Browser relay confirmation revalidates binding, operation, digest, revision, grant, and import state. A repeat/retried acknowledgement returns the same record rather than creating another.
- `php artisan ftb:mcp` constructs `LocalThemeServer` directly with `BoundedStdioTransport`, implementing `Laravel\Mcp\Server\Contracts\Transport` (MCP 1.0.1). Stdio line and response limit is `6,291,456 + 65,536` bytes, before frame buffering/writing; deadline, partial chunks/writes, UTF-8, EOF and notification behavior are tested.
- Direct `tools/list` returns exactly seven schemas: `local_theme_pair`, `local_theme_list`, `local_theme_export`, `local_theme_import_preview`, `local_theme_import_status`, `local_theme_operation_status`, `local_theme_disconnect`. Schemas reject unknown fields; there is no tool apply/force/confirmed/owner/process/session bypass. Status values are `pending|approved|rejected|expired|disconnected`.
- Relay registration requires `FTB_LOCAL_MCP_ENABLED=true` and local/testing environment. Temp records are contained in an owned `0700` child of sticky `/tmp`, protected by global/session and per-record locks and atomic writes. Runtime directory owner is checked against effective UID; unavailable identity support fails closed.
- Browser routes are registered under `/local-theme/relay/*`; `ValidateLocalThemeRelay` checks enabled/environment, exact Host and configured Origin (or same-origin Fetch Metadata/Referer fallback), session cookie, CSRF on POST, JSON/envelope bounds, tab-key header format and rate limit. Only the dedicated `X-FTB-Tab-Key` header carries the in-memory 256-bit key; server state stores its hash. Tests cover missing/bad CSRF, cookie, origin/host, body secret, unknown fields, oversized input, default-disabled/production behavior and generic credential failures.
- Raw import payloads are bounded temporary relay data; receipt/rejection/expiry cleanup is exercised. Result/status projections and logs are tested not to leak raw payloads, tab secrets, or filesystem paths. Export results are one-shot and consumed by the owning live MCP process, not by browser receipt.
- Real acceptance launches `docker compose -f compose.dev.yaml exec -T demo-php php artisan ftb:mcp`; Playwright drives browser pairing, preview, cancel/stale-revision rejection, confirmation, single creation, reload, operation-result consumption and revoke. The implementation makes no account-authentication or hosted-client support claim.

## Final review verification (2026-10-19)

The inventory was initially stale: it still described all local themes as UI-only/deferred to FTB-048. Updated the inventory to enumerate the five in-scope capability rows and kept broader FTB-048 out of scope. Added inventory assertions and marked FTB-022 done with evidence in `TICKETS.md`.

- TDD inventory assertion: before the inventory update, `docker compose -f compose.dev.yaml exec -T demo-php php artisan test --filter=DemoShowcaseCapabilityInventoryTest` failed because the FTB-022 tool row was absent. After update, **3 passed, 424 assertions**.
- `cd builder && npm run type-check && npm run test:unit -- --run && npm run build` — **type-check passed; 98 files / 440 tests passed; production build passed**.
- `docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test` — **257 passed, 2,241 assertions**.
- `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts e2e/ftb-022-relay-pairing.spec.ts e2e/ftb-022-versioned-theme-import-mcp.spec.ts` — **6 passed**, including live Compose stdio/browser relay import acceptance.
- `docker compose -f compose.dev.yaml exec -T demo-php composer lint:check` — **406 PHP files passed**.
- `docker compose -f compose.dev.yaml exec -T demo-php php -d memory_limit=512M vendor/bin/phpstan analyse --no-progress` — **0 errors**.
- Direct stdio exchange sent `initialize` (client protocol `2025-03-26`), initialized notification, `tools/list`, and unknown `local_theme_pair`; negotiated protocol `2025-11-25`, listed exactly the seven tools above, returned generic `pairing_required`, and produced clean JSON-RPC stdout. Compose command: `printf '%s\n' '<initialize>' '<initialized notification>' '<tools/list>' '<unknown pair call>' | docker compose -f compose.dev.yaml exec -T -e APP_ENV=local -e FTB_LOCAL_MCP_ENABLED=true demo-php php artisan ftb:mcp`.
- `git diff --check` passed for the review range and the final review edits; `git diff --summary` reports no file mode changes.

## Review notes and limits

- A 2026-10-19 repeat browser run previously documented one transient blank-app observation and an earlier 403 whose request/root cause was not established. The fresh six-test run passed; these reruns do not prove those prior observations impossible. See Task 9 report for details.
- Revocation cannot interrupt a mutation already executing synchronously after authorization; apply revalidates immediately before commit. This is the documented in-flight cancellation limit, not distributed atomic cancellation.
- The end-to-end acceptance uses the development Compose service `demo-php`. Production relay remains intentionally disabled; no production service runtime was claimed or tested.
