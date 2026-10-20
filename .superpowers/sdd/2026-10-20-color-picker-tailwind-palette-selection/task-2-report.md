# Task 2 review round 1 report

## Review findings addressed

- Public validation profiles now use the exact `hex6 | hex68 | foundation | raw` contract. `ColorFieldProfile` lives in `src/models/color-field.model.ts`.
- Custom input IDs are derived from the supplied field ID, with an ID/label-association regression test for two fields sharing a human label.
- Popover positioning watches immediately, measures the rendered bounds, clamps to viewport margins and the 390px maximum, and repositions on resize/scroll. Tests cover initially-open lifecycle and listener removal on close/unmount.
- Interaction tests locate controls by accessible names, associated labels, public field IDs, and ARIA roles rather than implementation classes or positional selectors.
- Profile tests cover 3/4/6/8-digit hex behavior, trusted foundation references, raw safe values, and rejection of unsafe raw values. Alpha values remain visible and disable native picking without emitting a change.
- Token references remain intact through tab switching, Escape dismissal, and reopen; no selection event is emitted. New opens return to Tailwind with a cleared query. Reset keys clear an invalid draft even when the canonical value is unchanged.
- Existing one-event selection behavior, actual native/text input event targets, effective swatch display for empty overrides, outside-click focus behavior, and mounted-only listener cleanup are covered.

## Verification

- Focused chooser/profile/positioning tests: 7 files, 15 tests passing.
- `npm run type-check`: passing.
- `npm run build`: passing.
- `git diff --check`: run before commit.

Existing application consumers and unrelated worktree changes were not modified.
