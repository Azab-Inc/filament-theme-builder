# Editor guidelines prototype review — progress

## Goal & scope

Audit `builder/` against the current Vercel Web Interface Guidelines and present five interactive, throwaway improvement prototypes with a description and matched before/after screenshots for each. No production editor promotion, dependency additions, persistence, or backend mutations.

## Accepted decisions

- Work on existing `dev` branch. Preserve all pre-existing dirty files and visual prototypes.
- Prototype uses the existing `/` route with a separate development-only `guidelines-prototype=1` gate and URL-addressable variants. Existing App.vue prototype gates remain intact.
- Five review candidates: action hierarchy; findable/deep-linkable settings; contextual color tokens; keyboard wayfinding; full-width mobile editing/preview switching.
- Prototype state is memory-only and explicitly labeled. Product/MCP capabilities remain unchanged; production acceptance and MCP promotion are outside this design exploration.
- Use existing Vue/TypeScript/Tailwind and the running Compose gateway at http://127.0.0.1:4175. No installs.
- No commit or branch creation without explicit user authorization.

## Owners & status

| Task | Owner | Status |
| --- | --- | --- |
| Live/source audit & before screenshots | controller | complete; five source-grounded findings/prototype directions |
| Isolated prototypes & focused Playwright checks | implementation worker | complete; initial blockers and final query/token transitions repaired and verified |
| Required Vue checks & after screenshots | worker/controller | type-check/build pass; ten final images captured; full unit suite unresolved |
| Independent correctness/spec & quality review | reviewer | complete; repaired scope approved on both axes |
| Description + screenshot gallery & final handoff | controller | gallery complete; final handoff next |

## Artifacts

- Implementation brief: `2026-10-23-editor-guidelines-brief.md`
- Implementation evidence: `2026-10-23-editor-guidelines-evidence.md`
- Audit/gallery: `2026-10-23-editor-guidelines.md`
- Screenshot directory: `editor-guidelines/` (ten final screenshots)

## Initial state

- Branch: `dev`; tracked modifications already exist in `.gitignore`, `builder/src/App.vue`, `demo/tests/Feature/FilamentPanelTest.php`.
- Existing untracked VisualPrototype components/composable/model/style and three unrelated plan documents must remain untouched.
- Compose builder-vite, demo-php, demo-vite, gateway all running; gateway port 4175.
- Live desktop audit at 1440×1000: body inherits Times New Roman; toolbar wraps many undifferentiated actions; sidebar selected state visually absent; Foundations overflows its narrow content column.

## Next action

Deliver five descriptions and all five screenshot pairs, links to interactive development-only variants, and the explicit full-unit-suite caveat. All scoped review blockers are resolved. No prototype direction has been selected for production. Concurrent unrelated padding changes were committed by another actor as 86ff5de; none of this task's code was committed by its controller/worker. Existing dirty visual-prototype work remains intact.

## Revision 2: dashboard-first cohesive prototype

**User correction:** “i dont like most of them because tehy are hiding the filament dashboard preview, one of the key points is that the filament dashboard is always in view for live feedback”. User selected **One cohesive layout (Recommended)** rather than revising all five separately.

- Prior five variants remain preserved as rejected/superseded exploration, not the accepted direction.
- New hard invariant: actual Filament iframe is always visibly present and interactive, with live feedback from editing. No sample dashboards, Edit/Preview replacement tabs, or full-preview-covering settings/export overlays.
- One DEV-only `/?dashboard-prototype=1` cohesive shell. Compact editing dock on desktop; real dashboard above independently scrolling dock on narrow screens. Ordinary editor and existing prototype routes remain intact.
- Reuse current foundation defaults, action/projection utilities, and `usePreviewTheme` with a dedicated in-memory draft, not production theme persistence. No backend mutation or new product/MCP capability.

| Revision task | Owner | Status |
| --- | --- | --- |
| Integration inspection & scoped brief | controller | complete |
| Dashboard-first implementation + test-first live-preview checks | implementation worker | complete; real bridge, isolated store, bounded dock/preview layout |
| Meaningful checks, independent review, screenshots | worker/reviewer/controller | complete; focused tests pass, type-check/build pass, full 533-unit pass recorded; reviewed repairs and final screenshots accepted |

Brief: `2026-10-23-dashboard-first-brief.md`. Evidence: `2026-10-23-dashboard-first-evidence.md`. Final gallery: `2026-10-23-dashboard-first.md`.

Final scope: foundations-only visual prototype (primary/surface/density/radius), not the complete editor inventory. The real embedded demo retains normal interactions; editor changes do not write production themes. Desktop preview takes about 76% width; mobile keeps dashboard above dock with no outer-page overflow. Search/group/export changes retain the iframe document/window. Prior five concepts preserved as superseded exploration. No product layout promoted and no task commit made.

Next: show the cohesive desktop/mobile comparison and interactive URL; await user design feedback. No current scoped implementation blocker. The prior full-unit-suite timeout warning is superseded for this revision by a successful 533-test run; its precise timing relative to prototype-only repairs is documented in evidence.
