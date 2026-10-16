# Multiple Local Themes Design

**Date:** 2026-10-16  
**Status:** Approved design — FTB-021  
**Scope:** Define local multi-theme management, persistence, and UI behavior for FTB-021. This supplements [`SPECS.md`](../../../SPECS.md#21-local-themes) and [FTB-021](../../../TICKETS.md#ftb-021); these remain authoritative for broader requirements and ticket status.

## Goals and non-goals

### Goals

- Replace the single anonymous autosaved draft with multiple locally persisted, named themes.
- Let users create, open, rename, duplicate, and delete themes while identifying the active theme.
- Persist the active theme's canonical state and undo/redo history independently from every other theme.
- Migrate the existing single-theme local data once without losing a user's work.
- Keep editing usable and communicate storage failures without blocking or silently claiming persistence succeeded.

### Non-goals

- Changing the canonical theme schema, `ThemeStateV4`, or theme serialization.
- Cloud accounts, synchronization, collaboration, theme sharing, import/export, or cross-device history.
- New theme editing capabilities or changes to preset application behavior in FTB-020.
- MCP tools or theme-management tools in this ticket. The capability inventory is updated with a UI-only entry for this scope; MCP parity is deferred to FTB-048.
- A new persistence dependency or generalized storage framework.

## Canonical theme state

`ThemeStateV4` remains unchanged and is the complete canonical editable state for each theme. A local theme record associates a stable ID and user-visible name with a `ThemeStateV4`; history snapshots are also `ThemeStateV4` values. Derived CSS, preview output, and other computed values are not persisted as theme state. Validate restored states using existing theme validation/migration behavior before activating them.

## Storage contracts

Use browser `localStorage` with these distinct keys and JSON payload contracts:

| Key | Contract |
| --- | --- |
| `ftb-themes` | Theme index/list: records containing stable `id`, `name`, and any minimal metadata required for listing. It identifies membership and display order; it does not duplicate theme state or history. |
| `ftb-theme-active` | ID of the currently active theme. It must identify a record in `ftb-themes`. |
| `ftb-theme:<id>` | Validated canonical `ThemeStateV4` for that theme ID. |
| `ftb-theme-history:<id>` | That theme's undo/redo snapshot history and cursor, in the existing history semantics; it contains no other theme's snapshots. |

IDs must be stable, unique among records, and safe to use as key suffixes. Names are display data, not identity. Validate all parsed records, states, IDs, and history bounds on load; malformed data must not be trusted as active state. Do not store a single shared mutable history across theme IDs.

## One-time legacy migration

At startup, detect the legacy `ftb-theme` key. When present and valid, migrate its canonical state into one new local theme named **Untitled**, create the index/active pointer and empty or equivalent initial history for that theme, and then remove the legacy key only after the new records have been written and verified. The migrated state must be preserved exactly as `ThemeStateV4` (using existing migrations if legacy data is an older supported schema).

Migration is one-time and idempotent: retries must not create duplicate Untitled themes or overwrite an already-valid new-format collection. If new-format data already exists, preserve it and do not replace its active theme with legacy data. If legacy data is invalid, leave the current application usable, surface a storage/migration error, and do not destroy the legacy bytes automatically.

When no new or valid legacy data exists, initialize one default theme using the application's existing default theme state and name it **Untitled**.

## Theme operations

- **Create:** Create a new theme with a fresh ID, name **Untitled**, the existing default canonical theme state, and fresh empty/initial history. Persist it and make it active.
- **Open:** Switch the active ID to the selected theme, load and validate its own state and history, and expose that theme in the editor. Switching themes must not merge state, pending history, or undo/redo from the previous theme. Flush or cancel the previous theme's pending autosave safely before switching.
- **Rename:** Change only the display name in the index. Keep the ID, state, history, and active selection unchanged. Reject empty/whitespace-only names; trim surrounding whitespace. UI validation should prevent duplicate ambiguity only if the established product convention requires it; IDs remain authoritative.
- **Duplicate:** Create a fresh ID and a user-facing copy name (for example, “<source name> copy”), copying the source's current canonical state. Create fresh history for the duplicate rather than copying the source's undo/redo stack. The duplicate becomes active.
- **Delete:** Require explicit confirmation before deletion. Delete its state and history and remove its index entry. If it is not active, leave the active theme unchanged. If it is active, choose the most recently updated remaining theme as active; if none remain, create and activate a default Untitled theme. Never leave the active pointer dangling.

## Autosave and history

Theme edits schedule a **300 ms debounced** save to `ftb-theme:<active-id>`. Each theme has independent persisted undo/redo history at `ftb-theme-history:<id>`. Undo and redo operate only on the active theme, update its canonical state and history, and remain correct after switching away and reopening. A new edit after undo truncates that theme's redo branch according to existing history semantics.

Before changing the active theme or deleting it, flush its pending autosave or ensure the pending save is canceled only after the latest state has been committed by an equivalent safe path. A stale debounce callback must never write an old theme's state under a newly active theme's ID. Autosave failure must not disable editing or undo/redo.

## User interface and accessibility

Add a theme-management control to the builder toolbar. It shows the active theme name and opens an accessible dialog/modal containing the theme list and management actions (open, create, rename, duplicate, delete). Use native dialog semantics or an equivalent dialog implementation with an accessible name, focus placement on open, contained keyboard focus, Escape/close behavior, and focus restoration to the trigger. Destructive deletion requires a clearly labeled confirmation step.

The active theme must be visibly identified in the dialog/list and toolbar. Provide visible, non-blocking storage error status when load, migration, save, or history persistence fails; do not falsely report a failed save as successful. Errors should be actionable where possible, remain perceivable to assistive technology (for example, an appropriate live region), and avoid disrupting ongoing editing.

## FTB-020 active-theme interaction

FTB-020 preset application continues to replace the canonical state of the **currently active theme only**. The multi-theme manager must not apply a preset to all local themes, create hidden preset records, or change active selection. Existing preset confirmation for overwriting modified work remains applicable to the active theme. Applying a preset is an ordinary mutation of that theme and participates in its own undo/redo and autosave behavior.

## AI-operability inventory boundary

The capability-to-tool inventory for this ticket records local theme management as **UI-only** and marks the corresponding MCP tools/capability as **deferred to FTB-048**. Do not add MCP tools as part of FTB-021. This scoped deferral is explicit; when MCP parity is implemented, it must follow the repository AI-operability contract in `/.config/opencode/rules/ai-operability.md` (same domain validation and persistence path, permission parity, preview/confirmation for mutations, and meaningful authorization/end-to-end tests).

## Component and store boundaries

- Keep the theme-management dialog/list and interaction presentation in a focused Vue component; it emits or invokes explicit operations rather than owning persistence details.
- Keep theme collection operations, active-theme selection, per-theme state/history, autosave scheduling, migration, and storage error reporting in the existing theme store/domain boundary (or a narrowly scoped storage helper owned by that store).
- Keep canonical `ThemeStateV4` mutations and existing editor consumers unchanged in shape; consumers read the active theme through the existing store-facing contract.
- Keep storage serialization/validation at the persistence boundary. UI components should not parse or write localStorage directly.
- Avoid introducing a second canonical theme state model or duplicating the entire active state in the theme index.

## Atomicity and error handling

Browser localStorage does not provide multi-key transactions. Treat multi-key operations as ordered writes with a recoverable commit boundary:

1. Validate inputs and prepare the complete intended records before modifying storage.
2. Write required state/history records before publishing an index or active-pointer change that references them.
3. For deletion, update the active fallback and index safely before removing old state/history keys; orphaned records may be cleaned up on a later successful load, but visible records must never point at missing state.
4. For migration, verify new-format writes before removing the legacy key.
5. On quota, security, serialization, or malformed-data errors, preserve the last known usable in-memory state, do not report success, and show a visible non-blocking error. Where feasible, restore prior key values after a partial multi-key write; if rollback also fails, report the partial-storage condition and recover by validating/indexing at next load.

Never replace a valid collection with an empty collection merely because one key is unreadable. Recover valid individual themes where possible, quarantine/ignore invalid records without activating them, and ensure a valid active fallback exists before presenting the editor.

## Acceptance tests

### Unit/store tests

- Storage serialization and parsing for all four key contracts, stable unique IDs, malformed index entries, invalid states, and invalid history.
- One-time legacy `ftb-theme` migration to Untitled, preservation of exact valid state, sequential supported migration where needed, idempotent retry, and preservation of legacy bytes on invalid input or failed migration.
- Initialization with no storage, and no-overwrite behavior when new-format data already exists.
- Create/open/rename/duplicate/delete semantics, including fresh duplicate history, correct active selection, active-delete fallback, and last-theme deletion recreation.
- Independent per-theme undo/redo across edits, switches, reopen, and redo-branch truncation; no cross-theme history contamination.
- 300 ms autosave debounce, flush/cancel ordering on switch/delete, and protection against stale callbacks writing under another ID.
- FTB-020 preset application changes only the active theme and participates in that theme's history/autosave.
- Storage exceptions/quota failures and partial multi-key writes keep editing usable, preserve/recover prior valid data where possible, and expose a failure rather than success.

### Playwright acceptance tests

- Toolbar opens the theme manager; accessible dialog labeling, keyboard focus behavior, Escape/close, and focus restoration work.
- User can create, open, rename, duplicate, and confirm deletion of themes; active selection is visible and deletion fallback behaves as specified.
- Theme edits autosave after the debounce, persist across reload, and restore theme-specific undo/redo after reopen without changing another theme.
- Applying an FTB-020 preset affects only the active theme.
- Simulated or injected storage failures yield a visible accessible non-blocking error while editor interaction remains available.
- The UI capability inventory identifies these functions as UI-only with MCP deferred to FTB-048; no MCP functionality is required by this ticket.
