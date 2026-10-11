# Task 3 Report

## Changed files

- `builder/src/services/theme-serialization.ts` — added pure minimal and fully-explicit serialization plus validated JSON/domain deserialization.
- `builder/src/__tests__/theme-serialization.spec.ts` — added sparse preservation, inherited materialization, invalid/unresolved rejection, and round-trip coverage.

## TDD evidence

- RED: `npm run test:unit -- src/__tests__/theme-serialization.spec.ts --run` failed because the serialization service did not exist.
- GREEN: focused serialization tests passed: `1` file, `4` tests.
- Full unit suite: `npm run test:unit` passed: `5` files, `26` tests.
- Type check: `npm run type-check` passed.
- Production build: `npm run build` passed.
- `git diff --check` passed.

## Decisions and risks

- Minimal serialization preserves the validated version-2 override list exactly; explicit values equal to inherited values remain explicit.
- Fully-explicit serialization materializes the requested resolver scope through `resolveThemeValue()` and rejects unresolved values.
- Version-1 states are normalized to the version-2 domain representation with a legacy global override.
- CSS/PHP export formats and store integration remain intentionally out of scope.
- The unrelated pre-existing `.gitignore` modification was preserved.
