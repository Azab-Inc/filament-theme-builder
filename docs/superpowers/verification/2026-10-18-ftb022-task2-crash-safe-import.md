# FTB022 Task 2 crash-safe import correction report

## Scope

Corrected the persistent fresh-theme import transaction only. No UI, MCP, dependency, or unrelated worktree changes were included.

## Corrections

- Import markers now bind explicit `operationId`, raw payload digest, normalized name, deterministic record ID, and canonical state/history fingerprint. Retry mismatches are rejected.
- Canonical V4 state, name, and operation identity are validated before pending theme saves or import writes.
- Malformed marker/index JSON is rejected without replacing the stored bytes or falling back to an empty index.
- Publication uses the shared verified-write helper: state/history/index are verified together, then the active pointer and completion marker are verified in order. Failure/readback rollback restores old keys and removes an uncommitted marker when cleanup succeeds.
- A prepared marker remains sufficient to recover an interrupted publication; exact readback is required before recording `complete`.
- Removed the unused `failed` marker state and expanded import persistence code into readable helpers.

## Regression coverage

Added cases for changed state/name with unchanged raw digest, invalid canonical state, malformed marker/index, prepared and complete marker write failures, state/history/index/active write failures, readback corruption, preserved old theme/history/index/active data, retries, and recovery after interrupted writes.

## Verification

- Focused import tests: 22 passed.
- Full builder unit suite: 85 test files, 387 tests passed. The initial 120-second invocation timed out; a fresh run with a 360-second limit completed successfully.
- `npm run type-check`: passed.
- `npm run build`: passed; Vite production build completed.
- `git diff --check`: passed.

## Rollback failure follow-up

- `writeVerified` now verifies each restoration, attempts all prior-key restorations, and returns `rollbackFailed` plus deterministic `unrestoredKeys` and an error naming those keys instead of swallowing restoration failures.
- Import publication stages state/history/index before the active pointer. Unresolved core rollback retains the prepared marker and reports recovery required. If active-pointer restoration itself fails, the staged imported record remains indexed and complete in state/history, so the persisted pointer still names a valid record; the marker remains prepared and the result is an explicit recovery error.
- Marker cleanup is attempted only after a fully successful rollback, and its result is verified. Cleanup failure retains the prepared marker and returns an explicit recovery error. A failed complete-marker write likewise keeps the validated publication recoverable; retry or startup recovery finalizes it without creating a second record.
- Added failure-injection coverage for restoration failures on imported state, history, index, and active pointer, marker cleanup failure, completion-marker retry, and the generic storage rollback result. Updated the existing storage assertion to check the newly observable rollback metadata.
- Follow-up verification: focused storage/import tests **45 passed**; full builder unit suite **87 files / 391 tests passed**; type-check passed; build passed; diff check passed.
