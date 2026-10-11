# Preview schema fix report

## Root cause

The builder now emits an envelope with `schemaVersion: 1` and a theme state with
`schemaVersion: 2`, including sparse `overrides`. The preview bridge required the
theme state to be version 1, so it discarded every current edit. Investigation
also found that `structuredClone(toRaw(theme.theme))` raised `DataCloneError`
once v2 overrides were present because `toRaw` only unwraps the root object.

## Fix

- Kept the protocol envelope at schema version 1.
- Bridge accepts theme-state v1 and v2, requires a strict six-digit hex primary
  color, and validates v2 override identities/value types without interpolating
  override content into CSS.
- Reused the existing managed style element and origin/source checks; no reload
  or request is introduced.
- Serialized the reactive builder state through JSON before cloning so v2 sparse
  edits can cross `postMessage` safely.

## Verification

- Builder type-check: passed.
- Builder unit tests: 38 passed.
- Builder production build: passed.
- Focused canonical Compose Playwright regression: passed; verifies the actual
  builder color control changes a native Filament primary badge's computed color
  and `--primary-400` from the default to `rgb(159 200 197)`.
- Focused Laravel panel/bridge tests: 8 passed, 37 assertions.
- Pint check: 277 files passed.
- PHPStan: no errors.
- The normal non-Compose Playwright security command could not start its local
  web servers because the host demo install is missing `Laravel\\Boost`; the
  canonical Compose stack remained healthy and the focused regression passed.
