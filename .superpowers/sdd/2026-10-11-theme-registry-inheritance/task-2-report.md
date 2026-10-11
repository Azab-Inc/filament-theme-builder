# Task 2 Report

## Changed files

- `builder/src/models/theme.model.ts` — added the shared `ResolveRequest` and `ResolveResult` contracts.
- `builder/src/registry/theme-registry.ts` — declared the primary button background registry default.
- `builder/src/services/theme-validation.ts` — added pure override/state validation with contextual failures and quarantine behavior.
- `builder/src/services/theme-resolver.ts` — added pure Global → Component → Variant → State resolution, registry defaults, legacy fallback, and unresolved results.
- `builder/src/__tests__/theme-resolver.spec.ts` — added inheritance, fallback, default, unresolved, validation, quarantine, explicit-equality, and immutability tests.

## TDD evidence

- RED: `npm run test:unit -- src/__tests__/theme-resolver.spec.ts --run` failed because the validation and resolver service modules did not exist.
- GREEN: focused resolver tests passed: `1` file, `6` tests.
- Full unit suite: `npm run test:unit` passed: `4` files, `20` tests.
- Type check: `npm run type-check` passed.
- Production build: `npm run build` passed.
- `git diff --check` passed.

## Assumptions

- The validated registry is the compatibility baseline; no active Filament version is present on `ThemeState` or `ThemeOverride` for a second compatibility comparison.
- The primary button background uses the existing primary color as its registry default so the resolver can distinguish a declared default from an unresolved control.
- Existing v1 state remains supported through the `legacy-global` result source until the planned store migration.

## Risks

- Store migration, persistence integration, serialization, UI, and exporter work remain intentionally unimplemented for later tasks.
- The unrelated pre-existing `.gitignore` modification was preserved.

## Fix round 1

- Added explicit compatibility-baseline checks against every registry entry, including unsupported and mismatched runtime baselines.
- Added runtime validation for scope, required/optional identifiers, control values, and every unsupported own key in external overrides.
- Expanded precedence tests to cover exact Global → Component → Variant → State selection and nearest fallback at each parent level.
- Added a registry default for the legacy global primary control and verified valid version-1 `colors.primary` wins before that default.
- Tightened default and quarantine assertions to verify exact values and contextual invalid override results.
- RED: focused resolver tests failed with precedence, compatibility, and runtime validation gaps before implementation.
- GREEN: focused resolver tests passed: `1` file, `8` tests.

## Fix round 2

- Added a failing regression assertion for a uniformly unsupported `4.x` registry baseline.
- Added the shared `SUPPORTED_FILAMENT_COMPATIBILITY` contract constant and used it for registry metadata and baseline validation, preserving verified `5.x` behavior.
- RED: focused resolver tests failed with a uniformly `4.x` registry because syntax-only validation accepted it.
- GREEN: focused resolver tests passed: `1` file, `8` tests.
- Full unit suite passed: `4` files, `22` tests.
- Type check passed: `npm run type-check`.
- Production build passed: `npm run build`.
