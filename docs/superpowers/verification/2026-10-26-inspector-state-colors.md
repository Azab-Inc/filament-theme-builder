# Inspector state colors verification

## Scope

Inspector raw overrides now expose supported Default, Hover, Focus, and Selected state choices. Sidebar labels use the focusable `.fi-sidebar-item-btn` ancestor for transient states and `.fi-sidebar-item.fi-active` for the current navigation item.

## Evidence

- Working directory: `/home/swagoverlord/repos/filament-theme-builder`
- Compose stack: `docker compose -f compose.dev.yaml ps` showed builder, demo, gateway, and demo-vite healthy; gateway served `http://127.0.0.1:4175`.
- Focused unit tests: `npm run test:unit -- --run src/__tests__/raw-inspector-state.spec.ts src/__tests__/raw-overrides.spec.ts src/__tests__/inspector-protocol.spec.ts` from `builder/`; passed, 3 files / 22 tests.
- Type check: `npm run type-check` from `builder/`; passed.
- Production build: `npm run build` from `builder/`; passed.
- Full unit suite: `npm run test:unit -- --run` from `builder/`; 125 files, 549 passed / 1 failed. The failure is the known dirty-worktree CSS-entrypoint expectation: `app.css` imports `./styles/dashboard-first-editor.css`, while the existing test expected the prior nine imports. No state-color code is involved.
- Real browser: `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/inspector-state-colors.spec.ts` from repository root; passed, 1 test in 10.9s.

The browser test verified independent default/selected/hover/focus colors, sibling isolation, reset fallback, no history change from state switching, distinct JSON raw overrides, and CSS export selectors.

## Review

Independent read-only review found no confirmed blocking correctness/spec defects. Nonblocking notes: the raw Inspector component is just over the 100-line guideline and unit coverage could be broader; the real browser test now closes the primary evidence gap.

## Limits

- State choices are intentionally limited to safe selectors supported by the current raw-selector grammar. Selected/current is explicitly modeled only for sidebar labels.
- No new MCP mutation route was added; state-specific values use existing raw override mutation and export paths.
- Full unit suite remains red for the pre-existing dirty `app.css` import expectation and should be reconciled separately rather than hidden in this change.
