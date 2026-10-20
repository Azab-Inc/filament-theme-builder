# Builder Studio Visual Refresh — Production Design

**Date:** 2026-10-20
**Status:** Approved; palette editor production slice
**Reference:** Prototype A at `?visual-prototype=1&variant=A`; this spec supersedes none of SPECS.md, FTB-005, or existing foundation contracts.

## Scope and sequencing

Promote the visual language of prototype A first to the Foundations palette editor only. Keep the current BuilderShell, EditorWorkspace, EditorNavigation, EditorToolbar, preview iframe, selected-section model, and all other foundation controls operational and compatible; this is not a shell rewrite. Prototype A's broader Studio shell is captured below as follow-up design direction and requires a separate spec/plan before implementation because navigation, toolbar, preview, and responsive shell are independent subsystems.

## Palette editor contract

Render the six existing semantic palettes (`primary`, `success`, `warning`, `danger`, `info`, `gray`) as a compact vertical accordion list. Each collapsed row shows a color marker, palette name, current base value, eleven-shade ramp (50–950), generated/edited summary, and expanded state. At most one row is expanded; opening another closes the previous row. Initial state is all collapsed. Keep expansion UI-only; it must not mutate theme state or enter undo history.

Expanded content exposes a base color picker and editable text value, base reset, and all eleven shade controls. Shade values show generated/effective colors; editing creates the existing sparse per-shade override, and reset removes only that override so the generated value returns. Base changes preserve shade overrides and regenerate non-overridden shades. Keep existing `statusFor` meanings (`generated`, `explicit`, inventory classifications) discoverable and associated with their controls. Continue using the existing typed props/emits and `BuilderShellModel` mutation/reset path; do not add parallel palette state, new tokens, selectors, preview messages, persistence paths, or MCP capabilities.

## Visual and interaction rules

Use a restrained neutral surface, thin border separators, compact typography, subtle color accents, and consistent visible focus rings, following prototype A's palette rows rather than copying its prototype-only shell. Row headers are native buttons with `aria-expanded` and `aria-controls`; panels have stable unique IDs. Labels name palette and shade, reset buttons have explicit accessible names, status text is politely announced without redundant live regions, and all actions work by keyboard. Preserve current valid color input forms and validation/error behavior. Do not hide functionality on small screens; allow ramps and shade controls to wrap/scroll without horizontal page overflow, with touch targets at least 36px.

## State, compatibility, and acceptance

No change to canonical theme shape, all six palettes, eleven shade keys, base/shade override semantics, reset/history, autosave/reload, import/export, undo/redo, real iframe projection, or existing compatibility inventory. No new dependency. Production must not depend on visual-prototype query parameters/components/styles; remove the prototype gate/artifacts only when the approved production slice has replaced its purpose and the separate shell follow-up is no longer relying on the throwaway implementation. Do not delete unrelated prototype artifacts during palette promotion without verifying references.

Acceptance: unit/component tests cover all rows, accessible accordion state, base/shade emits and resets; existing builder type-check, full unit suite and build pass; Playwright verifies keyboard expansion, single-open behavior, six palettes and 11 shades, override/reset persistence and immediate iframe projection without reload or mutation requests at desktop and mobile widths.

## Approved Studio shell follow-ups (separate plan required)

1. Promote neutral compact three-column Studio workspace: section navigation, focused editor pane, real preview canvas; preserve route and section selection.
2. Reconcile current toolbar actions (themes, import/export, history, Inspector, status) into the restrained Studio header without losing any action or accessibility.
3. Integrate existing live preview iframe, viewport/mode controls, loading and disclosure states; never substitute prototype's inert “Reference preview” for production preview.
4. Add responsive shell behavior: compact/hide preview as space requires, retain reachable editor/navigation, and test keyboard and touch interactions.
5. Remove prototype routing, components, styles, and state only after all promoted production journeys and shell Playwright checks pass.

Identity follows SPECS.md §39 exactly: “Filament Theme Builder”, “Build your Filament theme visually.” and footer “An open-source project from Azaber”; never imply official Filament affiliation.
