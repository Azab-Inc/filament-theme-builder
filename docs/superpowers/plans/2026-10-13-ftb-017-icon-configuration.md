# FTB-017 Icon Configuration Implementation Plan

**Goal:** Add dependency-free Heroicons pack/style selection and semantic resource overrides with immediate real-preview behavior, canonical JSON persistence, and explicit PHP runtime export.

**Architecture:** Keep icon state in the existing schema-v3 theme model and Pinia store. A focused icon registry owns valid packs, semantic resource keys, and export mappings; the preview bridge validates icon state and updates rendered icon presentation without pretending PHP configuration is CSS. The demo panel reads the same runtime mapping through a dedicated configuration seam while existing showcase fixtures remain unchanged.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Playwright, Laravel 13, Filament 5.9, PHP/PHPUnit/Pint/PHPStan.

**Spec:** `SPECS.md` §12 and `TICKETS.md` FTB-017.

## Global Constraints

- Heroicons catalog only; do not add external icon dependencies.
- Individual semantic overrides take precedence over the selected pack.
- JSON is canonical persisted state; PHP export is explicit runtime configuration.
- Preview must update immediately, using controlled reload/loading only where required.
- Do not duplicate dashboard/showcase icon ownership.
- Preserve unrelated `.gitignore`, plan, and prototype changes.

### Task 1: Model, registry, validation, and serialization

**Files:**
- Create `builder/src/models/icons.model.ts`.
- Create `builder/src/registry/icon-registry.ts`.
- Modify `builder/src/models/theme.model.ts`.
- Modify `builder/src/services/theme-serialization.ts`.
- Modify `builder/src/services/theme-validation.ts`.
- Modify `builder/src/services/foundation-defaults.ts`.
- Test with new icon model/serialization tests.

- [ ] Write failing tests for defaults, valid packs, override precedence, invalid identifiers, migration, and JSON round trips.
- [ ] Run the focused Vitest tests and verify expected failures.
- [ ] Implement the typed icon state, default catalog, normalization, and validation.
- [ ] Run focused tests and verify they pass.

### Task 2: Store actions and PHP export

**Files:**
- Modify `builder/src/stores/theme.ts`.
- Create `builder/src/services/icon-export.ts`.
- Test store actions and PHP export.

- [ ] Write failing tests for pack selection, override/reset, persistence, and generated PHP mappings.
- [ ] Run tests to verify failure.
- [ ] Implement minimal store actions and deterministic PHP export.
- [ ] Run focused tests and verify they pass.

### Task 3: Builder controls and preview bridge

**Files:**
- Modify `builder/src/App.vue`.
- Modify `demo/resources/views/filament/preview-bridge.blade.php`.
- Add/update builder component tests and Playwright coverage.

- [ ] Write Playwright tests for accessible controls, immediate rendered SVG changes, override precedence, reset, persistence, and JSON/PHP export.
- [ ] Run them before implementation and verify the expected failures.
- [ ] Implement controls, postMessage payload validation, immediate icon presentation, and controlled reload/loading signaling.
- [ ] Run the focused Playwright tests and verify they pass.

### Task 4: Demo runtime integration and coverage inventory

**Files:**
- Create `demo/app/Filament/Support/IconConfiguration.php`.
- Modify `demo/app/Providers/Filament/AdminPanelProvider.php`.
- Add PHP feature tests for runtime mappings and rendered icon evidence.
- Modify `COVERAGE.md`, `TICKETS.md`, and MCP capability inventory only with verified evidence.

- [ ] Write failing PHP tests for default mappings, overrides, and PanelProvider integration.
- [ ] Run them to verify failure.
- [ ] Implement the runtime configuration seam without changing showcase fixture ownership.
- [ ] Run PHP tests, Pint, PHPStan, and health checks.

### Task 5: Full verification and commit

- [ ] Run builder type-check, unit tests, and production build.
- [ ] Run demo Pint, PHPStan, feature tests, health checks, Compose, and Playwright.
- [ ] Inspect status/diff and confirm unrelated files are untouched.
- [ ] Commit intended files with `(builder)`/`(demo)` prefixes as appropriate.
