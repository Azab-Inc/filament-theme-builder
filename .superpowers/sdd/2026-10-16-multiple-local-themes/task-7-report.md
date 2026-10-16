# Task 7 — Local theme unit acceptance audit

## Result

**Blocked: two newly explicit store assertions expose implementation failures.**
No production changes were made pending confirmation that the defects should be corrected within this test-focused task.

FTB-020 preset application is not implemented; its active-theme-only assertion is explicitly deferred and no preset seam was added.

## Coverage audit

- **Validation and storage:** Existing tests cover all four storage key contracts, safe and duplicate IDs, malformed collections and records, invalid state/history/cursors, legacy migration (including sequential schema migration), idempotence, no-overwrite, orphan keys, access/quota errors, partial-write rollback, and legacy byte preservation on failure.
- **Collection operations:** Existing tests cover unique creation, trimmed/blank rename, duplicate state and fresh history, deletion of active/non-active records, fallback selection, last-theme recreation, missing IDs, and persistence errors. The new test also verifies rename leaves active canonical state unchanged.
- **Autosave:** Existing deterministic fake-timer tests cover the 300 ms boundary, independent IDs, switch/delete flushes, and cancellation/stale-timer safety.
- **History:** Existing tests cover redo-branch truncation. The new reopen test fails because `canRedo` is false after switching back to the first theme.
- **Storage failure/accessibility:** Existing assertions cover failed-save truthfulness, recoverability/editability, storage error status with polite live announcement, and that dialog controls remain available.
- **Preset isolation:** Deferred to FTB-020 as directed; current local-theme coverage does not claim to test a preset.

## Newly observed failures

1. `createTheme()` does not select the created record as active, contrary to FTB-021 create semantics. The added active-ID assertion failed (`theme-1000` remained active instead of `theme-1000-2`).
2. After editing, saving, undoing, switching away, and reopening, the first theme did not expose its redo branch (`canRedo` was false). This needs investigation before asserting persisted redo behavior as complete.

The focused run before adding these assertions passed (5 files, 52 tests). The expanded focused run failed on the two assertions above (1 file failed; 7 passed; 58 passed, 2 failed). Full unit testing also failed only on those assertions (78 passed files; 331 passed, 2 failed tests). `npm run type-check` passed and `npm run build` passed.

## Worktree

`builder/src/__tests__/local-theme-store.spec.ts` and this report were edited for this task. Existing unrelated worktree modifications were left untouched. No commit was created because the required unit verification is blocked by the two in-scope behavior failures.

## Completion — 2026-10-16

Both FTB-021 defects are fixed without adding a second history authority:

- Store `createTheme()` now reuses the existing `openTheme()` boundary, so a successfully created record is immediately active. Storage-failure handling preserves the original error and active record.
- `useThemeHistory()` now invalidates `canRedo` when persisted per-theme history is replaced, even when the cursor value is unchanged. The existing history array remains the sole canonical in-memory authority.
- Regression coverage verifies create selection and edit/save/undo/switch-away/reopen/redo behavior. The affected transaction setup now explicitly reopens the old theme to retain its active-pointer failure intent under the approved create semantics.
- FTB-020 preset isolation remains explicitly deferred; no preset capability or seam was added.

## Verification

- Focused local-theme tests: **PASS** — 3 files, 18 tests.
- Full unit suite: **PASS** — 79 files, 333 tests.
- `npm run type-check`: **PASS**.
- `npm run build`: **PASS**.
- `git diff --check`: **PASS**.
- Touched builder files remain at or below 100 lines.

Commit: `fa89fdc` (`Fix - Frontend: complete local theme acceptance behavior`).
