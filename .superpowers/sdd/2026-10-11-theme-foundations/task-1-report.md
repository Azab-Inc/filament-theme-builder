# FTB-005 Task 1 Report: Typed foundations defaults

## Scope delivered

- Added the shared palette, shade, density, font, foundation, validation, projection, and version-3 model types.
- Preserved `ThemeStateV1`, `ThemeStateV2`, the legacy `ThemeState` union, and the existing migration behavior; added a separately named `ThemeStateV3` contract.
- Added fresh factories for default foundation state and a version-3 theme state, plus named density presets.
- Added mapping defaults for the two unresolved controls: disabled text is `unmapped`; strong borders are `export-only`. No guessed runtime mapping or projection logic was added.
- Every palette default contains all eleven shade keys; until Task 2 implements generation, each shade entry is explicitly seeded with its palette's base color. This is a complete deterministic placeholder, not a claim that generation is implemented.
- Body, heading, and mono use distinct mutable font-choice objects in every returned foundation state.
- Light/dark surface, border, and text defaults reference the installed Filament 5.9 runtime's `--gray-50` through `--gray-950` variables. Evidence: `demo/public/css/filament/filament/app.css` (served as `/css/filament/filament/app.css?v=5.9.0.0`; computed `--gray-*` values verified in the running app) and `demo/resources/css/app.css` (Tailwind theme setup). The existing preview bridge emits only app-owned `--ftb-primary` and `--primary-{50,100,200,300,400,500,600,700,800,900,950}` values (`demo/resources/views/filament/preview-bridge.blade.php`, palette list and managed-style construction); these do not provide unsupported semantic-surface mappings.
- Disabled text remains `unmapped`, and strong borders remain `export-only`: the runtime evidence establishes neutral gray variables and the current primary bridge variables, but no verified target for either semantic control. No guessed selector or runtime variable is assigned to them.
- Added focused tests for palette/shade names and entries, records, stock values, system font defaults, independent light/dark values, density presets, fresh nested defaults, and within-state font independence.

## TDD and verification

- RED (review regressions): `npm run test:unit -- src/__tests__/foundation-defaults.spec.ts --run` failed on missing default shade keys and body/heading aliasing.
- GREEN (review regressions): same focused command passed (6 tests).
- Full builder tests: `npm run test:unit -- --run` passed (6 files, 44 tests).
- Type check: `npm run type-check` passed.
- Production build: `npm run build` passed.

## Boundaries

No generator, validation behavior, projection, store, or UI changes were made. No dependency or `.playwright-mcp/` change was made. The pre-existing `.gitignore` modification was preserved.
