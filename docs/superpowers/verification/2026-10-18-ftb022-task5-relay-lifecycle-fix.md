# FTB022 Task 5 Relay Lifecycle Review Fix

## Findings addressed

- Pairing creation/approval, heartbeat, authorization, operation/grant transitions, receipt, and cleanup now serialize through `session-index`; record-specific mutations also take their record lock and re-read state after locking.
- Private relay roots must be direct, owned children of the sticky system temp directory with mode `0700`. The repository root and descendants are rejected.
- A valid receipt removes payload, result, and operation records. Expiry cleanup removes all expired operation artifacts under the same lock ordering. Session cleanup removes stale session-scoped records.
- Added deterministic interleaving tests for approval, heartbeat, and authorization, along with locking, cleanup, replay, plaintext-leak, and unsafe-root tests.
- No routes, controllers, MCP tools, browser code, dependencies, or services were added.

## Verification

- Focused relay tests: `php artisan test --filter='RelayStoreTest|RelayLifecycleTest|RelayOperationTest|RelayCleanupTest|RelayLifecycleLockTest|RelaySecurityTest|RelayGrantLockTest|RelayPairingRaceTest'` — **20 passed**.
- Pint: `composer lint:check` — **passed**.
- PHPStan: `composer types:check` — **passed, 0 errors**.
- Full Laravel suite: `php artisan test` — **211 passed**.
- `git diff --check` — **passed**.
- New relay and focused test PHP files remain at or below 100 lines.

## Follow-up review closure

- Added an explicit repository-descendant root rejection test.
- Disclosure tests exercise representative tab-secret and raw-payload values across fixed errors, every captured log level, and serialized authorization/operation result metadata. No HTTP response surface exists in this storage-only task; no route/controller response was fabricated.
- Lock verification uses two independent file handles with a non-blocking `flock` check, plus deterministic pre-lock interleavings that mutate pairing state before lifecycle locks are granted. These tests verify serialization and revalidation without claiming separate-process scheduling behavior.
- `RelayRecordLock::release()` now releases the session-index lock in `finally` if releasing the record lock throws; a throwing-lock test verifies it.
- Follow-up focused tests: **15 passed**.
- Follow-up Pint, PHPStan, and `git diff --check`: **passed**; full Laravel suite: **211 passed**.
