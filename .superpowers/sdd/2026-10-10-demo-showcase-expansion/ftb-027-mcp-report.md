# FTB-027 MCP Capability Report

## Status

Implemented a safe, preview-only MCP capability for the completed FTB-027
upload boundary. FTB-027 remains `done`; this work does **not** claim full MCP
mutation coverage.

## Implemented contract

- Tool: `showcase_anonymous_upload_preview`, registered through Laravel Boost's
  `boost.mcp.tools.include` configuration.
- Inputs are limited to `operation`, `filename`, `mime_type`, `size_bytes`,
  optional `confirmed`, and an opaque `confirmation_token`.
- Preview derives the owner from the authenticated Laravel MCP request. It
  rejects unauthenticated calls and arbitrary owner overrides.
- Preview delegates validation and dry-run owner/global quota decisions to
  `TemporaryUploadStorage::preview()`. It creates no files, directories, or
  cleanup side effects.
- Preview returns an opaque five-minute confirmation token when metadata is
  accepted.
- Commit requires `confirmed=true` and a token matching the authenticated
  owner, metadata, and expiry. A valid confirmed commit returns the explicit
  `unsupported_upload_input` refusal because no safe binary upload transport
  exists in the installed MCP contract.
- The tool rejects filesystem paths, base64, raw content, and arbitrary owner
  fields. SVG, executable, disallowed MIME/extension pairs, oversize files,
  and quota violations use the same storage-boundary rules as the UI.

## Package/API evidence

The running Compose demo contains:

- `laravel/boost v2.10.3`
- `laravel/mcp v1.0.1`

The installed MCP API supports JSON object tool arguments, tool annotations,
Boost tool inclusion, and in-process `Boost::tools()` registration tests. It
does not expose a verified binary upload or resource-input contract suitable
for safely transferring up to 5 MB into `UploadedFile`. Base64 and filesystem
path workarounds were intentionally not implemented.

## TDD evidence

The red phase was observed before implementation:

- storage tests failed with `TemporaryUploadStorage::preview()` undefined;
- MCP tests failed with `App\\Mcp\\Tools\\PreviewTemporaryUpload` missing.

The green tests cover:

- allowed metadata preview;
- rejected SVG metadata;
- five-megabyte boundary;
- owner quota rejection;
- no preview mutation or deletion;
- authentication and owner override rejection;
- Boost registration through the installed MCP server;
- explicit confirmation requirement;
- stale confirmation rejection;
- truthful unsupported binary commit response.

## Remaining limitation/risk

AI clients cannot currently commit a new upload through MCP. This is an
intentional refusal rather than an authorization bypass. A future commit tool
requires a verified MCP binary/resource transport and must still construct an
`UploadedFile` and call `TemporaryUploadStorage::store()` after revalidating
the authenticated owner, token, metadata, MIME, extension, and quotas.

The focused feature/MCP/storage tests, Pint, PHPStan, Compose health, and
upload Playwright check pass. A full `php artisan test` run still has unrelated
baseline failures in the containerized test layout: repository-root inventory
files are not mounted at `/var/www` for existing inventory assertions, and an
existing maintenance-output assertion expects a different cleanup message.
Those failures were not changed by this capability.
