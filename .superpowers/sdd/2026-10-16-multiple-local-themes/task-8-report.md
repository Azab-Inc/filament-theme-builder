# Task 8 report: local theme Playwright acceptance

## Scope

Added `e2e/ftb-021-local-themes.spec.ts` with fresh Playwright test contexts and accessible role/name locators covering:

- create, open, rename, duplicate, delete confirmation, active fallback, and active marker;
- debounced editor persistence/reload and per-theme undo/redo after reopening;
- manager focus containment, Escape handling, opener focus restoration, and delete-dialog Escape cancellation;
- injected `localStorage` failure with an accessible status assertion and continued editor interaction.

The FTB-020 preset journey remains intentionally deferred because that feature is not implemented.

## Verification

Passed:

- `npm run type-check` from `builder/`
- `npm run test:unit -- --run` from `builder/` — 79 files, 333 tests
- `npm run build` from `builder/`
- Existing `e2e/local-theme-manager.spec.ts` against Compose — 1 passed
- `git diff --check`

Focused Compose command:

```sh
COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 \
  npx playwright test e2e/ftb-021-local-themes.spec.ts
```

Current result: 1 passed, 3 failed. The failures expose remaining runtime behavior gaps rather than unavailable Compose services:

1. Confirming deletion switches the active theme but leaves the deleted row rendered.
2. Editor density changes are reflected in the live editor but are not persisted to the per-theme local-storage record before switching/reload.
3. The injected storage failure does not produce the expected accessible status after the editor mutation.

The delete confirmation state was cleared before emitting the parent delete action so parent reactivity cannot leave a dangling confirmation dialog. The remaining failures are intentionally retained as acceptance evidence and were not weakened with implementation-only assertions.

## Worktree safety

Unrelated pre-existing modifications were preserved. No Compose topology, dependency manifest, or Playwright configuration was changed.
