# Driver.js Onboarding Tour Design

Date: 2026-11-18

## Problem

New users land in the builder with a real Filament preview, several editor sections, Inspector, theme management, and multiple export actions visible at once. The interface is powerful but self-explanatory only after the user already knows where foundations, component controls, Inspector, and exports live. There is no guided first-run path and no way to replay one later.

## Goals

- Give first-time users a short, skippable tour of the builder chrome.
- Teach the three main workflows: edit foundations, inspect a preview element, and export or save a theme.
- Replay the tour on demand from the Tools menu without changing theme state.
- Work in both editor navigation layouts, at desktop and narrow widths, and in light and dark mode.
- Respect keyboard, focus, reduced-motion, and screen-reader expectations.

## Non-goals

- Do not tour inside the Filament iframe. Steps target stable builder controls, not demo content that can change between releases.
- Do not create, mutate, save, export, or undo theme state.
- Do not introduce analytics, accounts, or server persistence for tour progress.
- Do not replace contextual hints, documentation, or the keyboard-shortcut command modal.

## Tooling

Use Driver.js for the tour overlay and popovers. Pin the dependency to an exact reviewed version and record it in `builder/package.json` and the lockfile. The dependency is approved by the tour request; no additional tour library is required.

## User-visible contract

- On first visit, the tour starts automatically after the preview shell is mounted and the preview iframe is visible. It must not start over a loading or error state.
- A visible `Skip tour` action dismisses the tour immediately and records completion so it does not reopen automatically.
- `Next` and `Back` move between steps; `Done` closes the final step. Escape closes the tour and records completion.
- Closing the tab or browser before finishing does not record completion; the next visit starts from the first step.
- The Tools menu contains a `Take a tour` action. It always starts from step one, even after completion.
- Completion is stored separately from theme data in versioned local storage, for example `ftb-onboarding-tour` with `schemaVersion: 1` and `completedAt`.
- Invalid, unknown, or legacy tour-storage values fail safely: the tour is treated as not completed and is shown once, without touching theme storage.
- Tour state never enters theme JSON, exports, undo/redo, or the autosave payload.

## Steps

Use stable `data-tour` attributes on the builder controls rather than CSS classes or DOM order. Each step has a title, short body copy, and one anchor.

1. Welcome: introduce the builder and explain that changes apply to the live preview immediately.
2. Editor navigation: show the section navigation (Foundations, Components, Branding, Icons, Inspector).
3. Foundations: explain palette, surface, typography, spacing, density, radius, border width, and shadow controls.
4. Live preview: explain that the iframe is a real Filament 5.9 application and that navigation is safe while Inspector is off.
5. Inspector: show the toolbar toggle, explain hover/click selection and the raw-element fallback, and state that Inspector must be off for normal interaction.
6. Themes and exports: show the Tools and Export menu triggers, Save theme, and the available JSON/CSS/PHP exports.
7. Finish: summarize the workflow and point to Tools > Take a tour for replay.

Steps must not require opening a menu, changing mode, or selecting a section. If a target is missing because the layout is collapsed or an optional panel is unavailable, skip that step and continue with the next available target rather than failing the whole tour.

## Layout and responsiveness

- Both editor navigation layouts expose the same tour anchors.
- At narrow widths, the tour popover stays inside the viewport and never covers its anchor completely.
- Driver.js animations are enabled by default and disabled when `prefers-reduced-motion: reduce` is set.
- The tour does not trap the user on an invisible overlay: the skip action remains reachable at every step.

## Accessibility

- Every popover has a visible title, readable body text, and an accessible close/skip control.
- Focus moves into the active popover and returns to the element that started the tour when it closes.
- Steps can be traversed with keyboard controls exposed by Driver.js; the implementation verifies Tab, Enter/Space, Escape, and arrow-key behavior and documents any limitation.
- The overlay does not suppress screen-reader access to the popover content.
- Do not rely on color alone to indicate progress; include textual step counts.

## Technical shape

- Put step definitions in a typed model under `builder/src/models/` and the ordered manifest in a dedicated module under `builder/src/` (for example `builder/src/tour/`).
- Put Driver.js lifecycle, first-run decision, and persistence behind one composable, `use-onboarding-tour`, with explicit start, next, previous, close, and replay functions.
- Keep persistence in a small utility with schema validation and safe failure; do not couple it to the theme store.
- Mount the tour at the builder shell level so it can target toolbar, navigation, editor, and preview containers.
- Clean up Driver.js listeners and DOM on unmount and when the tour closes; repeated starts must not duplicate overlays.
- Do not add a second state container for theme or tour state.

## Testing

- Unit tests cover first-run versus completed state, storage validation and migration, start/replay/skip/next/back/done behavior, missing anchors, reduced-motion configuration, and cleanup.
- Playwright covers the real builder: first-run display, skip persistence across reload, Tools > Take a tour replay, every step and anchor, both navigation layouts, narrow viewport, keyboard traversal, Escape, focus return, reduced motion, and unchanged theme/export/undo state.
- Add the Playwright regression before implementation and verify it fails for the expected missing-tour reason.
- Run builder type-check, unit tests, production build, and the focused Playwright suite on the settled change.

## Rollout

- No feature flag is required.
- If the tour must be temporarily disabled, use an explicit code-level constant and document it; do not silently alter stored completion.
- Update `TICKETS.md` and the GitHub project as each slice lands.
