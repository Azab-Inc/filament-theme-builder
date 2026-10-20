# Palette picker status association verification

- **Red:** Focused `FoundationsPaletteControls.spec.ts` failed because the base color picker had no `aria-describedby`; expected `primary-base-status`.
- **Green:** Focused component tests pass (5 tests); `npm run type-check` passes.
- **Change:** Associated the palette base color picker with the existing base status ID. The text input association and component labels/emits remain unchanged.
- **Diff check:** `git diff --check` passes.
