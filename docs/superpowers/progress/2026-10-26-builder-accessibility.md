# Builder accessibility and objective UX pass

## Request and sources

Audit the whole production `builder/` and fix verified violations, including Manage themes backdrop dismissal. Use Vercel's official web-design-guidelines SKILL.md and its live Web Interface Guidelines, with W3C APG/WCAG for accessibility requirements.

- https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md
- https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

No package/skill installation, dependency additions, ticket edits, or commits authorized. Existing Inspector improvements and prototype/app-shell dirty changes must be preserved. Current baseline: `dev`, HEAD `d60e0b6`, plus pre-existing dirty Inspector and prototype work.

## Scope and decisions

- Cover production toolbar, modal/popover flows, navigation, forms, all editor sections, document/landmark structure, responsive and keyboard behavior.
- Generated `dist/`, dependencies, and development-only prototypes are not production audit targets; do not rewrite unrelated prototypes.
- Distinguish WCAG requirements, APG recommendations, and UX conventions. Do not apply React-specific or subjective copy/visual rules blindly to Vue.
- Shared modal, focus, and dismissal policy must preserve in-progress import/authorization/confirmation safeguards. Outside click must not confirm deletion or dismiss a busy protected operation.
- Describe repeated behavior and proposed boundary before abstracting it. Existing native buttons/details provide baseline keyboard behavior; avoid redundant ARIA or fake menu roles.

## Tasks

| Task | Owner | Status |
| --- | --- | --- |
| Static production audit | deepseek | complete; confirmed findings supplied in implementation brief |
| Reproduce, fix, and browser-test confirmed issues | implementation | complete; evidence linked below |
| Reviewer follow-up: relay focus, delete description, section/forms audit | implementation | complete; see reviewer addendum and final evidence |
| Independent correctness/spec and quality review | reviewer | passed; no remaining task blockers |

## Initial confirmed findings

`builder/index.html`: empty lang, Vite App title. `LocalThemeDialog.vue`: no backdrop dismissal; rename focus lost; delete initially focuses destructive action and confirmation lacks robust focus isolation. `ThemeImportDialog.vue`: open attribute without native modal lifecycle. `EditorNavigation.vue` and `ColorPopover.vue`: tab roving focus gaps. `ToolbarMenu.vue`: missing outside/Escape dismissal. `CustomColorPanel.vue`: error association absent. Palette toggle accessible name hides visible status. Verify current runtime and additional production files before fixing.

## Evidence and next action

Implementation/audit report: `docs/superpowers/verification/2026-10-26-builder-accessibility.md`. Record exact commands, cwd, exit summaries, changed-file hashes, browser environment, standards mapping, verified coverage, and remaining gaps. Existing full-unit CSS-entrypoint mismatch from dirty `app.css` was documented by the preceding Inspector task; do not silently fix unrelated work or claim compliance on that basis.

Implementation and independent review complete. Reviewer passed correctness/spec and quality after the scoped repair. Controller reconciled Git status and `git diff --check` passed. Existing unrelated dirty builder/App/app.css, prototype, Inspector, demo, and generated changes were preserved; no commits or dependency changes made. Ready for user validation, subject to the documented audit limits and unrelated failing checks.

## Reviewer follow-up disposition

- Relay import without a picker opener now returns focus to the visible Tools disclosure summary after cancel/backdrop dismissal; a failed authorization keeps the modal and retry state and focuses its alert.
- Destructive warning is linked with `aria-describedby`; Cancel remains initial focus and manager content stays inert.
- `SemanticComponentControls` already uses `v-show`; the final browser matrix verified exactly one associated visible tabpanel across Foundations/Components/Branding/Icons at desktop, 640px 2x-width proxy, and 420px. Inspector evidence automatically selects its tab and panel; both are linked and visible. No unnecessary tabpanel or Inspector protocol edits were made.
- Bounded source audit for foundations/component/padding/icons/branding/raw fields added control names, validation associations, and accessible naming where concrete omissions were confirmed. Form/source matrix, red/green evidence, and SHA-256 hashes are in `docs/superpowers/verification/2026-10-26-builder-accessibility.md`.
- Final check: 124/125 unit files passed (546/547 tests); the sole CSS-entrypoint assertion mismatch is caused by pre-existing `builder/src/app.css` and remains untouched. Focused relevant unit suite (32), type-check/build, and final Playwright suite (21) passed. The existing storage-failure e2e remains unresolved and excluded; details are documented in verification.
