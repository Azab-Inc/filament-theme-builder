# Builder accessibility / UX audit and fixes

## Scope and baseline

Audited production `builder/` source only; development prototypes, `dist/`, dependencies, App-shell/Inspector protocol work, and demo were out of scope. HEAD at start: `d60e0b6` (`dev`). The working tree was already dirty: `.gitignore`, `builder/src/App.vue`, `builder/src/app.css`, Inspector protocol/validation code and tests, demo bridge/tests, prototype components/styles/docs, and test artifacts. The initial `git diff -- builder` had only the pre-existing tracked edits in `App.vue`, `app.css`, Inspector tests/model/utilities (119 insertions, 4 deletions); the patch was preserved at `/tmp/opencode/builder-baseline.patch`. No changes were made to `App.vue`, `app.css`, Inspector protocol files, demo, prototypes, packages, or ticket files. No files were staged or committed.

Initial `git status --short` snapshot, grouped by shared basename for readability (pre-existing paths; none are task-owned):

```text
 M .gitignore
 M builder/src/App.vue
 M builder/src/__tests__/inspector-protocol.spec.ts
 M builder/src/__tests__/raw-overrides.spec.ts
 M builder/src/app.css
 M builder/src/models/inspector-target-evidence.model.ts
 M builder/src/utils/inspector-protocol.ts
 M builder/src/utils/raw-override-validation.ts
 M demo/resources/views/filament/preview-bridge.blade.php
 M demo/tests/Feature/FilamentPanelTest.php
 M e2e/ftb-007-bridge.spec.ts
 M e2e/ftb-007-inspector.spec.ts
 M e2e/ftb-008-raw-inspector.spec.ts
?? artifacts/
?? builder/src/components/{BuilderVisualPrototype,DashboardPrototype,DashboardPrototypeControls,DashboardPrototypeField,DashboardPrototypeToolbar,GuidelinesActions,GuidelinesKeyboard,GuidelinesMobile,GuidelinesNavigation,GuidelinesPrototype,GuidelinesPrototypeSwitcher,GuidelinesSampleDashboard,GuidelinesTokens,VisualPrototypeEditor,VisualPrototypeFoundationGroups,VisualPrototypeHeader,VisualPrototypeNavigation,VisualPrototypePalette,VisualPrototypePaletteList,VisualPrototypePreview,VisualPrototypeSection,VisualPrototypeSwitcher,VisualPrototypeVariantA,VisualPrototypeVariantB,VisualPrototypeVariantC}.vue
?? builder/src/composables/{use-guidelines-prototype,use-visual-prototype}.ts
?? builder/src/models/{guidelines-prototype,visual-prototype}.model.ts
?? builder/src/stores/dashboard-prototype.ts
?? builder/src/styles/{dashboard-first-editor,dashboard-prototype,guidelines-prototype,visual-prototype}.css
?? builder/src/utils/inspector-target-matching.ts
?? docs/research/2026-10-23-{dashboard-first-brief,dashboard-first-evidence,dashboard-first,editor-guidelines-brief,editor-guidelines-evidence,editor-guidelines-progress,editor-guidelines}.md
?? docs/research/editor-guidelines/
?? docs/superpowers/plans/{2026-10-12-live-foundation-projection,2026-10-14-ftb-007-inspector,2026-10-15-app-shell-split}.md
?? docs/superpowers/progress/2026-10-25-inspector-element-coverage.md
?? docs/superpowers/verification/2026-10-25-inspector-element-coverage.md
?? docs/verification/2026-10-24-{dashboard-style-brief,dashboard-style-evidence,dashboard-style-progress}.md
?? docs/verification/dashboard-style/
?? e2e/{dashboard-first-prototype,dashboard-style,editor-guidelines-prototype-responsive,editor-guidelines-prototype}.spec.ts
```

Guidance consulted:

- Vercel `web-design-guidelines` skill and live Web Interface Guidelines at the URLs in the progress ledger.
- W3C APG modal dialog and tabs patterns; root and builder `AGENTS.md`; AI operability rules.

The audit found the browser regression test initially failed before reaching the manager because the test omitted opening the existing Tools disclosure. After correcting its setup, the requested backdrop regression reproduced: pointer click on the outside left Manage themes visible.

## Implementation

- `builder/index.html`: set `lang="en"`, product title, and theme color.
- `LocalThemeDialog.vue` / `LocalThemeManager.vue`: deliberate backdrop light-dismiss only when pointerdown and pointerup both target the dialog backdrop; internal-to-backdrop drag does not close. Escape closes the active layer (delete prompt first), manager focus returns to opener. Rename starts in the input and focus returns to the renamed row action. Delete confirmation starts on least-destructive Cancel, keeps underlying manager content inert and visually obscured, blocks parent Escape/outside dismissal, and Cancel restores focus. Closing resets pending rename/delete/error state.
- `ThemeImportDialog.vue`: move preview to body via Teleport, use native modal lifecycle, move focus into it, return focus to a visible opener or Tools summary, and guard Escape/backdrop while apply is protected/non-cancellable. Toolbar disclosure stays open while its teleported protected dialog is active.
- `ToolbarMenu.vue`: maintain native disclosure semantics (not a fake ARIA menu); add outside-pointer/Escape dismissal, Escape focus return, exclusive-open behavior for pointer and keyboard, and close after ordinary actions. Preserve pairing approval and manager workflows from accidental closure.
- `EditorNavigation.vue` / `ColorPopover.vue`: one tab stop per tablist and orientation-aware arrow/Home/End behavior; existing section navigation handler retained.
- `CustomColorPanel.vue`: add stable name/autocomplete/spellcheck and validation error `aria-invalid`/`aria-describedby` association.
- `FoundationsPaletteControls.vue`: remove the overriding palette-header accessible name so visible palette name and edited/generated count contribute to its accessible name.
- `BuilderShell.vue` / `EditorWorkspace.vue`: add a keyboard-visible skip link to the editor panel and a focusable link target.
- Tests: focused unit assertions and Playwright coverage added/updated in `LocalThemeManager.spec.ts`, `CustomColorPanel.native.spec.ts`, `local-theme-manager.spec.ts`, `ftb-021-local-themes.spec.ts`, `ftb-022-browser-relay-import.spec.ts`, and `editor-toolbar.spec.ts`. Existing e2e helpers were updated to open Tools, consistent with current UI. The former relay stale-revision browser scenario attempted to edit behind a modal; it is now replaced with a user-realistic modal isolation/cancel check. A separate existing unit test continues to verify stale-revision rejection before authorization.

## Standards mapping

- W3C APG modal dialog: native modal lifecycle, initial/in-dialog focus, focus return, keyboard containment, visible cancel/close affordance; nested destructive alertdialog prioritizes Cancel and isolates its background. Verified focused manager/import paths in Chromium via real keyboard/pointer interaction.
- W3C APG tabs: selected-only tab stops and arrow movement for vertical editor tabs and horizontal color-source tabs. Verified with real keyboard interactions.
- WCAG-relevant improvements: 2.1.1 keyboard operation, 2.4.3 focus order, 2.4.7 visible focus (using native/tab focus and existing focus styles), 2.4.11 focus not obscured in the tested dialog paths, 3.3.1 error identification, 3.3.2 labels/instructions, 3.1.1 page language, and 2.4.1 skip link. This is not a WCAG conformance claim or assistive-technology certification.
- Vercel Web Interface Guidelines: page language/title, skip link, labeled/associated form error, input name/autocomplete/spellcheck, modal overscroll containment, modal safe close behavior, and keyboard/outside interaction behavior. Subjective styling/copy guidance was not applied.

## Verification evidence

Commands below were run from the recorded working directories against HEAD `d60e0b6` plus the working-tree changes in this task and pre-existing dirty changes. Docker Compose dev stack was already running; browser checks used its canonical same-origin gateway `http://127.0.0.1:4175`, `COMPOSE_E2E=1`, Playwright Chromium, one worker.

| Command | Directory | Result |
| --- | --- | --- |
| `COMPOSE_E2E=1 npx playwright test e2e/local-theme-manager.spec.ts --grep 'opens accessibly'` (after opening Tools, before implementation) | repo root | Expected failure: outside pointer left the manager dialog visible. |
| `npm run test:unit -- --run src/__tests__/LocalThemeManager.spec.ts` | `builder/` | 9 passed after unit test event setup correction. |
| `npm run test:unit -- --run src/__tests__/LocalThemeManager.spec.ts src/__tests__/CustomColorPanel.native.spec.ts src/__tests__/ColorPopover.interactions.spec.ts src/__tests__/theme-import-ui.spec.ts` | `builder/` | 4 files, 23 tests passed. |
| `npm run type-check && npm run build` | `builder/` | Passed; Vue type-check and production Vite build succeeded (219 modules; JS 344.25 kB, CSS 50.05 kB). |
| `npm run test:unit -- --run` | `builder/` | 123 files: 122 passed, 1 failed; 541 passed, 1 failed. Sole failure is `src/__tests__/css-entrypoint.spec.ts`, which expects 9 `app.css` imports but the already-dirty `builder/src/app.css` contains the pre-existing `dashboard-first-editor.css` addition. `app.css` was unchanged by this task. |
| `COMPOSE_E2E=1 npx playwright test e2e/local-theme-manager.spec.ts e2e/editor-toolbar.spec.ts e2e/ftb-021-local-themes.spec.ts --grep-invert 'reports a storage failure'` | repo root | 11 passed: manager lifecycle/backdrop, desktop flows, focused destructive prompt, menu exclusivity/dismissal, tab arrows, and 420px manager bounds/focus return. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts` | repo root | 3 passed: relay import cancel, successful confirmation, and modal isolation/backdrop cancellation without authorization. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-021-local-themes.spec.ts --grep 'creates, opens'` | repo root | 1 passed; includes rename focus entry and return. |

The pre-existing `reports a storage failure without blocking further editor edits` e2e case repeatedly failed because it did not observe its injected storage error; it was excluded from the focused final Playwright batch and was not modified. The relay stale-revision e2e's previous direct edit-behind-modal premise is no longer valid after adopting a truly modal import preview; its authorization boundary is still covered by `theme-relay-confirm.spec.ts`.

### First-pass hashes (superseded for files modified during reviewer follow-up)

SHA-256 values (final verified working-tree contents):

```text
c3515eefeb971096a7b71f0ded2cf41ea8378cfb55cbf3dab1363d75c4103937  builder/index.html
1a0d738566cc5c4d596e9c2166e8083519939e830af86f0c2b02e35fdf889dbc  builder/src/components/LocalThemeDialog.vue
9fa34b7ee146b660eff9a5174f433593cec114591f93c6d52ffd514da1bf2906  builder/src/components/LocalThemeManager.vue
ae19e76b4484b0deb093d10a2af5b6d2985b00e22092a1eb4f7c95f430a18a41  builder/src/components/ThemeImportDialog.vue
14ef55af4652f1c60088ac8b9485162ad3a0eca29b4727edc702f56a2d913955  builder/src/components/ToolbarMenu.vue
58602155434ebbbd6bf1e5768a826ed512ca9ea284c788a56f4789200d1d7cd0  builder/src/components/EditorNavigation.vue
4082a6637face50b925394186cf16a74737c91fdb67a988fbe494071e954594c  builder/src/components/ColorPopover.vue
9d44212bf4dd3fcd9099de0b7380bf9b1fe68eb2811a8c39c51076f1dc5c2bc8  builder/src/components/CustomColorPanel.vue
0796604c06e96963771a4966bba17d1cc8efee242fb7f87f2f3a2b8215d8da8c  builder/src/components/FoundationsPaletteControls.vue
a7ccfe2d643f897c27d46d955cb181e43780c24e80d7b92904829384c9e03b10  builder/src/components/BuilderShell.vue
606a9dddad4ee9c574fb0b39d090f7acadf33047e618f2cc4e24d58af5312ebc  builder/src/components/EditorWorkspace.vue
fe15a5375a24ad0f5f691ba7135ac1e8693c9553faee6cd5e7f14a0fc4372da7  builder/src/__tests__/LocalThemeManager.spec.ts
c23e2bd0ba4f7e6860c7e0ef6810eea9ca1e2fa164ac2bd9aafd46fa6493086c  builder/src/__tests__/CustomColorPanel.native.spec.ts
c73afe98e0dea3da162d0cad8ba4a9c2b0e4e173b09a6cf53e0ee2f397bb86ab  e2e/local-theme-manager.spec.ts
3baed5b829b4d4cda89088fccabf3491158eaf5754f4fc92b8e07c64128c4653  e2e/ftb-021-local-themes.spec.ts
8c33d86f2f228212bc254a36060a1bd735125b1b3008d52968d2ed28d51053c2  e2e/ftb-022-browser-relay-import.spec.ts
a3b179fdb5df6c4f5bf3f97ec9e569c2ae913d3f5b94ec9dd5c0a4cb25cc52bc  e2e/editor-toolbar.spec.ts
```

Note: the last e2e focus assertion in `ftb-021-local-themes.spec.ts` was added after the listed 11-test batch and separately passed its rename scenario. A final `npm run build` (including type-check) passed after all application-source edits.

## Audit coverage and open limits

Production browser paths reviewed/tested: toolbar disclosures and tools grouping; local theme open/close, rename, delete cancellation/confirmation, focus return and backdrop pointer sequence; relay import preview, cancel/confirm and protected modal isolation; editor and color tabs; color validation association; page landmarks/skip link; 420px layout bounds. Source scan found existing focus-visible rules and reduced-motion handling for the color popover. No Axe package was present and none was installed.

Not established: actual 200% browser zoom (640px is only a viewport-width proxy); full visual overflow sweep across every nested editor control; high-contrast/forced-colors, all reduced-motion transitions, screen-reader/browser combinations, full keyboard traversal of all controls within every section, and exact contrast ratios for all dynamic theme colors. These need expanded manual/AT review; no claim is made that every possible guideline violation is fixed. The unrelated CSS-entrypoint and storage-failure e2e failures remain open.

## Reviewer repair addendum — 2026-10-26

### Reviewer findings and disposition

1. **Relay import focus restoration — fixed.** `receiveRelayPayload` now records a real visible active element if one exists and stores the nearest Tools disclosure summary independently as fallback. The focus candidate predicate rejects `body`/`documentElement`, disconnected, hidden, or inert nodes; this was the defect that previously prevented fallback when `document.activeElement` was `body`. Cancel and permitted backdrop dismissal return focus to the fallback summary for relay imports without a file-picker opener. A failed authorization keeps the modal open to preserve retryable protected state, and moves focus to its inline alert rather than moving focus behind the still-modal dialog. Regression: real browser relay cancel asserts the visible Tools summary is focused; failed confirmation asserts modal remains open and focuses the retryable error.
2. **Delete alertdialog description — fixed.** `aria-describedby="local-theme-delete-warning"` references the visible undo warning. The existing real-browser delete flow asserts the attribute and text; Cancel remains initial focus and the manager background remains inert.
3. **Components tabpanel visibility — not reproduced; no source change needed.** This checkout already has `v-show="shell.selectedEditorSection === 'components'"` on `SemanticComponentControls`. Real-browser keyboard traversal confirmed exactly one visible tabpanel matches each active Foundations/Components/Branding/Icons tab at 1280, 640, and 420 CSS-pixel viewport widths. Inspector evidence selects the Inspector tab and exposes its correctly linked visible panel. An initial Inspector test expected its panel hidden, but runtime evidence showed selecting a preview target also selects Inspector; the assertion was corrected to verify the actual selected state. No unnecessary wrapper or Inspector protocol change was made.

### Final scoped form/source audit matrix

| Production surface | Source checks and behavior covered | Result / changes |
| --- | --- | --- |
| Foundations: palette, surfaces, typography, layout | fieldset/legend, visible labels, color error/status associations, accessible reset controls; keyboard panel transition; all rendered visible fields have names and accessible labels | Added `name`/autocomplete metadata to native color text/picker, typography, density, spacing, radius and shadow controls. Generated shade ramp is decorative and now `aria-hidden`; palette names/count summaries remain exposed. |
| Components + padding hierarchy | semantic control labels/status/reset; linked and per-edge padding labels; number/unit pairs and validation | Added names and autocomplete to padding number/unit controls; invalid shared error is connected to each active number/select field with `aria-invalid`/`aria-describedby`. |
| Branding | app/font/layout labels, file/reference inputs, upload error association | Extracted the repeated 3-way upload/reference/error markup into `BrandingAssetField.vue` (typed setting/events); upload errors now set invalid/described-by on the file control. Remaining app-name/font/width/sidebar settings have stable names and autocomplete off. |
| Icons | icon pack and per-resource selectors, accessible labels/reset | Stable names and autocomplete off added to selects; existing associated labels and reset names retained. |
| Raw Inspector | selector and each property control, invalid selector feedback | Selector error now has a stable ID linked by `aria-describedby`; selector and raw fields have names and suitable autocomplete/spellcheck metadata. Existing raw Inspector e2e behavior was checked without editing its protocol/bridge. |
| Color picker / import / local themes | search/custom color labels and validation; modal close/error focus; destructive warning and focus | Color search has a name; custom text errors retain their ID association. Import failure stays modal and focuses retry alert; protected cancel guards are unchanged. |

Responsive check at 640px is a **2x-width proxy** for a 1280px CSS viewport, not browser zoom. Tests also cover 1280px and 420px and assert no horizontal document overflow while traversing the four editor tabs. This is not a real 200% browser-zoom test.

### Follow-up verification evidence

Commands were run from the same repo state/Compose Chromium gateway specified above; applicable working-tree changes are identified by the hashes below. The old full-unit result is superseded by this settled rerun.

| Command | Directory | Result |
| --- | --- | --- |
| `npm run test:unit -- --run src/__tests__/AdvancedRawInspector.accessibility.spec.ts` before implementation | `builder/` | Expected red: selector error had no `aria-describedby` target. |
| `npm run test:unit -- --run src/__tests__/FoundationsPaletteControls.spec.ts` before implementation | `builder/` | Expected red: decorative ramp was not excluded from the accessibility tree. |
| `npm run test:unit -- --run src/__tests__/ColorField.spec.ts` before implementation | `builder/` | Expected red: color text field lacked a form name. |
| `npm run test:unit -- --run src/__tests__/PaddingEdgeEditor.accessibility.spec.ts` before implementation | `builder/` | Expected red: invalid padding input lacked `aria-invalid` and an error association. |
| `npm run test:unit -- --run src/__tests__/BrandingSettingsPanel.spec.ts` before implementation | `builder/` | Expected red: upload failure was not associated with the upload input. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts --grep 'can be cancelled'` before repair | repo root | Expected red: relay cancel did not return focus to the visible Tools summary. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-021-local-themes.spec.ts --grep 'creates, opens'` before repair | repo root | Expected red: delete warning was not described by the alertdialog. |
| `COMPOSE_E2E=1 npx playwright test e2e/editor-toolbar.spec.ts --grep 'each editor tab'` before final traversal assertion | repo root | Passed at desktop before adding multi-width traversal; final replacement test covers all requested widths and visible relationships. |
| `npm run test:unit -- --run` final | `builder/` | 125 files: 124 passed, 1 failed; 546 passed, 1 failed. The sole failure remains the pre-existing CSS-entrypoint test: dirty, untouched `app.css` imports `dashboard-first-editor.css` while the test expects nine imports. |
| `npm run test:unit -- --run src/__tests__/BrandingSettingsPanel.spec.ts src/__tests__/FoundationsTypographyLayoutControls.spec.ts src/__tests__/FoundationsPaletteControls.spec.ts src/__tests__/ColorField.spec.ts src/__tests__/PaddingEdgeEditor.accessibility.spec.ts src/__tests__/AdvancedRawInspector.accessibility.spec.ts src/__tests__/LocalThemeManager.spec.ts src/__tests__/CustomColorPanel.native.spec.ts src/__tests__/theme-import-ui.spec.ts` final | `builder/` | 9 files, 32 tests passed. |
| `npm run type-check && npm run build` final | `builder/` | Passed; 221 modules, JS 346.06 kB / CSS 50.05 kB. |
| `COMPOSE_E2E=1 npx playwright test e2e/editor-toolbar.spec.ts e2e/local-theme-manager.spec.ts e2e/ftb-021-local-themes.spec.ts --grep-invert 'reports a storage failure'` final | repo root | 15 passed, including field audit, tabpanel relationships, focus, 2x-width proxy/mobile no-overflow, and Inspector evidence. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-022-browser-relay-import.spec.ts` final | repo root | 4 passed: cancel/focus restore, confirmation, modal isolation, failed authorization error focus/retry state. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-008-raw-inspector.spec.ts --grep 'edits a typed raw property|shows a fragile warning'` final | repo root | 2 passed; no protocol or bridge changes. |

### Final changed-source/test hashes

SHA-256 of final verified contents:

```text
c3515eefeb971096a7b71f0ded2cf41ea8378cfb55cbf3dab1363d75c4103937  builder/index.html
92a8c5d61f4b3137803787131c9cabdaba012a8667b2c43ae7d68dfb4a198371  builder/src/components/AdvancedRawInspector.vue
5eebc8a6a44d7d97f3c6104f8981f1a5b164d18ebdbbd26bfd3fbef1952ac37e  builder/src/components/BrandingAssetField.vue
061541fe641f943d9184676420dcdf4a2050d47faa7a24be45469082d0779ea6  builder/src/components/branding-asset-field.model.ts
f43444390bdfe17940a6569348aaaaa818456926729a1c26c2b64cb3eb52246a  builder/src/components/BrandingSettingsPanel.vue
e6e23dd09e94de3dfa9e9f880b604aa2c6cb5b365dcf0b9c104d4713803e9a2d  builder/src/components/ColorField.vue
4082a6637face50b925394186cf16a74737c91fdb67a988fbe494071e954594c  builder/src/components/ColorPopover.vue
9d44212bf4dd3fcd9099de0b7380bf9b1fe68eb2811a8c39c51076f1dc5c2bc8  builder/src/components/CustomColorPanel.vue
58602155434ebbbd6bf1e5768a826ed512ca9ea284c788a56f4789200d1d7cd0  builder/src/components/EditorNavigation.vue
606a9dddad4ee9c574fb0b39d090f7acadf33047e618f2cc4e24d58af5312ebc  builder/src/components/EditorWorkspace.vue
a7ccfe2d643f897c27d46d955cb181e43780c24e80d7b92904829384c9e03b10  builder/src/components/BuilderShell.vue
601f2b375b02dd6779337cc057a322defb0d14eee7f08c1da15972bb2df01306  builder/src/components/FoundationsLayoutControls.vue
6f33d1fea46d85a8619608958672ed14ccacdd86e057c23aecdf091574dab1e0  builder/src/components/FoundationsPaletteControls.vue
fd956f5560cc085cc7c210b82efe366585ef0c2c232d81f7231e9230de27086d  builder/src/components/FoundationsTypographyControls.vue
0fe977fbc5f12bebf2bb91729f75e306ae13fcb769d03aa90faf77a436dbbbae  builder/src/components/IconPackConfigurationPanel.vue
ef6e4f3ed44e26b0c2f402d19048e5fad784461e5ee1cd03aaeb4c4fe580e8c9  builder/src/components/LocalThemeDialog.vue
9fa34b7ee146b660eff9a5174f433593cec114591f93c6d52ffd514da1bf2906  builder/src/components/LocalThemeManager.vue
cfb28a61e64e36f337fe7d02384eaa4ea8dc749367b0b969c7a756626a46ac2c  builder/src/components/PaddingEdgeEditor.vue
29e726259b48f945e1a1f5719385a7d49ece1212bf512c75bbc6d9b52c724a37  builder/src/components/PaddingValueField.vue
c061279370fb183e9db6bbd276bdb86b2effc61a68417c4a7d7548fc824d419b  builder/src/components/TailwindColorPanel.vue
96a4c7a1595b8f9a25632c42174989fd678bb7ac7c2a6c5539be590fcb29de68  builder/src/components/ThemeImportDialog.vue
14ef55af4652f1c60088ac8b9485162ad3a0eca29b4727edc702f56a2d913955  builder/src/components/ToolbarMenu.vue
cab09aa116cbe2bd8d71ec91f3b12f2ded7d456c3e36f51f2a7e0f27240d1e02  builder/src/__tests__/AdvancedRawInspector.accessibility.spec.ts
a4d322721200367338ec4c9d1723537d8f25c9920fe9206b736091f95c9428fe  builder/src/__tests__/PaddingEdgeEditor.accessibility.spec.ts
c505d0de64d573e2a7ffbeb879deea26ed671e094df86ef4aeb127856de63d22  builder/src/__tests__/BrandingSettingsPanel.spec.ts
4a68782b74757d59bdd82c43524f376bcc6e610c456fcfbc444a6c687a33e59e  builder/src/__tests__/ColorField.spec.ts
fe15a5375a24ad0f5f691ba7135ac1e8693c9553faee6cd5e7f14a0fc4372da7  builder/src/__tests__/LocalThemeManager.spec.ts
fdc091c18bd69a33d88d7227654aa7359e80b575db3d1179644be9b65b89ebd8  builder/src/__tests__/FoundationsPaletteControls.spec.ts
c23e2bd0ba4f7e6860c7e0ef6810eea9ca1e2fa164ac2bd9aafd46fa6493086c  builder/src/__tests__/CustomColorPanel.native.spec.ts
336cf34443ff8753375cf8802b8f5424b8480ba793dcc6224aabe3d45c363db4  e2e/editor-toolbar.spec.ts
c73afe98e0dea3da162d0cad8ba4a9c2b0e4e173b09a6cf53e0ee2f397bb86ab  e2e/local-theme-manager.spec.ts
bd7b64bc93dbc8557a68f383e1837df10020c17fb2345d237932216f3cbb96a3  e2e/ftb-021-local-themes.spec.ts
187822d839b210738073118c3cb7655066815e2795ca6ee48cc4c66434e13ee7  e2e/ftb-022-browser-relay-import.spec.ts
f7179f38ac2ca88c2800caa4c0b2f4d3782dc8f47b389ab76ad6ce288e366263  e2e/support/browser-relay-routes.ts
```
