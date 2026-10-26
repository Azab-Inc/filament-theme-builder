# Inspector state colors

## Request

User cannot choose hover/focus/selected text colors independently. In particular Inspector selects `.fi-sidebar-item-label`, so a default white color also overrides labels on light selected/hover backgrounds.

## Baseline and boundaries

- Current branch `dev`, HEAD `d60e0b6`, plus prior uncommitted Inspector coverage/accessibility and unrelated prototype work. Preserve all existing changes; capture task-start diff/hash evidence before touching shared files.
- Use existing sparse raw overrides, validation, history, preview and exports; state switching alone must not mutate the theme.
- Selected/current sidebar navigation is ancestor `.fi-active` state, not transient CSS `:active`. Hover/focus for labels must belong to their actual interactive ancestor, not unfocusable label spans.
- Offer supported state choices with clear labels. Keep selected-element styling scoped to that element; do not apply label styles to whole links/sidebar or unrelated labels.
- Preserve strict safe-selector/protocol validation and off/on Inspector behavior. No new packages, schema migration, commits, ticket edits, or unrelated refactors authorized.
- Check existing MCP raw override/export capability parity; do not create an unguarded new mutation route. Document coverage and remaining limits honestly.

## Plan / owners

| Task | Owner | Status |
| --- | --- | --- |
| Real sidebar DOM/state reproduction and failing regression | luna6 | completed |
| Target-aware state UI, selector generation and canonical integration | luna6 | completed |
| Independent spec/correctness and quality review | reviewer | completed |

## Acceptance

- Select sidebar label, choose Default / Hover / Focus / Selected where verified applicable, edit each separately and see real corresponding state styling.
- Default and state values survive switching, reset/undo, and canonical JSON/CSS export. State choice does not itself add history or overwrite another state's value.
- Changing targets or manually editing selectors does not reuse stale state context or append duplicate pseudo-classes. Empty/unsupported targets remain safe/unavailable.
- Verify actual pointer hover, keyboard focus, and current navigation item state; positive state-specific and negative unrelated/default checks, and reset fallback.
- Keep existing real Product-name semantic mapping, generic fine-grained Inspector selection, modal accessibility and other dirty work intact.

## Evidence

Report: `docs/superpowers/verification/2026-10-26-inspector-state-colors.md`. Record commands/cwd/exit/env, task-baseline hashes and final changed-file hashes; red-capable tests before implementation. Use canonical Compose at `http://127.0.0.1:4175` and no extra dependencies. Known preceding full-unit CSS-entrypoint mismatch is unrelated dirty app.css; no silent changes to that source/test.

## Result

Implemented and verified. The raw Inspector state chooser is target-aware, state selection does not write theme history, and existing raw override/export paths persist distinct selectors. Independent review found no blocking defects. Remaining follow-up is optional extraction of the 104-line Inspector component and broader pure unit coverage; neither blocks the verified behavior.
