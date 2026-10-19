# FTB022 Task 8: browser relay import confirmation evidence

**Implementation commit:** `ff258b3` — `Feature: connect browser relay import confirmation`

## Implemented scope

- Added browser relay polling and 15-second heartbeat handling, page-hide best-effort disconnect, and explicit disconnect/revoke UI. Polling and heartbeat remain presence checks and do not extend the user/tool idle deadline.
- Added browser pairing claim display and explicit approval. The 256-bit tab key remains in memory and is sent only in `X-FTB-Tab-Key`; the relay request DTOs keep it out of URLs, bodies, and result payloads.
- Routed import notices to the existing Task 3 preview dialog. The browser bounds and validates the received UTF-8 bytes and digest, acknowledges receipt, then submits only the safe preview DTO.
- Confirmation obtains the operation-bound apply grant, revalidates payload, source version, name, grant, operation expiry, and the numeric revision fingerprint of the canonical collection and active state. Only the existing Task 2 fresh-theme import boundary commits. List/export remain read-only.
- Reused the Task 2 persistent import marker for idempotent retries and crash recovery; a lost result acknowledgement can be retried without creating another theme. Invalid payload, CSS, stale revision, and failed authorization do not create a theme.
- No dependencies were added. The Task 9 real-stdio MCP journey is not part of this report and is **not claimed**.

## Verification

- Builder unit suite: `cd builder && npm run test:unit -- --run` — **98 files, 440 tests passed**.
- Builder type-check: `cd builder && npm run type-check` — **passed**.
- Builder production build: `cd builder && npm run build` — **passed** (includes the build's type-check).
- Laravel relay/lifecycle coverage: `docker compose -f compose.dev.yaml exec -T -e FTB_LOCAL_MCP_ENABLED=false -e APP_URL=http://localhost:8000 demo-php php artisan test --filter='RelayLifecycleTest|LocalThemeRelay|LocalThemeToolImport'` — **28 passed, 236 assertions**. Includes exact route DTOs, receipt/payload cleanup, grant/replay/security behavior, and the assertion that heartbeat renews the lease without extending user idle.
- Compose Playwright: `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts e2e/ftb-022-relay-pairing.spec.ts e2e/ftb-022-versioned-theme-import-mcp.spec.ts` — **5 passed**. Covered browser pairing/header-only tab key, import preview cancellation without mutation, explicit confirmation and one fresh theme, stale-revision rejection before apply, and the existing browser file-import flow.
- The browser relay Playwright tests use same-origin routed relay responses against the Compose-served builder; the Laravel tests exercise the actual relay routes. They do not launch an MCP stdio client or claim Task 9 acceptance.
- `git diff --check` — **passed**.
