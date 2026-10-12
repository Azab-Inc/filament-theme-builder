# Variant A Split Workspace Design

**Date:** 2026-10-12
**Status:** Approved for deferred implementation; production promotion requires a separate explicit approval
**Scope slug:** `variant-a-split-workspace-promotion`
**Ticket:** [FTB-050](../../../TICKETS.md#ftb-050) · [GitHub issue #50](https://github.com/Azab-Inc/filament-theme-builder/issues/50)
**Product requirements:** existing [PRD.md](../../../PRD.md); this is a deferred layout design, not a new product requirement.
**Review fixed point:** `1416388f7b313c51298830d786277b19c35dc195`

## User-visible contract

When FTB-050 is unblocked and separately approved for implementation, the builder presents a split workspace: real theme editor controls occupy a wide left pane, and the real Filament demo remains visible in a right live-preview canvas. Existing editing and preview functionality takes priority over visual similarity. Variant A is the reference for layout and visual styling only; its displayed controls, saved status, share/publish actions, and swatches are illustrative and must not be treated as real behavior or copied as static mock UI.

No production UI changes are authorized by this specification. The current reference remains [`ThrowawayThemePrototype.vue`](../../../builder/src/components/ThrowawayThemePrototype.vue), reached only through `?prototype=1&variant=A`; preserve its files unchanged until implementation is explicitly authorized.

## Layout geometry and behavior

- Use a full-viewport workspace with a persistent 58px top toolbar. Keep brand/context and existing working actions truthful; do not display fabricated save, share, or publish states.
- Below the toolbar, use two adjacent regions. The left editor is a fixed 410px reference width at wide desktop, flexes no smaller than its usable control width, and owns vertical scrolling. The right preview consumes remaining width, has `min-width: 0`, a concise demo/location caption, and a border-framed iframe that fills the available height.
- Preserve the reference's warm neutral editor surface, fine dividers, restrained typography, and contrasting preview surround. Promote/copy the prototype styles as a starting point, then scope/refine them to production rather than importing prototype-only selector/control markup.
- Keep the preview iframe mounted and visible throughout editing and viewport changes. Changing editor sections or responsive layout must not recreate/navigate the iframe unless existing preview behavior requires it.
- On widths from 601–850px, narrow the editor to approximately 340px (as in the reference) and suppress nonessential toolbar context before compromising either pane. At widths above 850px, use the 410px desktop reference width.
- At 600px and below, stack editor above preview. The editor occupies a scrollable upper region (reference target about 44% of viewport height); the preview remains onscreen in the lower region with at least 35% of viewport height. Permit independent scrolling where necessary; do not hide, unmount, or replace the demo. Keep toolbar actions usable without horizontal page overflow.
- For short viewports, allow the workspace to scroll rather than clipping controls or the preview. The precise minimum pane sizes must be validated against supported browser viewports during implementation; do not trade away the visible iframe to preserve desktop proportions.

## Real theme controls and binding

The layout is presentation-only. Every promoted control must be backed by existing canonical theme state and existing editor mutation paths (including undo/redo, reset, persistence, validation, and preview projection where applicable). Bind genuine controls for currently supported foundations such as primary palette, generated/overridden shades, surfaces, typography, and density only where those controls already exist and are stable. Render their actual current values and status; derive swatches from state rather than hard-coded prototype literals. Do not add inert buttons, synthetic state, duplicate stores, or unsupported settings to imitate the prototype. Do not regress existing theme features to implement layout polish.

The existing real Filament preview bridge remains authoritative. A user edit must continue to update the iframe through the current state → projection → validated bridge path; the layout work must add no parallel preview mechanism or new MCP capability. Any future AI-operable capability remains subject to the repository's [AI operability rules](../../../.config/opencode/rules/ai-operability.md); this layout ticket itself introduces none.

## Accessibility

- Use semantic landmarks and meaningful names for editor, preview, and preview iframe; the iframe title identifies the Filament demo.
- Retain native input/button semantics and visible labels, focus indicators, and keyboard operation. Do not make color swatches the only means of identifying or editing a value.
- Preserve logical focus order (toolbar, editor, preview) and avoid focus being obscured by responsive rearrangement or sticky elements.
- Ensure text, controls, borders, focus, and status indicators remain distinguishable at browser zoom up to 200% and with reduced motion enabled. No interaction may depend on hover alone.
- Verify the narrow layout with keyboard-only interaction and an automated accessibility scan; fix newly introduced violations without claiming whole-product WCAG certification.

## Performance and runtime

Keep the existing iframe document alive through ordinary editor changes and CSS-only layout transitions. Avoid polling, forced reloads, layout thrashing, and unnecessary reactive copies of theme state. No third-party package or additional service is required. There are no persistence, schema, database, or backend changes in scope.

## Promotion and prototype cleanup

1. Leave current production behavior and the prototype/query gate untouched until the deferred blockers are complete, existing theme functionality is stabilized, and a separate explicit promotion approval is recorded.
2. Implement the production split around existing editor state and preview seams; make the real control coverage and iframe continuity observable in tests before removing the prototype path.
3. After production promotion is approved and verified, remove `ThrowawayThemePrototype.vue`, its import/render gate and prototype-only URL behavior/styles from the production path. Do not remove the prototype before its reference decisions have been transferred and tests prove the production layout.
4. Recheck ordinary routes without prototype query parameters, the old prototype query route, and unknown variant inputs. No prototype-only toolbar action or static sample value may leak into production.

## Playwright acceptance and test seams

Use the real builder and real Filament iframe; select public behavior by accessible labels/roles and stable observable state rather than private component internals. Add/extend Playwright coverage for:

- Ordinary builder entry uses the promoted production workspace only after approval; no prototype switcher or hard-coded demo values appear.
- A supported theme control changes canonical state and causes the corresponding real iframe appearance to update without a reload; reset/undo remain functional.
- At desktop and intermediate widths, both editor and live Filament iframe are visible and the editor/preview geometry follows the specified proportions.
- At 600px and narrow mobile widths, the panes stack, controls remain reachable, and the live iframe remains visible and usable; no horizontal overflow hides either pane.
- Resizing and editing keep the same iframe document alive absent existing required reload behavior.
- Keyboard navigation, visible focus, iframe naming, zoomed/reflowed layout, and automated accessibility checks pass for the new workspace.
- Prototype query/gate behavior is removed from production after promotion; neither the switcher nor prototype-only content can be reached through a production route.

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

## Publication and handoff

Local ticket: [FTB-050 in TICKETS.md](../../../TICKETS.md#ftb-050). Tracker issue: [GitHub #50](https://github.com/Azab-Inc/filament-theme-builder/issues/50). The ticket links to this document and its anchors; the links are reciprocal. This document is design-only and does not signal implementation readiness.
