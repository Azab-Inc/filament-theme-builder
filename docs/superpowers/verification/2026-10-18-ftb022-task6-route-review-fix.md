# FTB022 Task 6 relay route review fixes

## Findings addressed

- Pending browser pairings remain unbound until the browser approves a server-generated one-time claim. `bindPairing` now rejects unknown/pending pairings and different process IDs; same-process binding is idempotent only after approval and binds the approved browser session under the lifecycle locks.
- Operation result GET status DTOs now always include `version`, `operationId`, `kind`, and an allowed `status`, with only optional `recordId` and `errorCategory`. The builder DTO reflects the same contract.
- Added exact-shape assertions for pending, approved, rejected, and expired operation status responses, plus tests for pending-bind denial, approved binding, idempotence, wrong process, unknown pairing, invalid/replayed claims, and wrong browser tab credentials.
- Added dedicated Host and Referer fallback tests: the exact configured Host and exact configured Referer origin are accepted; mismatches are denied. Originless requests without the permitted fallback remain denied.
- MCP tool registration remains untouched.

## Verification

- Focused relay feature tests: **18 passed**.
- Full Laravel suite: **229 passed**; Pint and PHPStan passed.
- Builder type-check, unit suite (**400 tests**), and production build passed.
- Compose Playwright pairing/import smoke: **2 passed**.
- Dev and production Compose configuration validation and `git diff --check` passed.

## Follow-up alignment

- The pending claim is session-bound while the process identity remains null. Browser approval consumes that server-issued claim and creates an approved-but-unbound session; only then can the trusted binding seam assign the MCP `ProcessScope` to the pairing and session.
- Result-status clients/tests now assert the required `version`, `operationId`, `kind`, and `status` fields for pending, approved, rejected, and expired states.
- No MCP tools were registered. The review fix is committed separately as `Fix - Backend: enforce relay route authorization`.
