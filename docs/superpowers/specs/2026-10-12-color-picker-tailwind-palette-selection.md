# Color Picker and Tailwind Palette Selection

**Date:** 2026-10-12
**Status:** Approved for implementation; popover A selected on 2026-10-20
**Scope slug:** `color-picker-tailwind-palette-selection`
**Ticket:** [FTB-051](../../../TICKETS.md#ftb-051) · [GitHub issue #51](https://github.com/Azab-Inc/filament-theme-builder/issues/51)
**Review fixed point:** `0cce04d0e8f7c2cfb0fd5afed88c2ca32b846b46`

This specification adds a named-color selection path to the existing color editors. The user approved prototype A (popover) for production on 2026-10-20. Existing editor contracts and completed-gate evidence remain authoritative.

## 1. User-visible behavior and field coverage

Every existing editable color field in the builder offers both (a) a native browser color picker and (b) a button that opens a searchable, grouped palette of named Tailwind colors. Selecting a named color immediately applies it to that exact existing field. The current text/hex input remains available as the arbitrary-value escape hatch. Do not add, rename, remove, or repurpose controls, labels, IDs, state paths, or mode-specific fields.

Coverage includes every editable field in the existing inventory, including all light/dark page, sidebar, topbar, card, elevated, input, default/strong border, primary/muted/disabled text fields; palette base colors and individually editable shade/override colors where they are presently editable; and any other existing editable color control. The implementation must derive coverage from the real rendered controls and verify no editable color field is omitted. A field that does not currently exist must not be invented under this ticket.

The native picker and palette are alternate input methods for the same field value and existing canonical mutation path. The palette button identifies its target via the existing field label/ID; choosing an entry closes the popover, applies the entry without an extra confirmation, and leaves focus in a predictable location. Displayed swatches and names must correspond to the selected value and the committed palette data, not separately hard-coded UI examples.

## 2. Palette contract and explicit provenance decision

**Approved source/version:** use the Tailwind CSS **v4.3.3 default theme color palette** already installed and locked by `demo/package.json` and `demo/package-lock.json` (`tailwindcss` resolves to 4.3.3). Check in an application-owned immutable snapshot containing named families and shade stops 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, and 950. Record the upstream source, exact version, license/attribution obligations, snapshot date, and deterministic transformation alongside the data. Do not add a second Tailwind version or import Tailwind as a runtime dependency solely to obtain colors. No silently floating “latest Tailwind” source is permitted; updates require a reviewed snapshot and corresponding spec/test version update.

The checked-in palette data is deterministic, local, and available offline. Each entry has stable family name, shade number, display label such as `red-500`, and a normalized color value matching Tailwind 4.3.3. The UI provides accessible grouping by family and shade plus text search over family, shade, and complete token name. Empty search results are communicated and recover by clearing the query. Search order, grouping, and results are deterministic. The data contains the full required 50–950 ramp for supported families; any source exceptions must be explicitly resolved rather than inferred at runtime.

Do not create generated class names from arbitrary field contents (including forms such as `text-{#...}` or dynamically interpolated Tailwind class strings). Palette selection writes a color value through existing state/projection code; it is not a Tailwind utility-class generator.

## 3. Editing, validation, and preservation semantics

Selecting a color writes exactly the selected field through the existing mutation path. A single selection is one meaningful theme edit for current undo/redo semantics; undo restores the prior exact field value and redo restores the selected value. Existing reset behavior continues to reset the field as before. Existing persistence, JSON/theme serialization, history, and light/dark mode handling are not forked or bypassed.

Palette entries are opaque named colors. Existing CSS custom-property references, theme tokens, `var(...)` references, and other supported non-literal values must remain intact when loaded, displayed, focused, or edited elsewhere. Opening either picker does not normalize, replace, or resolve such a reference. If the browser-native color input cannot represent the current value, it must not write an empty/default value back; keep the textual value and communicate that native picking is unavailable for that current value. Only an explicit user selection or valid text edit may replace it.

Preserve current accepted hex syntax, including valid 3/4/6/8-digit forms wherever the existing validator accepts them. An 8-digit hex is treated consistently with the existing alpha semantics. Invalid or incomplete text remains visible as an invalid draft according to current UX, does not commit canonical theme state, does not emit invalid preview projection, and does not destroy the last valid value. A subsequent valid input or named selection recovers normally. Do not expand accepted syntax or change normalization rules as incidental picker work.

## 4. Accessibility and interaction contract

The native picker is a labeled input associated with the existing field label. The palette trigger is a real button with an accessible name that identifies both the action and color field. The popover has an accessible name/relationship, exposes searchable options as keyboard-operable controls, and announces result count/empty results where practical. Each swatch has a textual accessible name containing family, shade, and value; color alone never conveys the choice.

Keyboard users can open the palette, focus and search entries, navigate/select an option, and return focus predictably to the trigger or field. Escape closes without changing the field and restores trigger focus. Outside click closes without selection. Focus remains visible, is not trapped by a non-modal popover, and is not lost on selection. Native picker keyboard/system behavior remains native. Respect reduced-motion preference; opening, closing, filtering, and choosing do not rely on hover. Verify suitable contrast for labels, focus states, borders, and selected indication without claiming whole-product WCAG certification.

## 5. State, preview bridge, and projection boundary

The new affordances do not add a second state store, a new schema field, a new projection protocol, or a separate preview path. They call the existing canonical theme mutation and validation functions, preserving stable field IDs and mode selection. Valid changes continue through canonical state → existing validated projection → the existing preview bridge. No direct DOM style mutation, arbitrary selector, raw CSS insertion, iframe reload, or Laravel request is introduced. Invalid draft text never crosses the projection boundary.

Projection behavior remains the responsibility of the existing foundations/control projection inventory. If an existing field is currently unmapped or lacks stable projection evidence, this feature must not invent a selector, CSS variable, or Filament token to make the picker appear to work; the field's existing state/projection behavior remains authoritative. Color choices apply to that field even if its projection is currently classified differently.

## 6. Responsive behavior and performance

Controls and the popover remain usable at the builder's supported narrow viewport widths and browser zoom/reflow. The popover must avoid clipping offscreen: reposition or constrain its bounds, allow its option list to scroll, and keep the search field and selected option reachable. It must not cause page-level horizontal overflow or obscure the target field's label/focus context.

Use local static palette data and bounded client-side search; do not fetch palette data at runtime. Avoid rebuilding the complete palette on every keystroke or creating a separate reactive copy per field. The runtime dataset is shared/read-only; filtering may be local to the open picker. No third-party dependency or service is introduced without explicit consent.

## 7. Observable test seams and acceptance verification

Tests select public controls by existing accessible field labels/IDs and user-visible palette names, not private component internals. Unit/component tests must cover:

- complete existing-field coverage across semantic palettes, palette base/shades where editable, surfaces, borders, text, and each light/dark mode value;
- deterministic palette snapshot shape, all approved families and 50–950 stops, unique searchable names, exact source/version metadata, and representative exact color values;
- search by family, shade number, and full name; grouping/order; empty result and recovery;
- immediate selection writing only the intended existing field and participating in one undo/redo step;
- valid 3/4/6/8-digit and invalid/incomplete text behavior according to existing validators, including recovery and no invalid projection;
- CSS variable/token references surviving picker open/close and unrelated interactions, and native-input incompatibility not overwriting them;
- light/dark field isolation, existing labels/IDs, reset, persistence, and projection invocation;
- keyboard open/navigation/select, Escape without mutation, focus restoration, outside click without mutation, and accessible option names.

Playwright is required against the real builder and real Filament preview bridge. Cover a named choice for representative palette, surface, border, text, and light/dark values; assert immediate visible value/state and corresponding existing preview projection where that control is mapped; verify undo/redo, reset, reload/persistence, token preservation, invalid-input recovery, keyboard/Escape/outside click, and narrow viewport/overflow behavior. Add an inventory-driven assertion or equivalent test that every rendered editable color field exposes both affordances. Verify no dynamically generated arbitrary Tailwind class string appears and no network request is made for palette data. MCP capability inventory must record that this is a UI input enhancement with no new MCP operation; do not add MCP tools. If an existing MCP tool later edits the same theme field, it must continue through the existing service, validation, authorization, and confirmation rules.

## 8. Compatibility, failure, and operational behavior

The palette is static local app data; there is no network timeout, retry, remote partial failure, schema migration, or database operation. A corrupted/malformed bundled data shape must fail closed for palette choices rather than applying an ambiguous value, while leaving the existing textual input usable. Duplicate token identities are rejected by tests/build-time validation. No browser/session value is trusted as palette data. User-entered color values remain subject to existing input validation and CSS-value safety rules. No authorization, account, persistence, or backend boundary changes are in scope.

The approved data snapshot must record its upstream source URL/name, exact package/data version, retrieval or snapshot date, license, attribution requirements, and any deterministic transformation applied. Updating the snapshot is a reviewed source change and requires corresponding tests/spec version update; it never follows upstream releases automatically.

## 9. Sequencing and blockers

The 2026-10-20 readiness check reconciles the stale blocked prose with the completed demo-first and FTB-003/foundation-stabilization evidence in TICKETS.md (including FTB-016/017/018 and FTB-053). FTB-012's density-only partial status is unchanged. No gate is waived. Exact accepted input profiles were inspected: toolbar/semantic fields accept six-digit hex; palettes accept six/eight-digit hex; foundation mode fields also accept trusted references; raw color properties retain their existing broader safety validator. The palette source is Tailwind 4.3.3; its licensed, deterministic snapshot is part of implementation acceptance.

## 10. Out of scope

- Promoting the prototype's shell or static preview instead of using existing production editor/preview boundaries.
- Changing labels, field IDs, canonical state shape, mode handling, validation policy, reset, undo/redo, persistence, migration, or projection semantics.
- Adding theme tokens, CSS selectors, variables, CSS rules, or palette generation algorithms.
- Generating Tailwind utility classes from selected or arbitrary colors.
- Remote palette APIs, runtime dependency additions, font/icon/color service integration, or a new backend.
- Broad editor redesign, new editable color fields, or changes to unrelated theme controls.
- New MCP tools or mutation behavior.

## Publication and handoff

Local ticket: [FTB-051 in TICKETS.md](../../../TICKETS.md#ftb-051). Tracker issue: [GitHub #51](https://github.com/Azab-Inc/filament-theme-builder/issues/51). Continue this existing scope; do not create a duplicate issue. Prototype reference: `/?color-prototype=1&variant=A` (temporary, memory-only); its code is a visual reference, not production implementation.

## 2026-10-20 production decisions

- Promote the field-level popover interaction, not the prototype's replacement shell or static reference preview. Existing controls and real iframe remain in place.
- Reuse one ColorField/ColorPopover boundary for the repeated native-picker/text/palette affordances; adapters retain existing IDs, labels, input events, reset/status and validators. Raw Inspector gets the chooser only for its three existing color properties.
- Commit 26 families × 11 opaque six-digit sRGB hex entries, with original Tailwind 4.3.3 OKLCH values/source metadata. Conversion is deterministic: OKLCH → OKLab → linear sRGB → sRGB transfer, clamp each channel to [0,1], round to the nearest 8-bit channel. No browser canvas or runtime upstream import is used in production.
- Tailwind selection writes the fixed literal hex, not a new reference or schema field. Existing `var(...)` values survive opening/dismissal unchanged. Show a matching token name when a literal matches the local snapshot; never pretend a fixed literal is a live semantic reference.
- Native picker uses representable six-digit literals only. For a reference/alpha/function value, communicate the limitation and keep it intact; an explicit valid custom value or Tailwind selection may replace it. Custom draft Apply and named selection produce one existing input event/edit; invalid drafts do not cross the canonical/projection boundary.
