# Versioned Theme Import and Browser-Local MCP Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement bounded V1–V4 theme import into a fresh browser-local theme and expose list, export, preview, status, pairing, and browser-confirmed apply through a local MCP process.

**Architecture:** Pure TypeScript parses and migrates canonical theme JSON synchronously, then computes SHA-256 asynchronously with `crypto.subtle`; Pinia and existing local-theme persistence remain authoritative. `php artisan ftb:mcp` owns a bounded stdio transport and directly constructs the Laravel MCP server, while Laravel routes relay bounded operations to one browser tab. Explicit browser approval authorizes mutation; the persistent `ftb-theme-import:<operationId>` marker supplies idempotency, not authorization.

**Tech Stack:** Vue 3.5, Pinia 4, TypeScript 6, Vitest 4, Playwright, Laravel 13, PHP 8.5, Laravel MCP 1.0.1, Laravel Boost 2.10.3, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-17-versioned-theme-import-mcp-design.md`

## Global Constraints

- Theme JSON is at most `1_048_576` UTF-8 bytes before decoding/parsing; browser and relay enforce this independently.
- Raw JSON-RPC input is at most `6_291_456 + 65_536` bytes per line, bounded before allocation; stdout responses are bounded too.
- Pure migration is `migrate1To2`, `migrate2To3`, `migrate3To4`; canonical V4 serialization is unchanged.
- Browser tab key is 32 random bytes in memory and is sent only as `X-FTB-Tab-Key`; server hashes it and never echoes/stores/logs it.
- `local_theme_pair` receives the public pairing ID; the browser does not call MCP. Server process identity is internal and never a tool argument.
- Heartbeat is every 15 seconds but does not extend 30-minute user/tool inactivity; missing heartbeat is a 45-second lease fallback. `pagehide` disconnect is best effort.
- Pairing is 5 minutes, idle session 30 minutes, absolute session 8 hours, pending operation 5 minutes.
- The custom command is `php artisan ftb:mcp`, implemented by `ServeLocalThemeMcp`; do not use `mcp:start`, `Registrar::local`, Boost `ToolExecutor`, or `CallToolWithExecutor`.
- Custom transport implements exactly `Laravel\Mcp\Server\Contracts\Transport::{onReceive,run,send,stream}`.
- Relay is enabled only with `FTB_LOCAL_MCP_ENABLED=true` and `APP_ENV` `local`/`testing`; production default is disabled.
- Relay temp files and a global session index live below an OS sticky `/tmp` parent in an owned `0700` child inside the same container root, with locks and atomic rename. Repository directories are unsafe and forbidden.
- Exact default builder origin is `http://127.0.0.1:4175`; exact host allowlist, session cookie, CSRF, Fetch Metadata/host fallback, and origin checks apply.
- Status is exactly `pending|approved|rejected|expired|disconnected`. No tool can apply an import.
- Persist `ftb-theme-import:<operationId>` as `{digest,recordId,name,status}`. Operation ID is random 256-bit; record ID is deterministic from it. Retry verifies marker/state/history/index before returning the existing record.
- Every builder source file, Vue file, and `app.css` remains at or below 100 lines; no executable permission changes.
- No packages, Composer dependencies, services, database tables, account-auth changes, daemon, or server theme repository.

## Verified Existing APIs and File Map

Verified source: `Laravel\Mcp\Server\Contracts\Transport` has four methods; `Laravel\Mcp\Server` accepts `Transport` in its constructor and calls `start()`; current Boost replaces native `tools/call` with `CallToolWithExecutor` and must remain untouched. `demo/app/Providers/AppServiceProvider.php` is the existing provider. Compose development PHP is `demo-php`, mounted at `/var/www/html`; `e2e/urls.ts` uses `COMPOSE_E2E=1` and `http://127.0.0.1:4175`.

Create/modify only these responsibilities:

- Builder: `src/models/theme-import.model.ts`, `theme-import-operation.model.ts`, `theme-import-pairing.model.ts`; `src/dtos/theme-import.dto.ts`, `theme-relay.dto.ts`, `theme-pairing.dto.ts`; `src/utils/theme-import-bytes.ts`, `theme-import-migrations.ts`, `theme-import-validation.ts`, `theme-import-preview.ts`, `theme-import-service.ts`, `local-theme-import.ts`; `src/composables/use-theme-import.ts`, `use-theme-pairing.ts`, `use-theme-relay.ts`; `ThemeImportDialog.vue`, `ThemeImportSummary.vue`, `ThemePairingControl.vue`; existing toolbar/theme manager/store boundary and `app.css`.
- PHP: `demo/app/Console/Commands/ServeLocalThemeMcp.php`; `demo/app/Mcp/Servers/LocalThemeServer.php`; `demo/app/Mcp/Transport/BoundedStdioTransport.php`; focused `demo/app/Mcp/ThemeRelay/{Clock,ProcessScope,PairingStore,SessionStore,OperationStore,TempRelayStore,EnvelopeValidator}.php`; six tool classes plus `LocalThemeOperationStatus.php`; route controller/DTOs under `demo/app/Http/Controllers/LocalThemeRelay/` and `demo/app/Http/Requests/LocalThemeRelay/`; route registration in `demo/routes/web.php`; explicit local config in `demo/config/local-theme-relay.php`; registration in `AppServiceProvider`. Do not modify `demo/config/boost.php` or vendor Boost files.
- Tests: focused Vitest files under `builder/src/__tests__/`; PHP unit/feature tests under `demo/tests/Unit/Mcp/` and `demo/tests/Feature/Mcp/`; `e2e/ftb-022-versioned-theme-import-mcp.spec.ts`, `e2e/support/stdio-mcp-client.ts`, and fixtures under `e2e/fixtures/theme-import/` with each source file <=100 lines.
- Docs: update `docs/ai-operability/demo-showcase-capability-inventory.md` only after end-to-end evidence; create `docs/superpowers/verification/2026-10-18-versioned-theme-import-mcp.md`.

## Task 1: Pure bounded JSON, migrations, and async digest

**Files:** Create `builder/src/models/theme-import.model.ts`, `builder/src/utils/theme-import-{bytes,migrations,validation,preview,service}.ts`, and focused `theme-import-*.spec.ts` tests. Modify existing `theme-serialization.ts`/`theme-store-normalization.ts` only to reuse the shared migration entry point, preserving public exports.

**Interfaces:**

```ts
export const MAX_THEME_IMPORT_BYTES = 1_048_576
export type ImportFailureCategory = 'payload_too_large'|'invalid_encoding'|'invalid_json'|'missing_schema_version'|'unsupported_schema_version'|'invalid_schema_shape'|'migration_failed'|'nonempty_custom_css_rejected'|'invalid_theme_state'
export type ImportPreview = { sourceVersion: 1|2|3|4; targetVersion: 4; migrationPath: number[]; displayName: string; summary: string[]; payloadDigest: string; byteLength: number; state: ThemeStateV4 }
export type SyncImportResult = { ok: true; value: ThemeStateV4; sourceVersion: 1|2|3|4; migrationPath: number[]; decisions: string[] } | { ok: false; category: ImportFailureCategory; message: string }
export type ImportResult = { valid: true; preview: ImportPreview } | { valid: false; category: ImportFailureCategory; message: string }
export function parseAndMigrateTheme(bytes: Uint8Array, filename: string, proposedName: string, registry: FilamentRegistry): SyncImportResult
export function digestBytes(bytes: Uint8Array): Promise<string>
export function previewThemeImport(bytes: Uint8Array, filename: string, proposedName: string, registry: FilamentRegistry): Promise<ImportResult>
```

- [ ] Add `builder/src/__tests__/theme-import-service.spec.ts` failing tests for exact 1 MiB, multibyte overage, invalid UTF-8, malformed JSON, root/envelope rejection, versions 1–4, each migration edge, no mutation, custom CSS, filename fallback, and digest `crypto.subtle.digest('SHA-256', bytes)`.

```ts
it('rejects over-limit bytes before parsing', async () => {
  const registry = createThemeRegistry()
  const bytes = new Uint8Array(MAX_THEME_IMPORT_BYTES + 1)
  const result = await previewThemeImport(bytes, 'large.json', 'Large', registry)
  expect(result).toMatchObject({ valid: false, category: 'payload_too_large' })
})
```
- [ ] Run `cd builder && npm run test:unit -- --run src/__tests__/theme-import-service.spec.ts`; expect missing-module failure.
- [ ] Implement synchronous bounded parse/migrate and separate async digest. Reuse `validateThemeState`, `validateFoundationState`, `deserializeTheme`, and `serializeCanonicalTheme`; never change canonical V4 keys.
- [ ] Run the focused test; expect PASS. Commit `Feature: add versioned theme import domain`.

## Task 2: Persistent crash-safe fresh-theme import

**Files:** Create `builder/src/utils/local-theme-import.ts` and `builder/src/models/local-theme-import.model.ts`; modify `use-local-theme-persistence.ts` and `stores/theme.ts`; create `builder/src/__tests__/local-theme-import.spec.ts` and focused crash-boundary tests.

**Interfaces:**

```ts
export type ImportMarker = { digest: string; recordId: string; name: string; status: 'prepared'|'complete'|'failed' }
export type FreshThemeImport = { operationId: string; payloadDigest: string; state: ThemeStateV4; name: string }
export type ImportCommitResult = { ok: true; record: LocalThemeRecord } | { ok: false; error: string }
export function importFreshLocalTheme(storage: Storage, input: FreshThemeImport, now: () => number): ImportCommitResult
```

- [ ] Add failing tests for marker key `ftb-theme-import:<operationId>`, deterministic record ID, duplicate retry, altered digest, failed active flush, and crashes after marker/state/history/index/active writes. Assert old themes, old histories, old index entries, and old active pointer remain usable.

```ts
it('retains one imported record across store reload and retry', () => {
  const pinia = createPinia()
  const store = useThemeStore(pinia)
  const input = { operationId: 'a'.repeat(64), payloadDigest: 'b'.repeat(64),
    name: 'Imported', state: createDefaultThemeState() }
  const first = store.importFreshTheme(input)
  store.$dispose()
  const restored = useThemeStore(createPinia())
  expect(restored.importFreshTheme(input)).toEqual(first)
  expect(restored.themes.filter(record => record.name === 'Imported')).toHaveLength(1)
})
```
- [ ] Run `cd builder && npm run test:unit -- --run src/__tests__/local-theme-import.spec.ts`; expect failure.
- [ ] Implement: flush active pending save first; prepare marker; write/verify new state and history; publish index; publish active pointer; verify all; mark marker complete. On reload, marker recovery verifies exact state/history/index and returns the existing record. Never remove old records and never mutate old histories.
- [ ] Expose through `useLocalThemePersistence` and `useThemeStore` without component storage writes. Run focused transaction tests; expect PASS. Commit `Feature: add crash-safe local theme import`.

## Task 3: Import UI and pairing control

**Files:** Create `use-theme-import.ts`, `ThemeImportDialog.vue`, `ThemeImportSummary.vue`, `ThemePairingControl.vue`, their dedicated models and component tests; wire existing BuilderShell/toolbar composition; add styles only through `app.css` and its existing imported stylesheets. Add the first browser-import case in `e2e/ftb-022-versioned-theme-import-mcp.spec.ts`.

**Interfaces:**

```ts
export type ThemeImportUiState = { preview: ImportPreview|null; filename: string; proposedName: string; error: string|null; open: boolean }
export type ThemePairing = { pairingId: string; tabKey: Uint8Array; sessionId: string|null; expiresAt: number|null }
export function createTabPairing(): { pairingId: string; tabKey: Uint8Array }
export type ThemeImportUi = { chooseFile(file: File): Promise<void>; confirm(): Promise<ImportCommitResult>; cancel(): void }
```

- [ ] Add `e2e/ftb-022-versioned-theme-import-mcp.spec.ts` first test using the imported `builderBaseUrl` from `e2e/urls.ts`, `page.setInputFiles`, and fixture `e2e/fixtures/theme-import/v1.json`; assert import control, pairing control, preview isolation, editable name, cancel, and confirm.
  Import UI is testable before the relay exists; the pairing control remains disabled until bootstrap reports enabled. Task 6 wires the control to the backend rather than requiring a nonexistent backend in this task.

```ts
test('browser import previews before creating a theme', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles({ name: 'legacy.json',
    mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":1,"colors":{"primary":"#123456"}}') })
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Theme name' }).fill('Imported example')
  await page.getByRole('button', { name: 'Cancel import' }).click()
  await expect(page.getByRole('button', { name: /Manage themes/ })).not.toContainText('Imported example')
})
```
- [ ] Run `COMPOSE_E2E=1 npx playwright test e2e/ftb-022-versioned-theme-import-mcp.spec.ts --grep 'browser import'`; expect failure.
- [ ] Implement `ThemePairingControl.vue` plus import dialog/summary; generate `crypto.getRandomValues(new Uint8Array(32))`; send tab key only through the relay client header; disable sensitive Playwright tracing/HAR and redact console/network diagnostics. Use `File.size` before `arrayBuffer`, pure parse/migrate, async digest, and Pinia only on confirmation.
- [ ] Put styles only in `builder/src/app.css`; keep every component <=100 lines. Run builder type/unit/build and the focused Playwright test; expect PASS. Commit `Feature: add browser import and pairing UI`.

## Task 4: Application-owned bounded stdio command

**Files:** Create `demo/app/Console/Commands/ServeLocalThemeMcp.php`, `demo/app/Mcp/Transport/BoundedStdioTransport.php`, `demo/app/Mcp/Servers/LocalThemeServer.php`, `demo/config/local-theme-relay.php`, and `demo/tests/Unit/Mcp/BoundedStdioTransportTest.php` plus command feature tests. Keep tool registration empty until Task 7; test initialize/tools-list response rather than requiring future tool implementations.

**Interfaces:**

```php
final class BoundedStdioTransport implements \Laravel\Mcp\Server\Contracts\Transport
{
    public const MAX_LINE_BYTES = 6_291_456 + 65_536;
    public const MAX_RESPONSE_BYTES = 6_291_456 + 65_536;
    public function __construct(private int $maxLineBytes = self::MAX_LINE_BYTES) {}
    public static function fromStreams($input, $output): self;
    public function readLine(string $line): string;
    public function onReceive(Closure $handler): void;
    public function run(): void;
    public function send(string $message): void;
    public function stream(Closure $stream): void;
}
final class LocalThemeServer extends \Laravel\Mcp\Server {}
```

Use the exact constants `MAX_LINE_BYTES = 6_291_456 + 65_536` and `MAX_RESPONSE_BYTES = 6_291_456 + 65_536` in code.

- [ ] Add `demo/tests/Unit/Mcp/BoundedStdioTransportTest.php` failing tests for `MAX_LINE_BYTES`, `MAX_LINE_BYTES+1`, multibyte split chunks, newline at the boundary, incomplete EOF, notification, bounded response, and no output except JSON-RPC.
- [ ] Use this representative failing test before implementation:

```php
public function test_command_reads_exactly_one_bounded_json_rpc_line(): void
{
    $transport = BoundedStdioTransport::fromStreams(fopen('php://memory', 'r+'), fopen('php://memory', 'w+'));
    $this->expectExceptionMessage('stdio_message_too_large');
    $transport->readLine(str_repeat('a', BoundedStdioTransport::MAX_LINE_BYTES + 1));
}
```

- [ ] Run `cd demo && php artisan test --filter=BoundedStdioTransportTest`; expect failure.
- [ ] Implement chunked reads or `fgets(STDIN, MAX_LINE_BYTES + 2)` with newline/EOF length checks before allocation; reject oversize and invalid UTF-8; bound stdout before `fwrite`. Implement all four installed interface methods exactly.
- [ ] Add `ServeLocalThemeMcp` with command `ftb:mcp`: create `ProcessScope`; bind it with `app()->instance(ProcessScope::class, $scope)`; create `BoundedStdioTransport`; `app()->makeWith(LocalThemeServer::class, ['transport'=>$transport])`; call `$server->start(); $transport->run();`. Register only under `FTB_LOCAL_MCP_ENABLED=true` and local/testing. Do not edit Boost or use `Registrar::local`.
- [ ] Add a real JSON-RPC initialize/list test, not a source-text absence assertion. Run `docker compose exec -T demo-php php artisan ftb:mcp` with a JSON-RPC initialize and tools/list request; expect bounded JSON responses. Commit `Feature: add bounded local MCP command`.

## Task 5: Relay storage, process scope, locks, and exact lifecycle

**Files:** Create the concrete `demo/app/Mcp/ThemeRelay/` classes listed in the file map, with separate `RelayClock`, `RelayStore`, `LockHandle`, `RelayLifecycleContract`, and `AuthorizationResult` contract files, and `RelayStoreTest.php`/`RelayLifecycleTest.php` under `demo/tests/Unit/Mcp/`.

**Interfaces:**

```php
final readonly class ProcessScope { public function __construct(public string $processId) {} }
final readonly class PairingRecord { public function __construct(public string $pairingId, public string $tabKeyHash, public string $processId, public string $sessionId, public int $expiresAt) {} }
final readonly class OperationRecord { public function __construct(public string $operationId, public string $kind, public string $pairingId, public string $processId, public string $digest, public string $status, public int $expiresAt) {} }
interface RelayClock { public function now(): int; }
interface RelayStore { public function read(string $key): ?string; public function atomicWrite(string $key, string $value): void; public function delete(string $key): void; public function lock(string $key): LockHandle; }
interface LockHandle { public function release(): void; }
interface RelayLifecycleContract {
    public function approve(string $pairingId, string $tabKeyHash, string $processId): void;
    public function heartbeat(string $pairingId, string $processId): void;
    public function authorize(string $pairingId, string $processId, int $at): AuthorizationResult;
}
final readonly class AuthorizationResult { public function __construct(public bool $ok, public ?string $category) {} }
```

- [ ] Add failing unit tests for safe `/tmp` child mode `0700`, unsafe repository path rejection, global session-index lock, per-operation lock, atomic rename, cleanup after receipt/expiry, 5-minute pairing, 30-minute user/tool idle, 8-hour absolute, 15-second heartbeat, 45-second lease, and process/cross-session denial.
- [ ] Use this representative failing test:

```php
public function test_heartbeat_does_not_extend_user_idle_or_cross_process_scope(): void
{
    $this->assertSame(15, config('local-theme-relay.heartbeat_seconds'));
    $this->assertSame(45, config('local-theme-relay.lease_seconds'));
    $this->assertSame(1800, config('local-theme-relay.idle_seconds'));
}
```

- [ ] Run `cd demo && php artisan test --filter='RelayStoreTest|RelayLifecycleTest'`; expect failure.
- [ ] Implement the stores under the same container root with no DB/cache; process identity is created once by `ServeLocalThemeMcp`, never accepted from tool args. Heartbeat/poll do not reset user/tool idle. `pagehide` is best effort; lease expiry is authoritative.
- [ ] Add tests for status transitions and no secret/raw payload in errors/logs/responses. Run focused PHP tests; expect PASS. Commit `Feature: add bounded local theme relay state`.

## Task 6: Exact same-origin HTTP relay routes

**Files:** Modify `demo/routes/web.php` and `demo/config/local-theme-relay.php`; create focused controllers/requests under `demo/app/Http/{Controllers,Requests}/LocalThemeRelay/`, middleware `ValidateLocalThemeRelay.php`, builder DTOs/client, and `demo/tests/Feature/Mcp/LocalThemeRelayRoutesTest.php`. Wire Task 3's pairing control through `use-theme-pairing.ts` here.

**DTOs:**

```ts
type BootstrapResponse = { version: 1; origin: 'http://127.0.0.1:4175'; host: '127.0.0.1:4175'; csrfToken: string; enabled: true }
type PairRequest = { version: 1; pairingId: string }
type ImportPreviewDto = Omit<ImportPreview, 'state'>
type BrowserEnvelope = { version: 1; sessionId?: string; operationId?: string; digest?: string; revision?: number; received?: true; preview?: ImportPreviewDto }
type OperationResult = { version: 1; operationId: string; kind: 'list'|'export'|'import'; status: 'pending'|'approved'|'rejected'|'expired'|'disconnected'; recordId?: string; errorCategory?: string }
type TestRelayClient = { request(path: string, key: Uint8Array, body: Record<string, unknown>): Promise<{ headers: Headers; body: string; json(): Promise<Record<string, unknown>> }> }
declare const relay: TestRelayClient
```

- [ ] Add failing feature tests for every exact route in the spec: bootstrap, pairings create/claim/approve, sessions poll/heartbeat/disconnect, operation payload/receipt/preview/authorize-apply/result. Test CSRF, session cookie, exact origin, host/Fetch Metadata fallback, required `X-FTB-Tab-Key`, body-secret rejection, unknown fields, generic unknown-credential errors, and disabled production/default.
- [ ] Use this representative failing route test; the header is intentionally present and only its absence from all other surfaces is asserted:

```php
public function test_pair_uses_only_the_tab_key_header_and_never_echoes_it(): void
{
    $key = str_repeat('a', 64);
    $response = $this->withHeader('Origin', 'http://127.0.0.1:4175')->withHeader('X-FTB-Tab-Key', $key)->postJson('/local-theme/relay/pairings', ['version' => 1, 'pairingId' => 'pair-1']);
    $response->assertStatus(200)->assertJsonMissing(['tabKey' => $key]);
    $this->assertStringNotContainsString($key, (string) $response->getContent());
}
```

- [ ] Run `cd demo && php artisan test --filter=LocalThemeRelayRoutesTest`; expect failure.
- [ ] Implement routes in `demo/routes/web.php` with the exact DTOs and controllers. Default config is disabled and origin `http://127.0.0.1:4175`; require env local/testing + flag. Hash the only accepted tab-key header, never include it in body/response/log/error. Do not use preview iframe postMessage origin policy for relay authentication.
- [ ] Run focused route tests; expect PASS. Commit `Feature: add same-origin local theme relay routes`.

## Task 7: MCP tool schemas and async operations

**Files:** Create `demo/app/Mcp/Tools/LocalTheme{Pair,List,Export,ImportPreview,ImportStatus,OperationStatus,Disconnect}.php`, register those classes only in `LocalThemeServer.php`, and create `demo/tests/Feature/Mcp/LocalThemeToolsTest.php` using the actual server's serialized tool definitions.

**Tools:** `local_theme_pair`, `local_theme_list`, `local_theme_export`, `local_theme_import_preview`, `local_theme_import_status` alias, `local_theme_operation_status`, `local_theme_disconnect`.

**Test interface:** `interface LocalThemeToolRegistry { public function tool(string $name): ?array; }` is bound by the application test harness to the registered direct server; the returned array contains the exact `inputSchema` array.

- [ ] Add failing MCP feature tests asserting exact tool names/schemas, `additionalProperties:false`, no owner/process/confirmed/force/apply arguments, repeated same pairing ID idempotence within one process, and generic unknown credential responses.
- [ ] Use this representative failing tool test:

```php
public function test_operation_status_is_the_common_async_retrieval_tool(): void
{
    $tool = app(LocalThemeToolRegistry::class)->tool('local_theme_operation_status');
    $this->assertNotNull($tool);
    $this->assertSame(['operation_id'], array_keys($tool['inputSchema']['properties']));
}
```

- [ ] Run `cd demo && php artisan test --filter=LocalThemeToolsTest`; expect failure.
- [ ] Implement thin tools against relay services. List/export are async and return operation IDs; operation status serves all kinds. Export returns bounded one-shot canonical V4 JSON only after live-pair membership revalidation and is consumed by the authorized MCP client. Preview stores bounded raw bytes, deletes after browser receipt/rejection/expiry, and never applies. Import status is an exact import-only alias.
  For exports, the producer browser POSTs canonical JSON to the result route. Only the owning MCP process consumes that cached result through operation status; browser receipt must not delete it before the client reads it. Import payload receipt is the distinct browser acknowledgement that deletes the original input bytes.
- [ ] Test cross-process/session denial, replay, altered digest, stale revision, CSS rejection, raw-payload/secret/log leakage, and no tool apply bypass. Run focused tests; expect PASS. Commit `Feature: expose async local theme MCP tools`.

## Task 8: Browser relay polling and authoritative confirmation

**Files:** Create `builder/src/composables/use-theme-relay.ts`, `builder/src/dtos/theme-relay.dto.ts`, focused `theme-relay*.spec.ts` tests and implementation modules split under 100 lines. Reuse Task 1's import service, Task 2's Pinia import method, Task 3's preview dialog, and Task 6's session client.

**Interfaces:**

```ts
export type OperationNotice = { operationId: string; kind: 'list'|'export'|'import'; status: 'pending'|'approved'|'rejected'|'expired'|'disconnected'; themeId?: string }
export type ApplyGrant = { version: 1; status: 'pending'; grantId: string; grantExpiresAt: number }
export type BrowserRelay = { poll(): Promise<OperationNotice[]>; heartbeat(): Promise<void>; receivePayload(id: string): Promise<PayloadDto>; acknowledgePayload(id: string, digest: string): Promise<void>; submitPreview(id: string, preview: ImportPreviewDto): Promise<void>; authorizeApply(id: string, digest: string, revision: number, displayName: string): Promise<ApplyGrant>; disconnect(): Promise<void> }
export type PayloadDto = { operationId: string; rawJson: string; filename: string; proposedName: string; digest: string; byteLength: number }
export type ApprovedImport = { operationId: string; payloadDigest: string; expectedRevision: number; state: ThemeStateV4; name: string }
export type ThemeStoreImportBoundary = { revision: number; importFreshTheme(input: FreshThemeImport): ImportCommitResult }
export function applyApprovedImport(store: ThemeStoreImportBoundary, input: ApprovedImport): ImportCommitResult
```

- [ ] Add failing Vitest tests for polling, payload acknowledgement deletion, digest mismatch, revision mismatch, pair/session expiry, revoke, duplicate confirmation, marker retry after reload, and no Pinia/localStorage mutation during preview.
- [ ] Use this representative browser test; the tab key is intentionally present in the one approved header:

```ts
it('sends the tab key only in the approved header and never in body or result', async () => {
  const key = new Uint8Array(32).fill(7)
  const request = await relay.request('/local-theme/relay/sessions/heartbeat', key, { version: 1, sessionId: 's-1' })
  expect(request.headers.get('X-FTB-Tab-Key')).toBeTruthy()
  expect(request.body).not.toContain('7,7,7')
  expect(JSON.stringify(await request.json())).not.toContain('7,7,7')
})
```

- [ ] Run `cd builder && npm run test:unit -- --run src/__tests__/theme-relay.spec.ts`; expect failure.
- [ ] Implement 15-second heartbeat and polling timers without extending user/tool idle; best-effort `pagehide`; stop all timers on disconnect. On confirmation revalidate session/tab key, operation expiry/single use, digest/bytes/name/version, current revision, migration/final V4 validation, and fresh target. Call only the persistent Pinia fresh-theme operation from Task 2.
  The authorize-apply response is a 5-second, operation-bound grant, not a completed import. Apply synchronously only after rechecking local revision and grant validity; POST successful local commit to the result endpoint with grant ID, record ID, and digest. Approved status is published only after that acknowledgement. Lost acknowledgement uses Task 2's persistent marker; it never creates a second record. Operation kind remains `import` through preview/apply. Read-only list/export requests execute the existing store/serializer and POST bounded results; they never open an import confirmation.
- [ ] Run `cd builder && npm run type-check && npm run test:unit && npm run build`; expect PASS. Commit `Feature: connect browser relay confirmation`.

## Task 9: Real stdio + Playwright acceptance

**Files:** Extend `e2e/ftb-022-versioned-theme-import-mcp.spec.ts`; create `e2e/support/stdio-mcp-client.ts`, its separate model file, and bounded fixture files under `e2e/fixtures/theme-import/`. Configure sensitive-test artifacts explicitly, without disabling unrelated test diagnostics.

**Helper interface:**

```ts
export type StdioMcpClient = { initialize(): Promise<{ protocolVersion: string }>; listTools(): Promise<string[]>; call(name: string, args: Record<string, unknown>): Promise<unknown>; close(): Promise<void> }
export function startStdioMcpClient(command: string[], env?: Record<string,string>): Promise<StdioMcpClient>
export const composeLocalThemeCommand = ['docker','compose','exec','-T','demo-php','php','artisan','ftb:mcp']
```

- [ ] Add fixture files `e2e/fixtures/theme-import/v1.json`, `v2.json`, `v3.json`, `v4.json`, and `oversized.json`; each <=100 lines except generated oversized fixture created in test memory.
- [ ] Write this failing Playwright journey before implementation:

```ts
import { test, expect } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'

test('real ftb:mcp pair previews and confirms one fresh local theme', async ({ page }) => {
  const client = await startStdioMcpClient(composeLocalThemeCommand)
  await client.initialize()
  expect(await client.listTools()).toEqual(expect.arrayContaining(['local_theme_pair', 'local_theme_operation_status']))
  await page.goto(builderBaseUrl)
  await page.getByRole('button', { name: /pair local client/i }).click()
  const pairingId = await page.getByTestId('pairing-id').textContent()
  expect(pairingId).toMatch(/^[A-Za-z0-9_-]{16,}$/)
  await client.call('local_theme_pair', { pairing_id: pairingId })
  await page.getByRole('button', { name: /approve pairing/i }).click()
  await client.call('local_theme_import_preview', { raw_json: '{"schemaVersion":1,"colors":{"primary":"#123456"}}', filename: 'v1.json', proposed_name: 'Imported' })
  await expect(page.getByRole('dialog', { name: /import preview/i })).toContainText('1 → 2 → 3 → 4')
  await page.getByLabel(/theme name/i).fill('Imported Marketing')
  await page.getByRole('button', { name: /confirm import/i }).click()
  await expect(page.getByText('Imported Marketing')).toBeVisible()
  await client.close()
})
```

- [ ] Use `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-022-versioned-theme-import-mcp.spec.ts`; expect failure before implementation.
- [ ] Implement JSON-RPC helper with bounded stdout/stderr, protocol capture, sensitive trace/HAR disabled, and redaction of tab key/raw JSON. Add replay, revoke, 45-second lease, 30-minute inactivity, cross-session, export one-shot, and crash-retry assertions. No `builderUrl`, `setup`, or undefined fixture helper: import `composeBaseUrl`/`builderBaseUrl` from `e2e/urls.ts` and define all fixtures in the file/helper.
- [ ] Run `docker compose -f compose.dev.yaml up -d` then the exact Playwright command; expect PASS. Commit `Tests: verify versioned import through real stdio and Playwright`.

## Task 10: Inventory, security evidence, and full regression

**Files:** Update `docs/ai-operability/demo-showcase-capability-inventory.md`, `TICKETS.md` FTB-022 only, and create `docs/superpowers/verification/2026-10-18-versioned-theme-import-mcp.md`; add focused inventory contract assertions to the existing Laravel capability inventory test.

- [ ] Add failing documentation test/assertion that the old FTB-021 “deferred to FTB-048” row is gone only for these capabilities and that rows name operation class, authorization, confirmation, and exact MCP status.
- [ ] Use this representative failing documentation assertion:

```php
public function test_ftb022_inventory_has_verified_local_theme_tools(): void
{
    $inventory = file_get_contents(base_path('../docs/ai-operability/demo-showcase-capability-inventory.md'));
    $this->assertStringContainsString('local_theme_operation_status', $inventory);
    $this->assertStringNotContainsString('builder.local-themes` |', $inventory);
}
```

- [ ] Run `cd demo && php artisan test --filter=CapabilityInventoryTest`; expect failure.
- [ ] Update inventory and write `docs/superpowers/verification/2026-10-18-versioned-theme-import-mcp.md` with command, class, interface, route, origin, CSRF, key-header, lock, temp-dir, response-bound, digest, crash-boundary, and Playwright evidence.
- [ ] Run `cd builder && npm run type-check && npm run test:unit && npm run build`; `cd ../demo && php artisan test`; `cd .. && COMPOSE_E2E=1 npx playwright test e2e/ftb-022-versioned-theme-import-mcp.spec.ts`; `git diff --check`.
- [ ] Inspect logs, responses, error messages, stdout/stderr, screenshots, traces, and HAR configuration. Assert no tab key, digest secret, raw JSON, filesystem path, or account-auth claim leaks. Assert no file mode changes with `git diff --summary`.
- [ ] Commit `Tests: record FTB022 security and capability evidence` after all checks pass.

## True Unresolved Decisions

1. None in the approved contract. The only runtime verification is selecting the actual production Compose service name when production evidence is run; development is concretely `demo-php`.
2. Whether the local-only feature is exercised in production remains intentionally disabled by configuration, not an implementation decision.
