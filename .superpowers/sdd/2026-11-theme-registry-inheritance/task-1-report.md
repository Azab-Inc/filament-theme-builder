# Task 1 Report

## Changed files

- `builder/src/models/theme.model.ts` — added semantic scopes, values, sparse overrides, and versioned v1/v2 theme state types.
- `builder/src/models/theme-registry.model.ts` — added registry, control, compatibility, and lookup contracts.
- `builder/src/registry/theme-registry.ts` — added the frozen deterministic registry, metadata validation, and selector/compatibility lookup.
- `builder/src/__tests__/theme-registry.spec.ts` — added duplicate/malformed metadata, stable label, lookup, ambiguity, no-match, and compatibility tests.

## TDD evidence

- RED: `npm run test:unit -- src/__tests__/theme-registry.spec.ts --run` failed because `@/registry/theme-registry` did not exist.
- GREEN: the same command passed: `1` test file, `4` tests passed.
- Full unit suite: `npm run test:unit -- --run` passed: `3` test files, `12` tests passed.
- Type check: `npm run type-check` passed.
- Build: `npm run build` passed; Vite produced the production bundle.

## Assumptions

- The requested `.superpowers/sdd/2026-11-theme-registry-inheritance/task-1-brief.md` was absent, so the approved plan and design spec were used as the task authority.
- `ThemeState` retains an explicit v1 union member so the existing store remains type-safe until the planned migration task; the v2 member has the required sparse override shape.
- Ambiguous `.fi-shared` selectors remain a synthetic test fixture, while the production registry uses the selectors required by the approved Task 1 contract.

## Risks

- Store migration, resolver/validation services, serialization, and persistence integration remain intentionally unimplemented for later tasks.
- The repository contains an unrelated pre-existing `.gitignore` modification, which was not changed.

## Fix round 1

- Runtime verification used Playwright against the rendered preview iframe at `http://127.0.0.1:4175/demo/admin` and the redirected authenticated-preview route. The live DOM contained `.fi-color-primary`; the button route contained `.fi-btn` and `.fi-icon-btn`. `.fi-btn-primary` and `.fi-btn-secondary` matched zero elements.
- Production metadata now uses only those verified selectors: `button.primary` → `.fi-btn`, `button.secondary` → `.fi-icon-btn`, and `global.primary` → `.fi-color-primary`.
- Selector validation now accepts only trimmed, simple `.fi-*` class selectors, rejecting empty/whitespace, `. `, `[`, combinators, script-like text, and other non-parseable/unsafe forms.
- Registry validation now checks typed/default values, finite numeric metadata, deterministic ID ordering, and a single compatibility baseline across entries. This makes incompatible lookup requirements deterministic rather than selecting an arbitrary candidate requirement.
- RED: `npm run test:unit -- src/__tests__/theme-registry.spec.ts --run` failed with 2 failing regression tests for unsafe selectors/default metadata and conflicting compatibility baselines.
- GREEN: the same command passed: `1` test file, `6` tests passed.
