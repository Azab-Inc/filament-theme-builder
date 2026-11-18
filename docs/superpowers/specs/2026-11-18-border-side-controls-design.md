# Border Side Controls

Date: 2026-11-18. Status: planning contract; not implemented.

Tracking: [FTB-084 / #88](https://github.com/Azab-Inc/filament-theme-builder/issues/88) umbrella → [FTB-085 / #87](https://github.com/Azab-Inc/filament-theme-builder/issues/87) semantic slice → [FTB-086 / #86](https://github.com/Azab-Inc/filament-theme-builder/issues/86) raw Inspector slice. Local acceptance: [TICKETS.md](../../../TICKETS.md#ftb-084). Project: [Filament Theme Builder #30](https://github.com/orgs/Azab-Inc/projects/30), Backlog.

## 1. Confirmed gap

The user asked to choose border positions such as top, left, right and bottom. On 2026-11-18, the existing healthy development Compose stack at `http://127.0.0.1:4175/` was inspected with Playwright. Foundations exposes `border default light`, `border strong light` and `Border width`. The Components tab has separate-edge **padding** controls, but no border-edge controls. Navigation/read inspection did not edit theme values.

Source evidence:

- `builder/src/components/FoundationsSurfaceControls.vue`: default/strong border colors.
- `builder/src/components/FoundationsLayoutControls.vue`: one `borderWidth` numeric field.
- `builder/src/models/raw-overrides.model.ts`: aggregate `border-color`, `border-width`, `border-style` and separate `border-radius`; no `border-top/right/bottom/left-*` properties.
- `builder/src/components/RawVisualProperties.vue`: renders that property inventory without a border-side selector.
- `builder/src/utils/raw-override-property-validation.ts`: accepts a single length for `border-width`, not four-edge shorthand. Typing `0 0 1px 0` is not an existing supported workaround.
- `builder/src/registry/theme-registry-catalog-core.ts` and `theme-registry-catalog-showcases-entry.ts`: semantic color controls/coverage metadata do not provide border-side editing.

Existing GitHub issues and local tickets were checked; no dedicated border-side issue was found. These findings describe the checked development worktree, not a production deployment guarantee.

## 2. User-visible contract

Expose a clearly labeled **Border** group on verified border-bearing semantic targets and in raw Inspector. Offer **All sides**, **Top**, **Right**, **Bottom**, **Left**, with visible and accessible selected-side feedback. Side selection itself is presentation-only and must not create theme overrides.

The selected side determines the scope of width, color and style edits. Width supports explicit zero; style supports explicit none and the existing supported style vocabulary. Color supports the existing validated color/token inputs. Untouched color/style values continue to inherit. Do not silently force solid style or a new color when another property changes; explain when zero width or none style prevents a visible border.

Editing one side/property preserves the other three sides and all other properties. All sides intentionally applies the chosen property to four sides in one history transaction. Show Mixed when effective values differ, rather than substituting one side's value. Switching between All sides and individual sides does not normalize mixed values. Reset removes only the selected override(s) and restores their applicable inheritance/native fallback, rather than setting zero. All sides reset is one transaction affecting all four selected-property overrides in the current scope and mode.

Required outcomes include top-only, right-only, bottom-only, left-only, asymmetric/mixed borders and none. A bottom-only result must explicitly suppress unwanted inherited edges, rather than merely add bottom width. Physical Top/Right/Bottom/Left remain physical in RTL. Logical start/end editing, individual corner radii and chart canvas dataset outlines are outside this feature. Radius and shadow/ring remain separate controls.

## 3. Target coverage and integration boundaries

FTB-085 must first inventory the installed Filament border-bearing targets using existing registries and fixtures. Record selector, border-owning element (including wrapper or pseudo-element), actual native four-edge styles, variants/states and support status. Include representative input wrappers, section/card surfaces and table separators where verified. Do not use a blanket global selector or equate every coverage entry with a supported editable border.

Filament may draw an apparent border with a ring/box-shadow. Distinguish it from a CSS border, verify the real visual result and record any target limitation. A target cannot be marked supported if its ring obscures the requested edge result. Capture a ring-backed fixture where applicable; do not silently remove unrelated shadows. Extend COVERAGE.md and the capability inventory from the verified inventory. Coordinate FTB-071 metadata; do not require unrelated chart features to finish first.

Use the current canonical theme, resolver, registry, validation, preview and export boundaries. Inspect existing padding edge controls for reusable presentation/transaction patterns, but do not clone their storage or introduce a parallel inheritance engine. Share the smallest useful border-domain validation/projection seam across semantic and raw paths.

## 4. State, inheritance and compatibility

Represent each explicit edge/property/mode/scope distinctly from missing/inherited data. Preserve existing Global → Component → Variant → State behavior for registered supported scopes. Light edits flow into dark until the corresponding dark value is explicit. An explicit dark edit must not overwrite light or sibling edges. Existing mode-link operations retain their documented behavior using canonical edge identities; existing value guards apply where present.

Existing themes must render identically before a border-side edit, including native asymmetric separators. Do not materialize four equal edges simply because a legacy theme has a global border width. Preserve aggregate raw border records and all current JSON import validation. Side reset falls back to the applicable aggregate/inherited/native value; explicit zero and none never mean unset.

Before production changes, FTB-085 must record the exact canonical field names, allowed units/ranges, mode identities, schema/version migration decision and aggregate-versus-edge resolution table here. The implementation must establish the compatible format from the actual current schema rather than assume a version. FTB-086 reuses that settled contract and records raw precedence before editing. Required invariant: explicit edge overrides beat the applicable aggregate fallback regardless of editing order or JSON key order. Broad aggregate edits must not accidentally erase explicit edge overrides; All sides deliberately writes the four selected edge properties. Semantic/raw precedence remains consistent with the existing product contract.

### Approved V8 contract and verified ring inventory (2026-11-18)

Implementation is approved to add schema V8 with a sparse `borderEdges` collection. Each record is one canonical edge/property identity and uses the existing semantic mode convention: `value` is the light value and an absent `darkValue` inherits it in dark mode. The active mode is an operation context, not serialized state.

```ts
type BorderEdge = 'top' | 'right' | 'bottom' | 'left'
type BorderProperty = 'width' | 'color' | 'style'
type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double'

type BorderEdgeOverride = {
  targetId: string
  controlId: 'border'
  edge: BorderEdge
  property: BorderProperty
  scope: ThemeScope
  componentId?: string
  variantId?: string
  stateId?: string
  value?: string | number
  darkValue?: string | number
}

type ThemeStateV8 = Omit<ThemeStateV7, 'schemaVersion'> & {
  schemaVersion: 8
  borderEdges: BorderEdgeOverride[]
}
```

Width is finite, nonnegative, and has no artificial upper bound; semantic projection emits px. Color keeps the current validated semantic/token boundary. Style keeps the existing five-value vocabulary. Missing values inherit; explicit `0` and `none` never mean unset. V7 → V8 migration adds `borderEdges: []` and never materializes legacy aggregate values.

The mode-link target is `kind: 'semantic-border'` with the target, `controlId`, edge, property, scope, and hierarchy IDs. Its identity is generated by the existing canonical target identity function, so links are independent per edge/property.

Verified Compose baseline selectors and ownership:

| Selector | Native owner/effect | Approved status |
| --- | --- | --- |
| `.fi-ta-header` | real bottom CSS border | supported |
| `.fi-ta-row` | real bottom CSS border | supported |
| `.fi-section-content-ctn` | real top CSS border in the current fixture | supported |
| `.fi-input-wrp` | Tailwind `--tw-ring-shadow` base ring plus elevation shadows; `.fi-input` owns focus-visible outline | supported through ring replacement |
| `.fi-section` | Tailwind base ring plus elevation shadows | supported through ring replacement |
| `.fi-ta-ctn` | Tailwind base ring plus elevation shadows; `position: relative` | supported through ring replacement |
| `.fi-topbar` | Tailwind base ring plus bottom elevation shadow | supported through ring replacement |
| `.fi-wi-stats-overview-stat` | Tailwind base ring plus elevation shadows | supported through ring replacement |
| `.fi-btn.fi-outlined` | Tailwind base ring; hover changes background; focus-visible changes ring color | supported through ring replacement after actions fixture browser confirmation |

Ring replacement suppresses only the verified decorative base `--tw-ring-shadow` layer in a target-specific non-focus selector, then materializes four border longhands: explicit edge values win and untouched edges receive the native ring's verified width/style/color fallback. `--tw-shadow`, inset shadows, offsets, hover rules, focus-within/focus-visible rules, and outlines remain untouched. Reset removes replacement declarations and suppression once the final explicit edge is gone, restoring native ring CSS. `style: none` or width zero suppresses only the selected base border edge; transient native focus indicators remain intentionally visible.

The implementation uses real `border-box` borders and accepts the approved inner-content geometry change. Pseudo-element overlays are rejected for this slice because they cannot hide the original ring without opaque masking, clipping, or stacking/layout risks.

## 5. Preview, persistence and exports

Valid UI edits update the real preview immediately without a separate Apply step. Invalid drafts show field errors without corrupting the last valid state. Undo/redo restores edge identities, values and explicitness as one meaningful action; reload/autosave and JSON export/import retain those semantics.

Preview and export consume the same resolved state and deterministic border-longhand ordering. Emit aggregate fallback rules before applicable edge overrides and ensure later broad declarations cannot re-enable disabled edges. Minimal export emits explicit deviations; Fully Explicit resolves the supported edge values without inventing unknown native defaults. Supported Tailwind output must preserve equivalent semantics, using safe CSS fallback if the existing exporter requires it. Exported CSS applied to a fresh fixture must match computed preview edge width/style/color in both modes and supported states. Retain separate radius/shadow values.

## 6. AI operability

Extend purpose-built MCP discovery and reads to expose border targets, supported sides/properties/units, effective values, explicitness/provenance, mode and scope. Preview and confirmed apply must use the same validation, authorization, resolution and mutation services as UI. Require explicit confirmation for MCP mutations; revalidate authorization, current state and target support at apply time and reject stale confirmations without partial corruption.

Do not grant AI clients additional selector or CSS permissions. Test forbidden targets/operations, malformed values and unsafe selectors/declarations, mode isolation and stale-state handling. Update the capability-to-tool inventory and verify a real AI client discovers, reads, previews, confirms and applies an edge change, then compare its visible result and export. Extending existing purpose-built tools is appropriate where their contracts already fit; exact tool names are settled against the existing inventory during implementation.

## 7. Delivery and acceptance evidence

1. **FTB-085** delivers semantic controls with target inventory, settled state/migration contract, preview, persistence/export and MCP as a vertical slice. Verify existing FTB-006/022 prerequisite evidence; preserve all repository gates.
2. **FTB-086**, after FTB-085, adds raw edge widths/colors/styles to every relevant property/validation/bridge/import/mode-link/token/export/MCP boundary and delivers raw UI through those shared semantics. Verify existing FTB-008/022/058 evidence; coordinate FTB-052/062 guards/resets.
3. **FTB-084** closes only after both child slices and their complete acceptance evidence pass. Backlog denotes planning, not implementation readiness or completion.

Use failing-first focused unit/integration tests and create/run the real Compose Playwright CLI regression before production changes. Parameterize four sides and modes rather than duplicating setup. Verify selection is nonmutating; side/property isolation; all/mixed/zero/none; global/component/variant/state inheritance; independent dark overrides; reset/history; mode links; invalid values; native asymmetric defaults and old-theme import; reload/JSON; raw-semantic precedence; tokens; deterministic exports and fresh-fixture computed styles. Verify keyboard controls, accessible names/focus, narrow editor layout and physical-side behavior in RTL.

Run applicable builder type-check, unit and build checks after implementation and retain actual command/cwd/result and tested-state evidence. Require MCP authorization and actual-client checks. This documentation task does not claim those future implementation checks have passed. The existing demo-complete gate is evidenced satisfied as recorded at the root; FTB-012 density-only partial remains nonblocking, and all ticket-specific and release gates remain authoritative.
