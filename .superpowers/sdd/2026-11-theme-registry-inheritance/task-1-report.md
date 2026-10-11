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

## Fix round 2

- Playwright inspected the real demo at `http://127.0.0.1:4175`. On `/demo/admin/login`, `.fi-btn.fi-color-primary` matched exactly one visible `<button>` with accessible name `Sign in`; its parent had `fi-ac fi-width-full` context.
- On `/demo/admin` at the deterministic 930×700 viewport, `.fi-icon-btn.fi-topbar-open-sidebar-btn` matched exactly one visible `<button>` with accessible name `Expand sidebar`; its parent had `fi-topbar` context. The close/open counterparts are both rendered by Filament and one is hidden based on sidebar state, so the regression controls the viewport and asserts visibility/accessibility rather than accepting hidden DOM matches.
- The Playwright regression is `e2e/theme-registry-selectors.spec.ts`; it verifies count, visible semantic role, accessible name, and parent context for both selectors.
- Production metadata now uses `.fi-btn.fi-color-primary` and `.fi-icon-btn.fi-topbar-open-sidebar-btn`; synthetic `.fi-shared` ambiguity remains test-only.
- RED: `npm run test:unit -- src/__tests__/theme-registry.spec.ts --run` failed with 2 assertions when the new verified selector contract was added before metadata changed.
- GREEN: focused registry tests passed (`1` file, `6` tests), and `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/theme-registry-selectors.spec.ts` passed (`1` test).
