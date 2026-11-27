# Agent environment improvements

Approved scope: retrospective items 1–6, Jenkins-only CI, and an honest FTB-182 reassessment. Base: `5a26a768ed01344e53d0b5b67fa9753c886acfa1` on `dev`.

## Repository changes

- Expanded FTB-182 assertions exposed and repaired unique state validation, state-rule rename/disable, raw mode-link identity migration, and stale bridge-node cleanup. [Criterion evidence and unresolved acceptance](./ftb-182.md) remain authoritative; the issue is not done.
- `Jenkinsfile` installs locked dependencies and runs root contracts, a changed-TypeScript guard, builder units/type/build, demo build/Composer checks, and Compose browser checks. It uses a job-owned project/port, startup bounds, cleanup, and retained logs/artifacts. No GitHub Actions, Git hooks, deployment, or release monitoring were added. FTB-034 retains its prerequisites and full scope.
- The guard uses installed TypeScript tooling. It checks `.ts` syntax/suppressions and production-file non-regression counts for explicit `any`, `as never`, and unannotated variable declarations. It covers branch plus local changes. It is not a full Vue/template linter or enforcement of every coding standard.
- Normal builds can recover from blocked generated output without changing ownership. Symlink and alternate-output cases have behavioral tests; writable output is preserved. This is recovery, not proof of container UID prevention.

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
- Controller `composer test` failed at existing Pint violations in seven MCP files. PHPStan/full PHPUnit stages were not reached.
- FTB-182 remains Testing with explicit behavior/evidence gaps. No broader issue or release gate is closed by this retrofit.
