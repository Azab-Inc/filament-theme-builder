# FTB-084/085/086 Border Sides — Final Checkpoint

## Approved decisions

- Schema V8 stores sparse `borderEdges`; migration adds no explicit edges to old themes.
- Widths are finite and nonnegative with no artificial upper cap.
- Ring-backed targets use physical border replacement, accepting normal inner geometry changes while preserving focus indicators and elevation.
- Physical border declarations remain active while focused; ring suppression is a separate rule.
- Focus state owns the verified `.fi-input-wrp:focus-within` wrapper, triggered by its input.
- Unsupported product-name variant borders are hidden and documented rather than advertised.
- Dark-only raw values do not invent a light value; dark inherits only from an explicit light value.
- Tailwind palette selection is validated as actual CSS output, not inferred from palette/token input.

## Verified support inventory

- `table.header` → `.fi-ta-header`
- `table.container` → `.fi-ta-ctn`
- `form.product-name` → `.fi-input-wrp`
- `surface.section` → `.fi-section`
- `surface.card` → `.fi-ta-ctn`
- Product-name scopes: global, component `form`, hover, focus-within. No verified variant selector.

## Feature files

- Projection/resolution/read: `builder/src/utils/border-edge-projection.ts`, `border-edge-resolver.ts`, `theme-border-read.ts`.
- Catalog/actions/UI: `builder/src/registry/border-target-catalog.ts`, `use-theme-border-actions.ts`, `BorderEdgeControls.vue`, `SemanticComponentControls.vue`.
- Bridge/export: `demo/resources/views/filament/preview-bridge.blade.php`, `vanilla-css-export-semantic-overrides.ts`.
- Browser/unit evidence: `e2e/ftb-085-border-side-controls.spec.ts`, `ftb-085-border-targets.spec.ts`, `ftb-085-border-mcp.spec.ts`, `ftb-086-raw-border-inspector.spec.ts`, and border/export unit specs.

## Final verification

Repository cwd:

```text
COMPOSE_E2E=1 npx playwright test e2e/ftb-085-border-side-controls.spec.ts e2e/ftb-085-border-targets.spec.ts e2e/ftb-085-border-mcp.spec.ts e2e/ftb-086-raw-border-inspector.spec.ts --reporter=line
PASS — 17 tests, 3m36s
```

Relevant PHP cwd via Compose:

```text
docker compose -f compose.dev.yaml exec -T demo-php php artisan test tests/Feature/FilamentPanelTest.php tests/Feature/PreviewInspectorBridgeTest.php tests/Feature/Mcp/ThemeRelayValidationV6Test.php
PASS — 21 tests, 150 assertions
```

Builder cwd:

```text
npx vitest run
FAIL — 719 passed, 1 failed; 720 tests total
npm run type-check
PASS
```

Authorized stylesheet assertion correction: `src/__tests__/stylesheet-compliance.spec.ts`
was changed from the logically incorrect `not.arrayContaining(filteredNames)` form to
direct empty-list assertions. This changed test logic only; no token or CSS names were
renamed. Targeted and final full-unit results:

```text
npx vitest run src/__tests__/stylesheet-compliance.spec.ts
FAIL — 3 passed, 1 failed; the forbidden --builder-* list contains 276 actual generated token names
npx vitest run
FAIL — 719 passed, 1 failed; 720 tests total
```

The remaining failure is genuine stylesheet data, not an assertion-shape artifact.
The generated `--builder-*` token names remain unmodified pending explicit approval
to rename/remove them.

```text
docker compose -f compose.dev.yaml exec -T builder-vite npm run build
PASS — type-check and Vite build
```

Red-first note: the semantic browser test failed before its controls existed. Raw-property unit coverage failed on the missing physical properties before implementation; the raw browser test was omitted before production edits and was added afterward. This is a recorded TDD process gap, not claimed as failing-first browser evidence. The settled raw browser suite is included in the passing integrated run.

## Review blockers addressed

- Focus wrapper bridge rejection now has a direct focus-within computed browser regression.
- Hex Tailwind color bridge rejection now has mixed color/style computed browser coverage.
- Selector ownership and unsupported variant scope are covered by catalog/UI/browser regressions.
- Export has a fresh fully explicit physical-border fixture covering light/dark widths, styles, none, and colors.
- No independent reviewer re-approval is claimed; no second review was run.

## State and next action

- Publication update: implementation and this checkpoint were saved in commit `4562f2e` on `dev`; the following HEAD/worktree observations describe the verification-time state before that commit. Issues #88/#87/#86 remain Open / Testing.
- HEAD: `ee3e00203f5342dad8c56b4d063c59fa1747c9d6`
- Worktree: uncommitted shared WIP; 127 changed/untracked paths reported by `git status --short`.
- No helper, package, branch, or commit was added.
- Remaining acceptance gap: there is no separate Tailwind-specific exporter; parity is verified only through the existing shared CSS exporter. Keep tickets open for explicit export-mode ownership if a distinct Tailwind output is required. The external stylesheet failure remains open.
