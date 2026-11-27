# Inspector Unique Element IDs

Date: 2026-11-26. Phase: Phase 1 online builder. Status: planning contract; not implemented.

Tracking: [FTB-182 / #184](../../../TICKETS.md#ftb-182) ([GitHub issue](https://github.com/Azab-Inc/filament-theme-builder/issues/184)).
Related: [FTB-008](../../../TICKETS.md#ftb-008), [FTB-022](../../../TICKETS.md#ftb-022),
[FTB-004](../../../TICKETS.md#ftb-004), and [FTB-058](../../../TICKETS.md#ftb-058).

## 1. Confirmed gap

Advanced Inspector currently stores raw CSS by selector. When multiple preview
elements share a selector such as `.fi-section-header`, editing one selected
element edits every matching element. The user needs to isolate one selected
element without weakening the existing safe-selector boundary.

The feature is an Inspector targeting capability, not a general custom CSS
escape hatch. It must work for repeated class selectors and retain the existing
preview, history, persistence, JSON, and vanilla CSS contracts.

## 2. User-visible contract

The Advanced Inspector exposes a keyboard-accessible **Unique element ID**
toggle for a selected target.

When enabled:

- the builder generates a stable valid ID based on the selected target and a
  collision-safe suffix;
- the generated ID is shown in an editable ID field;
- the preview assigns that ID to the selected occurrence only;
- raw properties edited while the toggle is enabled target `#that-id`;
- the existing class selector remains the shared baseline, so other matching
  elements keep their current shared styling;
- CSS export emits the unique rule as `#that-id { ... }`;
- JSON export and local persistence retain the ID assignment and its binding;
- undo and redo treat enabling, renaming, disabling, and property changes as
  coherent theme operations.

When disabled, the preview removes the generated assignment, raw editing uses
the original safe selector again, and the shared class rule remains unchanged.
Disabling must not silently delete unrelated shared properties. If the unique
rule has no properties after disabling, it may be removed as an empty override.

The ID field updates immediately after a valid edit. Invalid IDs keep the last
valid value active, show an inline error, and do not send an unsafe selector to
the preview or export.

## 3. Target identity and state model

Keep existing raw overrides backward compatible. Add a separate sparse
assignment collection to canonical theme state rather than encoding preview
occurrence metadata into arbitrary CSS selectors.

The assignment records:

```ts
type UniqueElementIdAssignment = {
  id: string
  sourceSelector: string
  matchIndex: number
}
```

`sourceSelector` is an existing validated class or compound Filament selector.
`matchIndex` is the zero-based index in the preview document's
`querySelectorAll(sourceSelector)` result at selection time. The bridge uses
the same bounded lookup when applying the assignment after theme updates or
iframe navigation. It must not use arbitrary DOM paths, HTML text, or
unvalidated attribute selectors as identity.

Unique raw rules use the existing raw override shape with an effective selector
of `#id`. The assignment is the binding that tells the preview which original
element receives that ID. The shared `sourceSelector` rule remains a separate
raw override, allowing a unique rule to refine a shared baseline without
changing every matching element.

IDs must match `^[A-Za-z][A-Za-z0-9_-]{0,63}$`, be unique within the theme, and
never collide with a reserved builder or preview bridge ID. Assignment count
and match-index values are bounded. Unknown assignment records, duplicate IDs,
duplicate source/index identities, invalid selectors, and malformed values make
the theme invalid or are rejected during import according to the existing
fail-closed theme validation contract.

The schema version and migration decision must be recorded before implementation.
The preferred migration is a sparse empty assignment collection for existing
themes, preserving byte-for-byte behavior for themes that do not use the new
feature. Existing raw overrides and mode-specific properties must not be
materialized or rewritten during migration.

## 4. Preview bridge behavior

The bridge must validate the assignment collection using the same origin,
protocol, selector, ID, count, and index limits as the builder. Applying a valid
theme update must:

1. remove IDs previously assigned by the bridge;
2. resolve each assignment's bounded source-selector match;
3. assign the ID only to the requested match;
4. render shared and `#id` raw rules in deterministic order; and
5. leave the document unchanged when any theme payload validation fails.

If a route no longer contains the assigned match, the bridge should skip the
assignment and leave the rest of the accepted theme update functional. A later
navigation or theme update should retry the assignment. The bridge must not
overwrite an existing application-owned ID; it should report a safe, visible
Inspector status and leave that target unassigned.

Inspector evidence should report the assigned ID when present. Selecting the
same element after navigation must not create a second assignment or duplicate
raw override.

## 5. Raw override and export rules

The existing `.fi-*` selector grammar remains unchanged for class selectors.
The raw override grammar gains only the validated single-ID form generated by
this feature. Arbitrary IDs, commas, combinators, attribute selectors,
pseudo-elements, and declaration injection remain rejected.

Raw CSS precedence must be deterministic:

- foundation projection;
- semantic overrides;
- shared raw selectors; and
- unique `#id` raw selectors after their shared source selector.

Light/dark inheritance remains independent. A dark-mode edit to a unique rule
must not overwrite the light unique rule, the shared source rule, or another
assignment. Resetting a unique property removes only that property in the
active mode and falls back to the shared/inherited result.

Vanilla CSS export must contain the `#id` selector and remain usable in a clean
Filament fixture after the consumer applies the exported CSS and provides the
same ID in markup. JSON export must include the assignment collection and the
unique raw override without leaking transient Inspector outlines or bridge
state.

## 6. Accessibility and failure states

- The toggle has an explicit label, `role="switch"` or equivalent native
  checkbox semantics, and an accurate pressed/checked state.
- The ID input has a programmatic label and an inline error association.
- Enabling the feature announces the generated ID and target status through the
  existing Inspector status region.
- A duplicate or application-owned ID explains why the target remains shared.
- The feature is unavailable when no safe selected target or source match is
  available; it must not guess an ancestor.
- Keyboard-only users can toggle, edit, reset, and return focus predictably.

## 7. Verification contract

Implementation must use failing-first tests at each affected seam:

- validator and model tests for valid IDs, duplicates, reserved IDs, bounds,
  invalid assignments, migration, and round-trip serialization;
- raw action tests proving shared baseline plus unique override precedence,
  mode isolation, reset, undo/redo, and disabling behavior;
- CSS export tests proving deterministic `#id` output and clean-fixture parity;
- bridge tests proving one-match assignment, cleanup, collision handling,
  malformed-payload rejection, and navigation retry;
- component tests proving toggle/input/error accessibility and immediate UI
  state changes;
- Playwright tests using two repeated `.fi-section-header` elements proving a
  bottom-only change leaves the top element unchanged, survives reload and
  local persistence, and exports the expected ID rule;
- existing builder type-check, unit tests, production build, and the relevant
  Compose/browser checks required by the repository gate.

No MCP mutation tool is required for the initial UI-only slice. If unique IDs
are later exposed through MCP theme mutation, the capability inventory and
preview/confirm/apply authorization contract must be extended before claiming
parity.

## 8. Non-goals

- Adding arbitrary custom CSS or JavaScript.
- Assigning IDs to every preview node automatically.
- Replacing stable semantic selectors globally.
- Editing application-owned IDs on the user's real Filament markup.
- Creating a new selector language or a second raw-override inheritance engine.
