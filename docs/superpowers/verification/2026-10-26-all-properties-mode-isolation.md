# All-properties light/dark isolation verification

Date: 2026-10-26, refreshed 2026-10-27  
Workspace: `/home/swagoverlord/repos/filament-theme-builder`  
Branch: `dev`  
HEAD at task start: `82004b7`  
Environment: Linux; Node/npm from the repository environment; PHP/Laravel demo through canonical Compose; browser base URL `http://127.0.0.1:4175`.

## Current status

- Code and focused acceptance are complete except designated pre-existing failures. Independent review is **PASS** (`ses_e87726579ffekMIo8331SYfD33`): correctness/quality accepted, all original blockers resolved.
- Last change scope was `demo/resources/views/filament/preview-bridge.blade.php` plus new `e2e/palette-cache-parity.spec.ts`. The bridge `generatedPaletteShade` now uses the same `Math.round` encoded-sRGB/alpha algorithm as TypeScript and ignores stale derived `dark`/`light.shades` caches, deriving shades from base plus overrides.
- Final builder unit run: `585 passed`, `1 failed` of 586 tests in 127 files, duration `197.17s`, exit `1`. The single failure is the known unrelated `css-entrypoint.spec.ts` CSS-import expectation. This remains valid because only bridge code and the new E2E test changed after it.
- The preceding full unit run was `582 passed / 4 failed`. Three failures exposed semantic reset regressions: `request.mode` could be undefined and was treated as dark. The controller changed `resetOverride` to use `request.mode ?? 'light'` in `use-theme-override-actions.ts`; the final `585/1` run confirms those regressions are fixed.
- `npm run type-check && npm run build` from `builder/` exited `0`; remains valid for the bridge/test-only final change.
- Combined PHP run exited `1` with `10 passed, 1 failed, 82 assertions`. The failure is a pre-existing source-string assertion in `PreviewInspectorBridgeTest.php:114`: it asserts `context.targetId === rule.targetId`, while `git show HEAD:demo/resources/views/filament/preview-bridge.blade.php` already contains `context.targetId !== target.id`. The new 3 MCP validation tests passed in the combined run; the earlier relay suite remains `19 passed`. PHP was not rerun after the bridge-only change.
- Bridge-touching browser evidence is the final 4-test run: `4 passed` in `30.9s` for `palette-cache-parity`, `dark-first-palette`, and `all-properties-mode-isolation`. The new parity spec was red before the fix: both explicit-dark-base cases failed with accepted count `0`.
- The earlier unchanged 5-test browser run at `41.4s` remains valid for the unchanged non-bridge paths; the broad foundation test passed by itself in `1.4m` after its own budget rose from `120_000` to `240_000ms`. The full 37-test matrix was not rerun and is not claimed green; the only known remaining matrix failure is the designated pre-existing `ftb-021` storage assertion.
- Nonblocking debt remains: `ThemeStateV5` alias debt and the duplicated palette-shade algorithm in the bridge (cross-boundary; no TypeScript import).
- No commit was created; this is intentional because no commit permission was given. No production or test code was changed while refreshing these artifacts.

## Baseline attribution and review artifacts

The original `/tmp/ftb-dirty-files.txt`, `/tmp/ftb-baseline-sha256.txt`, and `/tmp/ftb-baseline-diff.patch` are gone, so the exact task-start baseline cannot be replayed. The 35 pre-task dirty paths were recovered from OpenCode DB part `prt_17861fa13001LvcTkAkcwmmfsp`. The snapshot at `db4034b7f9a103fee6a8c73cbb976d44cb38bd5f` is incomplete: it contains only 18 tracked diffs and does not hold the pre-task contents for all 35 paths.

Because exact baseline attribution cannot be proven, neither artifact is labeled an exact task-only diff:

- `docs/superpowers/verification/2026-10-26-all-properties-mode-isolation.task-only.diff` retains its legacy filename but is a **non-baseline review diff**. It contains 63 tracked paths not in the 35-path baseline plus 6 new task files, 69 paths total. It now includes `e2e/palette-cache-parity.spec.ts` and the current `preview-bridge.blade.php` hash. It excludes all baseline paths and unrelated prototype/accessibility/research files. It is not proof that every change is solely from this task.
  - 69 paths, 2066 lines
  - SHA-256: `e61a9882b8cacd3c311f9d3dc82943504ac254fc34d38f933e28f43674892722`
- `docs/superpowers/verification/2026-10-26-all-properties-mode-isolation.shared-baseline-mixed-review.diff` is the **supplementary mixed-baseline review artifact**. It contains HEAD-to-current diffs for the shared baseline files with known task relevance, explicitly marked mixed pre-existing + task code because the two cannot be separated without the original patch:
  - `builder/src/components/FoundationsPaletteControls.vue` — `activeMode` labels and context keys
  - `e2e/ftb-008-raw-inspector.spec.ts` — export menu/raw selector fixture updates
  - `e2e/ftb-021-local-themes.spec.ts` — toolbar menu/focus fixture updates
  - `e2e/ftb-022-browser-relay-import.spec.ts` — relay import isolation/failure-path updates
  - `e2e/support/browser-relay-routes.ts` — authorization-failure route support
  - 5 paths, 255 lines
  - SHA-256: `b17e4b3297e5cb70d36a5f746f76ea6692a604ae941e8ba754635961192a44be`

The two artifacts together contain 74 paths and cover the actual task code reviewers need, while keeping mixed baseline contexts separate. No claim is made that the primary artifact alone is an exact task delta.

`builder/src/models/mode-values.model.ts` was deleted as an unused zero-import abstraction. It has been removed from the path list and from the primary artifact; no source or test imports remain.

## Task scope and property enumeration

`ALL_RAW_VISUAL_PROPERTIES` contains **18 unique visual properties**:

```text
color, background-color, border-color, border-width, border-radius, box-shadow,
opacity, padding, margin, font-family, font-size, font-weight, line-height,
letter-spacing, text-decoration, border-style, text-align, white-space
```

Selector/state variants are orthogonal to that property list; they are not additional property names. The earlier “19 raw properties” wording was stale and is corrected here.

The focused domain matrix covers:

- semantic scopes `global`, `component`, `variant`, and `state` (with `hover`);
- all six palettes (`primary`, `success`, `warning`, `danger`, `info`, `gray`) and all eleven shades per palette;
- light/dark writes, identical-to-light explicit dark values, dark reset to light inheritance, light reset preserving explicit dark, and dark-only edits not creating light values;
- raw rename/reset per mode and light fallback until a dark overlay exists;
- schema-v6 padding validation/export and malformed-padding rejection;
- `:where(html:not(.dark))` / `:where(html.dark)` export scoping and unsafe `.dark` selector rejection.

This focused matrix is not proof of every semantic control/scope/state cross-product, every persistence/migration path, or actual AI-client MCP behavior.

Intentional shared values remain typography families, layout foundations (spacing, density, radius, border width, shadow), structural padding, icons, and branding except `lightLogo`/`darkLogo`. Raw overrides for visual properties remain independently mode-editable.

## Final verification evidence

| Check | cwd | Final result |
| --- | --- | --- |
| `npm run test:unit -- --run` | `builder` | exit 1; 585 passed, 1 known CSS-entrypoint failure, 586 tests, 127 files, 197.17s |
| `npm run type-check && npm run build` | `builder` | exit 0; Vue type-check and Vite production build succeeded |
| `docker compose -f compose.dev.yaml exec -T demo-php php artisan test tests/Feature/PreviewInspectorBridgeTest.php tests/Feature/Mcp/ThemeRelayValidationV6Test.php` | repository root | exit 1; 10 passed, 1 pre-existing source-string failure, 82 assertions |
| `php artisan test tests/Feature/Mcp --filter='LocalThemeRelay|ThemeRelay'` | `demo` | 0; 19 tests, 133 assertions (earlier unchanged relay evidence) |
| `COMPOSE_E2E=1 npx playwright test e2e/raw-sidebar-mode-isolation.spec.ts` | repository root | 0; 1 passed after original red regression |
| `COMPOSE_E2E=1 npx playwright test e2e/theme-foundations.spec.ts --grep 'covers every foundation control'` | repository root | 0; 1 passed in 1.4m after timeout `120_000` → `240_000` |
| Final bridge browser run (4 tests) | repository root | 0; 4 passed in 30.9s |
| Earlier focused browser run (5 tests, unchanged non-bridge paths) | repository root | 0; 5 passed in 41.4s |

Final bridge browser command:

```text
COMPOSE_E2E=1 npx playwright test e2e/palette-cache-parity.spec.ts e2e/dark-first-palette.spec.ts e2e/all-properties-mode-isolation.spec.ts
cwd=/home/swagoverlord/repos/filament-theme-builder
result=4 passed (30.9s)
```

The final browser run verifies the one-time storage initialization correction and the full true computed-style assertions. It covers dark-first palette switching, palette base/shade isolation, raw color and semantic component background isolation, reset/undo/reload, and exported CSS applied to isolated light/dark roots. The earlier 5-test run remains valid for unchanged non-bridge paths.

The new `e2e/palette-cache-parity.spec.ts` exercises both `explicitDarkBase=false` and `true`. It captures the actual postMessage payload, injects a stale derived palette cache, and verifies the preview accepts the valid message while recomputing `--primary-500`. It then forges a cache-matching projection; that message is rejected, and a subsequent valid message provides the acceptance barrier. Before the bridge fix, both cases failed with accepted count `0`.

The new `e2e/dark-first-palette.spec.ts` was red before the bridge fix: after a dark-first primary edit, switching to light left `html` with `fi dark`. The preview canonical palette filter counted dark paths for light mode; filtering on `projection.mode` fixed it.

`e2e/all-properties-mode-isolation.spec.ts` is green. Earlier failures were harness/fixture issues: storage was cleared on every navigation instead of once before initialization, the raw sidebar label was hidden, and the fixture lacked foundation rules. The current spec clears storage once before navigation so reload preserves state.

## Historical Compose matrix (superseded)

```text
COMPOSE_E2E=1 npx playwright test \
  e2e/theme-foundations.spec.ts \
  e2e/inspector-state-colors.spec.ts \
  e2e/color-picker-acceptance-fields.spec.ts \
  e2e/color-picker-acceptance-inventory.spec.ts \
  e2e/raw-sidebar-mode-isolation.spec.ts \
  e2e/ftb-008-raw-inspector.spec.ts \
  e2e/ftb-021-local-themes.spec.ts \
  e2e/ftb-022-browser-relay-import.spec.ts
result=35 passed, 2 failed (6.5 minutes)
```

The two failures were:

- designated pre-existing `ftb-021-local-themes.spec.ts` storage-failure status assertion, still failing and unchanged;
- broad `theme-foundations.spec.ts` iframe navigation timeout, now green when run by itself with the increased timeout.

The older 29-passed/8-failed run and the earlier new-harness failures are retained only as historical red evidence; they are not current acceptance results.

## Known blockers and limitations

- Full builder unit suite: 585/586, with the known unrelated `css-entrypoint.spec.ts` CSS-import failure.
- Combined PHP run: 10/11, with the pre-existing `PreviewInspectorBridgeTest.php:114` source-string assertion failure. The PHP suite is not green.
- `ftb-021-local-themes.spec.ts`: designated pre-existing storage-failure status assertion remains failing; the full 37-test browser matrix was not rerun.
- `ThemeStateV5` still accepts `schemaVersion: 5 | 6` while `ThemeStateV6` exists; this nonblocking compatibility debt remains.
- The bridge duplicates the TypeScript palette-shade algorithm because it cannot import TypeScript across the boundary; this nonblocking duplication remains.
- Actual AI-client MCP verification was not performed. Relay tests cover envelope validation, v6 fields, malformed migration modes, and untrusted origins; nested canonical mode payload validation remains at the TypeScript domain/bridge boundary.
- Baseline attribution cannot be proven because the original patch is unavailable; the supplementary artifact is explicitly mixed.
- Independent review is PASS (`ses_e87726579ffekMIo8331SYfD33`). No commit was created.

## Non-baseline review paths (69)

```text
98988eee943b4bbd4f90c3098503f672f8fe735871c0dbf5a9522f8014f87402  builder/src/components/AdvancedRawInspector.vue
86f610c82c8a9181f4e02602b2a8fbaec36d3fcb74eeb58677a3f33a3dc11d6e  builder/src/components/EditorSections.vue
5a9fddf064519d8b6bfb7f3e69bd68adf0c03033bfd35a13bca99b2183f78d55  builder/src/components/SemanticComponentControls.vue
97eebe5cbb2a146d0cc8ee0fbcc29bf7b55b50099ce826a9a7faad279bb5cd5e  builder/src/composables/use-builder-actions.ts
c86f9af6a62e3fdae9178c42e1e4dbf1c04a98d7b57668370698e667337fed83  builder/src/composables/use-builder-foundations.ts
d24dfebca0426ffb98921f2afcec899172329c5f680511f3d4f17a71f7a8f2e6  builder/src/composables/use-theme-foundation-actions.ts
3806ca7d34a8baaef9d724d761062ffa288bf6f52a35271b77360ab3221448f8  builder/src/composables/use-theme-override-actions.ts
65813f6344b5ea79014e2ad5125d04eab8062bb86aaf17d3768192a74d71691b  builder/src/composables/use-theme-palette-actions.ts
e2a7c63186bff167d5e5860d49597596a912150d8b4aaec7696db4324ecb5f8f  builder/src/composables/use-theme-raw-actions.ts
cfeb96e37b1c8dd4775c18b2ef25853b7b40703445724fdb266910cb6aacc04b  builder/src/composables/use-theme-relay.ts
ae2934f50b8ad880f5990b243b7d1caafd4e8da23ba0714569dbf63d874ef380  builder/src/dtos/theme-relay.dto.ts
1416fe0542c6e1fbfdb728e89b436e1a6c9ac38cee7493eb4a3230643e669207  builder/src/models/foundations.model.ts
3662cbc638735409e222dfb3d3b84c50043c911da8f9b510e6e65d9930f86711  builder/src/models/raw-overrides.model.ts
630b9d9fdd8388e1af878ccd2d0df54f3b6215cc0105c9edd0bc6a9a678e05b9  builder/src/models/theme-import.model.ts
c503612ea7480271082203bd567326b3d78a491910b805cd26c7475293195509  builder/src/models/theme.model.ts
f34f067dfe184e4598f364e065f5aeb0dd4f85a3e97f9a43cff6a09d48cac5c6  builder/src/__tests__/local-theme-storage.spec.ts
86081401cfd1abd748688596219dbbd3ab05dd38337c117ed3ae8948fb366726  builder/src/__tests__/mode-isolation-domain.spec.ts
ead1021e62128f383bfe02931bfaa2e78dfedb418c3a7818b92d716ceaa0e2ac  builder/src/__tests__/padding-store.spec.ts
85672acf4f54648a24ab4ac15cb99f076e8cc5aaeaa73b88f5e04715ecd8cd69  builder/src/__tests__/preview-theme-state-effects.spec.ts
d438daf2808474e9e29f2e6697e96fb8e9609aa2fa3be127788edfd0b0b638c4  builder/src/__tests__/pure-service-migration.spec.ts
8225f93d41e536f33ef32b4431ac4d92d1bb497861116d609041cb6eb89bf0c0  builder/src/__tests__/theme-import-migrations.spec.ts
72536bed5de571f3da72d5c0618b564b1e3c0c4f9f1e3a258fe5373c0ae57e7c  builder/src/__tests__/theme-import-service.spec.ts
5c29b51253c25eb6684f3a882de4952ddf251a2cba9c02b95be622161e134aad  builder/src/__tests__/theme-import-ui.spec.ts
5a5c66f7dc79da856e2e7e0726ad382721d420e814f766696351aaf56a3e6056  builder/src/__tests__/theme-relay-client.spec.ts
e7d60198d3bf87b16fc1da207707082fe050347517079a6d86c9e104318d064f  builder/src/__tests__/theme-relay-operations.spec.ts
129827f5075ee9f2f81a665c8a3b15862f33b7817d85f37942e777692808ad2b  builder/src/__tests__/theme-relay-preview.spec.ts
538db313b3042cb3a928bb85fae556397f0d52943b6353e7a042a7b63a3ef181  builder/src/__tests__/theme-serialization-canonical.spec.ts
a0656cb1cefa11c0d970ca850874c4f32d29afe2a227ad904b6fdf0de3e790f1  builder/src/__tests__/theme-serialization-round-trip.spec.ts
75935ab990479152dbf69c5bdaeff1ecf0dcf4dd5322f2401746c7d9b71a5e3a  builder/src/__tests__/theme-state-defaults-raw.spec.ts
c2675d0c5248d4cef43830d1461702368ac6643e446920c246016fe90fbe2f38  builder/src/__tests__/theme-state-migrations.spec.ts
dcf614fc7f78a9b1a08a3cfb69bdd3a491ddbf88889171ddba8c5d001e1746ab  builder/src/__tests__/theme-state-overrides.spec.ts
410e554b343402c67d1714e8414245ac1deb2f7b4e1faebf3bfe55f3c0bfb6e5  builder/src/utils/foundation-collections-validation.util.ts
1e530dfd4e74cb1aa4ad8162cf8dc488ac7f32f68ba6047efecdc740dee59b3d  builder/src/utils/foundation-defaults.ts
375fdb7ae38a9d70f646e57820a7db4f0e5bce13093feb924120bcfcbd90508d  builder/src/utils/foundation-override-validation.util.ts
fadf3fdf12044acd412abf2d4924a8f735bf1b09bb9d34b561582783be1a971f  builder/src/utils/foundation-projection.ts
8d1f86e2708804124423e5133c978497022e1b3874367751fe8a9a657e0dc6ed  builder/src/utils/foundation-provenance.ts
54fa57cd16fb87817695899cfd581db1f44fa40d73f493fce3fe5b5a0689abae  builder/src/utils/foundation-record-validation.util.ts
57a1fe647ede49ea1b5cc95fe61662b0e184276896d5b9b916aad38ff3defed9  builder/src/utils/foundation-state-validation.util.ts
40287824334b4452a32dfd4ae12f9296421af1c779d34c16986fa336c64f2615  builder/src/utils/foundation-validation-constants.util.ts
cedd8337f093bc8cbbd88f25cc0c8ecc60f35e4bbf3ad2afa632f63a0eb5ecc7  builder/src/utils/local-theme-recovery.ts
aac79a24dcb1dd6592f000b9fd7770cef7df4b36a0c22d604fd0a98a5f375ca3  builder/src/utils/local-theme-storage.ts
3111bbfcf17bcdebb9860336f9479067e82d172f11d7b151891ca370a0eab560  builder/src/utils/raw-override-validation.ts
a3374c0604439c301eeb23bc4b497e42827f68e63ac3d38e06af2091a41239ea  builder/src/utils/resolve-request-validation.ts
0e0b4f2325f1b0d2b9652ac6e686afdcb9ce83e9757f639733fd12b8313f0efb  builder/src/utils/theme-import-migrations.ts
13ab6485a4da485697c0874eeb971d0d39bf49f2b17344157ab8fc981ec0bc42  builder/src/utils/theme-import-preview.ts
ad0afc12c9dd6ee88c5a2b15613f454a1a0e6c30c21ac276bac1565ecffa7734  builder/src/utils/theme-import-service.ts
18b729ca081b86c7539e874e2d9c0b3423f4a107728f68f73b6c486d702c5135  builder/src/utils/theme-import-validation.ts
5a5a620f3a82c570b7a02d0438964155608618021018cb73fe8dc6f548e0aa62  builder/src/utils/theme-override-validation.ts
110afc81ab08b6a1a6490a62facff1a702fb4de703fd61a89e6db16ee4be0799  builder/src/utils/theme-resolver.ts
6837b22ab80f65deccb753e9283b9c961aed8edb68683f9fd65f7e1477750a96  builder/src/utils/theme-serialization.ts
e777de1a0078ca11046ecfa0c1c571cdf453819fc92616d67afbf34c36521bc2  builder/src/utils/theme-store-normalization.ts
a32698124a53b489a41fe46e03fd897caf42c6a86e311e361b6485213abaf821  builder/src/utils/theme-store-palettes.ts
441a66214731e54561f51c54fd445c9a20af51cc318eeca42c8a2823e22c32a7  builder/src/utils/theme-store-serialization.ts
ad052fd79b384c3f4ca6c641ff89b720cc36159dc0410ed2f66c7104bca0d266  builder/src/utils/vanilla-css-export-foundations.ts
a5ff0bb81bbcef58c409c964932ea5b46035bf90d43d2b79112fb3105918dc0e  builder/src/utils/vanilla-css-export-raw-overrides.ts
2ba965232a31909c60b5044abe77e4a8867eea7cf605f9812f1aad5416e1439a  builder/src/utils/vanilla-css-export-semantic-overrides.ts
91f93e2fc45b2ea3b50f582a1f011b71b6f60c02ffa984ff219e3b1b4d2283bc  demo/app/Mcp/ThemeRelay/OperationResultValidator.php
350622ead444ff44b466bd6744091ae7880dccb314b31fc2e32e0a944885e90e  demo/app/Mcp/ThemeRelay/RelayImportPreviewValidator.php
4a1135800f133115de5d8fa4842e286a733bc1ca35d438da7c483fcbb23d6f89  demo/resources/views/filament/preview-bridge.blade.php
b4a089a785a7b70c51feafd67bb56786c3a1a4060dd919a0ad7c76422a61c1cc  demo/tests/Feature/Mcp/ThemeRelayValidationV6Test.php
c62c1f5c3175da4ec1b132b62c80e3e34450ca348cd36885b17ec974d556714b  e2e/all-properties-mode-isolation.spec.ts
6c742ac70aaecb0ce4ec4098473743229cda8d3452b7b8d649a43872f5fe8452  e2e/color-picker-acceptance-boundaries.spec.ts
4a3290c70b06d322fb48c7b43465e22575757633ff1f17f18e39b5df142af34e  e2e/color-picker-acceptance-fields.spec.ts
f045a8059a390079c3ff4938ee0e50121971469520b5a2c4c165afd53446073d  e2e/color-picker-acceptance.helpers.ts
e625e3bd979fae4064ae727e1c579259e4ae4acfad2d15b43ccf5f3e1bad98a3  e2e/color-picker-acceptance-inventory.spec.ts
61f04cd43a25f63fe6c6c3be391bf8196b34ba09d32bdea4666f9f0202676fca  e2e/dark-first-palette.spec.ts
88d4a4f684056dd2d8f5b3c94be1fd5d47187d660b4116fd7ed261a70be12b55  e2e/palette-cache-parity.spec.ts
c4250fd48b8378b43794df48ca4f7d7853c0a109ac00f974852b5368c7fcdac9  e2e/raw-sidebar-mode-isolation.spec.ts
ff8068c7185451316e2533d198b62cbd05e1f31c710651418b5d8852d7621718  e2e/theme-foundations.spec.ts
```

## Supplementary mixed-baseline paths (5)

```text
433dc57f0b42e9953d224d518aeea3a812575c178cd31bae38190b78b795933a  builder/src/components/FoundationsPaletteControls.vue
e75803e6c58238af3b94b150453b98bc8feb7aa4b6257ee6234c51b9490af5ca  e2e/ftb-008-raw-inspector.spec.ts
bd7b64bc93dbc8557a68f383e1837df10020c17fb2345d237932216f3cbb96a3  e2e/ftb-021-local-themes.spec.ts
187822d839b210738073118c3cb7655066815e2795ca6ee48cc4c66434e13ee7  e2e/ftb-022-browser-relay-import.spec.ts
f7179f38ac2ca88c2800caa4c0b2f4d3782dc8f47b389ab76ad6ce288e366263  e2e/support/browser-relay-routes.ts
```
