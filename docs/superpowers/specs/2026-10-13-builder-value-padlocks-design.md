# Builder Value Padlocks

**Status:** Approved design; implementation blocked

**Scope slug:** `builder-value-padlocks`

**Local ticket:** [FTB-052](../../../TICKETS.md#ftb-052)

**GitHub issue:** [#52](https://github.com/Azab-Inc/filament-theme-builder/issues/52)

**Planning fixed point:** `66c8b6e543717f41266b8c100d7cdeaa291dbdb1` (2026-10-13)

**Review rule:** refresh the fixed point before implementation review if functionality changes land.

## 1. Purpose and boundaries

Add a strict, per-editable-value protection system to the builder. Every editable builder value gets a padlock control on the **left** of its field. Locking freezes the value currently resolved by the editor and prevents all value-changing paths until the user explicitly unlocks it.

This is a builder-state feature only. It does not authorize deployment, change the demo gate, add dependencies, or modify source/prototype files in this planning change. The existing repository guidance remains authoritative: builder work is still blocked by the demo-complete gate and foundation/control projection stabilization; those prerequisites are not marked done here.

## 2. User-visible contract

### 2.1 Field coverage and placement

The lock inventory is derived from the complete editable-value registry/control inventory, not from a hand-maintained subset of the current Foundations markup. It must cover:

- all foundation palette bases and editable shade controls;
- generated palette shades 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, and 950;
- light and dark values as distinct lock keys;
- surfaces, borders, text, spacing, density, radius, border width, shadows, and typography composite values;
- icon pack and semantic resource-icon overrides;
- panel/runtime and other editable non-CSS values, including branding values when those controls exist;
- component, variant, state, raw-element, custom-CSS, and other registry-backed editable controls;
- future registered editable controls without requiring a separate lock implementation.

Every editable field renders one reusable lock control before the field. The control has a stable field name, keyboard operation, `aria-pressed`, an accessible label, and a tooltip/help message explaining that protection blocks edits and bulk operations. The locked state is not communicated by color alone.

The repeated field markup in `App.vue` currently duplicates the same label/value/status/reset shape across palettes, mode-specific controls, typography, layout, icons, and component controls. The implementation should introduce one shared padlock control and one centralized lock guard/service rather than repeat lock markup or lock checks; this is the intentional DRY/SOLID abstraction justified by the existing repeated field pattern.

### 2.2 Strict lock semantics

On lock, resolve and snapshot the **effective current value**, including inherited values, CSS-variable/inherited values, generated palette shades, and runtime-resolved values. Preserve the source expression/provenance as informational metadata only; it is not the frozen value. If resolution is missing, malformed, ambiguous, or otherwise unknown, locking fails safely with an actionable non-mutating message and never guesses or writes an empty value.

While locked, the same canonical guard rejects:

- direct field edits, pickers, selectors, and icon/font choices;
- regeneration or source/base changes that would alter the locked result;
- individual, section, component, group, or theme reset;
- undo and redo restoring a snapshot that would change the locked result;
- bulk theme/preset/import application.

Explicit unlock is the only operation that changes protection state. Undo/redo never implicitly unlocks a value, restores stale lock metadata, or erases an active lock. Unlocking does not immediately revert, regenerate, or restore the prior source value; it only permits future edits. Restoring inherited/default behavior is a separate explicit reset after unlock.

For multi-value operations, unlocked values apply normally and locked values are skipped. The result reports the exact skipped field keys and reasons; a fully skipped operation is not a silent success. The current lock snapshot remains authoritative during partial application.

Aliases resolve to one canonical lock identity. For example, a header primary value and palette primary value sharing one path share one lock. Light and dark values remain separate identities. Typography is a composite whole-value snapshot: changing any member of the composite is blocked while its typography value is locked.

Each generated shade has its own 50–950 snapshot, including 500. Locking a generated shade freezes that shade even if its base later changes. Existing generated explicit projection is palette-wide today; implementation must change projection/materialization so locking a shade does not accidentally freeze or overwrite its unlocked peers. Subsequent base changes still regenerate unlocked shades normally while retaining locked snapshots. The lock affects the actual preview and exported effective output, not merely editor display.

## 3. State, persistence, and migration

Locks are versioned metadata in the canonical theme JSON. The metadata contains a schema/version marker, canonical field path/identity, effective frozen value, source/provenance metadata for explanation, compatibility/value type information, and integrity data (including hashes needed to reject stale or incompatible records). It must not contain untrusted CSS selectors or executable/payload content.

The lock metadata is persisted with local autosave, survives reload, is restored during bootstrap, and is included in JSON export/import. Existing themes without lock metadata migrate to **all unlocked**. Current locks take precedence when merging imported locked fields; importing an unlocked or conflicting value must not silently overwrite a currently locked field. Migration and import validate metadata version, hashes, canonical paths, value shape, and compatibility before applying anything. Invalid, malformed, stale, unknown, or unresolved metadata fails safely without empty overwrite or current-theme damage.

Schema migration must be explicit and previewable through the existing migration boundary. The implementation may not silently add keys to exports: schema version, metadata shape, import acceptance, migration preview, and JSON export parity must be specified and tested against exact keys. Serialized locks loaded at bootstrap are authoritative after validation.

## 4. Preview, projection, and concurrency

The effective frozen snapshot must flow through the existing canonical state → projection/export → preview bridge path. A pin therefore freezes the rendered appearance and exported effective result, not just a control's disabled state.

All mutation paths call the same centralized lock service/guard. Async editor operations re-check locks at apply time, after resolution and before committing state. A stale editor event, delayed regeneration, preview confirmation, bulk import, or MCP apply operation cannot overwrite a value locked after the operation began. Resolution failures, missing registry paths, malformed values, and compatibility mismatches produce structured failure/skip results and preserve the last valid theme.

## 5. MCP and authorization contract

This feature must be AI-operable through purpose-built MCP capability coverage, while using the same domain lock service, validation, confirmation, and authorization as the UI. The capability inventory must record:

- discoverable editable-value and lock status inventory;
- read-only lock/effective-value inspection;
- preview lock, unlock, and multi-value apply plans with skipped locked fields;
- explicit-confirmation mutation for lock/unlock/apply;
- apply-time permission, current-value, resolution, compatibility, and lock revalidation;
- AI-client evidence for discovery, preview, confirmation, successful mutation, rejection, and partial skip.

MCP must not bypass locks or gain extra permissions. No UI-only claim is allowed for this capability. Local stored metadata is not an authorization boundary; authorization remains in the shared service and caller context. No untrusted selectors, CSS payloads, filesystem references, or arbitrary code are accepted in MCP inputs.

## 6. Failure, recovery, and security cases

- Missing or unresolved effective value: refuse lock, preserve state, explain resolution failure.
- Malformed/stale metadata, bad hash, unknown path, incompatible type/version, duplicate identity, or invalid value: reject that record/operation without destructive normalization.
- Locked direct edit/reset/regeneration/import/undo/redo: reject or skip with a structured reason; never silently mutate.
- Mixed bulk operation: apply only unlocked compatible entries and report all skipped locked entries.
- Concurrent stale apply: re-check at commit and return a conflict/skip result without overwriting the active lock.
- Unlock: explicit and auditable; no automatic restore or source regeneration.
- Import: current locks win; invalid imported lock metadata cannot clear or weaken them.
- Storage unavailable/full: keep editing usable, do not claim persistence, and do not drop active in-memory locks.
- No CSS/HTML/JS payload is interpreted from lock metadata or MCP input.

## 7. Testing and observable seams

Test-first implementation is required. Define public seams around the lock inventory, effective-value resolver/materializer, centralized mutation guard, migration/serialization validator, preview/export projection, and MCP tools before implementation.

Unit/component coverage must verify:

1. complete registry/control inventory, including icons, resource overrides, fonts, runtime/branding values, raw/component paths, aliases, light/dark identities, and composite typography;
2. lock snapshot generation/materialization, source metadata, unknown-resolution failure, hashes, and exact schema migration/export keys;
3. every generated shade 50–950 independently, including 500, with base regeneration preserving locked shade snapshots and regenerating unlocked peers normally;
4. direct edits, picker/selector changes, regeneration, per/group reset, undo/redo, and bulk import/preset behavior under active locks;
5. partial multi-operation application and deterministic skipped-field reporting;
6. persistence/reload/bootstrap, old-theme unlocked migration, current-lock precedence, malformed metadata, and stale async apply rechecks;
7. unlock-only protection changes and no surprise restore on unlock;
8. actual preview projection and effective CSS/runtime export parity.

Playwright must verify the per-value inventory, left-side accessible lock buttons, keyboard and tooltip behavior, lock/unlock journeys, shade regeneration, reset, undo/redo, import, reload, light/dark separation, aliases, typography composite behavior, partial-operation reporting, and visible preview/export freezing. Tests must prove locked controls are not merely disabled-looking: the rendered effective result remains pinned.

MCP tests must verify capability discovery, exact input validation, authorization, preview-confirm-apply flow, apply-time revalidation, lock/unlock behavior, partial skips, and an actual AI-client transport journey with evidence recorded in the capability inventory.

## 8. Sequencing, blockers, and out of scope

The single implementation ticket is blocked by the existing FTB-003 functionality stabilization, the repository's unchanged demo-first gate (including remaining FTB-018 requirements), current foundation/control projection stabilization, and the versioned JSON import/migration boundary needed for safe lock portability. FTB-012's density-only partial status remains non-blocking. Where local root guidance and tracker issue states are stale or inconsistent, the root gate remains in force until the documented acceptance criteria and evidence are actually resolved; tracker status alone does not mark the gate complete. This design does not close, alter, or relax any parent issue or existing gate.

No new dependency, source/prototype edit, deployment authorization, user-account system, or unrelated editor redesign is included.

## 9. Reciprocal references

- Local implementation ticket: [FTB-052](../../../TICKETS.md#ftb-052)
- GitHub feature ticket: [#52](https://github.com/Azab-Inc/filament-theme-builder/issues/52)
- Ticket acceptance criteria: [FTB-052](../../../TICKETS.md#ftb-052), especially [lock semantics](../../../TICKETS.md#ftb-052-lock-semantics), [persistence and migration](../../../TICKETS.md#ftb-052-persistence-and-migration), [MCP coverage](../../../TICKETS.md#ftb-052-mcp-coverage), and [verification](../../../TICKETS.md#ftb-052-verification)
