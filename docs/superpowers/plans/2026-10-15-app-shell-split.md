# App Shell Split Under 100 Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `builder/src/App.vue` into focused Vue components and composables while preserving every existing builder contract.

**Architecture:** `App.vue` selects inspect mode or the normal `BuilderShell`. `useBuilderShell` owns canonical Pinia wiring and coordinates existing preview, Inspector, recovery, and editor behavior. Focused child components render navigation and editor sections through a typed shell context.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Vue Test Utils, Vite, Compose Playwright.

**Spec:** Approved in chat on 2026-10-15.

## Global Constraints

- Preserve DOM order, IDs, ARIA attributes, data hooks, classes, styles, modes, protocols, exports, uploads, recovery, persistence, and prototype behavior exactly.
- Keep `App.vue` and every new maintainable builder source file at or below 100 lines.
- Add parity tests before extraction; add no dependencies.
- Preserve unrelated worktree changes.

### Task 1: Add red parity and line-limit checks

**Files:**
- Modify: `builder/src/__tests__/App.spec.ts`
- Create: `builder/src/__tests__/app-shell-parity.spec.ts`

- [ ] Add assertions for the public shell contract and the line-count rule.
- [ ] Run focused tests and confirm the new extraction boundary assertions fail for the expected missing shell modules.

### Task 2: Extract app orchestration and browser effects

**Files:**
- Create: `builder/src/composables/use-builder-shell.ts`
- Create: `builder/src/composables/use-builder-exports.ts`
- Create: `builder/src/composables/use-branding-upload.ts`
- Create: `builder/src/models/builder-shell.model.ts`
- Create: `builder/src/dtos/branding-upload-response.dto.ts`
- Create: `builder/src/utils/file-download.ts`

- [ ] Move state, handlers, export effects, upload effects, and existing composable coordination without changing behavior.
- [ ] Keep all shared types in dedicated model/DTO files.
- [ ] Run type-check and focused unit tests.

### Task 3: Extract the normal-mode shell and editor markup

**Files:**
- Create: `builder/src/components/BuilderShell.vue`
- Create: `builder/src/components/EditorNavigation.vue`
- Create: `builder/src/components/EditorWorkspace.vue`
- Modify: `builder/src/App.vue`

- [ ] Move the existing markup without changing selector order or bindings.
- [ ] Keep App as query-mode composition shell under 100 lines.
- [ ] Run parity tests and inspect the rendered application.

### Task 4: Run full verification and commit

**Files:**
- Verify all changed builder files and preserve unrelated worktree files.

- [ ] Run builder type-check, unit tests, and production build.
- [ ] Run relevant and full Compose Playwright checks.
- [ ] Report exact line counts and any verification gaps.
- [ ] Commit with `(builder) Refactor: split App.vue under 100 lines without behavior changes`.
