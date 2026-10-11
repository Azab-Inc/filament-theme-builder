# Theme Registry and Inheritance Design

**Date:** 2026-10-11
**Status:** Approved design — FTB-006 prerequisite
**Scope:** Define the semantic registry and theme-value inheritance contract for FTB-006. This supplements [`SPECS.md`](../../../SPECS.md) and the acceptance criteria in [`TICKETS.md`](../../../TICKETS.md#ftb-006); those remain authoritative for broader product requirements and ticket status.

## Scope and prerequisites

FTB-006 depends on FTB-003. It adds a version-aware mapping from semantic Filament concepts to selectors and supported theme controls, plus inherited values across Global → Component → Variant → State. This contract is a prerequisite for FTB-007 Inspector and later registry consumers; it does not authorize work that is blocked by the repository's demo-first gate.

The existing builder theme is `ThemeState` in `builder/src/models/theme.model.ts`, currently schema version 1 with `colors.primary`; `builder/src/stores/theme.ts` owns persistence and undo/redo. Extend that domain model and its existing mutation, persistence, history, and export paths. The registry is metadata used to interpret that theme, not a second source of theme values or a parallel state/export model.

## Registry metadata

Each registry entry describes one semantic theme target and includes:

| Field | Contract |
| --- | --- |
| `id` | Stable, unique semantic identifier, independent of wording and UI layout. Treat published IDs as persistent data identifiers; renaming a label must not change an ID. |
| `label` | Human-readable display text; may be revised or localized without changing identity. |
| `family` | Stable grouping/category identifier for related targets (for example, `button`). |
| `selectors` | One or more real Filament CSS selectors for the target, with selector intent documented and grounded in the supported Filament compatibility baseline. |
| `controls` | Allowlisted control/property descriptors, including the value type and validation constraints needed to accept or reject a theme value. |
| `variants` / `states` | Supported variant and state identifiers, where applicable; these are semantic keys, not arbitrary selector fragments. |
| `filamentCompatibility` | Explicit Filament compatibility baseline (major/version range as established by implementation evidence), so selector support is version-aware rather than implied. |

Metadata must be deterministic and validated as a whole: IDs are unique; selectors and supported keys are non-empty and well-formed; controls have known types and constraints; compatibility metadata is parseable. Unknown metadata is not silently interpreted as an active control. Concrete compatibility ranges and selector inventory belong to the registry implementation and verified Filament markup, not guesses in this design.

## Theme values and resolution

The existing theme model is extended with sparse explicit overrides associated with semantic target IDs, controls, and optional component/variant/state keys. The logical resolution path is:

```text
Global → Component → Variant → State
```

At each level, a present, valid explicit value replaces the inherited value for that same target/control. If no value is present, resolution continues to the parent. The child editor's default is **Inherit**: it stores no value. An inherited value is a resolved result, not a copied child value. Resolution ends at the global value or, if no level defines one, the registry/control default when one is declared; otherwise the target is unresolved and must be reported as such, not invented.

### Representative four-level example

For `button.primary.background`:

| Level | Stored value | Resolved value |
| --- | --- | --- |
| Global | `#334155` | `#334155` |
| Component: `button` | absent (Inherit) | `#334155` |
| Variant: `primary` | `#4f46e5` | `#4f46e5` |
| State: `hover` | `#4338ca` | `#4338ca` |

The default state and other components/variants inherit from their nearest defined ancestor. Removing the Variant override makes Variant resolve to Global (`#334155`), and State resolves to that same value unless it has its own override. The resolved values are computed from one sparse theme state; they are not separately persisted.

### Reset semantics

Resetting a control at any scope removes that scope's explicit override. It does not write the current parent value, a default copy, or a reset marker. Resolution then follows the ordinary inheritance chain. Clearing a child override therefore continues to reflect later parent changes and remains distinguishable from an explicit value equal to the parent.

## Minimal and fully explicit export

Exports use the existing theme model and export modes defined in `SPECS.md` §5:

- **Minimal** serializes explicit deviations only. Inherited controls and absent values remain absent, preserving the distinction between inherited and explicitly-set-equal-to-parent values.
- **Fully Explicit** resolves the selected theme scope and serializes the complete supported representation, including effective values inherited from ancestors. It is a materialized export, not a new persisted state or alternate source of truth.

Both modes use the same registry, target IDs, control validation, and resolver. Minimal output must not erase explicit overrides merely because their values happen to equal the parent. Export must not emit unsupported controls or unresolved values as if they were valid.

## Lookup contract

Given an element's available selector/attribute evidence and active Filament compatibility context, lookup returns either the uniquely matched registry entry (stable ID plus entry metadata) or an explicit no-match result. A lookup may return ambiguity with the candidate IDs when evidence matches multiple entries; it must never silently pick an arbitrary result. Lookup does not mutate theme state. Selector matching uses only registry-declared selectors and documented matching rules; arbitrary DOM text, labels, or user-provided selectors do not become trusted semantic IDs. FTB-007 may consume this contract for Inspector navigation, but Inspector behavior is outside this design.

## Validation and errors

Validate theme overrides at input/mutation boundaries and again when restoring persisted or imported state and exporting. For each override, confirm that the semantic ID exists, the control is declared for that entry, the requested scope/variant/state is supported, and the value conforms to the control's type and constraints. Reject or safely quarantine invalid persisted/imported data without applying it; do not coerce unknown keys into active theme controls.

Errors should identify the failing semantic ID, control, and scope/key when available, and distinguish unknown target, unsupported control/scope, invalid value, incompatible Filament baseline, and ambiguous lookup. Normal rendering/resolution should not crash on invalid external data. The implementation must choose a consistent validation result shape compatible with existing builder conventions; this design does not prescribe a new error framework.

## Persistence and undo/redo compatibility

The extended theme remains the single persisted `ThemeState` and continues through the existing store's local persistence and snapshot history. A user edit or reset is one theme mutation and must be undoable/redone as a complete state change; undo/redo restores the sparse overrides exactly, including absence versus explicit values. Inherited values are derived and must not be separately recorded in history or local storage. Validate restored data against the current schema and registry before use; schema evolution must preserve existing version-1 theme data, including `colors.primary`, through an explicit migration or compatible defaulting path rather than dropping it. Persistence failure must not prevent editing, consistent with the existing store behavior.

## Security and AI-operability boundaries

Registry IDs, selectors, controls, compatibility declarations, and scope keys are application-owned allowlisted metadata. Theme values are untrusted input: validate them by declared control type, safely encode them in CSS generation, and never interpolate arbitrary selectors, CSS rules, markup, or executable content from theme input. Lookup is read-only and must not expose unrelated page data.

Any future AI/MCP capability that reads or mutates theme values must reuse the same registry, resolver, validation, authorization, and persistence/domain path as the product. AI access must not grant extra permissions; preview proposed mutations and require explicit confirmation before applying them, then revalidate. Include capability-to-tool inventory coverage and meaningful authorization plus AI-client end-to-end verification when such a capability is implemented. This design itself adds no MCP tool and makes no UI-only capability exemption.

## Testing strategy

FTB-006 implementation tests should cover:

- Registry metadata schema, stable-ID uniqueness, control/scope validation, compatibility metadata, and deterministic lookup results including no-match and ambiguous-match cases.
- Resolver behavior for all four levels, omitted levels, registry defaults, unresolved values, and parent changes after child reset.
- Sparse-state semantics: Inherit stores absence; reset removes only the selected override; explicit-equal-to-parent remains explicit.
- Minimal export preserving only explicit overrides and Fully Explicit export materializing the same resolved result from the shared resolver.
- Invalid values/unknown IDs, unsupported controls or keys, incompatible baselines, and safe restore/import/export failure behavior.
- Existing version-1 `ThemeState` migration/defaulting and store persistence, undo, and redo preserving sparse overrides.
- A representative component fixture/contract demonstrating Global, Component, Variant, and State contributions together.

Use unit tests for registry, resolver, validation, and serialization; store-level tests for persistence/history compatibility. Add UI/Playwright coverage when FTB-006 introduces user-visible behavior; do not make a full editor or Inspector a prerequisite for validating the domain contract.

## Explicit non-goals

- Building a full registry editor UI, full theme editor, or the semantic Inspector (FTB-007).
- Icon packs, icon replacement, branding, or other non-CSS configuration surfaces.
- A separate inheritance, resolved-state, or export model/store alongside `ThemeState`.
- Unrelated builder features, showcase implementation, or bypassing the demo-first gate.
- Inventing unsupported selectors, compatibility ranges, UI presentation, or a new validation/error framework without implementation evidence.
