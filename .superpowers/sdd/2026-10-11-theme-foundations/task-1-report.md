# FTB-005 Task 1 Report: Typed foundations defaults

## Scope delivered

- Added the shared palette, shade, density, font, foundation, validation, projection, and version-3 model types.
- Preserved `ThemeStateV1`, `ThemeStateV2`, the legacy `ThemeState` union, and the existing migration behavior; added a separately named `ThemeStateV3` contract.
- Added fresh factories for default foundation state and a version-3 theme state, plus named density presets.
- Added mapping defaults for the two unresolved controls: disabled text is `unmapped`; strong borders are `export-only`. No guessed runtime mapping or projection logic was added.
- Added focused tests for palette/shade names, records, stock values, system font defaults, independent light/dark values, density presets, and fresh nested defaults.

## TDD and verification

- RED: `npm run test:unit -- src/__tests__/foundation-defaults.spec.ts --run` failed because `@/models/foundations.model` did not exist.
- GREEN: same focused command passed (5 tests).
- Full builder tests: `npm run test:unit -- --run` passed (6 files, 43 tests).
- Type check: `npm run type-check` passed.
- Production build: `npm run build` passed.

## Boundaries

No generator, validation behavior, projection, store, or UI changes were made. No dependency or `.playwright-mcp/` change was made. The pre-existing `.gitignore` modification was preserved.
