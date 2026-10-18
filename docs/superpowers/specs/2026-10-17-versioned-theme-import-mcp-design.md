# Versioned Theme Import and Browser-Local MCP Parity

**Date:** 2026-10-17  
**Status:** Design specification  
**Primary ticket:** [FTB-022](../../../TICKETS.md#ftb-022)  
**Related existing design:** [Multiple Local Themes](./2026-10-16-multiple-local-themes-design.md)  
**Scope:** Versioned JSON import into a new browser-local theme, plus actual local MCP parity for that capability.

## 1. Purpose and decisions

This design extends FTB-022 without changing the current canonical V4 export contract. It accepts raw JSON for schema versions 1, 2, 3, and 4, migrates supported input sequentially through `1 → 2 → 3 → 4`, validates the resulting state, and creates a new local theme rather than replacing the active theme. The imported theme is opened only after the user confirms the import preview.

The same TypeScript domain services used by the browser UI are the authority for MCP import preview, validation, migration, and creation. Pinia remains the state, history, active-theme, and persistence authority. Laravel is a temporary request relay and transport boundary, not a second theme implementation or a server-side theme store. The local MCP process uses the application-owned `ftb:mcp` command and existing Laravel MCP server/transport contracts; the existing Boost server and `ToolExecutor` remain untouched and are not the execution path.

This specification supersedes the FTB-021 statement that local-theme MCP is deferred to FTB-048 for this capability only. The FTB-048 phase-2 work remains a separate broader package/consumer effort; it is not a prerequisite for this local browser parity slice.

## 2. Goals

- Import raw JSON documents whose top-level `schemaVersion` is exactly 1, 2, 3, or 4.
- Enforce a 1 MiB byte limit before JSON parsing or any schema inspection.
- Migrate accepted input sequentially through every intervening version, with a separately testable step for each edge.
- Preserve the current canonical V4 export shape, output safety, and rejection of nonempty `customCss` and future schema versions.
- Preview the migrated result and its name before mutation.
- Always create a fresh local theme with a fresh history; never overwrite, merge into, or delete an existing theme.
- Default the filename-derived display name to the filename with its final `.json` suffix removed, while allowing editing before confirmation.
- Pair a local stdio MCP client explicitly to one browser tab/client session. The browser creates a 256-bit tab secret with `crypto.getRandomValues`, keeps it in memory only, and submits only the public pairing ID to `local_theme_pair`; browser approval binds that ID to an internal per-stdio-process identity. Pairing grants only list/export capabilities until each import is separately previewed and confirmed in the browser. This is local pairing, not secret handoff or account authentication.
- Ensure revocation, disconnect, expiry, stale sessions, replay, and cross-session attempts cannot apply an import.
- Provide capability inventory coverage, unit tests, Laravel authorization tests, and a real stdio MCP-client journey driven through Playwright.

## 3. Non-goals and hard boundaries

- No server-side theme library, database persistence, cloud synchronization, account theme sharing, or cross-device themes.
- No new npm, Composer, MCP, or server theme-library dependency.
- No import into the active theme, existing theme, or shared history.
- No import bypass tool, implicit confirmation, “force” flag, trusted-client flag, or server-only confirmation path.
- No acceptance of future schema versions, arbitrary unknown schema versions, or a missing `schemaVersion`.
- No change to current canonical V4 export keys, omission rules, safety checks, or export filename behavior.
- No interpretation of CSS, HTML, JavaScript, filesystem paths, font URLs, `@import`, or uploaded executable content.
- No provider-specific identity API, browser extension API, or MCP account-authentication claim.
- No hosted remote-client support in this slice. Hosted clients, internet-facing pairing, multi-user authorization, and production-grade cross-origin deployment are explicit follow-on work.

## 4. Existing architecture and source of truth

### 4.1 Builder authority

`ThemeStateV4` is the canonical editable state. Existing `theme.model.ts` owns the version union and current migration entry point; the implementation must split or replace that entry point with explicit migration edges without changing the public V4 result. Existing validation and normalization remain authoritative after migration.

The current local-theme boundary owns:

- `ftb-themes` index and active ID;
- `ftb-theme:<id>` canonical state;
- `ftb-theme-history:<id>` state history;
- recovery and ordered, verified localStorage writes.

The Pinia theme store remains the only owner of active state and history. Import orchestration may call a focused domain/persistence operation, but components, Laravel, and MCP adapters must not write localStorage or mutate Pinia state directly.

### 4.2 Export authority

The current canonical export path remains unchanged in behavior. `serializeCanonicalTheme`/the established export action continues to produce a V4 canonical document, preserving the exact current key set and safety behavior. The import path must consume that public representation, not the reduced local persistence representation that omits derived palette shades.

The existing safety contract remains mandatory:

1. nonempty `customCss` is rejected for this import/export capability;
2. unsupported/future schema versions are rejected;
3. invalid canonical values, unsafe keys, malformed overrides, and invalid foundation data are rejected;
4. no unvalidated value is interpolated into CSS, preview markup, a selector, a URL, or a server request;
5. rejection leaves the active theme, all existing local themes, and all histories unchanged.

## 5. Import contract

### 5.1 Input boundary

The browser import boundary accepts a `File` or an already-received byte sequence only through a dedicated adapter. It must determine byte length before decoding or parsing. The hard maximum is **1,048,576 bytes (1 MiB)**. A file whose byte length exceeds the limit is rejected without reading its contents into a string and without calling `JSON.parse`.

The MCP relay enforces this limit on the UTF-8 bytes of the theme JSON before forwarding or parsing that document. The custom stdio transport enforces a maximum raw JSON-RPC line of **6,291,456 + 65,536 bytes** before allocation, using bounded stream chunks or `fgets(STDIN, MAX_LINE_BYTES + 2)` with newline/EOF oversize detection; it must not use an unbounded `fgets(STDIN)` or accumulate an unbounded line. This envelope bound covers worst-case sixfold JSON escaping for a 1 MiB document plus metadata. The decoded document is independently limited to 1,048,576 UTF-8 bytes before JSON parsing, and stdout responses are bounded before writing. Incomplete EOF lines, notifications, multibyte boundaries, and exact limits are explicit transport tests. The browser enforces the document limit again because it is the final authority. Raw bytes may exist only in bounded temporary relay storage pending browser delivery; they are not a persistent theme library and must never appear in logs or error messages.

The input must be a JSON object with an own `schemaVersion` property whose value is the integer `1`, `2`, `3`, or `4`. A JSON envelope, protocol message, or object containing a nested theme is not silently unwrapped; only the explicit DTO envelopes defined in the relay contract may contain the raw theme document.

### 5.2 Sequential migration

Migration is a pure, deterministic chain:

```text
raw bytes
  → bounded UTF-8 decode
  → JSON parse
  → version-1 shape validation
  → migrate1To2
  → version-2 shape validation
  → migrate2To3
  → version-3 shape validation
  → migrate3To4
  → V4 shape/foundation validation and normalization
  → import preview
```

This diagram shows the V1 path. V2 and V3 input enter at their respective source validation stages; V4 input runs through the final V4 validation/normalization stage without a migration edge. Each migration step must:

- accept only its declared source version;
- return only its declared destination version;
- deep-clone input and avoid mutating the caller’s object;
- reject malformed or unsafe source data before constructing the next state;
- preserve semantic colors, raw overrides, icon state, runtime/branding state, and custom-CSS state as applicable to that source version;
- produce a structured failure category and safe human-readable message.

Migration is not a lossy fallback to defaults. If a source version cannot represent a later field, the documented destination default is used and the preview records that migration decision. Existing migration behavior for V1/V2/V3 must be reconciled with the edge functions rather than duplicated in a second importer.

### 5.3 Custom CSS rule

This capability rejects an input when `customCss` exists as a nonempty string after the relevant migration step. Empty or absent `customCss` remains compatible with the current canonical representation. The import must not strip nonempty CSS and continue, because doing so would create an unreviewed semantic change. The rejection is reported before preview confirmation and does not create a local theme.

### 5.4 Filename and new-theme semantics

The UI derives the initial display name from the client filename by removing only its final `.json` extension, case-insensitively, then trimming surrounding whitespace. If the resulting name is empty, it uses `Untitled`. The name is editable in the preview dialog before confirmation and is validated by the existing local-theme name rules.

The confirmed operation always:

1. allocates a fresh safe local-theme ID;
2. stores the validated migrated `ThemeStateV4`;
3. creates a fresh history containing only the imported initial state at cursor zero;
4. publishes the new index entry and active ID using the existing ordered/verified local-theme persistence boundary;
5. opens the new theme in Pinia;
6. leaves every pre-existing theme state, history, and record untouched.

The browser persists an idempotency marker at `ftb-theme-import:<operationId>` with `{digest, recordId, name, status}`. The operation ID is a random 256-bit value and the safe local-theme record ID is deterministically derived from it. The marker is prepared and verified before state/history writes, marked complete only after state/history/index/active publication is verified, and retained until the operation result is safely terminal. A retry after reload or crash verifies the marker digest, record state, history, and index membership before returning the existing record; it never allocates a second record. An altered digest is rejected. Tests cover crashes after marker preparation, state write, history write, index publication, active-pointer publication, and acknowledgement; a failed active flush stops import before marker preparation.

If any write or verification fails, the operation fails closed. It must not publish an index entry pointing to missing state, must not remove the source bytes, and must not switch the active theme. Recovery follows the existing local-theme partial-write behavior.

## 6. UI flow

The browser UI provides an import action that accepts a local JSON file and immediately applies the byte limit before parsing. A valid document produces a preview containing:

- source filename and derived editable name;
- source schema version and migration path, such as `1 → 2 → 3 → 4`;
- target schema version `4`;
- safe summary of affected theme domains;
- explicit warning when import is rejected or migration made a documented defaulting decision;
- confirmation and cancel actions.

Confirmation is required even for a valid local file. Confirmation creates and opens the new theme; cancel leaves the active theme and browser storage unchanged. The preview is not the active theme and must not mutate Pinia state except for isolated preview state that cannot be persisted or applied.

The new theme’s name can be edited until confirmation. After confirmation, the normal theme manager can rename it through its existing operation.

## 7. MCP pairing and authorization model

### 7.1 Intended local flow

The first supported caller is a local MCP client launched through stdio. It invokes the application-owned `php artisan ftb:mcp` command, implemented by `App\Console\Commands\ServeLocalThemeMcp`, with an application-owned bounded transport implementing the installed Laravel MCP 1.0.1 `Laravel\Mcp\Server\Contracts\Transport` interface. The command creates one internal process scope, constructs the direct `LocalThemeServer` with `app()->makeWith(LocalThemeServer::class, ['transport' => $transport])`, calls `Server::start()`, then calls the bounded transport’s `run()`. It does not use `mcp:start`, `Registrar::local`, Laravel Boost’s `ToolExecutor`, or a transport selected by tool arguments. In development Compose, the supported invocation is `docker compose exec -T demo-php php artisan ftb:mcp` so the command shares the demo PHP filesystem and runtime with the web process. The relay is temporary, does not own browser-local themes, and cannot complete an import without browser confirmation.

Pairing is explicit and user-mediated:

1. the browser creates a short-lived pairing request for the current tab/client session and generates a 256-bit tab secret held only in that tab’s memory;
2. the MCP client submits the public pairing ID as the `local_theme_pair` tool argument and the browser displays that process's pending claim;
3. the user approves that claim in the browser. The browser sends the 256-bit tab secret only in the dedicated `X-FTB-Tab-Key` header to the same-origin relay; the body, URL, MCP tool arguments, and responses never contain it;
4. the relay hashes the header secret and binds the approved pairing ID to exactly one browser tab/client session and the internal identity of the long-lived `ftb:mcp` process. The process identity is server-created and never supplied in tool arguments;
5. list/export operations become available for that pair;
6. every import requires a browser preview and explicit browser confirmation.

Client-provided names are display labels only and are not verified identity. Authorization is based on the bound session and server/browser pairing state, not on a client name, arbitrary owner argument, environment flag, URL parameter, or secret supplied in a tool payload.

### 7.2 Lifetime and revocation

- Pairing approval expires after 5 minutes and is single-use for establishing the pair.
- A paired session expires after 30 minutes idle or 8 hours absolute, whichever comes first.
- The browser sends a heartbeat every 15 seconds; the relay treats a missing heartbeat as a silent disconnect after a 45-second lease and invalidates pending operations at that point.
- Heartbeats and automatic polling prove browser presence but do not extend the 30-minute user/tool inactivity deadline; only an authorized user/tool operation resets idle activity. `pagehide` sends best-effort disconnect, while the 45-second lease is the authoritative fallback for silent tab closure.
- A pending import confirmation expires after 5 minutes.
- Explicit revoke/disconnect invalidates pending confirmations immediately; silent tab closure, browser-session loss, or process loss is detected by the lease/EOF boundary and invalidates pending confirmations when detected.
- An expired or revoked pair cannot be renewed by replaying an old pairing or confirmation credential.
- New pairing is required after disconnect/expiry.

The server and browser must check these conditions at list/export, preview, confirmation, and apply boundaries. A pending import is not authorization; it is a bounded proposal tied to the pair, client session, exact payload digest, filename/name, migration result, and current browser revision.

### 7.3 Secure credential handling

The browser tab secret is exactly 32 random bytes (256 bits), represented only as an in-memory `Uint8Array`. It is permitted only in the `X-FTB-Tab-Key` request header to the dedicated same-origin relay, where it is immediately hashed server-side and never stored or echoed. It must not appear in request bodies, URLs, MCP arguments, headers other than that one dedicated header, browser history, logs, analytics, exceptions, tool descriptions, snapshots, responses, traces, or HAR files. The public pairing ID is an identifier, not a secret and not an account identity. Confirmation operations use server-side operation records and payload digests, not caller-generated confirmation tokens. Preview digest calculation is asynchronous SHA-256 through `crypto.subtle.digest`; pure parse/migrate functions remain synchronous and do not depend on Web Crypto.

There is no account-authentication claim and no secret handoff to the MCP client. If the browser cannot retain the tab secret in memory, send it only in the dedicated header, bind it to the exact tab/session, or satisfy the local web session/CSRF/origin checks, pairing fails closed.

## 8. MCP capability contract

All tools use the same TypeScript domain services as the UI through a browser-side adapter. Laravel tools validate the caller/session envelope and relay request/response data; they do not reimplement migration, theme validation, localStorage, or history.

### 8.1 `local_theme_pair`

Responsibility: begin or complete the browser-approved pairing handshake. It may return a non-secret pairing request ID, status, expiry, and safe browser action guidance. It must not accept a caller-selected owner/session identity and must not grant access before browser approval.

The input is `{pairing_id:string}`. Repeating the same ID from the same internal `ftb:mcp` process is idempotent and returns the current safe status; a different process or unknown ID receives generic `pairing_required` without valid-pair metadata. The browser does not call this MCP tool; it uses the dedicated same-origin routes.

### 8.2 `local_theme_list`

Responsibility: list the paired browser session’s local theme metadata only: stable local IDs as needed for user selection, display names, active marker, and safe update metadata. It must not expose another browser session’s themes, localStorage keys, credentials, or full state.

### 8.3 `local_theme_export`

Responsibility: export a selected paired local theme through the existing canonical V4 export serializer. It returns the same safe export result as the UI, including schemaVersion 4, and must apply the existing nonempty-`customCss` and future-schema safety rules. It is read-only but still requires a live pair and revalidates theme membership at execution time.

The result is asynchronous: the tool returns an operation ID and `pending`; the browser uploads the validated canonical JSON through the result endpoint. The caller retrieves it through `local_theme_operation_status`; the cached canonical result is deleted atomically when that authorized tool call consumes it, or on expiry. A lost tool response may require a new read-only export operation.

### 8.4 `local_theme_import_preview`

Responsibility: submit bounded raw JSON plus filename and proposed display name for browser preview. It returns an operation ID and `pending` status. Once the browser has validated the document, the operation also exposes source/target versions, migration path, safe summary, payload digest, and confirmation expiry. It never creates a theme, changes active state, writes localStorage, or returns a bypass token.

The browser must show the preview and require the user’s explicit confirmation. A tool argument such as `confirmed: true`, `force: true`, `skip_preview: true`, or a caller-generated confirmation token is rejected as an authorization bypass.

### 8.5 `local_theme_import_status`

Responsibility: retrieve the minimal status of an operation owned by the paired session. Valid statuses are `pending`, `approved`, `rejected`, `expired`, and `disconnected`; a completed approved operation may additionally expose a safe result reference/new local-theme ID without exposing credentials or raw payload. Status is bound to the pair and operation owner.

### 8.6 `local_theme_operation_status`

Responsibility: retrieve status for any owned asynchronous list, export, or import operation. It accepts only `{operation_id:string}` and returns `{operation_id, kind:'list'|'export'|'import', status:OperationStatus, record_id?:string, digest?:string, preview?:ImportPreviewDto, result?:ListResult|ExportResult}`. `ListResult` is `{themes:[{id,name,updatedAt,active}]}`; `ExportResult` is `{filename:'filament-theme.json', schemaVersion:4, json:string}`. Bounded results are consumed by the authorized MCP process, not by the producing browser. `local_theme_import_status` is an import-only alias with the same authorization.

### 8.7 Browser confirmation/apply bridge

The browser-side application service is the only component that can turn a pending preview into an approved import. On confirmation it revalidates:

- pair/session validity and browser tab binding;
- pending-operation expiry and single-use state;
- payload digest, byte length, filename, proposed name, and source version;
- current active/local-theme collection revision;
- migration result and final V4 validation;
- the fact that no existing theme is the target;
- current authorization and disconnect/revoke state.

Only after all checks pass does Pinia invoke the existing new-local-theme persistence operation. The result is atomically represented as approved or as a safe failure; a second confirmation or altered payload is rejected as replay/stale confirmation.

### 8.8 `local_theme_disconnect`

Responsibility: revoke only the caller's own paired session, invalidate its pending proposals, and return `disconnected`. The browser provides an equivalent revoke control. Disconnect is idempotent and cannot target another caller's session.

## 9. Relay request/response handling and retention

The Laravel relay accepts only a narrow, typed request envelope containing operation name, pair/session reference, operation ID where applicable, bounded metadata, and the raw payload only for the preview request. The outer JSON envelope has an explicit byte/field bound large enough for JSON escaping but rejects unknown fields, caller-supplied owner IDs, arbitrary URLs, filesystem paths, unbounded strings, and protocol extensions not in the allowlist. The theme document itself is limited to 1,048,576 UTF-8 bytes before parsing.

The exact same-origin routes are:

| Route | Method | Request | Response |
|---|---|---|---|
| `/local-theme/relay/bootstrap` | GET | no body; same-origin session and configured host | `{version:1, origin:string, host:string, csrfToken:string, enabled:true}`; never pairing metadata or secrets |
| `/local-theme/relay/pairings` | POST | `{version:1, pairingId:string}` | `{version:1, pairingId:string, status:'pending', expiresAt:number}` |
| `/local-theme/relay/pairings/{id}` | GET | `X-FTB-Tab-Key` | `{version:1, pairingId:string, status:'pending'|'approved'|'expired'|'disconnected', claimId?:string, clientLabel?:string, expiresAt:number}` or generic `pairing_required` |
| `/local-theme/relay/pairings/{id}/approve` | POST | `X-FTB-Tab-Key`, `{version:1, claimId:string}` | `{version:1, status:'approved', sessionId:string, sessionExpiresAt:number}` |
| `/local-theme/relay/sessions/poll` | POST | `X-FTB-Tab-Key`, `{version:1, sessionId:string}` | `{version:1, operations:list<OperationNotice>}` |
| `/local-theme/relay/sessions/heartbeat` | POST | `X-FTB-Tab-Key`, `{version:1, sessionId:string}` | `{version:1, status:'alive', leaseExpiresAt:number}` |
| `/local-theme/relay/sessions/disconnect` | POST | `X-FTB-Tab-Key`, `{version:1, sessionId:string}` | `{version:1, status:'disconnected'}` |
| `/local-theme/relay/operations/{id}/payload` | GET | `X-FTB-Tab-Key` | `{version:1, operationId:string, payload:string, filename:string, proposedName:string, digest:string, byteLength:number}`; deletes after browser acknowledgement |
| `/local-theme/relay/operations/{id}/receipt` | POST | `X-FTB-Tab-Key`, `{version:1, digest:string, received:true}` | `{version:1, status:'received'}` |
| `/local-theme/relay/operations/{id}/preview` | POST | `X-FTB-Tab-Key`, `{version:1, preview:ImportPreviewDto}` | `{version:1, status:'pending'|'rejected', digest:string}` |
| `/local-theme/relay/operations/{id}/authorize-apply` | POST | `X-FTB-Tab-Key`, `{version:1, digest:string, revision:number, displayName:string}` | `{version:1, status:'pending', grantId:string, grantExpiresAt:number}` or structured rejection; this is not completed approval |
| `/local-theme/relay/operations/{id}/result` | POST | `X-FTB-Tab-Key`, versioned list/export result, or import `{version:1, grantId:string, recordId:string, digest:string}`, or `{version:1, errorCategory:string}` | `{version:1, status:OperationStatus}`; approval is recorded only after successful browser execution |
| `/local-theme/relay/operations/{id}/result` | GET | `X-FTB-Tab-Key` | `{version:1, status:OperationStatus, recordId?:string, errorCategory?:string}`; browser recovery status, never consumes MCP export result |

`OperationNotice` is `{operationId:string, kind:'list'|'export'|'import', status:OperationStatus, themeId?:string}`; only export has a theme ID. `ImportPreviewDto` is `{sourceVersion:1|2|3|4, targetVersion:4, migrationPath:number[], displayName:string, summary:string[], payloadDigest:string, byteLength:number}` without canonical state. `OperationStatus` is exactly `pending|approved|rejected|expired|disconnected`; no unknown fields are accepted. List results POST `{version:1, themes:[{id,name,updatedAt,active}]}`; export results POST `{version:1, filename:'filament-theme.json', schemaVersion:4, json:string}` with the same 1 MiB canonical JSON bound. Apply grants last at most 5 seconds and bind operation, payload digest, edited display name, browser revision, and session. They remain pending until a successful local commit is acknowledged; expired/revoked grants cannot authorize new mutations. Retry after an ambiguous acknowledgement uses the persistent browser import marker, not a second creation. All routes require the browser session cookie; POST additionally requires CSRF and the configured exact Origin, or same-origin Fetch Metadata plus exact host when Origin is absent. Only bootstrap is exempt from tab-key authentication. Pairing creation requires the key header too. The header is hashed server-side, body secrets are rejected, and unknown credentials return generic errors.

Relay behavior:

- authenticate the installed MCP request according to the actual host integration;
- resolve the pair from server-side session state, never from a client-selected identity;
- enforce byte and field limits before forwarding;
- forward the minimum required data to the paired browser session;
- return typed status/error data and safe digests, not credentials; authorized export is the explicit exception that returns canonical JSON;
- retain only the minimum pending-operation metadata needed for expiry, replay protection, status, disconnect cleanup, and the idempotency marker `(operation_id, payload_digest)`;
- delete raw payload bytes immediately after the browser acknowledges receipt or rejection, whichever comes first;
- remove undelivered raw payloads on the 5-minute operation expiry or earlier rejection/revocation; keep only non-secret terminal status metadata until the paired session expires, then delete it;
- emit logs with operation IDs, status categories, and non-secret digests only.

Because the current Laravel relay is temporary, it must not introduce a second persistent theme repository or assume the server can directly inspect browser localStorage. Raw bytes, operation records, and a global session index use a private OS `/tmp` directory with sticky parent semantics and an application-owned `0700` child inside the same container root, plus per-record/global locks and atomic rename. The repository’s world-writable directories are never used. Configuration is active only when `FTB_LOCAL_MCP_ENABLED=true` and `APP_ENV` is `local` or `testing`; production remains disabled. The configured builder origin defaults to `http://127.0.0.1:4175` and the exact host allowlist is enforced. No theme DB, cache-backed theme library, or durable account record is permitted.

## 10. Origin, CSRF, and transport protections

Browser-facing relay endpoints are separate from the read-only preview iframe protocol. They are disabled unless an explicit local-only configuration flag is enabled, and production/public exposure is disabled by default. They accept only the exact configured builder origin and exact configured host, enforce the paired browser tab credential, use the normal web session/CSRF protections, and reject unknown message shapes. They use a versioned message schema. If a window-message adapter is used, it additionally checks exact origin and `event.source`; the preview iframe is not granted theme-management access.

Relay HTTP requests, if the installed transport uses HTTP, require the application’s normal session/CSRF protections and an origin check appropriate to the actual route. The implementation must not disable CSRF, use wildcard credentialed CORS, or treat an `Origin` header alone as authentication. If the installed stdio transport does not involve browser cookies, its actual host authentication context must be preserved rather than replaced with a product-specific login claim.

Same-origin deployment and local development origin configuration must be tested separately. Cross-origin hosted-client support is not part of this design.

## 11. Types and module boundaries

All new types live in dedicated files under the existing builder structure and each source file must remain at or below 100 lines. Proposed boundaries are:

- `src/models/theme-import.model.ts`: domain import result, migration path, preview, and failure categories;
- `src/models/theme-import-operation.model.ts`: operation/session status and safe operation metadata;
- `src/dtos/theme-import.dto.ts`: browser/relay transfer shapes only;
- `src/utils/theme-import-bytes.ts`: byte-limit and bounded decode functions;
- `src/utils/theme-import-migrations.ts`: explicit pure migration edges;
- `src/utils/theme-import-validation.ts`: raw/version/final import validation;
- `src/utils/theme-import-preview.ts`: deterministic preview projection and digest inputs;
- `src/composables/use-theme-import.ts`: file-picker and UI lifecycle coordination;
- Pinia theme/local-theme store boundary: create/open fresh theme and history through existing persistence authority;
- Laravel MCP tool classes: thin transport/auth adapters only;
- a focused browser relay adapter: typed request/response bridge with no Pinia replacement.

This separates repeated boundary concerns (bounded input, migration, preview, and operation status) instead of copying them across file input, store, and MCP adapters. It does not create a generalized import framework for unrelated data.

## 12. Error semantics

Every rejected operation has a stable category, safe message, operation ID where one exists, and no raw payload. Required categories include:

- `payload_too_large`;
- `invalid_encoding`;
- `invalid_json`;
- `missing_schema_version`;
- `unsupported_schema_version`;
- `invalid_schema_shape`;
- `migration_failed`;
- `nonempty_custom_css_rejected`;
- `invalid_theme_state`;
- `pairing_required`;
- `pairing_expired`;
- `session_disconnected`;
- `confirmation_required`;
- `confirmation_expired`;
- `confirmation_replay_rejected`;
- `cross_session_rejected`;
- `stale_preview_rejected`;
- `storage_write_failed`.

All mutation errors fail closed. Existing themes and active state remain usable. Pending operations transition to `rejected`, `expired`, or `disconnected` as appropriate; they never remain ambiguously pending after a known terminal condition.

Revoke/disconnect invalidates all future relay requests and pending operations immediately in the authoritative state. A request already accepted by a browser or already executing inside a synchronous local operation cannot be retroactively interrupted; its completion must still revalidate before mutation, and the verification report must state this in-flight limitation rather than claim distributed atomic cancellation.

## 13. Capability inventory and actual coverage

The capability inventory must contain rows for:

| Capability | Surface | Operation | Authorization | Confirmation | MCP status |
|---|---|---|---|---|---|
| `builder.local-themes.list` | Pinia/local-theme store and local theme manager | read-only | paired browser-local session; no server theme identity | none | `local_theme_list`; mark tested only after verification |
| `builder.local-themes.export` | canonical V4 export service | read-only | paired browser-local session; existing theme membership revalidated | none | `local_theme_export`; mark tested only after verification |
| `builder.local-themes.import-preview` | bounded import/migration/preview service | read-only | paired browser-local session; browser session binding | browser preview required | `local_theme_import_preview`; mark tested only after verification |
| `builder.local-themes.import-apply` | fresh-theme creation through Pinia/local persistence | mutation | same paired session plus browser approval and apply-time revalidation | explicit browser confirmation; no bypass tool | browser confirmation bridge plus operation status; mark tested only after verification |
| `builder.local-themes.pairing` | browser pairing UI and relay session | mutation | browser owner approves; client name is unverified label | browser approval | `local_theme_pair`, `local_theme_disconnect`; mark tested only after verification |

The inventory must explicitly remove or revise the old FTB-021 row claiming “No MCP tool; deferred to FTB-048” for these operations. Other local-theme operations not covered by this design retain their existing status and must not be silently advertised as MCP-capable.

## 14. Verification contract

### 14.1 Unit and store tests

Test-first coverage must include:

- byte length checked before decode/parse, including multibyte UTF-8 and exactly-1-MiB boundaries; raw stdio lines checked at `6,291,456 + 65,536` before allocation, with bounded stdout, incomplete EOF, notifications, and exact boundaries;
- invalid encoding, malformed JSON, missing/future/unknown versions, non-object roots, and extra unsafe shapes;
- each migration edge independently and the full V1→V4 chain;
- deep-clone/no-mutation behavior and preservation of supported semantic/raw/icon/runtime state;
- nonempty `customCss` rejection and empty/absent acceptance;
- exact V4 canonical export parity and rejection safety;
- filename-derived name, editable name validation, and `Untitled` fallback;
- fresh ID, fresh history, active opening, no overwrite, no merge, and unchanged existing themes;
- ordered persistence, verification failure, quota/security failure, and recovery behavior;
- preview isolation from Pinia/localStorage;
- pairing/session/operation lifetimes, status transitions, single-use pairing, expiry, revoke, disconnect, replay, stale revision, cross-session, and altered-payload rejection;
- no credential/payload leakage in returned errors, logs, or status projections.

### 14.2 Laravel authorization tests

Feature tests must use the installed Laravel MCP/Boost boundary and verify, without inventing unverified APIs:

- tool registration and schema rejection of unknown fields/owner overrides;
- unauthenticated/unauthorized relay rejection;
- pair binding to one browser tab/client session;
- client names not being treated as identity;
- list/export allowed only for the live pair;
- preview bounded before forwarding;
- import apply unavailable through tool arguments alone;
- confirmation expiry, replay, revoke, disconnect, cross-session, and stale operation rejection;
- response/log assertions that secrets and raw payloads are absent;
- no server-side theme storage or mutation occurs.

### 14.3 Real stdio MCP client plus Playwright

The acceptance journey must launch a real local stdio MCP client against the application-owned bounded server command in the installed Laravel/MCP runtime, not call a PHP class or Boost `ToolExecutor` subprocess directly. In development Compose it must use `docker compose exec -T demo-php php artisan ftb:mcp` and record the command, protocol version, `Transport` implementation, and direct `app()->makeWith(...['transport' => ...])` server construction path. Playwright must drive the browser pairing approval, display the import preview, edit the filename-derived theme name, confirm the import, and verify that:

1. the new theme is created and opened;
2. its history starts fresh;
3. the original active theme and another existing theme remain unchanged;
4. list/export see only the paired browser-local collection;
5. a second/replayed confirmation fails;
6. revocation or tab disconnect changes pending status and prevents creation;
7. an expired session cannot list, export, preview, or apply;
8. a client with the same display name but another session cannot access the pair.

The test must record the actual protocol/version and installed transport behavior. It must not claim support for a hosted client or undocumented MCP API.

## 15. Dependencies and implementation contract

### 15.1 Constraints

- Use existing browser platform APIs, Vue/Pinia code, Laravel MCP/Boost, and current test tooling only.
- Do not add a package, service, database, or permanent relay daemon without explicit approval.
- Preserve the repository demo-first gate and existing FTB-021 behavior.
- Keep local-only browser ownership distinct from authenticated hosted-product authorization.

### 15.2 Implementation facts and evidence

The installed MCP 1.0.1 server contract has four methods: `onReceive(Closure)`, `run()`, `send(string)`, and `stream(Closure)`. The application command owns construction and uses `app()->makeWith(LocalThemeServer::class, ['transport' => $transport])`, then `start()` and `run()`. The stock `mcp:start`/`Registrar::local` path is not used because it constructs the stock unbounded stdio transport. Boost’s existing server and `ToolExecutor` are untouched.

The browser relay routes, DTO fields, header credential rule, CSRF/session/origin/host checks, temp directory, status names, and operation lifetimes are defined in this specification, not deferred to implementation discovery. The only implementation work is to test these exact contracts against the repository’s current Laravel middleware and Compose runtime. Any incompatibility is a failing implementation that must be corrected within this approved contract, not replaced by an invented route, account-authentication claim, or weaker transport.

## 16. Controller judgment and contradictions

The following existing documents conflict with the user-approved scope and require controller-level acknowledgment before implementation:

- FTB-021 and its design mark local-theme MCP as deferred to FTB-048, while this design requires actual parity now. This document treats the user-approved requirement as the narrower, newer exception for local theme list/export/import and updates the inventory accordingly; it does not claim all FTB-048 work is complete.
- FTB-022 describes sequential migration with an example ending at V3, while the current canonical state is V4. This design requires the chain to end at V4 and treats current V4 export as authoritative.
- The installed MCP/Boost evidence establishes the Laravel MCP server contracts and the reason to use the application-owned `ftb:mcp` command. The browser relay is an application-owned same-origin web boundary with the exact routes and DTOs in this specification; it is not an undocumented MCP or account-authentication feature.

No implementation or commit is authorized by this document. The next artifact, if approved, is an implementation plan that resolves the preflight questions and maps each contract to existing files and tests.
