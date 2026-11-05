# Editor guideline prototypes — repair evidence

## Scope and architecture

The DEV-only async mount in `builder/src/App.vue` remains additive. Five URL-addressable, memory-only views share the typed variant model/composable and labeled switcher. `GuidelinesSampleDashboard.vue` is the shared local Filament-like context used by actions, keyboard, and mobile; tokens retains its token-specific swatch context. This extraction removes the repeated dashboard markup rather than duplicating it.

URLs:

- `/?guidelines-prototype=1&variant=actions` — name history, grouped Export dialog, local sample dashboard.
- `/?guidelines-prototype=1&variant=navigation&q=font&group=Typography` — URL-synced search, validated group, editable samples.
- `/?guidelines-prototype=1&variant=tokens` — supported inherited token/hex validation and last-valid preview.
- `/?guidelines-prototype=1&variant=keyboard` — truthful skip links, active section focus/state, shortcut guide.
- `/?guidelines-prototype=1&variant=mobile` — full-width Edit/Preview workspaces and safe-area switcher.

## Repair test-first evidence

Repair assertions were added first. The expected-red run was:

`COMPOSE_E2E=1 npx playwright test e2e/editor-guidelines-prototype*.spec.ts --reporter=line`

It failed on disabled Undo boundaries, editable navigation sample retention, token `aria-invalid`, keyboard active-section state, and mobile notice visibility/safe-area behavior. These failures corresponded to the verified review blockers.

Final focused run from repository root, against the running Compose gateway (`COMPOSE_E2E=1`, `http://127.0.0.1:4175`):

`COMPOSE_E2E=1 npx playwright test e2e/editor-guidelines-prototype*.spec.ts --reporter=line` — **7 passed**, 28.3s.

Coverage includes URL history, Undo/Redo boundaries, native modal focus/Escape/restore, mock handoff close, search empty/reload/back-forward, editable samples across groups, strict token validation and last-valid preview, skip links, active sections, input-arrow isolation, background arrow cycling, mobile retention/overflow/safe-area stylesheet/notice, and ordinary route isolation.

## Required Vue checks

From `builder/`, 2026-10-23:

- `npm run type-check` — exit 0.
- `npm run build` — exit 0; Vite production build passed.
- `npm run test:unit -- --run` — not green in the earlier verification: one run reported 3 timeout failures after 530/533 tests, and a second run exceeded the 300s command timeout. Attribution is unknown; no third full-suite retry was performed. No unit files were changed.

## Screenshots

Regenerated in a fresh Playwright context after repair:

- `editor-guidelines/01-actions-after.png` — 1440×1000, native Export modal open with local dashboard.
- `editor-guidelines/02-navigation-after.png` — 1440×1000, `q=font`, Typography results.
- `editor-guidelines/03-tokens-after.png` — 1440×1000, inherited source/resolved swatch.
- `editor-guidelines/04-keyboard-after.png` — 1440×1000, editor focus/active navigation.
- `editor-guidelines/05-mobile-after.png` — 390×844, Edit workspace and visible notice.

## Revision and hashes

Observed `git rev-parse HEAD`: `86ff5de966fb417b767a440a83976770b3c17fac`.

```text
da1693f0a82d7b11ec29f1de4da55ceff686b26f3db9fd53dd334b66079255fa  builder/src/App.vue
ec6787a6f80f1661c257377148041a1203b9ac0132ad4163814e02baa628ac9c  builder/src/components/GuidelinesActions.vue
33984b335d995cfb691f23f7c52aaceac172694ef81d34c93ca8f4d3e5d170b2  builder/src/components/GuidelinesKeyboard.vue
1ce88cb74596caa1402438b8e17f9a8b8a42b4762290553df1bc1af45258b3d1  builder/src/components/GuidelinesMobile.vue
f4c636bbf8b463657c141ed4839541c271880ea442b4d170c3b07ea466fda663  builder/src/components/GuidelinesNavigation.vue
e6bacc9ab153fd9cd329943525e6a7fcf86a354448c7c7f14b9e857076f96658  builder/src/components/GuidelinesPrototypeSwitcher.vue
880d973816b8cc9426fb18ab9d6ab8526975407afa3e5e4db0615b9b96d22538  builder/src/components/GuidelinesPrototype.vue
69e61cabbb388680a67a5a9605e42e421911cfac9f1035ff4a6811e7c407d4aa  builder/src/components/GuidelinesSampleDashboard.vue
57624b23e34c2b2773f23feed75f6dfce12624fe11790c56a6b7c61b0c684f24  builder/src/components/GuidelinesTokens.vue
1fb53d6e4f2bdbce07b669bf3bc15fa9fbca0a863db483755599f5c108a2add6  builder/src/composables/use-guidelines-prototype.ts
73b947616fd8c7be05eed8b2c69a10b9c3c0be17f0777e2fa766f4e1b9552dca  builder/src/models/guidelines-prototype.model.ts
d164b2bebfa11e6cf9f27e30db41e0e4ccc4c2939e3656576773dd54dcc7e7d7  builder/src/styles/guidelines-prototype.css
57baeb135e86c1c25a065a1c4dc4fb46f73c46696ab4ee3dd0fe6072e875c068  e2e/editor-guidelines-prototype.spec.ts
89c068bb39f059866bde892d10b196e227593a8b2343c8206f49f0a820428611  e2e/editor-guidelines-prototype-responsive.spec.ts
```

## Limitations and status

The prototype does not wire edits into production state, storage, backend, downloads, or MCP. Token resolution is explicitly illustrative and supports only `var(--gray-50)` plus six-digit hex values. Ready for scoped repair review. Unrelated concurrent `PaddingValueField.vue` and `padding-ui.spec.ts` edits were preserved.

## Repair attempt 2 — committed query history

Navigation search now records the pre-edit URL once on input focus, replaces the active URL while typing for instant results, and resets the session at blur. This preserves one meaningful back/forward boundary without creating a history entry per keystroke. The regression test documents the boundary with `Enter` followed by blur: `font → heading → Back restores font/results → Forward restores heading/results`. Group push-state history remains covered by the existing navigation test.

Focused evidence from repository root:

- `COMPOSE_E2E=1 npx playwright test e2e/editor-guidelines-prototype.spec.ts --grep "committed search sessions" --reporter=line` — **1 passed**, 5.9s.
- `COMPOSE_E2E=1 npx playwright test e2e/editor-guidelines-prototype.spec.ts --grep navigation --reporter=line` — **1 passed**, 9.9s.
- `npm run type-check` from `builder/` — exit 0.
- `npm run build` from `builder/` — exit 0.
- Full unit suite intentionally not rerun.

Repair-2 hashes: `8fce47963b697e1f42c1ecdec8790947df746dc49a5129ffdfeb922b1e893f30` (`GuidelinesNavigation.vue`) and `92628be0b9b526ca90b6a8c5d73474bf3bdcdde8318255565a087328f048a5c5` (focused Playwright spec). Observed HEAD remains `86ff5de966fb417b767a440a83976770b3c17fac`.

## Final token correctness fix

Added a regression assertion for `hex → invalid draft → supported inherited token` without Reset. The token prototype now stores the last valid source (`inherited` or `override`) alongside the last valid resolved value: invalid drafts preserve both, while manually entering `var(--gray-50)` immediately resolves `#f9fafb` and restores the inherited badge.

Focused evidence:

- `COMPOSE_E2E=1 npx playwright test e2e/editor-guidelines-prototype.spec.ts --grep tokens --reporter=line` — **1 passed**, 6.5s.
- `npm run type-check` from `builder/` — exit 0.
- `npm run build` from `builder/` — exit 0.
- Full unit suite and unrelated tests were not rerun; screenshots were not recaptured.

Final-fix hashes: `7ee4dc7d367d9b85ff9e45192de5dc119b2cdb70639eefd8285cd0a982bb31e0` (`GuidelinesTokens.vue`) and `7ef43059a057426ff8f3ab64cc4e68e18dbee2d90a656cd26bc4fadaf8266aca` (token regression spec).

## Controller acceptance & final capture

- Independent read-only reviewer approved the original seven repaired findings, then approved the narrow query-history and token-transition repairs for both spec/correctness and quality. No unresolved scoped prototype blocker remains.
- Controller captured all ten final images with Playwright against the existing Compose gateway, in an isolated context with reduced motion: four desktop pairs at 1440×1000 and one mobile pair at 390×844. All files are under `editor-guidelines/` with numbered `before`/`after` names.
- Only Vue devtools/inspector overlay containers were hidden for capture, identically across before/after. Product styles were not rewritten for screenshots. Token before scrolls its existing Foundations container to Surfaces; keyboard after uses Tab/Enter/Tab to show actual focus. Controller visually inspected final token, keyboard, and mobile pairs.
- Gallery and source audit: `2026-10-23-editor-guidelines.md`.
- Full unit-suite failures/timeouts remain unresolved; there is no demonstrated clean pre-change baseline, so they are not labeled pre-existing or unrelated.
