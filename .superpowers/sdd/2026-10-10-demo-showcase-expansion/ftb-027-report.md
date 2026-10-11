# FTB-027 implementation report

## Changed files

- `demo/app/Support/Uploads/TemporaryUploadStorage.php` — reusable MIME/extension, size, owner-quota, global-capacity, purge, safe-path, permissions, and retention boundary.
- `demo/app/Filament/Pages/Showcase/Forms/ProductEditorForm.php` — native Filament `FileUpload` accepting JPEG, PNG, WebP, and PDF with a 5 MB limit and guarded storage callback.
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

FTB-027 remains `in-progress`. The automated evidence proves the storage boundary, native field configuration, invalid-type UI, safe local storage, owner/global calculations, bounded purge, cleanup command, and Compose health. A browser-level quota-exhaustion flow has not been exercised against a live 25 MB anonymous session, so the quota error presentation is not claimed as fully proven.
