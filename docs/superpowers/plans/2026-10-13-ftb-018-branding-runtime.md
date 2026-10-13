# FTB-018 Branding and Runtime Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe, typed panel branding/runtime controls with canonical persistence, controlled iframe refresh, upload lifecycle reuse, and CSS/PHP exports.

**Architecture:** Extend the existing V3 canonical theme state with a validated `PanelBrandingSettings` boundary. CSS-safe values travel through the existing preview message; PanelProvider-only values travel through a versioned runtime message that causes a controlled iframe reload while the builder draft remains in Pinia/local persistence. Uploads reuse `TemporaryUploadStorage` and are represented by safe relative references.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Laravel 13, Filament 5.9, PHPUnit/Pest, Blade, Playwright, Docker Compose.

**Spec:** `SPECS.md` §13, §20, §22, §25; `TICKETS.md` FTB-018; `.config/opencode/rules/ai-operability.md`.

## Global Constraints

- No new dependencies or services.
- Runtime configuration must use native Filament APIs; never emulate PanelProvider-only settings with brittle CSS.
- Uploads accept only safe image types already allowed by `TemporaryUploadStorage`, remain non-executable, and expire after 24 hours.
- Tests are red-first and all unrelated worktree changes remain untouched.

### Task 1: Canonical branding model, validation, migration, and exports

**Files:**
- Create: `builder/src/models/panel-branding.model.ts`
- Create: `builder/src/services/panel-branding-validation.ts`
- Create: `builder/src/services/panel-branding-export.ts`
- Modify: `builder/src/models/foundations.model.ts` or `builder/src/models/theme.model.ts`
- Modify: `builder/src/services/theme-serialization.ts`
- Test: `builder/src/__tests__/panel-branding.spec.ts`

- [ ] Write failing tests for defaults, exact unions, safe asset references, Google Fonts, migration, classification, canonical JSON, and PanelProvider snippets.
- [ ] Run the focused Vitest test and confirm the missing model/export failures.
- [ ] Implement typed settings, validation, migration, and deterministic exports.
- [ ] Run the focused tests and the existing serialization tests.

### Task 2: Pinia state integration and controlled preview protocol

**Files:**
- Modify: `builder/src/stores/theme.ts`
- Modify: `builder/src/App.vue`
- Modify: `demo/resources/views/filament/preview-bridge.blade.php`
- Test: `builder/src/__tests__/theme-state.spec.ts`
- Test: `builder/src/__tests__/App.spec.ts`
- Test: `e2e/ftb-018-branding.spec.ts`

- [ ] Add failing tests for set/reset/undo/redo/persistence, immediate CSS projection, runtime loading/reload, iframe continuity, and dark/light assets.
- [ ] Run unit and Playwright tests to establish expected failures.
- [ ] Implement store methods, message classification, runtime message validation, bridge asset/font application, and loading state without replacing the draft.
- [ ] Run focused unit tests and the browser test.

### Task 3: Demo runtime branding consumption and uploads

**Files:**
- Create: `demo/app/Support/Branding/PanelBrandingSettings.php`
- Create: `demo/app/Http/Controllers/PanelBrandingUploadController.php`
- Modify: `demo/app/Support/Uploads/TemporaryUploadStorage.php`
- Modify: `demo/app/Providers/Filament/AdminPanelProvider.php`
- Modify: `demo/config/preview.php`
- Modify: `demo/routes/api.php`
- Test: `demo/tests/Feature/Filament/PanelBrandingTest.php`
- Test: `demo/tests/Feature/Uploads/BrandingUploadTest.php`

- [ ] Write failing PHP tests for image validation, quota, safe references, 24-hour cleanup, unauthorized upload rejection, runtime settings, and supported sidebar/content-width modes.
- [ ] Run focused PHPUnit tests and confirm failures.
- [ ] Implement the domain value object, upload endpoint/reference handling, cleanup reuse, and native PanelProvider mapping.
- [ ] Run focused tests, Pint, and PHPStan.

### Task 4: Builder controls and export boundary

**Files:**
- Modify: `builder/src/App.vue`
- Modify: `builder/src/services/panel-branding-export.ts`
- Test: `builder/src/__tests__/App.spec.ts`
- Test: `builder/src/__tests__/panel-branding.spec.ts`
- Test: `e2e/ftb-018-branding.spec.ts`

- [ ] Add failing control tests for app name, logos, favicon, logo height, custom Google font, width, sidebar modes, reset, and both export formats.
- [ ] Implement the controls using existing styling/components and explicit mapping labels.
- [ ] Run focused unit and Playwright tests.

### Task 5: MCP inventory, coverage, ticket closure, and full verification

**Files:**
- Modify: `demo/tests/Feature/AiOperability/DemoShowcaseCapabilityInventoryTest.php` or its inventory source
- Modify: `COVERAGE.md`
- Modify: `TICKETS.md`
- Add/update: relevant MCP inventory documentation/tests

- [ ] Write failing inventory/coverage assertions for branding read, upload, preview, export, authorization, and cleanup capabilities.
- [ ] Implement truthful inventory and evidence references.
- [ ] Run builder type-check/unit/build, PHP tests/Pint/PHPStan, health checks, and full relevant Compose Playwright coverage.
- [ ] Mark FTB-018 done only for evidenced criteria; report any environmental or acceptance gaps.
- [ ] Inspect status/diff, stage only intended files, and commit with `(builder)`/`(demo)` prefixes.
