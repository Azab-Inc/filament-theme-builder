# FTB-014 Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the FTB-014 actions, modal, notification, and registry contract against the installed Filament 5.9 runtime with deterministic presentation-only forcing and evidence-backed documentation.

**Architecture:** Keep the existing `ActionsShowcase` and `NotificationsShowcase` Livewire pages as read-only fixture owners. Add explicit named action/modal/notification fixtures and query-driven forced presentation hooks that call native Filament APIs but never mutate domain data or persist showcase state. Extend the builder registry with distinct action, modal, and notification entries carrying component, variant, and state metadata; verify those selectors against rendered Filament 5.9 markup in PHP, Playwright, and registry tests.

**Tech Stack:** Laravel 13, PHP 8.5, Filament 5.9, Livewire 4, PHPUnit, Pint, PHPStan, Vue/TypeScript, Vitest, Playwright, Docker Compose.

**Spec:** `TICKETS.md#ftb-014`, `COVERAGE.md` FTB-014 section, and installed vendor templates under `demo/vendor/filament/`.

## Global Constraints

- Use native installed Filament 5.9 APIs and selectors; do not copy official demo identity, copy, or presentation.
- Missing native variants may use a local dependency-free presentation adapter, clearly documented as compatibility behavior; do not add packages.
- Forced modal/notification visibility is deterministic, presentation-only, non-persistent, and not an FTB-016 state-control implementation.
- Showcase callbacks remain read-only; no database mutation and no MCP mutation tool.
- Write tests first, run them failing, then implement the smallest passing change.
- Preserve unrelated `.gitignore`, existing prototype, and existing plan changes.
- Report the known missing Boost provider as an environment blocker; do not work around it.

---

### Task 1: Define failing registry coverage for FTB-014 surfaces

**Files:**
- Modify: `builder/src/__tests__/theme-registry.spec.ts`
- Modify: `builder/src/registry/theme-registry.ts`

**Interfaces:**
- Produces stable registry IDs for action component/variant/state, modal, and notification surfaces using verified `.fi-*` selectors.

- [ ] **Step 1: Write the failing tests** for the exact IDs, selectors, native `5.x` compatibility, action variants (`primary`, `danger`, `success`, `warning`, `info`, `gray`, `outline`, `icon-only`), and action states (`disabled`, `loading`), plus modal and notification layout/status metadata.
- [ ] **Step 2: Run the focused Vitest file** and confirm failure is missing FTB-014 entries, not a test typo.
- [ ] **Step 3: Add the smallest registry helpers/entries** for action buttons/groups, modal window/header/content/footer/form, and notification container/notification/status/layout selectors. Use unique selectors or intentionally grouped selectors only where the runtime markup is identical.
- [ ] **Step 4: Run the focused registry tests** and the full builder unit suite; refactor only after green to remove repeated metadata construction.

### Task 2: Add native action/modal fixture contract

**Files:**
- Modify: `demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php`
- Modify: `demo/app/Filament/Pages/Showcase/ActionsShowcase.php`
- Modify: `demo/resources/views/filament/pages/showcase/actions-showcase.blade.php`

**Interfaces:**
- Produces named native `OrderActionsFixture`, `ProductActionsFixture`, `DeleteProductConfirmationModal`, and `OrderStatusModal` surfaces exposed by the existing page.

- [ ] **Step 1: Extend the PHP test first** to assert named sections, native action variants, confirmation/destructive metadata, modal widths, headers, footer actions, form fields, and read-only callbacks.
- [ ] **Step 2: Run the focused PHPUnit class** and confirm the new assertions fail because the named fixtures/modal definitions are absent.
- [ ] **Step 3: Implement the native fixture actions** with deterministic labels and Filament 5.9 APIs. Keep order/product fixtures separate, include every requested variant where native, and use the agreed local adapter only for a missing presentation capability.
- [ ] **Step 4: Implement representative modal actions**: a destructive product-delete confirmation and an order-status form modal with explicit size, heading, description, submit/cancel footer, and safe non-mutating callbacks. Make loading observable through native Livewire action loading attributes rather than fake timers.
- [ ] **Step 5: Update the Blade page** with stable accessible section labels and fixture identifiers without introducing non-native action markup.
- [ ] **Step 6: Run focused PHPUnit and Pint on changed PHP files** and confirm green.

### Task 3: Add deterministic presentation-only forcing

**Files:**
- Modify: `demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php`
- Modify: `demo/app/Filament/Pages/Showcase/ActionsShowcase.php`
- Modify: `demo/app/Filament/Pages/Showcase/NotificationsShowcase.php`

**Interfaces:**
- Produces query-controlled `force_modal`/`force_notification` presentation hooks that are deterministic, do not persist, and do not overlap with FTB-016 state controls.

- [ ] **Step 1: Add failing Livewire/request tests** proving a permitted force token mounts the named modal or sends the named persistent notification, while an unknown token renders no forced fixture and no domain state changes.
- [ ] **Step 2: Run focused PHPUnit** and verify failure due to missing force behavior.
- [ ] **Step 3: Implement a small explicit force-token mapper** in the page classes, invoking native modal mounting/notification sending only during initial presentation. Avoid generic arbitrary method dispatch and avoid database writes.
- [ ] **Step 4: Run focused PHPUnit and inspect rendered response markers** to prove forced behavior is present without persistence.

### Task 4: Add named semantic notification fixtures

**Files:**
- Modify: `demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php`
- Modify: `demo/app/Filament/Pages/Showcase/NotificationsShowcase.php`
- Modify: `demo/resources/views/filament/pages/showcase/notifications-showcase.blade.php`

**Interfaces:**
- Produces `OrderStatusNotification`, `InventoryWarningNotification`, and `ActionFailureNotification` with semantic statuses and layout/persistence variants.

- [ ] **Step 1: Add failing PHP assertions** for each named notification’s title/body/status, persistent/transient layout, action/footer behavior, and last-notification presentation label.
- [ ] **Step 2: Run the focused PHPUnit test** and verify the named fixtures are missing.
- [ ] **Step 3: Implement the notification fixture factory/mapper** using native Filament notification APIs and deterministic fixture payloads. Keep the existing status button behavior intact and route forced tokens through the same named fixture definitions.
- [ ] **Step 4: Add accessible Blade fixture documentation/controls** that identify the three named notification variants without duplicating native notification markup.
- [ ] **Step 5: Run focused PHPUnit and Pint** and confirm green.

### Task 5: Prove actual rendered selectors with Playwright

**Files:**
- Modify: `e2e/demo-showcase.spec.ts`
- Modify: `e2e/theme-registry-selectors.spec.ts` if selector evidence needs a dedicated action/modal/notification assertion.

**Interfaces:**
- Produces browser evidence for all requested action variants, modal headers/forms/footers/destructive/loading behavior, notification statuses/layout variants, and forced-visible query paths using roles and verified `.fi-*` selectors.

- [ ] **Step 1: Add Playwright tests first** using actual rendered roles/classes, including selector counts/attributes and no timing-only visibility assumptions.
- [ ] **Step 2: Run the focused Compose Playwright tests** and verify the new assertions fail against the incomplete showcase.
- [ ] **Step 3: Adjust only the implementation/selectors necessary** to make the browser tests pass; use live request interception only for loading evidence.
- [ ] **Step 4: Run the focused showcase and registry Playwright specs** and record pass counts.

### Task 6: Record honest coverage and completion status

**Files:**
- Modify: `COVERAGE.md`
- Modify: `TICKETS.md`

- [ ] **Step 1: Update the FTB-014 coverage table and fixture section** with exact stable IDs, selectors, test sources, native/compatibility distinctions, and presentation-only force semantics. Record any installed-runtime omissions and the Boost provider blocker honestly.
- [ ] **Step 2: Mark only evidenced FTB-014 acceptance criteria complete** and set the ticket status to `done` only if every criterion has passing evidence.
- [ ] **Step 3: Run a documentation consistency search** for stale “planned”, “remaining”, or unsupported claims in the FTB-014 sections.

### Task 7: Full verification and commit

- [ ] Run builder `npm run type-check`, `npm run test:unit`, and `npm run build`.
- [ ] Run focused and full relevant demo PHPUnit tests, Pint check, PHPStan, and `/api/health` through Compose.
- [ ] Run focused and full relevant Compose Playwright suites; separate unrelated hard-coded-port failures from FTB-014 evidence.
- [ ] Inspect `git diff` and `git status`; stage only intended `(demo)`/`(builder)` and documentation/test files, preserving unrelated `.gitignore`, prototype, and plan changes.
- [ ] Commit with the repository-required message format, e.g. `Feature: complete FTB-014 actions modal and notification coverage`.
