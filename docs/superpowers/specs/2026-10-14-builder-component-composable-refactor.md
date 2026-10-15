# Refactor builder into components, composables, and utilities

**Status:** phase 1 in progress — characterization only; production extraction has not started
**Scope slug:** `builder-component-composable-refactor`
**Ticket:** [FTB-053](../../../TICKETS.md#ftb-053) · [GitHub #53](https://github.com/Azab-Inc/filament-theme-builder/issues/53)
**Review fixed point:** `546818b828b68e51251121fb407b81015ad7b7a4` (2026-10-15 current `dev` characterization baseline)

This document defines the approved scope for the single refactor ticket. The exclusive scope lock is recorded separately at `.scratch/spec-locks/builder-component-composable-refactor.lock`. Phase 1 is restricted to tests and baseline evidence: no production behavior or file placement changes are included. This phase does not lift the repository's demo-first/root gate. The worktree contains unrelated concurrent changes that must be preserved.

### Phase 1 evidence (2026-10-15)

- Refreshed the characterization baseline to current `dev` HEAD `546818b828b68e51251121fb407b81015ad7b7a4`.
- Added App characterization assertions for stable DOM/ARIA/data hooks, owned `keydown`/`message` listener cleanup, canonical JSON bytes, and all five public export filenames.
- Added Playwright characterization for accepted multipart branding uploads and rejected-upload state preservation.
- Existing unit and integration coverage continues to characterize schema/projection/protocol validation, Inspector and editor layout modes, prototype-query behavior, exports, recovery, and real iframe parity; see `builder/src/__tests__` and `e2e/`.
- Baseline builder checks passed: unit tests, type-check, and production build. Compose Playwright run: 96 passed, 3 skipped (test-safe upload limits and production gateway are opt-in). This evidence does not complete phase 1 or authorize production extraction.

## 1. Goal and non-goals

Move the oversized builder shell toward cohesive Vue components, focused composables, and framework-independent utilities. The refactor covers the current approximately 1,082-line `App.vue` and all current `builder/src/services` modules. It is structural only: existing behavior, contracts, selectors, IDs, accessible names, state shape, export output, and preview protocol remain unchanged.

Out of scope: new product behavior, schema/color/CSS semantic changes, new MCP tools, third-party dependencies beyond the explicitly approved builder Tailwind CSS 4.3.3 pipeline, backend changes, prototype promotion, layout redesign, Pinia domain redesign, model/DTO/registry relocation, or changing the demo-first gate. The existing prototypes remain prototypes; no real preview effects are added to prototype mode.

### Approved builder CSS pipeline (review clarification)

- The only approved builder dependency/configuration addition is the minimal Tailwind CSS 4.3.3 build-time pipeline: `tailwindcss` plus `@tailwindcss/vite` as builder dev dependencies, and the Tailwind Vite plugin.
- Keep the CSS entrypoint import in `src/main.ts` as `import './app.css'`; `app.css` imports only Tailwind's theme and utilities layers (`tailwindcss/theme.css` and `tailwindcss/utilities.css`).
- Do not import `tailwindcss` wholesale or enable Preflight. Preserving existing browser/native styles and prototype rendering is required.
- No other third-party dependency may be added as part of this ticket.

## 2. Boundaries and invariants

- Pinia remains the canonical state, history, persistence, and recovery authority. Composables coordinate it; they do not create competing state copies.
- `src/composables/useX.ts` owns Vue reactivity, lifecycle registration, browser APIs, and orchestration of application effects. Do not create a monolithic `useApp` wrapper.
- `src/utils/` owns deterministic validation, resolution, transformation, serialization, generation, and export functions. Utility modules must not import Vue, Pinia stores, components, composables, or browser globals, and retain plain-function APIs.
- Domain models stay in `src/models/`, transfer-only shapes in `src/dtos/`, and semantic/Filament registries in `src/registry/`.
- Shared/domain types declared in `App.vue` or composables are moved to dedicated `.model.ts`/`.dto.ts` files in the appropriate boundary folder; component/composable-local implementation details may remain local.
- Builder styling uses only the approved Tailwind CSS 4.3.3 pipeline above, imported once through `src/main.ts` and without Preflight.
- Components use typed props/emits/slots and focused composables. Pass reactive refs and callbacks rather than introducing a giant union of props or excessive prop drilling.
- Any repeated field-row markup or mutation/reset/status logic found in more than two places must first be described in the implementation plan, then extracted to a focused reusable control/component. Do not abstract one-off markup merely to reduce line count.
- Existing effective values, provenance labels, reset-to-inherit behavior, light/dark separation, alpha handling, responsive spacing, and decimal spacing values remain identical.

## 3. Current service migration inventory

Every current service is classified below. There must be no remaining `src/services` directory or import after the contract facade is retired.

| Current module | Destination | Boundary decision |
| --- | --- | --- |
| `foundation-defaults` | `utils/foundation-defaults` | Pure defaults, cloning, density presets, and default theme construction. |
| `foundation-projection` | `utils/foundation-projection` | Pure inventory-gated projection. |
| `foundation-provenance` | `utils/foundation-provenance` | Pure explicit-path/provenance helpers. |
| `foundation-recovery` | `utils/foundation-recovery` plus `composables/useRecovery` | Split parsing/merge/restore validation from injected local-storage reads/writes, errors, and recovery actions. |
| `foundation-validation` | `utils/foundation-validation` | Pure allowlist, range, font, mapping, and state validation. |
| `icon-export` | `utils/icon-export` | Pure PHP projection/export. |
| `inspector-protocol` | `utils/inspector-protocol` | Pure protocol types, guards, and registry resolution; browser message ownership belongs to `useInspector`. |
| `palette-generator` | `utils/palette-generator` | Pure palette generation and override application. |
| `panel-branding-export` | `utils/panel-branding-export` | Pure JSON/PHP export. |
| `panel-branding-validation` | `utils/panel-branding-validation` | Pure defaults, validation, and setting classification. |
| `raw-override-validation` | `utils/raw-override-validation` | Pure selector/property validation and selector proposal; protocol types are imported from `utils`. |
| `theme-resolver` | `utils/theme-resolver` | Pure inheritance resolution. |
| `theme-serialization` | `utils/theme-serialization` | Pure canonical/minimal/fully-explicit serialization and deserialization. |
| `theme-validation` | `utils/theme-validation` | Pure registry/theme/resolve-request validation. |
| `vanilla-css-export` | `utils/vanilla-css-export` | Pure CSS projection/export; output ordering and formatting are frozen. |

The migration must update stores, registry consumers, components, composables, tests, and any barrels/imports in one coherent graph. No compatibility wrapper may remain unused; an expand-contract facade is allowed only while consumers are being migrated and is deleted before completion.

## 4. App.vue decomposition contract

`App.vue` becomes a composition shell that selects the inspect/prototype/production branches, wires top-level components, and owns no feature markup or business workflow. The production branch is decomposed into cohesive sections without changing DOM behavior:

- shell/header and toolbar;
- export actions and export status;
- undo/redo and legacy recovery status/actions;
- foundations editor, including palette rows;
- mode controls;
- typography editor;
- layout/density editor;
- panel branding and uploads;
- icon configuration;
- semantic component controls;
- raw/advanced Inspector controls;
- preview frame.

The existing DOM IDs, `data-*` hooks, ARIA labels/roles, section names, iframe title, event semantics, and CSS selectors are compatibility contracts. Components may share refs/reactive values through focused props and emits, but must not fork canonical theme state. Type-boundary checks must also keep shared editor types outside `App.vue` and composables.

Focused composable seams should cover the current responsibilities, using names such as `useFoundationEditor`, `usePreviewBridge`, `useInspector`, `useExportActions`, `useBrandingUploads`, and `useRecovery` where the extracted responsibility warrants them. Names are guidance, not permission to create trivial wrappers; each composable must own a coherent reactive/lifecycle/effect boundary and be independently testable.

## 5. Behavior-preservation contract

- Preview bridge behavior remains immediate: allowed origin, exact `event.source`, protocol version, message schema, target origin, theme projection, Inspector commands/events, and runtime-refresh behavior are unchanged.
- Listener ownership is explicit and cleaned up on unmount. Multiple mounts cannot duplicate `keydown`/`message` listeners or share unintended mutable state. Runtime refresh is intentional and must not become a page reload for ordinary edits.
- Clipboard uses the current native path and fallback semantics. Download URLs/blobs/data links and deferred cleanup remain safe and deterministic.
- Branding upload errors, accepted references, quota/rejection messaging, and error recovery remain unchanged.
- Legacy recovery preserves native defaults, malformed/unsupported archive handling, download behavior, restoration history, and injected storage failure behavior.
- Foundation controls preserve validation, invalid-input feedback, reset, provenance/effective-value display, alpha colors, responsive behavior, and decimal spacing.
- JSON, vanilla CSS, icon PHP, branding JSON/PHP, and any existing export outputs remain byte-for-byte or semantically golden-equivalent as currently specified; no output/schema migration is part of this ticket.

## 6. Test and verification contract

Implementation remains TDD: establish failing seams before each extraction, then migrate the smallest slice. Tests assert external behavior rather than private file placement, except for the explicit type-boundary guard that ensures shared/domain types are declared in `.model.ts`/`.dto.ts` files.

- Keep and relocate/update pure unit tests for every utility, including defaults/projection/provenance/recovery parsing, palette generation, validation, resolver, serialization, protocol guards, raw selectors, branding/icon exports, and vanilla CSS golden parity.
- Add composable/component tests for lifecycle cleanup, multiple mounts, Pinia history/persistence authority, effective values/provenance, reset semantics, native defaults, alpha and decimal spacing behavior, clipboard fallback, download cleanup, uploads, quota/error handling, and recovery failure paths.
- Use the existing DOM IDs, ARIA labels, and data hooks in component tests; do not replace them with implementation-specific selectors.
- Run the existing unit/type/build checks from `builder/` and the relevant Compose Playwright tests before claiming completion. Use Playwright MCP against the real builder and iframe to verify edit-to-preview, Inspector origin/source/schema behavior, runtime refresh, export actions, branding uploads/errors, recovery, and no listener leaks across mount/unmount.
- Verify both normal production mode and prototype query modes. Prototype mode must not create real preview bridge effects or iframe orchestration beyond its existing behavior.
- Root Compose remains the canonical complete runtime. No new package or service may be installed or added beyond the approved builder Tailwind CSS 4.3.3 CSS pipeline above.

## 7. Sequencing and readiness

This is one overall ticket, internally executed as an expand-contract sequence: (1) establish pure utility/composable/component seams and parity tests, (2) migrate consumers in coherent batches while any temporary compatibility facade is still used, (3) move all `App.vue` workflows/markup, (4) migrate all tests/barrels/registries/stores, (5) delete the facade and `src/services`, then (6) run full end-to-end verification. Every checkpoint must remain reviewable; the final checkpoint must prove no `src/services` references remain.

The ticket is future and blocked by existing FTB-003 functionality stabilization, the unchanged Phase 1/demo-first gate and foundation/control stabilization, and coordination with FTB-050/051/052 when their shared builder rows or shell work is active. Those future enhancements are parallel coordination concerns, not new blocker-cycle dependencies. The refactor does not implement layout modes, color pickers, or padlocks and must not make them prerequisites for unrelated work.

## 8. AI operability and capability inventory

This structural refactor introduces no capability. Existing UI-only or MCP-backed operations retain their current inventory entries, authorization, confirmation, validation, and shared-service boundaries. Do not add tools or claim new AI-client capability. The implementation report must inventory unchanged capabilities, changed import paths, and test evidence without bypassing existing AI-operability contracts.

## 9. Reciprocal publication links

- Local tracker anchor: [FTB-053](../../../TICKETS.md#ftb-053)
- GitHub tracker issue: [#53](https://github.com/Azab-Inc/filament-theme-builder/issues/53)
- Root specification index: [SPECS.md](../../../SPECS.md#deferred-builder-component-composable-refactor)

This document is design-only. Implementation must refresh the fixed point, repeat duplicate/ownership checks, and obtain the normal implementation approval before modifying application or test code.
