# FTB-022 Task 3 — Import UI verification

## Implementation

- Added local JSON file selection, a preview-only dialog, editable theme name, version/migration summary, SHA-256 digest, byte size, safe validation errors, and explicit confirm/cancel actions.
- File size is checked against 1 MiB before `File.arrayBuffer()`; successful confirmation uses the existing Pinia fresh-theme import boundary.
- Added a visible disabled pairing placeholder; it does not claim that an MCP relay is available.
- Fixed V1/V2 legacy primary-color migration to regenerate the primary palette shades when translating to V3, using the existing palette generator/rebuild behavior. Validation was not weakened.
- Kept imported preview data shallow-reactive so Vue does not proxy the canonical domain state passed to the store.

## Verification

- Regression: V1 migration to V4 preserves `#123456`, generates consistent primary shades, and passes local theme state validation. V2 edge also checks shade consistency.
- `npm run test:unit -- --run`: 88 files, 397 tests passed.
- `npm run type-check`: passed.
- `npm run build`: passed.
- `COMPOSE_E2E=1 npx playwright test e2e/ftb-022-versioned-theme-import-mcp.spec.ts --grep 'browser import'`: passed against the running Compose app. The journey checks disabled pairing, preview isolation, editable name, cancel, and confirmed fresh-theme creation.

No new packages were added. The import task does not activate or call MCP pairing; Task 6 remains responsible for relay wiring.
