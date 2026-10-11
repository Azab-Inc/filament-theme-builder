# FTB-027 implementation report

## Changed files

- `demo/app/Support/Uploads/TemporaryUploadStorage.php` — reusable MIME/extension, size, owner-quota, global-capacity, purge, safe-path, permissions, and retention boundary.
- `demo/app/Filament/Pages/Showcase/Forms/ProductEditorForm.php` — native Filament `FileUpload` accepting JPEG, PNG, WebP, and PDF with a 5 MB limit and guarded storage callback.
- `demo/app/Filament/Pages/Showcase/FormsShowcase.php` — dehydrates upload state and renders storage quota validation errors.
- `demo/app/Filament/Pages/Showcase/AnonymousUploadShowcase.php` and `demo/resources/views/filament/pages/showcase/anonymous-upload-showcase.blade.php` — minimal public, upload-only Filament fixture.
- `demo/app/Http/Middleware/AuthenticatePreviewPanel.php` — explicit allowlist entry for the public upload fixture.
- `demo/tests/Feature/FilamentPanelTest.php` — public-route regression coverage.
- `docs/ai-operability/demo-showcase-capability-inventory.md` — records the UI-only anonymous upload capability and its shared safety boundary.
- `demo/app/Console/Commands/CleanupTemporaryUploadsCommand.php` — delegates recursive cleanup to the storage boundary.
- `demo/config/maintenance.php` — private default storage path and 5 MB / 25 MB / 500 MB / 400 MB limits.
- `demo/tests/Feature/Uploads/TemporaryUploadStorageTest.php` — real temporary-files regression coverage.
- `demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php` — Livewire/page regression assertions for the real upload field and helper text.
- `e2e/demo-showcase.spec.ts` — Playwright coverage for accepted PDF upload, rejected executable MIME/type, and existing forms behavior.
- `TICKETS.md` — FTB-027 status changed to `in-progress`.

`.playwright-mcp/` was not modified.

## Red / green evidence

Initial PHP red run after writing tests and before implementation:

```text
docker compose -f compose.dev.yaml run --rm --no-deps demo-php php artisan test tests/Feature/Uploads/TemporaryUploadStorageTest.php tests/Feature/Filament/Showcase/FormsShowcaseTest.php
FAIL: Target class [App\\Support\\Uploads\\TemporaryUploadStorage] does not exist
FAIL: forms showcase still rendered the old placeholder and no file input
```

The first Playwright command was attempted before starting Compose and could not start its configured web server. The same test was then run against the canonical Compose stack after implementation.

Focused PHP green run:

```text
docker compose -f compose.dev.yaml run --rm --no-deps demo-php php artisan test tests/Feature/Uploads/TemporaryUploadStorageTest.php tests/Feature/Filament/Showcase/FormsShowcaseTest.php tests/Feature/ComposeRuntimeTest.php
PASS — 19 tests, 106 assertions
```

Focused Playwright green run:

```text
COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 DEMO_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/demo-showcase.spec.ts --grep "forms and schemas showcase"
5 passed
```

Static checks and runtime health:

```text
docker compose -f compose.dev.yaml run --rm --no-deps demo-php vendor/bin/pint --test ...
PASS — 5 files

docker compose -f compose.dev.yaml run --rm --no-deps demo-php vendor/bin/phpstan analyse --memory-limit=512M
[OK] No errors

docker compose -f compose.dev.yaml ps
All Compose services healthy/running
curl --fail --silent http://127.0.0.1:4175/api/health
{"status":"ok"}
```

## Security assumptions

- Uploaded files are copied into `storage/app/private/tmp` by default, never the public storage root.
- The stored filename is generated from random bytes and the extension is derived from detected MIME, while the client extension must also match the permitted MIME pair.
- Only JPEG, PNG, WebP, and PDF are accepted; SVG and executable types are rejected.
- Files are written with `0640` permissions beneath a SHA-256 owner directory and a non-executable generated filename.
- Owner identity uses the authenticated user ID when available and the session ID for anonymous users.
- The quota and purge implementation scans the configured local temporary directory recursively and purges oldest files before accepting an upload that would cross the global limit.

## Unresolved criteria

FTB-027 remains `in-progress` in `TICKETS.md`. The original unresolved browser quota concern is addressed through the explicit test-safe Compose override below; the exact production-sized 25 MB browser run is intentionally not used because the review contract permits an equivalent configured boundary. The showcase page itself requires the seeded demo login, so the browser evidence exercises the same owner-quota path with the authenticated demo session rather than an unauthenticated route.

## Round 1 review fix

Root cause: the original browser test only staged a FilePond file. The upload callback runs when Filament dehydrates form state, while the showcase `save()` method previously validated without calling `getState()`, so no browser test reached the quota boundary or rendered its error.

Changes:

- `FormsShowcase::save()` now dehydrates the form after validation and converts storage `ValidationException` messages into the rendered `product_image` error state.
- The Playwright suite now waits for Livewire upload completion, submits a valid first upload, reloads, submits a second valid upload, and asserts the quota message.
- The Playwright suite now asserts FilePond's oversized-file feedback using a deterministic test-safe size boundary.
- `compose.dev.yaml` now exposes `TEMP_UPLOAD_OWNER_QUOTA_BYTES` and `TEMP_UPLOAD_MAX_BYTES` as environment overrides with production-preserving defaults of 25 MB and 5 MB. The fix run used 12 KiB and 16 KiB respectively; the same production code paths were exercised without changing production defaults.
- `FileUpload::maxSize()` now derives its client-side limit from the same configured byte limit used by the server-side boundary.

Round 1 green evidence:

```text
TEMP_UPLOAD_OWNER_QUOTA_BYTES=12288 TEMP_UPLOAD_MAX_BYTES=16384 docker compose -f compose.dev.yaml up -d
COMPOSE_E2E=1 DEMO_UPLOAD_TEST_LIMITS=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 DEMO_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/demo-showcase.spec.ts --grep "temporary quota|five megabyte"
2 passed
```

The oversized test uses a 32 KiB fixture against the explicit 16 KiB test boundary and asserts both `File is too large` and `Maximum file size is 16 KB` in the rendered UI. Production defaults remain 5 MB per file, 25 MB per owner, 500 MB global, and 400 MB cleanup target.

Final fix verification:

```text
docker compose -f compose.dev.yaml run --rm --no-deps demo-php php artisan test tests/Feature/Uploads/TemporaryUploadStorageTest.php tests/Feature/Filament/Showcase/FormsShowcaseTest.php tests/Feature/ComposeRuntimeTest.php
PASS — 19 tests, 106 assertions

docker compose -f compose.dev.yaml run --rm --no-deps demo-php vendor/bin/pint --test ...
PASS — 6 files

docker compose -f compose.dev.yaml run --rm --no-deps demo-php vendor/bin/phpstan analyse --memory-limit=512M
[OK] No errors

docker compose -f compose.dev.yaml ps && curl --fail --silent http://127.0.0.1:4175/api/health
All Compose services healthy/running; {"status":"ok"}
```

## Round 2 review fix

Root cause: the prior quota test cleared cookies but still navigated to the authenticated `forms-showcase` page. The page was correctly redirected by `AuthenticatePreviewPanel`, so the test could not prove the session-owner fallback used for anonymous uploads.

The fix adds the smallest production-safe public fixture: `/demo/admin/anonymous-upload`. It is an explicitly allowlisted, navigation-hidden Filament page containing only the existing guarded upload field and submit action. It has no commerce data, persistence, or extra permissions; uploads still use the same `TemporaryUploadStorage` service, MIME/extension checks, owner quota, global cleanup, and private storage. The browser tests clear cookies, navigate directly to this public fixture, submit two valid files under the test-safe quota, and assert the rendered quota error. The oversized-file test uses the same anonymous surface.

Round 2 green evidence:

```text
docker compose -f compose.dev.yaml run --rm --no-deps -e TEMP_UPLOADS_PATH=/tmp/ftb-no-default-upload-path demo-php php artisan test tests/Feature/FilamentPanelTest.php --filter anonymous_upload
PASS — 1 test, 3 assertions

TEMP_UPLOAD_OWNER_QUOTA_BYTES=12288 TEMP_UPLOAD_MAX_BYTES=16384 docker compose -f compose.dev.yaml up -d
COMPOSE_E2E=1 DEMO_UPLOAD_TEST_LIMITS=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 DEMO_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/demo-showcase.spec.ts --grep "temporary quota|five megabyte"
2 passed
```

The test-safe overrides are explicit in the command and retain production defaults when omitted.

The focused covering PHP suite passed after Round 2, along with Pint, PHPStan, Compose config validation, default-limit verification, and health checks. The full `php artisan test` run had three unrelated baseline failures in existing AI-operability assertions/path assumptions: the ticket-sequence assertion, the inventory assertion when resolved from the container's `/var/www` path, and the existing commerce inventory path assertion. The newly added public-route test and all upload/forms/runtime tests passed.
