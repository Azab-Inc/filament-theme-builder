# FTB022 Task 2 crash-safe import correction report

## Scope

Corrected the persistent fresh-theme import transaction only. No UI, MCP, dependency, or unrelated worktree changes were included.

## Corrections

- Import markers now bind explicit `operationId`, raw payload digest, normalized name, deterministic record ID, and canonical state/history fingerprint. Retry mismatches are rejected.
- Canonical V4 state, name, and operation identity are validated before pending theme saves or import writes.
- Malformed marker/index JSON is rejected without replacing the stored bytes or falling back to an empty index.
- Publication uses the shared verified-write helper: state, history, index, active pointer, and final marker are verified as a transaction. Failure/readback rollback restores old keys and removes an uncommitted marker.
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
