# Capitalized token creation

## Cause and change

The reported `Secondary` input was rejected by the canonical lowercase name
validator. Creation now trims and lowercases names before validation and collision
checks, for both single colors and palettes. Canonical import validation remains
strict. Reserved names, internal spaces, unsafe characters, and normalized duplicate
names still fail without writes. The form explains normalization and announces the
actual created name with a live success message; a failed attempt clears that message.

## Verification

Environment: Linux, branch `dev`, HEAD `82004b7` plus existing preserved working
changes. Builder commands ran from `builder/`; Playwright ran from the repository
root against canonical Compose at `http://127.0.0.1:4175`. No packages or commits.

- RED: `npm run test:unit -- --run src/__tests__/user-token-creation-names.spec.ts`:
  3 failed as expected before production edits.
- RED: `COMPOSE_E2E=1 npx playwright test e2e/user-token-creation-names.spec.ts`:
  both color/palette journeys rejected the capitalized name before the fix.
- GREEN: focused unit creation/integration/resolution tests: 3 files, 10 passed.
- GREEN: `COMPOSE_E2E=1 npx playwright test e2e/user-token-creation-names.spec.ts e2e/inspector-tokens-mode-links.spec.ts --grep 'Create token|named color definitions'`:
  3 passed, 17.9s. Includes normalization, visible confirmation, duplicate protection,
  and existing live-reference/reload behavior.
- `npm run type-check && npm run build`: exit 0.
- Full `npm run test:unit -- --run`: exit 1; 619 passed, 2 failed, 621 tests.
  One is the known unrelated CSS-entrypoint expectation. The other is the composed
  color-field inventory exceeding its 5-second budget under the full run (7.46s).
  A single bounded diagnostic rerun of `App.color-field-inventory.spec.ts` passed
  unchanged in 2.74s test time. The full run is not claimed green.
- `git diff --check`: exit 0; no staged changes.

## Final source SHA-256

```text
eab08629ebafb7863dcb32dd5638a046d0627e45f73c0844eeb43ee2a77f749c  builder/src/composables/use-theme-user-tokens.ts
6bac5972b259c196c0bb2e953a4b7e27dbeff0201a4bd9275f52da15f9a4483d  builder/src/components/UserColorTokensPanel.vue
e196624f71697b1cfffde8b0cca038c052eccd74c0abf896f58a32e89b19003b  builder/src/models/user-token-operation-result.model.ts
2c2eec559f918479da48fe86a3aa548ea79cb3a9739f81ccc5065b557314a372  builder/src/__tests__/user-token-creation-names.spec.ts
a7d554473532130a10877dca8934dca00df526c8d3e842215fc7e8b8749e3f2e  e2e/user-token-creation-names.spec.ts
```
