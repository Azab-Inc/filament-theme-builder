# Hierarchical Padding Controls

**Status:** Approved urgent design; implementation blocked

**Scope slug:** `hierarchical-padding-controls`

**Local ticket:** [FTB-054](../../../TICKETS.md#ftb-054)

**GitHub issue:** [#54](https://github.com/Azab-Inc/filament-theme-builder/issues/54)

**Planning fixed point:** `880e2ff6c536a44429b6f2fefbd7b8d99ee4996e` (2026-10-15; refresh the full `dev` HEAD before implementation review)

**Priority:** urgent; use the existing `priority: high` label. Do not create a new priority field or label.

This document defines the approved contract for semantic, hierarchical padding editing. It is documentation-only and does not approve source, application, prototype, or test changes. The exclusive planning lock is [`.scratch/spec-locks/hierarchical-padding-controls.lock`](../../../.scratch/spec-locks/hierarchical-padding-controls.lock), which must never be overwritten. Existing dirty worktree changes remain unrelated and must be preserved.

## 1. Purpose and boundaries

Expose padding as a first-class visual property across the existing semantic registry and inheritance model:

```text
Global default
  ↓
Section default (Forms, Tables, Buttons, ...)
  ↓
Individual component (Input, Textarea, Table cell, ...)
  ↓
Existing variant/state scopes
```

The editor shows the resolved/effective padding and its source. A reset removes only the selected explicit value so that inheritance resumes. A missing explicit padding at every supported level resolves to the native Filament value; there is no global blanket reset and no blanket selector rule.

This feature is limited to mapped visual padding targets. It must not style arbitrary DOM descendants, icons, checkbox/radio internals, `html`, `body`, menus, or wrappers merely because they are ancestors or convenient selectors. Density and shared spacing remain separate foundation concepts; padding controls do not mutate density or the spacing scale.

The feature remains compatible with light/dark mode behavior already defined by the current state model. Padding is not implicitly duplicated into a mode when the existing contract treats the target as mode-independent.

## 2. Verified target coverage contract

The registry is authoritative. Every target below is a proposed semantic target that must be verified against the installed Filament 5.9 showcase markup and the existing compatibility inventory before implementation. A target is not supported merely because a selector looks plausible.

| Group | Semantic target coverage | Verified selector evidence required | Mapping rule |
| --- | --- | --- | --- |
| Global | Global default padding only where a real, intentionally shared Filament visual surface exists | A concrete verified registry selector, not a universal descendant selector | Semantic default for mapped targets; never `*`, `html`, `body`, or all descendants |
| Forms | Form section/layout where distinct; field/container where distinct | Existing `.fi-section`, `.fi-fo-field`, and other registry selectors only after fixture verification | Do not double-pad a section and its child unless both are intentionally distinct visual targets |
| Forms | Text input, textarea, select/multiselect family, and other mapped input surfaces | Existing registry-backed selectors including `.fi-fo-text-input .fi-input`, `.fi-fo-textarea`, `.fi-fo-select`/`.fi-select-input` where the runtime confirms the visual box | Do not apply input padding to checkbox/radio icons or unrelated control internals |
| Tables | Table container, table header, table header cell, table cell as distinct targets | `.fi-ta`, `.fi-ta-header`, `.fi-ta-header-cell`, and a verified cell selector such as `.fi-ta-cell`/the exact runtime-qualified cell target | Container/header/cell must remain distinct and must not receive duplicate nested global padding |
| Buttons | Button default plus supported semantic variants/states | Existing `.fi-btn` and verified variant/state selectors from the action registry | Apply to the button visual box, not icon descendants or arbitrary action-group wrappers |
| Other registry groups | Cards/widgets, infolists, navigation, dialogs/modals, notifications, action groups, and other existing registry families | Each group requires a verified showcase selector and visual-target classification | Mark unsupported/unverified mappings as mapping work; never invent fake selectors or claim coverage |

The implementation must publish a coverage matrix that records target ID, group, exact selector(s), fixture/evidence, Filament compatibility, and whether the target is supported, unmapped, or intentionally excluded. Unsupported targets remain visible as such and do not emit CSS.

## 3. Registry and semantic target contract

Padding targets use stable semantic target IDs independent of labels and CSS implementation details. The registry contract is extended rather than bypassed. IDs must remain stable across label changes and selector maintenance; selectors may be versioned or replaced only with compatibility evidence and migration guidance.

Each supported padding target declares:

- group and semantic target ID;
- one or more verified selectors;
- visual target boundaries and nested-target policy;
- supported variant/state dimensions;
- padding control metadata and supported value units;
- Filament compatibility baseline and evidence reference;
- export classification and deterministic CSS ordering.

This is a new registry semantic contract that builds on FTB-006; it must not pretend FTB-006 already contains padding groups or target metadata. Registry validation rejects duplicate IDs, duplicate control identities, malformed selectors, unsupported units, and mappings without evidence.

## 4. Canonical value and inheritance contract

Padding is one canonical property with four optional edges: `top`, `right`, `bottom`, and `left`. Each edge is independently sparse. Omission means “no explicit value at this scope”; numeric zero is a valid explicit value and must never be treated as omission.

For each edge, the resolver selects the most-specific explicit value in the existing scope chain. A partially specified child inherits only the omitted edges from its parent. An explicit zero blocks the parent edge. Reset removes the selected edge's explicit value, restoring the nearest parent/native result; reset never writes a copied resolved value.

The resolved result exposes, per edge:

- effective value;
- source scope/target (global, section, component, variant, state, or native Filament);
- whether the edge is explicit at the selected scope;
- whether the result is native/unmapped and therefore not emitted.

The UI must show the same resolved/effective/source information used by preview, CSS export, JSON export, and MCP. A parent edit updates inheriting children immediately while preserving all child explicit overrides, including explicit zero values.

Existing variant/state scopes remain valid and are evaluated after the newly introduced semantic section/component hierarchy according to one documented, deterministic precedence model. The model must not create a second competing resolver or store.

## 5. Editor interaction contract

The editor presents an explicit hierarchy rather than a flat padding list:

```text
Global
├── Forms
│   ├── Default
│   ├── Input
│   ├── Textarea
│   └── Select
├── Tables
│   ├── Default
│   ├── Header
│   └── Cell
├── Buttons
│   └── Default
└── Other verified registry groups
```

The exact child list is registry-driven. Variant and state controls remain beneath their mapped component target; unsupported or unmapped groups are clearly identified rather than rendered as fake editable controls.

The control presents one linked all-sides input and optional top/right/bottom/left inputs.

- Editing while linked intentionally writes all four edges as one atomic history entry.
- Switching presentation between linked and separate mode does not silently overwrite heterogeneous edge values.
- If edges differ, the linked presentation clearly indicates mixed values; an explicit linked edit is required to make them equal.
- Separate-edge edits write only the selected edge and preserve the others.
- Reset can remove one edge or the selected target's complete padding record according to the existing reset affordance; it must not mutate unrelated properties.
- Keyboard access, narrow widths, zoom, focus visibility, labels, and status announcements follow the existing editor accessibility conventions.

Values reuse the existing raw visual-value allowlist for backward compatibility. That allowlist currently accepts the safe finite length syntax used by raw validation, including unitless `0`, numeric length tokens with the existing `px`, `rem`, `em`, `ex`, `ch`, `lh`, `rlh`, `vw`, `vh`, `vmin`, `vmax`, or `%` units, and existing bounded nonnegative spacing lists where applicable. The raw validator remains backward compatible with its current accepted syntax; semantic padding emission is stricter about CSS validity: zero is valid unitless, while a nonzero emitted length must carry a supported unit. Semantic controls may offer named spacing-scale choices, but they resolve those choices to canonical validated CSS length values; a literal token name is never emitted as CSS. Injection syntax and arbitrary `calc(...)`, `var(...)`, URLs, declarations, or executable content are not accepted. Per-edge values are individual declarations, not a composite shorthand string. Validation must check the actual emitted CSS value and preserve the existing raw-validation behavior rather than silently coercing unsupported input or inventing a new clamp.

## 6. Preview and export parity

The canonical mutation path is:

```text
control → canonical theme state → shared resolver/projection → preview CSS → iframe bridge → real Filament target
                                      ↘ JSON export / CSS export / MCP result
```

Edits must update a real Filament iframe immediately without a Laravel request, page reload, Vite rebuild, or nonessential network call. The preview must apply only to mapped target selectors and must demonstrate that section, component, table header/cell, form input/textarea, and button targets do not accidentally double-apply padding.

CSS export uses the same resolved values and selector registry as the preview. Existing FTB-004 vanilla export and canonical JSON parity are required. Padding does not inherit through the DOM: global and section inheritance is resolved in the theme model, not by relying on a container's CSS padding to affect its children. For each mapped visual target and edge whose resolved source is an explicit global, section, component, variant, or state value, preview and minimal CSS export materialize the effective declaration on that target's verified selector. Equal declarations may share a selector list only when that grouping preserves target boundaries and scope/state precedence. Native/unmapped edges are not guessed or emitted. Reset recomputes each affected target: it emits the next explicit ancestor's effective value, or removes the generated declaration when the result returns to native Filament styling. Canonical JSON remains sparse and never stores these derived per-target copies. A future Fully Explicit or Tailwind `@apply` mode integrates conditionally when that exporter exists, but neither future mode is a prerequisite for this urgent feature and no fake exporter support is added here.

## 7. State, migration, reset, and history

The canonical JSON schema adds grouped padding metadata through the existing versioned migration boundary. Old themes with no padding data migrate to an empty grouped structure (or the current canonical omission form) and continue resolving to native Filament values. Migration must preserve colors, palette values, density, spacing, light/dark values, raw overrides, icons, branding/runtime state, custom CSS, and existing semantic overrides.

The schema must distinguish absent edges from explicit zero and must not persist resolved inherited copies. A single linked edit is one meaningful history entry. Separate-edge edits, reset, undo, redo, reload, persistence, import, and export preserve sparse omission and zero semantics exactly.

If FTB-052 is implemented before this feature, the shared mutation guard must include per-edge padding lock identities and must prevent bulk padding application from changing locked edges. This feature does not implement padlocks, alter their contract, or create a dependency cycle solely to anticipate them.

## 8. Validation, safety, and observability

Validate at registry construction, UI mutation, migration/restore, JSON import, resolver input, preview serialization, CSS generation, and MCP boundaries. Every mutation identifies the exact target, scope, edge set, and current revision/confirmation context. Invalid input fails without partially applying unsafe or unknown values.

Logs may include operation IDs, stable target IDs, scope, edge names, and non-sensitive validation categories. Logs must not include secrets, arbitrary CSS payloads, confirmation tokens, or unrelated DOM/filesystem content. No server-side service or third-party dependency is introduced by this planning contract.

## 9. MCP and capability inventory contract

Padding must be AI-operable through purpose-built capabilities using the same registry, resolver, validation, history/state, export, authorization, and lock services as the UI. No UI-only mutation shortcut is permitted.

Required capability shapes are:

1. discover supported padding groups/targets, selector evidence, supported edges/units, and compatibility;
2. read resolved/effective padding and per-edge source/provenance;
3. preview a scoped set/reset mutation with a structured diff and validation results;
4. require explicit confirmation, then revalidate authorization, current revision, registry mapping, units, and locks before setting or resetting edges;
5. return the same resolved/export parity result as the UI.

MCP inputs accept stable target IDs, scopes, edge values, and approved units only; they do not accept arbitrary selectors or CSS rules. The capability inventory records operation type, authorization, confirmation, target scope, lock handling, and actual AI-client test evidence.

## 10. Test and verification contract

Implementation remains TDD. Establish failing model/resolver tests before production changes and keep tests on external behavior.

### Unit and store coverage

- registry target matrix, stable IDs, exact selectors, compatibility, nested-target policy, and unsupported/unmapped behavior;
- per-edge inheritance across global/section/component/variant/state scopes;
- omitted edge versus explicit zero, parent changes, reset-to-inherit, native fallback, and source/effective results;
- linked atomic four-edge edits, separate-edge edits, heterogeneous linked presentation, undo/redo, partial reset, persistence, old JSON migration, and invalid input quarantine;
- existing colors, palette values, density, spacing, light/dark values, raw overrides, and unrelated state remain unchanged;
- shared resolver output matches preview projection, minimal/fully-explicit CSS, and canonical JSON export;
- validation rejects unsafe selectors, invalid units, negative/non-finite values, unknown targets, duplicate identities, and unsupported mappings;
- if padlocks exist, locked per-edge values are preserved during bulk operations.

### Playwright coverage

Against the real builder and real Filament iframe, verify keyboard and narrow/zoomed UI behavior plus:

- global, Forms input/textarea/select, Table container/header/cell, and Buttons edits;
- effective/source display at each inheritance level;
- parent edits preserving child explicit overrides;
- reset restoring inheritance and native-before/after behavior when all explicit padding is absent;
- immediate computed padding on all four edges in the iframe;
- no duplicate nested padding on table/header/cell and form/container targets;
- linked/separate editing and one-history-entry semantics;
- CSS and JSON export parity with the visible preview;
- clean consumer/native state after reset and reload;
- no unintended network mutation, reload, or Vite rebuild.

### MCP verification

Verify capability discovery, read resolution/source, preview diff, explicit confirmation, authorization, stale-state revalidation, invalid target/unit rejection, lock handling where applicable, and an actual AI-client transport journey. Do not claim MCP support from unit-only or UI-only tests.

## 11. Blockers, coordination, and non-goals

The single feature ticket remains blocked until the genuine prerequisites are complete: the existing demo-first gate and FTB-003 stabilization, the FTB-006 registry/inheritance foundation (extended with the new padding group contract), and the versioned canonical JSON migration boundary (FTB-022). Existing FTB-004 vanilla CSS and canonical JSON parity are part of this feature's acceptance contract. FTB-024 Fully Explicit vanilla export and FTB-025 Tailwind `@apply` export are future coordination points only when those modes exist; they are not prerequisites and this feature must not implement or claim them. The ticket is also blocked by any active implementation of FTB-053 only where both changes touch the same core files or seams; this is a coordination constraint, not a new dependency cycle. Refresh and record the actual full `dev` HEAD before implementation review.

FTB-012 remains explicitly partial only for density integration and is not silently marked complete by padding work. The demo gate is not lifted or claimed ready by this design. FTB-052 remains a future coordination concern unless its implementation is present; do not invent lock behavior or force a cycle.

Out of scope: density changes, spacing-scale redesign, arbitrary CSS injection, blanket DOM selectors, unsupported/fake registry targets, backend/server services, third-party dependencies, prototype promotion, unrelated component refactors, parent-ticket closure/status changes, and implementation or test edits in this planning task.

## 12. Reciprocal publication links

- Local implementation ticket: [FTB-054](../../../TICKETS.md#ftb-054)
- GitHub feature ticket: [#54](https://github.com/Azab-Inc/filament-theme-builder/issues/54)
- Root specification index: [SPECS.md](../../../SPECS.md#deferred-hierarchical-padding-controls)
- Existing registry/inheritance design: [FTB-006 design](2026-10-11-theme-registry-inheritance-design.md)
- Existing padlock design: [FTB-052 design](2026-10-13-builder-value-padlocks-design.md)

This design is planning-only. Before implementation, repeat duplicate/ownership checks, refresh the fixed point, verify the current gate from evidence rather than stale tracker status, and preserve unrelated worktree changes.
