# Task 3a report: local theme persistence boundary

Implemented the focused persistence composable and tests without wiring `stores/theme.ts`.

- Added fake-timer coverage for the 300 ms persistence delay, independent per-ID state/history, switching and stale callback safety, delete flush/cancel, and storage errors.
- Added a switch-failure regression test. It initially failed because the composable changed the active refs before writing the active ID. The composable now commits the in-memory switch only after that write succeeds.
- `ThemeStateV4` and editor-facing store wiring were left unchanged.

Verification from `builder/`:

- `npm run type-check` — passed.
- `npm run test:unit -- --run src/__tests__/local-theme-persistence.spec.ts src/__tests__/theme-state-icons-and-history.spec.ts src/__tests__/theme-state-persistence-recovery.spec.ts` — passed (17 tests).
- `npm run build` — passed.

## Review fix round 1

- Replaced the superficial redo-branch assertion with a history/persistence test that creates two snapshots, undoes to the earlier cursor, adds a new edit, then verifies persisted history contains the new branch and excludes the discarded redo snapshot.
- Added a failure-path assertion using an edit assigned to `activeState`; after the timed save fails, the active edit remains readable and further editable.
- `createTheme()` and `duplicateTheme()` now report storage failures through `storageError`, only expose records in the in-memory collection after state/history and index writes succeed, and clean up state/history if the index write fails. Duplicate source-load failures are also exposed.
- Split the persistence tests across focused specs; each builder file stays within the 100-line limit.
- Verification: six focused persistence/history/recovery spec files pass (22 tests); type-check, build, and `git diff --check` pass. The persistence composable and each persistence spec are at or below 100 lines.
