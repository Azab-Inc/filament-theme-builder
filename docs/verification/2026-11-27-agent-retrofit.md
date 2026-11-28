# Agent environment improvements

Approved scope: retrospective items 1–6, Jenkins-only CI, and an honest FTB-182 reassessment. Base: `5a26a768ed01344e53d0b5b67fa9753c886acfa1` on `dev`.

## Repository changes

- Expanded FTB-182 assertions exposed and repaired unique state validation, state-rule rename/disable, raw mode-link identity migration, stale bridge-node cleanup, collision feedback and malformed update handling. The subsequent remaining-gap pass completed [FTB-182 acceptance](./ftb-182.md) in `48bf507`, with runtime/Composer repairs in `62e2302` (local, not pushed).
- `Jenkinsfile` installs locked dependencies and runs root contracts, a changed-TypeScript guard, builder units/type/build, demo build/Composer checks, and Compose browser checks. It uses a job-owned project/port, startup bounds, cleanup, and retained logs/artifacts. No GitHub Actions, Git hooks, deployment, or release monitoring were added. FTB-034 retains its prerequisites and full scope.
- The guard uses installed TypeScript tooling. It checks `.ts` syntax/suppressions and production-file non-regression counts for explicit `any`, `as never`, and unannotated variable declarations. It covers branch plus local changes. It is not a full Vue/template linter or enforcement of every coding standard.
- Normal builds retain safe recovery for previously blocked output. The remaining-gap pass also runs Node development processes as configured `HOST_UID`/`HOST_GID` with writable cache/dependency volumes; real container tests prove host-owned generated files, alternate-GID behavior, argv preservation and termination signals. Only the two owned Node services were restarted.

## Shared environment changes

These files are outside this repository and are not included in its commits:

- `~/.config/opencode/rules/execution.md`: criterion-to-assertion evidence is required at handoff and checked during review.
- `~/.config/opencode/rules/version-control.md`: one source of commit authority; repository auto-commit permission is honored and pushes require an explicit request.
- `~/.config/opencode/skills/subagent-driven-development/{implementer-prompt,task-reviewer-prompt}.md`: evidence and requested-stage completion criteria.
- `~/.config/opencode/skills/{check-issue,update-tasks}/SKILL.md`: defer Git authority to shared policy; filter GitHub results before returning them and narrow truncated discovery queries.

Shared Markdown changes were inspected for consistent policy references; no new automated enforcement of agent prose behavior is claimed. Restart OpenCode to load changed skill/config-time guidance in future sessions.

## Verification and limits

- Controller: standards guard checked 40 changed `.ts` files; standards/output/Jenkins Node checks passed 13/13; `git diff --check` passed.
- Owner: full builder suite 157 files / 755 tests, type-check, normal production build, demo asset build, root contracts, focused PHP bridge 9 tests / 89 assertions, and bridge/unique-ID browser 9 tests passed. Exact commands and caveats are in the linked evidence.
- Live Jenkins remains unavailable; contract tests do not prove Jenkins execution. The pipeline's first real run will also require the documented Node/PHP/Docker/Chromium agent prerequisites.
- Historical Composer Pint/PHPStan/inventory/reset blockers are resolved. Final controller `composer test`: Pint and PHPStan pass; **274 PHP tests / 2,398 assertions pass**. SQLite snapshot restore preserves existing connections/inodes using backup-in-place, refuses unsafe/missing-extension cases and preserves persistent shares.
- Final controller browser acceptance: **21 bridge/unique-ID tests passed**, with a still-valid **25 affected integration tests passed**. Full builder evidence is **756 unit tests**, type-check and normal build passing. FTB-182 is complete; no broader release gate or full Jenkins/deployment ticket is closed by this result.

## Repository-only retrospective follow-up — 2026-11-28

Approved in-session after preflight on clean `dev` base `81587f226d67a3cc1f22aa9c46914975f4cd8d72`. The user selected repository fixes first and requested a list of proposed global changes. No global OpenCode files, services, dependencies, branches, or remote branches were changed for this follow-up. Implementation commits: `1358cb4` (pure density transformation) and `38c4ee6` (verification tooling/Jenkins); neither was pushed. The evidence below was captured before committing the unchanged tested implementation.

- Extended the existing TypeScript compiler-API guard to builder tests, E2E TypeScript and parsed Vue scripts. It checks explicit declarations/signatures and new utility dependencies on Vue/composables. Contextual violation identities with multiplicity retain unchanged legacy debt while rejecting new/replacement violations. Temporary Git fixtures cover tracked, staged, untracked and deleted sources. New checks exposed and repaired a false positive for unchanged legacy casts next to edited statements.
- `npm run lint:changed` runs that guard plus changed-file Pint, preserving argument boundaries, skipping deleted PHP files and propagating failures. It passes with its default settings, without baseline overrides.
- Extracted the pure density preset transformation shared by the canonical UI action and relay; focused assertions cover original-state/provenance immutability and relay parity. Existing history/reset/persistence behavior passes real browser verification.
- `npm run verify:local` sequences lint, tooling tests, full builder units with the shared 20-second test/hook timeout, type-check/build, full Composer checks and selected Inspector/table/density browser journeys. Jenkins consumes the same timeout and browser selection. Browser execution has its own 15-minute bound within the job-owned Compose stage, preserving existing cleanup/log capture. Live Jenkins execution remains unverified.
- The runner records one git-private checkpoint with fixed base, relevant tracked/untracked source/configuration/manifest/lockfile contents, deletion markers, command/cwd/exit results and end-state identity. Read-only `identity` inspection does not replace evidence; `check` requires complete successful non-stale results. Tests exercise source changes, commit stability, failed/incomplete results and concurrent edits. Documentation/output-only changes preserve source evidence.
- Repository instructions now point to authoritative tracker/gate records and executable checks; conflicting inference/size guidance was reconciled. FTB-012 records now identify actual completion commit `81587f2`, preserving the original tested base `7e471f3`.

Final controller evidence (repository root unless stated):

1. `npm run lint:changed` — exit 0; TypeScript guard and changed-file Pint passed.
2. `node --test builder/scripts/changed-code-standards.test.mjs scripts/changed-code-check.test.mjs scripts/verification-checkpoint.test.mjs scripts/jenkins-contract.test.mjs scripts/demo-first-roadmap.test.mjs` — exit 0, **32 passed**. Failing-first fixtures had exposed missing guard/checkpoint behavior before implementation; one independent read-only review identified baseline/discovery/checkpoint/budget blockers, subsequently repaired and covered.
3. `COMPOSE_BASE_URL=http://127.0.0.1:4175 npm run verify:local` — exit 0. Recorded stages: **28 tooling tests**, **158 builder files / 773 tests**, type-check and normal production build, Pint/PHPStan, **275 PHP tests / 2,414 assertions**, and **27 real browser checks** (21 Inspector, 3 tables, 1 native table-density, 1 density UI regression, 1 actual stdio MCP density journey). Existing healthy source-mounted development Compose was reused without restarts.
4. `node scripts/verification-checkpoint.mjs check` — exit 0, `complete: true`, `ok: true`; before/end/current identity all `702c66412696f52c2b2fd3fe271e642bfa69011f0ddeab14e9307feadddeb79a`. Latest evidence is stored at the path resolved by `git rev-parse --git-path ftb-verification-checkpoint.json`.
5. `git diff --check` — exit 0. No additional whole-change review or unrelated release-gate closure was performed.

Global follow-ups remain proposals: testable evidence-handoff enforcement in the existing adapter, shared policy conflict cleanup, file-scoped Grep argument normalization, and a compact Laravel application-info response. The global configuration repository has pre-existing WIP on `main`; its branch/ownership decisions and tool-source access must be settled before changes.
