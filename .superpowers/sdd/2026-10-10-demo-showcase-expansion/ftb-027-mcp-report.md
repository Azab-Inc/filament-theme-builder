# FTB-027 MCP Capability Hardening Report

## Status

FTB-027 remains `done`. The upload MCP capability remains preview-only: no
binary mutation coverage is claimed.

## Hardened contract

- Accepted arguments are exactly `operation`, `filename`, `mime_type`,
  `size_bytes`, optional `confirmed`, and optional `confirmation_token`.
- The published input schema constrains `operation` to `preview|commit`, marks
  the metadata fields required, and sets `additionalProperties: false`.
- The handler repeats the boundary: unknown fields (including `executable` and
  arbitrary extras) are rejected, required fields are not coerced, malformed
  types/values return `invalid_arguments`, and invalid operations return
  `invalid_operation`.
- Owner identity is derived only from the authenticated MCP request. Owner,
  session-owner, user-id, and auth-user-id override fields are rejected.
- Preview delegates metadata validation and dry-run quota decisions to
  `TemporaryUploadStorage` without writing, deleting, or creating directories.
- The interface accepts metadata only. It does not inspect file bytes or scan
  contents, so no content-based executable detection is claimed.
- Confirmed commit still returns `unsupported_upload_input`; no unsafe binary
  transport or base64/path workaround was added.

## End-to-end stdio evidence

The test launches the actual Boost local server with `mcp:start laravel-boost`
and writes newline-delimited JSON-RPC requests to its stdin. It verifies:

1. `initialize` succeeds for protocol `2025-11-25`;
2. `tools/list` returns `showcase_anonymous_upload_preview` with the enum and
   `additionalProperties: false` schema;
3. `tools/call` with an owner override is refused as
   `authentication_required` because stdio has no authenticated caller; the
   authenticated direct tests separately prove caller-derived ownership and
   owner/session override rejection.

## Reproducible verification

Command:

```sh
docker compose -f compose.dev.yaml exec -T demo-php \
  php artisan test tests/Feature/Mcp/TemporaryUploadMcpToolTest.php
```

Output:

```text
PASS Tests\Feature\Mcp\TemporaryUploadMcpToolTest
Tests: 9 passed (44 assertions)
```

This includes the actual stdio `initialize`, `tools/list`, and `tools/call`
exchange; it is not an in-process registration-only assertion.

Other verification commands and their results are recorded in the completion
message for this fix:

```sh
docker compose -f compose.dev.yaml exec -T demo-php \
  php artisan test tests/Feature/Mcp/TemporaryUploadMcpToolTest.php \
  tests/Feature/Uploads/TemporaryUploadStorageTest.php
# Tests: 25 passed (75 assertions)

docker compose -f compose.dev.yaml exec -T demo-php vendor/bin/pint --test
# PASS — 273 files

docker compose -f compose.dev.yaml exec -T demo-php vendor/bin/phpstan analyse
# [OK] No errors

docker compose -f compose.dev.yaml ps --format '{{.Service}} {{.State}} {{.Health}}'
# builder-vite running healthy
# demo-php running healthy
# demo-vite running healthy
# gateway running

COMPOSE_E2E=1 DEMO_BASE_URL=http://127.0.0.1:4175 \
  npx playwright test e2e/demo-showcase.spec.ts --grep 'safe document uploads'
# 1 passed
```

No dependencies or `.playwright-mcp/` files were added.
