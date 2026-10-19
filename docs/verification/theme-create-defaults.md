# Create-theme defaults regression verification

## Regression evidence

- Red: `cd builder && npm run test:unit -- --run src/__tests__/local-theme-create-defaults.spec.ts` correctly failed on full persisted state and history equality because created themes retained customized legacy values.
- Red: `COMPOSE_E2E=1 npx playwright test e2e/theme-create-defaults.spec.ts` failed because the visible primary color remained customized after Create.
- Green: focused Vitest regressions (3 tests) and Compose Playwright regression passed after both creation paths adopted the shared fresh-state/history helper.

## Coverage audit

The valid typed unit fixture customizes every palette base and generated shade plus palette overrides, every light/dark surface/border/text slot, all typography roles, spacing, density, radius, border width, shadow, explicit provenance, component and raw overrides, icon pack and all semantic icon overrides, and every allowed branding field. Foundation, component-override, raw-override, icon, and branding validators are asserted before using it. Nonempty `customCss` is intentionally not included as legacy-restored state: supported versioned import/migration rejects it (`nonempty_custom_css_rejected`), and this regression makes no claim about resetting unsupported persisted CSS.

Unit coverage uses `useThemeStore` and fresh Pinia instances: legacy-only migration, valid collection plus stale legacy key written before reload, exact created state/history, original-state preservation/reopen, and last-theme deletion defaults. The deletion checks persisted replacement state/history, active pointer, one-record index, and removal of both deleted records. `createDefaultLocalTheme()` in `local-theme-persistence-helpers.ts` owns the shared canonical-state plus one-snapshot-history construction used by Create and last-delete replacement.

The browser builds a valid customized state through the real primary-color setter, verifies customized control and computed preview `--primary-500`, then seeds the matching validated raw override and verifies the rendered primary button background changes to `rgb(225, 29, 72)`. After reload and Create, the control, computed primary value, and rendered button background return to their captured native defaults. It compares full state/history and verifies original primary and raw override after reload and reopen. `e2e/native-default-styles.spec.ts` independently verifies untouched native layout/table styles and the no-Preflight baseline.

## Final verification

- `cd builder && npm run type-check`: passed.
- `cd builder && npm run test:unit -- --run`: passed, 99 files / 446 tests.
- `cd builder && npm run build`: passed.
- Focused builder tests (`local-theme-create-defaults`, `local-theme-store`, `theme-state-defaults-raw`): 3 files / 23 tests passed.
- Compose `local-theme-manager.spec.ts`, `native-default-styles.spec.ts`, and `theme-create-defaults.spec.ts`: 5 passed, 1 failed. The unrelated native-default legacy test at line 114 dereferences a null `ftb-theme`; isolated rerun reproduces it. The untouched-layout and no-Preflight native-default cases pass, as does the create-theme case.
- Prior full `COMPOSE_E2E=1 npx playwright test`: exceeded the 5-minute limit after 46/121 cases with an unrelated Product name inheritance projection failure in `demo-showcase.spec.ts:423`.
- `git diff --check`: passed.

## Independent final verification

- Full builder rerun: 99 files / 446 tests passed; type-check and production build passed. An earlier run reached the command timeout without a result; the longer rerun completed.
- Compose manager, reset regression, and native baseline tests: 5 passed (`--grep-invert 'legacy foundation storage'`). The excluded legacy-key test and earlier broad-suite limitations remain documented above; the full browser suite is not claimed green.
- Playwright MCP smoke: changed the visible Primary color from `#6366f1` to `#123456`, clicked Manage themes → Create theme, and observed it reset to `#6366f1` with no console errors.
