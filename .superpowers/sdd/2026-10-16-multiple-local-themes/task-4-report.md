# Task 4 report: manage multiple local themes in Pinia

## Status

Implemented and committed as `Feature: manage multiple local themes in Pinia`.

## Delivered

- Exposed readonly `themes`, `activeThemeId`, `activeThemeName`, and `storageError` from the Pinia theme store.
- Added store actions for create, open, rename, duplicate, and delete.
- Added collision-safe IDs, trimmed-name validation, timestamp updates, deterministic newest-theme fallback, and last-theme recreation.
- Kept persistence writes behind the reviewed local-theme persistence/storage boundary.
- Reset history when opening or selecting a duplicate so undo/redo state never crosses themes.
- Preserved the legacy persistence/recovery mirror and editor/recovery contracts.
- Added TDD coverage for initialization, state isolation, timestamps, invalid inputs, storage failures, active fallback, fresh duplicate history, and preset isolation.

## Verification

Passed:

- `npm run test:unit -- --run src/__tests__/local-theme-store.spec.ts src/__tests__/local-theme-persistence.spec.ts src/__tests__/local-theme-persistence-errors.spec.ts src/__tests__/local-theme-persistence-switch.spec.ts src/__tests__/local-theme-persistence-history.spec.ts src/__tests__/theme-state-icons-and-history.spec.ts src/__tests__/App.structure.spec.ts`
- `npm run type-check`
- `npm run build`

The complete `npm run test:unit` run has 4 failures in existing App/state tests that do not clear localStorage between mounts. They observe persisted collection state from an earlier test (`rawOverrides`/legacy expectations), while the focused Task 4 and persistence regression suites pass. No production workaround was added that would discard legitimate local-theme persistence.

## Scope notes

- No packages were added.
- Unrelated dirty worktree files were preserved.
- Touched maintainer-facing source files remain at or below 100 lines.

## Round 1 fixes

- Removed the synchronous `ftb-theme` initialization write and preserved legacy migration/recovery reads while seeding the new collection from the already-restored state.
- Reordered active deletion/recreation persistence and added rollback behavior so pointer failures retain a valid active record/pointer and publish `storageError`.
- Made `flush()` return metadata/index failures from timestamp updates.
- Kept `useThemeHistory` as the live history authority; persistence now receives immutable snapshots instead of maintaining a second live history authority.
- Added coverage for fallback ties, non-active deletion, pointer failures, metadata failures/updates, and invalid IDs.
- Isolated legacy-only and App export tests from intentional per-theme local storage.

Round 1 verification:

- Full unit suite: **77 files, 321 tests passed**
- `npm run type-check`: passed
- `npm run build`: passed
- `git diff --check`: passed

## Round 2 fix

Fixed the last-theme recreation rollback edge case. If replacement state/history and pointer writes succeed but the collection index fails, and restoring the old pointer also fails, the replacement remains indexed and persisted. The store now keeps the replacement as the active in-memory state/history, reports both failure causes through `storageError`, and never removes the records targeted by `ftb-theme-active`.

Added a regression test that forces index failure followed by pointer-rollback failure and verifies the active pointer resolves to present replacement records.

## Round 3 fix

Reworked active deletion and last-theme recreation to publish in a safer order: replacement records are written first, the index is published while retaining the old record, the new active pointer is published, and only then is the final index published and the old record removed. Index failures preserve the old pointer and records; pointer failures preserve both valid records and the old pointer. Added next-load regression coverage for repeated index failures and pointer failure after index success, including non-last active deletion.

## Round 4 regression

Added a storage fake that allows the first `ftb-themes` index write during last-theme recreation and rejects the second, final index write. The regression verifies that the persisted active pointer resolves to an indexed record after reload and that both state/history records remain retained, with no dangling pointer.

Focused regression verification:

- `npm run test:unit -- --run src/__tests__/local-theme-transaction.spec.ts`: passed (4 tests)

Final verification:

- `npm run test:unit`: passed (78 files, 325 tests)
- `npm run type-check`: passed
- `npm run build`: passed
- `git diff --check`: passed
