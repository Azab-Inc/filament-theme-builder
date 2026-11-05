# Implementation brief: editor guideline prototypes

## Deliverable

Create five development-only interactive UI prototypes on `/?guidelines-prototype=1&variant=actions|navigation|tokens|keyboard|mobile`, with a labeled floating previous/next switcher, shareable URL state, back/forward support, and a clear “Prototype · Changes are not saved” notice. These are design explorations, not a production redesign.

## Ownership & constraints

One writer owns all new `GuidelinesPrototype*` Vue components, `useGuidelinesPrototype*` composables, related models/styles, a new focused `e2e/editor-guidelines-prototype.spec.ts`, and the evidence report. Only modify existing `builder/src/App.vue` additively to mount a DEV-gated async component. Preserve every existing user edit (App.vue already dirty). Do not touch existing VisualPrototype files, demo files, packages, lockfiles, or .gitignore. Follow builder/AGENTS.md: typed Vue script setup, models in models, no style blocks, files <=100 lines. Prefer scoped CSS imported by prototype root; no global reset impacting the ordinary editor. No dependencies, commits, branches, real storage, backend mutations, or product state composables.

## Five questions / variants

1. **actions** — Can a compact toolbar prioritize theme identity and editing, with export formats behind one clear Export disclosure instead of six peer actions? Show grouped editable name (memory only), undo/redo for prototype edits if exposed, and functional keyboard-accessible Export disclosure. No fake success or download promises; choosing a format may show a labeled mock handoff panel. Clearly distinguish this design recommendation from a strict Vercel violation. Use actual editor context rather than a marketing landing page.
2. **navigation** — Can users find a setting without scrolling through all Foundations? Provide actual search with empty state/clear action, compact subgroup navigation (Colors, Surfaces, Typography, Layout), and URL state for query/group. Include real editable sample settings in selected groups, not dead controls. Keep section controls semantic links or complete tabs; current section visually obvious. Default to a useful search such as typography only for screenshot via URL, not hidden test data.
3. **tokens** — Make inherited token values legible: field name “Page Surface”, source `var(--gray-50)`, resolved swatch `#f9fafb`, visible inherited/override distinction, inline fix-oriented error, and Reset to inherited. Plain label-associated code input with name/autocomplete=off/spellcheck=false. Editing valid hex updates an adjacent sample preview instantly; invalid draft leaves last valid preview intact. Label resolution as illustrative, not a universal CSS resolver. No contrast-pass claims without calculation.
4. **keyboard** — Add skip-to-editor/preview links, clear active section and high-contrast focus-visible treatment, and a compact visible shortcut/wayfinding guide. Demonstrate keyboard operation and focus arrival via real controls. Do not intercept arrow keys within inputs/selects/textarea/contenteditable. Shortcut chips must match implemented keys (avoid fake shortcuts). Do not present existing keyboard tab support as wholly missing; audit issue is skip links and incorrect selected-state selector.
5. **mobile** — At 390×844, offer Edit / Preview as full-width switchable workspaces rather than two cramped columns. Use adequate touch targets, no horizontal page overflow, safe-area-aware bottom controls, retain in-memory edits across switches, keep focused controls unobscured. On desktop explain/demonstrate responsive behavior. This is a layout direction, not an assertion that Vercel mandates tabs.

Shared base can use a restrained, legible system-font editor shell and the actual same-origin Filament dashboard iframe as read-only visual context (clearly label it not wired to prototype edits), or an explicitly labeled local sample preview. Keep improvement variants structurally distinct (toolbar export panel, navigation search/results, token detail editor, keyboard wayfinding, mobile workspaces), not color-only variations. Reuse repeated control primitives rather than duplicating markup >2 times; explain any repeated-pattern extraction in evidence first.

## Verification & evidence

Before implementation write/run focused Playwright CLI tests and record expected failures due to missing prototype. Then implement and pass them against the running Compose gateway with COMPOSE_E2E=1. Cover all five variants, working switches/URL history, export disclosure Escape/focus, search+empty+reload, token validation/reset/last valid preview, skip links/keyboard/input arrow isolation, mobile edit/preview retention and overflow, ordinary route unchanged. Add focused unit tests only if useful; this task adds no production behavior or MCP capability.

Run from builder/: `npm run type-check`, `npm run test:unit -- --run`, `npm run build`. Record command, cwd, exit/result, tested HEAD and content hashes of relevant final files, environment and limitations in `docs/research/2026-10-23-editor-guidelines-evidence.md`. Do not rerun successful checks without changed relevant code.

Capture five AFTER screenshots using Playwright CLI in a fresh isolated browser context into `docs/research/editor-guidelines/`: `01-actions-after.png` (1440×1000, export open), `02-navigation-after.png` (1440×1000, useful query/results), `03-tokens-after.png` (1440×1000, inherited source/resolved context), `04-keyboard-after.png` (1440×1000, keyboard focus visibly on editor/active nav), `05-mobile-after.png` (390×844, Edit workspace). Wait for fonts/iframe/dashboard readiness if present; use deterministic current state and no browser storage writes. Controller captures corresponding before images. Screenshot output must be visible in repository and final gallery.

## Return

Report changed files, exact implementation design/URLs, expected-red and final-green evidence, required Vue checks, screenshot paths, known limitations, and ready-for-read-only-review status. Do not start a separate workflow, spawn agents, independently review, or commit.
