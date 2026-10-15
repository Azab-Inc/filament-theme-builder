# Editor Layout Modes Promotion

**Date:** 2026-10-12
**Status:** Production promotion explicitly approved and completed 2026-10-15
**Scope slug:** `editor-layout-modes-promotion`
**Ticket:** [FTB-050](../../../TICKETS.md#ftb-050) · [GitHub issue #50](https://github.com/Azab-Inc/filament-theme-builder/issues/50)
**Product requirements:** existing [PRD.md](../../../PRD.md); this is a deferred layout design, not a new product requirement.
**Review fixed point:** `1416388f7b313c51298830d786277b19c35dc195`

## User-visible contract

When FTB-050 is unblocked and separately approved for implementation, the builder offers two user-selectable navigation modes **inside the editor side panel**. They change only how users navigate editor sections; they do not rearrange the builder/demo workspace. Sidebar mode uses an internal vertical navigation rail alongside the selected section's editor content. Top navigation mode uses internal horizontal tabs (for example, Navigation, Foundations, Components) above that content. An accessible user-facing toggle switches the panel navigation mode without losing draft/theme/UI state, moving the real Filament demo, or recreating, navigating, or otherwise disrupting its iframe document. Existing editing and preview functionality takes priority over visual similarity. Prototype variants A, B, and C remain visual references only; displayed sample values, saved status, share/publish actions, and swatches are illustrative and must not be treated as real behavior or copied as static mock UI. Production modes A and B are defined here; C is explicitly not a production mode in this scope.

No production UI changes are authorized by this specification. The current reference remains [`ThrowawayThemePrototype.vue`](../../../builder/src/components/ThrowawayThemePrototype.vue), reached only through `?prototype=1&variant=A|B|C`; preserve its files and all three visual variants unchanged until implementation is explicitly authorized.

## Panel navigation contract and geometry

- The overall builder/editor/demo split, including the real demo's placement, sizing, and iframe behavior, remains as separately selected/implemented. The panel mode toggle must not alter workspace geometry or move, resize, hide, reload, or navigate the demo iframe.
- Place a user-facing, accessible mode toggle in the editor side panel, identified as “Editor navigation”, with “Sidebar” and “Top navigation” options. Use a labelled radio group or equivalent segmented control with radio semantics, a single checked option, and standard keyboard operation; expose the selected mode to assistive technology.
- Sidebar mode: within the editor panel, show a vertical navigation rail for editor sections beside the selected section's content. Keep the rail and content within the panel bounds; section content retains its existing scrolling behavior. The internal rail must not change the panel's external width or the demo's geometry.
- Top navigation mode: within the same editor panel, show horizontal tabs (for example, Navigation, Foundations, Components) above the selected section's content. Keep section content below the tabs within the panel's existing content region. Tabs may scroll horizontally when necessary; they must remain readable and keyboard reachable and must not cause page-level horizontal overflow.
- At constrained widths and browser zoom up to 200%, keep panel navigation and content usable within the existing editor panel. Allow the tab strip to scroll horizontally rather than forcing page-level overflow or an obstructive wrapped block. Sidebar navigation remains internal to the panel and must not obscure or displace the demo.
- For short viewports, preserve the panel's existing scrolling behavior rather than clipping navigation or editor controls. Validate exact minimum sizes against supported browser viewports during implementation.
- Preserve the existing editor and workspace styling; do not import prototype-only selector/control markup.
- Keep the preview iframe mounted and unchanged throughout editing, mode switches, and viewport changes. Changing editor sections, panel mode, or responsive layout must not recreate, resize, move, hide, or navigate the iframe unless existing preview behavior requires it.

## Real theme controls and binding

The layout is presentation-only. Both modes bind to the same existing canonical theme state and editor mutation paths (including undo/redo, reset, persistence, validation, and preview projection where applicable). Switching mode preserves the active draft, unsaved edits, selected editor section/control, and relevant UI state; it does not reset, reload, or fork state. Bind genuine controls for currently supported foundations such as primary palette, generated/overridden shades, surfaces, typography, and density only where those controls already exist and are stable. Render actual current values and status; derive swatches from state rather than hard-coded prototype literals. Do not add inert buttons, synthetic state, duplicate stores, or unsupported settings to imitate the prototype. Do not regress existing theme features to implement layout polish.

The existing real Filament preview bridge remains authoritative. A user edit must continue to update the iframe through the current state → projection → validated bridge path; panel navigation changes must not affect iframe placement or behavior. The layout work must add no parallel preview mechanism or new MCP capability. Any future AI-operable capability remains subject to the repository's [AI operability rules](../../../.config/opencode/rules/ai-operability.md); this layout ticket itself introduces none.

## Accessibility

- Use semantic landmarks and meaningful names for editor, preview, and preview iframe; the iframe title identifies the Filament demo.
- Retain native input/button semantics and visible labels, focus indicators, and keyboard operation. The panel navigation mode control is a labelled, accessible two-option segmented/radio control with a clear checked/selected state, focus treatment, and keyboard switching. Sidebar rail items and Top navigation tabs expose the current section and support keyboard navigation. Do not make color swatches the only means of identifying or editing a value.
- Preserve logical focus order within the existing workspace (panel mode control, panel navigation, editor content, then the unchanged preview); avoid focus being obscured by responsive rearrangement or sticky elements.
- Ensure text, controls, borders, focus, and status indicators remain distinguishable at browser zoom up to 200% and with reduced motion enabled. No interaction may depend on hover alone.
- Verify the narrow layout with keyboard-only interaction and an automated accessibility scan; fix newly introduced violations without claiming whole-product WCAG certification.

## Performance and runtime

Keep the existing iframe document and overall workspace placement alive through ordinary editor changes, switching panel navigation modes, and CSS-only internal panel transitions. The selected mode may be persisted using existing UI preferences if such a mechanism already exists; do not add a new persistence system or let mode switching overwrite theme draft persistence. Avoid polling, forced reloads, layout thrashing, and unnecessary reactive copies of theme state. No third-party package or additional service is required. There are no persistence, schema, database, or backend changes in scope.

## Promotion and prototype cleanup

1. Leave current production behavior and the prototype/query gate untouched until the deferred blockers are complete, existing theme functionality is stabilized, and a separate explicit promotion approval is recorded.
2. Implement production modes A and B around the same existing editor state and preview seams; make real control coverage, state preservation, accessible mode switching, and iframe continuity observable in tests before removing the prototype switcher/query path.
3. After production promotion is approved and verified, remove only the prototype switcher/query-gated route path and associated gate from production. Replace that prototype-only switcher with the real user-facing A/B mode toggle. Keep the prototype variants A, B, and C intact as visual references; do not remove the prototype component or C reference as part of promotion.
4. Recheck ordinary routes, the former prototype query route, and unknown variant inputs. The query path must no longer expose the prototype in production; no prototype-only toolbar action or static sample value may leak into the production UI.

## Playwright acceptance and test seams

Use the real builder and real Filament iframe; select public behavior by accessible labels/roles and stable observable state rather than private component internals. Add/extend Playwright coverage for:

- Ordinary builder entry uses the promoted production workspace only after approval; no prototype switcher or hard-coded demo values appear.
- Sidebar mode is selectable through the accessible “Editor navigation” control; verify the vertical navigation rail sits inside the editor panel beside its section content at desktop, intermediate, and narrow viewports, without changing overall builder/demo geometry.
- Top navigation mode is selectable through the same control; verify horizontal section tabs (including Navigation, Foundations, Components where present) sit inside the editor panel above its section content at desktop, intermediate, and narrow viewports, including keyboard-reachable/scrollable tabs and no page-level horizontal overflow.
- Switch Sidebar → Top navigation → Sidebar after making a draft edit and selecting an editor section; verify the canonical draft and selection remain unchanged and the same iframe document remains alive throughout.
- Verify the panel mode toggle does not move, resize, hide, reload, or navigate the real Filament demo iframe, and that its existing workspace placement remains unchanged.
- A supported theme control changes canonical state and causes the corresponding real iframe appearance to update without a reload; reset/undo remain functional.
- At desktop, intermediate, and narrow widths, the existing editor/demo split and iframe geometry remain unchanged; internal controls remain reachable without horizontal page overflow.
- At narrow mobile widths and browser zoom up to 200%, panel navigation remains usable, controls remain reachable, and the live iframe remains visible in its existing workspace placement.
- Resizing, switching panel navigation modes, and editing keep the same iframe document alive absent existing required reload behavior.
- Keyboard navigation, visible focus, iframe naming, zoomed/reflowed layout, and automated accessibility checks pass for the new workspace.
- After promotion, the prototype A/B/C selector and prototype query route are removed from production and replaced by the real user-facing A/B toggle. Verify the prototype visual references remain unchanged and C cannot be selected as a production mode.

Unit/component tests may cover rendering and responsive state where useful, but Playwright is required for the user-visible layout and real iframe contract. No test run is required for this documentation-only publication.

## Dependencies and blockers

FTB-050 is deliberately **blocked** by all existing Phase 1/demo-first requirements and demo completion gate: FTB-003 functionality stabilization; FTB-009A, FTB-009B, FTB-010; FTB-011, FTB-013, FTB-014, FTB-015; and outstanding FTB-016, FTB-017, FTB-018 requirements. FTB-012 remains partial only for theme-density integration and is not a gate blocker. Existing builder feature stabilization, including the currently evolving foundation/control projection path, must be complete before layout promotion begins. These are references to existing tickets and gate conditions, not a new parent ticket. Re-evaluate the blockers against the current ticket graph at start; do not infer that this design lifts any gate.

## Out of scope

- Production implementation or immediate replacement of the builder layout.
- Reprioritizing UI polish ahead of existing theme functionality or demo completion.
- New theme controls, state models, preview protocol, export behavior, auth, MCP tools, or persistence.
- Replacing the real demo iframe with screenshots, static markup, or another preview.
- New dependencies, backend services, or broad design-system refactoring.
- Treating prototype sample values, buttons, saved status, or variant navigation as production behavior.
- Changing the overall builder/editor/demo split or the real demo's placement/iframe behavior as part of the panel navigation toggle.
- Promoting prototype variant C as a production mode or adding a production C option.

## Publication and handoff

Local ticket: [FTB-050 in TICKETS.md](../../../TICKETS.md#ftb-050). Tracker issue: [GitHub #50](https://github.com/Azab-Inc/filament-theme-builder/issues/50). The ticket links to this document and its anchors; the links are reciprocal. This document is design-only and does not signal implementation readiness.
