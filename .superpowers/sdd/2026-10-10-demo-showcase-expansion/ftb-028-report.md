# FTB-028 implementation report

## Status

In progress. The reset implementation and deterministic snapshot are present, but the application test and browser gates could not be completed in this worktree because the checked-out `demo/vendor` tree is missing the declared `laravel/boost` development package (`Laravel\\Boost\\BoostServiceProvider`). No dependency installation was performed, per task instructions.

## Implemented

- Added `demo/database/demo-snapshot.sqlite` as the known-good seeded SQLite snapshot.
- Added `DemoResetService` with an exclusive lock, same-directory temporary copy, atomic rename, and full temporary-upload cleanup.
- Made `demo:reset` report database restoration and upload cleanup failures/results.
- Added ten-minute scheduling with scheduler overlap protection.
- Preserved the separate share store by keeping reset scope limited to the demo database and temporary uploads.
- Added the public showcase reset notice: “Demo data resets every 10 minutes.”
- Added focused PHP and Playwright-first tests for reset behavior, scheduler visibility, cleanup, share preservation, and UI disclosure.
- Marked FTB-028 in progress because runtime acceptance evidence is incomplete.

## Evidence collected

- New and changed PHP files pass `php -l`.
- Pint test passed for the changed PHP files.
- Snapshot opens through PDO and contains the deterministic seeded aggregate: 1 user, 2 customers, 2 products, and 2 orders.
- Both Compose files pass `docker compose ... config --quiet`.
- `git diff --check` passed.

## Blocked verification

- Focused PHP tests and `php artisan schedule:list` stop during Laravel bootstrap because `Laravel\\Boost\\BoostServiceProvider` is absent from `demo/vendor`.
- Playwright CLI cannot start its configured Laravel web server for the same bootstrap failure.
- PHPStan cannot bootstrap the Laravel application for the same reason.
- Full PHP tests, full Playwright, Compose health, and live scheduler verification remain to be run after the existing dependency environment is repaired outside this task.
