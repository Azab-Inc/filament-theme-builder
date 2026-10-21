# FTB-051 Custom and Tailwind popover verification

## Approved scope and fixed point

User chose A (popover) and explicitly approved production implementation. Review base is `0cce04d0e8f7c2cfb0fd5afed88c2ca32b846b46`; existing GitHub issue #51 and project 30 are continued. The separate Studio prototype, user guidance/config edits and demo test changes are not part of this implementation.

## Implementation

- Shared production ColorField/ColorPopover, Custom tab/native picker and searchable grouped Tailwind ramps. All 26 families/11 stops (286 entries) use the pinned local 4.3.3 snapshot, original OKLCH metadata and full upstream MIT notice. Production uses committed six-digit hex, not canvas conversion or a network service.
- Toolbar primary, six palette bases/66 shade overrides, all light/dark surfaces/borders/text, four semantic Product name scopes, and the three existing raw color properties use current validators and mutation paths. Non-color Inspector properties are unchanged.
- Reference/alpha/native incompatibility remains explicit. Opening/dismissing never replaces a value. Empty generated shades remain empty explicit overrides; selection is a field edit. Invalid drafts, per-field reset, context closure, accessible labels/status, history and persistence are covered.
- Acceptance exposed existing malformed semantic override context construction; requests now contain only the IDs permitted by their scope. A red/green regression verifies all four scopes survive storage/reload without weakening validation.
- Prototype primary source is archived in `28aec4b`; temporary color route/source is removed after promotion. No prototype import remains in production color components.

## Red/green and review

Snapshot/API tests started missing-module red. Component tests preceded the shared controls. Integration began with missing native/Tailwind controls and missing Page dark trigger in Compose. Reset-isolation/duplicate-label/error/raw-reset tests and Custom native-picker tests failed before their fixes. Task-scoped data, popover and adapter reviews passed after corrections.

## Fresh commands and results

- `npm run test:unit -- --run --maxWorkers=2` in builder: **116 files / 489 tests passed**.
- Builder type-check and production build passed (no dependency additions).
- `COMPOSE_E2E=1 npx playwright test e2e/color-picker-tailwind.spec.ts e2e/color-picker-acceptance-fields.spec.ts e2e/color-picker-acceptance-boundaries.spec.ts e2e/color-picker-acceptance-inventory.spec.ts e2e/theme-foundations.spec.ts e2e/local-theme-manager.spec.ts e2e/theme-create-defaults.spec.ts --reporter=line --timeout=90000`: **30 passed**.
- Additional focused Foundations/raw/manager regression subset: **8 passed** in the Task 4 run.
- Browser cases cover real iframe projection, distinct-value one-step undo/redo, base/shade resets and generated restoration, semantic/raw persistence, light/dark isolation, second reload after reset, native/manual/alpha/invalid recovery, search/empty results, references, Escape/outside/focus, mode-context closure, 390px bounds, no runtime palette fetch or arbitrary utility-class generation.
- `git diff --check`: passed.
- Capability inventory contract: **3 PHP tests / 434 assertions passed** in the Compose demo runtime.
- Playwright MCP manual production smoke: chose `gray-900` from toolbar Primary, saw `#101828`, undid once to `#6366f1`, opened Custom's native picker and dismissed with Escape; zero console errors (existing router/font-preload warnings remain).

An initial simultaneous full-unit/browser run overloaded the runner and timed out with timing-related failures. Sequential reruns above completed. One genuine broad-selector collision was corrected to target the existing Primary color native control exactly. No test timeout was silently represented as a pass.

## Boundary-test maintenance

The old source-text guard required an unused editor-type import in App.vue although editor state is owned by use-builder-state. It now asserts the real consumer imports the dedicated model and neither that consumer nor App redeclares those types. This corrects the previously documented baseline failure rather than adding dead production imports.

## Final review corrections

Two-axis review found missing explicit native label linkage and insufficient active-control border contrast. Red tests reproduced both (native label missing, rendered border contrast 2.56:1). Native controls now have explicit HTML labels plus a description link to the visible field label/status while preserving existing accessible names. Active input/button boundaries use darker borders. Component prop/emits types were extracted to models and identical input handlers merged. Verification: **35 focused unit tests** and **6 boundary/contrast Playwright cases** passed after the fixes.

The standards review also raised the broader lack of direct MCP field tools. This remains a pre-existing domain-capability gap, not a new operation introduced by this input-method ticket. The approved spec explicitly forbids new MCP tools here. Existing tool permissions and canonical import/export are unchanged; no complete direct-field AI parity is claimed.

## Limits

This is field-input enhancement only, not the full Studio shell refresh. Direct MCP field editing is not claimed; existing canonical import/export authorization and confirmation remain unchanged. The 30-test acceptance set and additional regression subset are not a claim that every repository browser test was rerun.
