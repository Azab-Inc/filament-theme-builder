# Demo Showcase Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing real Filament 5 e-commerce demo into a deterministic, accessible, independently branded theme-preview showcase while preserving the public dashboard, completed FTB-009A/B/010 domain/resource/relationship work, and the builder/demo boundary.

**Architecture:** Keep one public Filament panel at `/demo/admin` and extend it with native Filament pages, widgets, resources, actions, notifications, navigation, and panel configuration. Put deterministic commerce calculations behind a small read-only support service, put focused showcase fixtures in a grouped Showcase area, and let FTB-016 control presentation-only forced states through explicit allowlisted state identifiers. Runtime-only branding/icon settings remain PanelProvider/export concerns; no second dashboard, navigation system, mock HTML application, or new package is introduced.

**Tech Stack:** PHP 8.5, Laravel 13, Eloquent, SQLite, Filament 5.9+, Livewire 4, PHPUnit 12, Laravel Pint, Larastan, Playwright, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-10-demo-showcase-expansion-design.md`; authorities: `docs/research/2026-10-10-filament-demo-showcase.md`, `SPECS.md` §§16–18, 25, 34–35, 41, and `TICKETS.md` FTB-011–018.

## Global Constraints

- FTB-009A, FTB-009B, and FTB-010 are already complete and are prerequisites, not work to reopen.
- FTB-027 and FTB-028 remain outside this plan as parallel operational tickets; do not implement uploads, reset scheduling, or alter their dependency/status records.
- The panel brand is exactly **Filament Theme Builder**. Use original repository-local light SVG, dark SVG, and favicon assets; do not copy or imply affiliation with the official Filament Demo name, logo, layout, data, source, or distinctive identity.
- All showcase output is real Filament output backed by existing domain records or deterministic fixture records; no static HTML mockup and no duplicate dashboard/navigation system.
- Use only installed Laravel/Filament/Livewire APIs. Do not add Composer, npm, Docker, icon, chart, or other third-party dependencies.
- Every user-visible behavior follows TDD: write the focused PHP/Livewire test first, run it red for the expected reason, implement the smallest change, then run it green. For browser-visible behavior, add and run the Playwright test before implementation.
- Use fixed reference date `2026-10-10 12:00:00` and seeded business keys. Never use `now()`, random data, visitor-specific static state, long-lived mutable singletons, sleeps, notification timing, or wall-clock screenshot assumptions for showcased values/states.
- Preserve the public dashboard and login contract: `/demo/admin` remains publicly readable, `/demo/admin/login` continues to show the existing credentials, and profile/auth/tenant UI is controlled showcase presentation rather than a new access policy.
- Validate all action inputs server-side, retain existing authorization and tenant boundaries, escape rendered content through normal Laravel/Filament paths, and constrain destructive operations so the disposable demo remains usable.
- Every new product operation is recorded in the capability-to-tool inventory and receives MCP coverage through the same domain validation/authorization path, with preview/confirmation for mutations. Showcase-only presentation state is not exposed as privileged data mutation.
- Every task ends with focused tests, formatting/static checks where relevant, a clean diff review, and the commit message specified in that task. The plan itself is not committed while it is being created.

---

## File Map

| Path | Responsibility |
|---|---|
| `TICKETS.md` | Tighten FTB-011–018 acceptance/status wording and dependency notes without changing ticket IDs; explicitly record Phase 1 ownership and FTB-027/028 exclusion. |
| `COVERAGE.md` | Source-of-truth manifest for each visually distinct showcase surface, with stable coverage IDs and separate resource, relation-manager, nested-resource, widget, state, icon, branding, and action entries. |
| `docs/ai-operability/demo-showcase-capability-inventory.md` | Capability-to-MCP inventory for read-only dashboard/showcase surfaces and real commerce mutations; presentation-only forced states are explicitly marked non-privileged. |
| `demo/app/Filament/Support/DashboardMetrics.php` | Fixed-date, read-only query boundary returning typed dashboard summary, chart points, recent orders, and low-stock products. |
| `demo/app/Filament/Support/ShowcaseState.php` | Allowlisted state identifiers and pure state-resolution contract used by FTB-016; no database mutation. |
| `demo/app/Filament/Pages/Dashboard.php` | Existing Filament dashboard page extended or replaced only through the installed native dashboard API; owns widget layout, not metric query logic. |
| `demo/app/Filament/Widgets/CommerceStatsOverview.php` | Native `StatsOverviewWidget` for revenue, orders, customers, products, and low-stock/trend context. |
| `demo/app/Filament/Widgets/RevenueOrdersChart.php` | Native `ChartWidget` with fixed period labels and deterministic revenue/order datasets. |
| `demo/app/Filament/Widgets/RecentOrdersTable.php` | Native table/list widget with stable order, customer/date/total/status columns, and real order URLs. |
| `demo/app/Filament/Widgets/LowStockProductsTable.php` | Native table/list widget with stable product/stock/status columns, product URLs, and safe empty state. |
| `demo/app/Filament/Resources/**/` | Existing resource-specific icons, navigation badges/colors, non-destructive order/product actions, and showcase-safe modal/notification integration. |
| `demo/app/Filament/Pages/Showcase/ShowcasePage.php` | Native grouped Showcase landing page linking to focused real Filament examples without copying the official demo. |
| `demo/app/Filament/Pages/Showcase/{Forms,Tables,Infolists,Actions,Widgets,Navigation,States}Showcase.php` | Focused pages/fixtures for FTB-011–016; each page owns a distinct visual surface rather than a duplicate CRUD resource. |
| `demo/app/Filament/Resources/Showcase/**` | Only if native Filament resource APIs are required for a table/form fixture; otherwise prefer pages/widgets and document why no resource is needed. |
| `demo/app/Providers/Filament/AdminPanelProvider.php` | Single source for panel brand, local assets, favicon, icon overrides, navigation/page/widget discovery, profile/search/auth/tenant presentation, and runtime export-relevant configuration. |
| `demo/resources/views/filament/branding/*` | Repository-local original SVG light/dark logos and favicon only; no arbitrary upload path. |
| `demo/public/demo-images/*` | Existing seeded product imagery only; do not use it for panel branding. |
| `demo/database/seeders/EcommerceDemoSeeder.php` | Extend only with deterministic records needed by dashboard/showcase fixtures; preserve existing stable keys and idempotence. |
| `demo/database/factories/*` | Add narrowly scoped factory states for edge-case tests (empty/low-stock/validation/action states) without changing normal seeded output. |
| `demo/tests/Feature/FilamentPanelTest.php` | Public panel, branding, navigation, login/profile/auth invariants. |
| `demo/tests/Feature/Filament/DashboardShowcaseTest.php` | Dashboard registration, fixed aggregates, badges, widget rendering, empty data, and deterministic ordering. |
| `demo/tests/Feature/Filament/Showcase/*Test.php` | Livewire/page tests for forms, tables, infolists, actions/modals/notifications, navigation/auth/tenant, and forced-state isolation. |
| `demo/tests/Feature/Filament/Resources/*Test.php` | Real commerce action validation, authorization, persistence, and notifications on existing resources. |
| `demo/tests/Feature/AiOperability/DemoShowcaseCapabilityInventoryTest.php` | Inventory completeness and authorization/confirmation contract for new product operations. |
| `e2e/demo-showcase.spec.ts` | Playwright acceptance against the real public panel: branding, dashboard, responsive layout, actions/modals/notifications, showcase pages, and explicit state controls. |
| `e2e/demo-panel.spec.ts` | Existing panel/relationship coverage, extended only where a new navigation or action invariant belongs in the existing flow. |
| `playwright.config.ts` | Existing server orchestration only; alter only if required to expose the already-supported `/demo/admin` route, with no new service. |
| `docs/demo-showcase.md` | Independent identity, local asset convention, fixed seed date, reset safety, Showcase navigation, state-control safety, and verification commands. |

Before changing Laravel files, execution must inspect neighboring code and the installed Filament 5 source/API. If a `demo/AGENTS.md` or closer Laravel guidance file is added before execution, it takes precedence over this map and root guidance.

## Dependency Graph

```text
Task 1 docs/ticket contract
  └── Task 2 Phase 1 identity/navigation/icons/seed badges
       └── Task 3 native dashboard widgets + aggregates
            └── Task 4 real commerce actions/modals/notifications
                 └── Task 5 FTB-011 forms/schemas fixtures
                      └── Task 6 FTB-012 table fixtures
                           └── Task 7 FTB-013 infolists
                                └── Task 8 FTB-014 focused action/modal/notification showcase
                                     └── Task 9 FTB-015 showcase navigation/search/profile/auth/tenant + dashboard integration
                                          └── Task 10 FTB-016 safe deterministic forced states
                                               └── Task 11 FTB-017 icon packs/semantic replacements
                                                    └── Task 12 FTB-018 runtime branding/config/export classification
                                                         └── Task 13 coverage/docs/final E2E acceptance

FTB-027/028 remain parallel and outside this plan.
```

## Task 1: Update ticket and documentation contracts

**Files:** Modify `TICKETS.md`; create/modify `COVERAGE.md`; create `docs/ai-operability/demo-showcase-capability-inventory.md`; add `demo/tests/Feature/AiOperability/DemoShowcaseCapabilityInventoryTest.php` only if no existing inventory test covers the contract.

**Interfaces:** Preserve anchors `#ftb-011` through `#ftb-018`, statuses, and blocker graph unless implementation later proves a status change. Define stable coverage IDs such as `dashboard.stats`, `dashboard.revenue-orders-chart`, `dashboard.recent-orders`, `dashboard.low-stock`, `showcase.forms`, `showcase.tables`, `showcase.infolists`, `showcase.actions`, `showcase.notifications`, `showcase.navigation`, `showcase.states`, `panel.icons`, and `panel.branding`. Inventory records `{capability, surface, operation, authorization, confirmation, MCP tool/status}` and distinguishes read-only/presentation from mutation.

- [ ] **Step 1: Write the failing documentation/inventory test.** Assert the ticket file names the ordered Phase 1 → FTB-011 → … → FTB-018 sequence, says FTB-009A/B/010 are complete, keeps FTB-027/028 outside scope, and retains each anchor exactly once. Assert every capability inventory row has a stable ID, operation classification, authorization/confirmation field, and an MCP status. Assert COVERAGE includes the stable Phase 1/dashboard/showcase categories without claiming official-demo copying.
- [ ] **Step 2: Run red.** From the repository root run `node --test` for the documentation test if present, and `cd demo && php artisan test --filter=DemoShowcaseCapabilityInventoryTest`; expect failure because the new contract entries do not exist.
- [ ] **Step 3: Update `TICKETS.md`.** Refine only FTB-011–018 acceptance criteria to name the concrete fixtures and ordering. Keep FTB-015 as the owner of the single dashboard/navigation/search/auth/tenant integration, FTB-017 as icon configuration, FTB-018 as runtime branding/export classification, and FTB-016 as state forcing. Add explicit “official demo is research inspiration only; identity is independent” wording.
- [ ] **Step 4: Create `COVERAGE.md` and the MCP inventory.** Record the named IDs, their route/page/widget, visual distinction, data source, forced-state support, and corresponding test. For commerce actions include read/view and status-change operations, server validation, existing panel authorization, confirmation requirement, and the domain service/model path. Mark dashboard/showcase reads as read-only and forced states as presentation-only with no MCP mutation tool.
- [ ] **Step 5: Run green.** Re-run the documentation and inventory tests, then run `git diff --check`; no ticket ID or anchor may be duplicated.
- [ ] **Step 6: Commit.** `git add TICKETS.md COVERAGE.md docs/ai-operability/demo-showcase-capability-inventory.md demo/tests/Feature/AiOperability/DemoShowcaseCapabilityInventoryTest.php && git commit -m "Docs: define demo showcase coverage contract"`.

## Task 2: Phase 1 panel identity, local assets, semantic icons, and navigation badges

**Files:** Modify `demo/app/Providers/Filament/AdminPanelProvider.php`; modify each existing resource class that currently repeats `Heroicon::OutlinedRectangleStack`; create `demo/resources/views/filament/branding/logo-light.svg`, `logo-dark.svg`, and `favicon.svg`; modify `demo/database/seeders/EcommerceDemoSeeder.php` only if a badge count needs an existing stable record; add `demo/tests/Feature/Filament/PanelBrandingNavigationTest.php`; add browser tests in `e2e/demo-showcase.spec.ts`.

**Interfaces:** Resources expose native `protected static string|BackedEnum|null $navigationIcon`, `public static function getNavigationBadge(): ?string`, and `public static function getNavigationBadgeColor(): string|array|null` (using the exact installed Filament 5 signature if source inspection shows a compatible declared type). `AdminPanelProvider::panel(Panel $panel): Panel` remains the only panel configuration entry point and registers local logos/favicon through native `brandName()`, `brandLogo()`, `darkModeBrandLogo()`, `favicon()`, and sizing APIs available in the installed version.

- [ ] **Step 1: Add Playwright red tests first.** In `e2e/demo-showcase.spec.ts`, assert `/demo/admin` shows “Filament Theme Builder”, light/dark logo elements, grouped navigation with distinct accessible icon labels, deterministic badge values from seeded records, and no “Filament Demo” identity. Run `npx playwright test e2e/demo-showcase.spec.ts --grep 'branding|navigation badge|semantic icon'`; expect failure.
- [ ] **Step 2: Add PHP red tests.** Seed the database and assert the panel HTML contains the independent brand, local asset references, and stable navigation labels/counts. Assert representative resource classes return distinct semantic icons and badge colors; assert badge values are based on stable records rather than authenticated user/session state.
- [ ] **Step 3: Implement original local SVGs.** Create simple repository-owned SVGs with accessible dimensions/viewBox and light/dark contrast; favicon must be a static trusted asset. Do not accept uploaded SVG or use an official Filament mark.
- [ ] **Step 4: Configure the existing panel.** Add brand name, light/dark logo, favicon, and native logo sizing. Assign semantic icons across Catalog, Sales, Customers, and Operations resources (for example product, order, customer, inventory, payment, shipment, discount, supplier, and note concepts), preserving current groups and URLs.
- [ ] **Step 5: Add deterministic badges.** Use stable seeded counts such as products/orders/customers or low-stock/review counts, with semantic colors and adjacent text/labels so color is not the only signal. Do not query mutable session state, use relative dates, or create a duplicate navigation registry.
- [ ] **Step 6: Run green and inspect both color schemes.** Run the focused PHP test, the Playwright grep, `cd demo && ./vendor/bin/pint --test app/Filament/Resources app/Providers/Filament tests/Feature/Filament/PanelBrandingNavigationTest.php`, and inspect browser snapshots in light and dark mode.
- [ ] **Step 7: Commit.** `git add demo/app/Providers/Filament/AdminPanelProvider.php demo/app/Filament/Resources demo/resources/views/filament/branding demo/database/seeders/EcommerceDemoSeeder.php demo/tests/Feature/Filament/PanelBrandingNavigationTest.php e2e/demo-showcase.spec.ts && git commit -m "Feature: add independent demo panel identity"`.

## Task 3: Native dashboard widgets and deterministic aggregates

**Files:** Create `demo/app/Filament/Support/DashboardMetrics.php`, `demo/app/Filament/Widgets/CommerceStatsOverview.php`, `RevenueOrdersChart.php`, `RecentOrdersTable.php`, and `LowStockProductsTable.php`; modify `demo/app/Providers/Filament/AdminPanelProvider.php` and the existing dashboard registration; add `demo/tests/Feature/Filament/DashboardShowcaseTest.php`; extend `e2e/demo-showcase.spec.ts`.

**Interfaces:** `DashboardMetrics` exposes `public function summary(): array`, `public function revenueAndOrdersSeries(): array`, `public function recentOrders(): Collection`, and `public function lowStockProducts(): Collection`; the arrays contain fixed period labels, integer cents, counts, status strings, stable business keys, and empty collections where appropriate. `CommerceStatsOverview` extends `StatsOverviewWidget` and implements `protected function getStats(): array`; `RevenueOrdersChart` extends `ChartWidget` and implements `protected function getData(): array` and `protected function getType(): string`; table widgets use installed `TableWidget`/table APIs and expose stable query/record and column definitions. Verify exact Filament 5 method declarations against `demo/vendor/filament` before coding.

- [ ] **Step 1: Add the failing Livewire/PHP tests.** Assert exactly four stats cards: total revenue, orders, customers, products, plus a low-stock/trend detail in the documented card content. Assert seeded totals from `EcommerceDemoSeeder`, fixed chart labels/data over a documented period ending at `2026-10-10 12:00:00`, stable recent-order ordering, and low-stock product ordering. Assert no records render a safe heading/empty-state message rather than throwing.
- [ ] **Step 2: Add the failing Playwright test.** Assert the public dashboard contains stats, chart accessible name/labels, recent-orders and low-stock headings, links to real order/product records, responsive two-column/one-column behavior, and fixed displayed values. Run the dashboard grep before implementation and record the expected failure.
- [ ] **Step 3: Implement the read-only metrics boundary.** Query existing `Order`, `Customer`, `Product`, and `Inventory` models; use `Order::placed_at` and the fixed reference date, sum integer `total_cents`, count distinct records, and define low stock from the existing seeded inventory threshold. Eager-load displayed relationships, order by business key/date explicitly, and return empty collections for absent data. Do not hard-code display totals in widgets.
- [ ] **Step 4: Implement native widgets.** Register one stats widget, one chart widget, and two table/list widgets through the existing dashboard registration. Give every widget an explicit heading, description/accessible label, compact empty state, and responsive column span. Recent rows link through `OrderResource::getUrl('view', ['record' => $order])`; low-stock rows link through `ProductResource::getUrl('view', ['record' => $product])`.
- [ ] **Step 5: Run green.** Run `cd demo && php artisan test --filter=DashboardShowcaseTest`; run `npx playwright test e2e/demo-showcase.spec.ts --grep 'dashboard'`; run `./vendor/bin/pint --test app/Filament/Support app/Filament/Widgets tests/Feature/Filament/DashboardShowcaseTest.php`; verify a fresh migration/seed produces identical aggregate JSON twice.
- [ ] **Step 6: Commit.** `git add demo/app/Filament/Support/DashboardMetrics.php demo/app/Filament/Widgets demo/app/Providers/Filament/AdminPanelProvider.php demo/tests/Feature/Filament/DashboardShowcaseTest.php e2e/demo-showcase.spec.ts && git commit -m "Feature: add deterministic commerce dashboard widgets"`.

## Task 4: Real commerce actions, modals, and notifications on existing resources

**Files:** Modify `demo/app/Filament/Resources/Orders/Pages/ViewOrder.php`, the existing order/product page/table classes, and the relevant domain model/service boundary; create `demo/app/Filament/Support/OrderWorkflow.php` only if the existing model has no suitable domain operation; add `demo/tests/Feature/Filament/Resources/CommerceActionsTest.php`; extend `e2e/demo-showcase.spec.ts` and the capability inventory.

**Interfaces:** `OrderWorkflow::markFulfilled(Order $order): Order` validates the allowed transition, persists only the order status/required history through the existing model contract, and returns the refreshed order. Filament actions use native `Action::make()`, `->form()`, `->requiresConfirmation()`, `->modalHeading()`, `->modalSubmitActionLabel()`, `->action()`, and `Notification::make()->success()/danger()/warning()/info()->send()` APIs. Use real order view/details and a non-destructive status/fulfillment action; never expose unrestricted delete/payment/account/tenant operations.

- [ ] **Step 1: Add Livewire red tests.** Test viewing order details, valid fulfillment/status transition, invalid transition validation, unauthorized mutation, missing related customer/product data, confirmation/modal labels, success notification, failure notification, and unchanged data after canceled confirmation. Assert the operation is represented in the MCP inventory with confirmation.
- [ ] **Step 2: Add Playwright red test.** From a real seeded order view, open the action modal, assert accessible heading/labels/cancel-confirm controls, cancel without mutation, confirm a valid action, and assert the status/notification. Run the grep before implementation.
- [ ] **Step 3: Implement the domain operation and action.** Keep transition validation server-side and reuse it from every caller. Add explicit confirmation, accessible modal form/validation, success/failure notifications, and stable action labels. Keep destructive-looking variants constrained or simulated so the seeded showcase remains recoverable.
- [ ] **Step 4: Run green and security checks.** Run focused PHP/Playwright tests, full resource tests, `composer lint:check`, `composer types:check`, and verify no action accepts arbitrary status strings or bypasses existing authorization. Update the capability inventory only for the real operation.
- [ ] **Step 5: Commit.** `git add demo/app/Filament/Resources demo/app/Filament/Support/OrderWorkflow.php demo/tests/Feature/Filament/Resources/CommerceActionsTest.php e2e/demo-showcase.spec.ts docs/ai-operability/demo-showcase-capability-inventory.md && git commit -m "Feature: add safe commerce actions and notifications"`.

## Task 5: FTB-011 Forms and Schemas fixtures

**Files:** Create `demo/app/Filament/Pages/Showcase/FormsShowcase.php`, focused schema/view support under `demo/app/Filament/Pages/Showcase/Forms/` only when required by native Filament 5 APIs, `demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php`, and `e2e/demo-showcase.spec.ts`; modify `TICKETS.md`/`COVERAGE.md` only after evidence.

**Interfaces:** The page is a native `Page` with `public static function getSlug(): string`, `protected function getView(): string`, and an explicitly typed form/schema configuration using installed Filament 5 `Schema` components. Fixtures must visibly cover wizard, repeater, builder/content blocks, rich text/editor, tabs/sections, conditional/reactive fields, validation, disabled, filled, and focus states without duplicating existing entity CRUD forms.

- [ ] **Step 1: Add Playwright and Livewire red tests** for route/navigation, headings, each distinct control/layout, keyboard labels, validation error, disabled/filled state, and light/dark rendering. Run the focused commands and record failure.
- [ ] **Step 2: Inspect installed Filament 5 schema APIs** and write the smallest native page fixture. Use deterministic prefilled values and local text only; do not add upload/media dependencies or copy official-demo source.
- [ ] **Step 3: Implement tests/fixture and edge cases.** Include empty/null optional fields, invalid required field, long text truncation behavior, keyboard focus order, and a server-side validation assertion. Keep showcase form mutations isolated to the request/test state or constrained fixture records.
- [ ] **Step 4: Run green and commit.** `cd demo && php artisan test --filter=FormsShowcaseTest && ./vendor/bin/pint --test app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/FormsShowcaseTest.php`; `npx playwright test e2e/demo-showcase.spec.ts --grep 'forms'`; commit `Feature: add forms and schemas showcase`.

## Task 6: FTB-012 Tables fixtures

**Files:** Create `demo/app/Filament/Pages/Showcase/TablesShowcase.php`, native table fixture support under `demo/app/Filament/Pages/Showcase/Tables/` if required, `demo/tests/Feature/Filament/Showcase/TablesShowcaseTest.php`, and browser coverage; modify coverage/tickets after tests.

**Interfaces:** Use native Filament table configuration with text/image/badge/icon columns, search, sort, filters, grouping, pagination, summaries, column toggles, selection/bulk actions, row actions, and reorder support where installed. Define explicit stable ordering and a safe empty/loading state; do not turn the fixture into a second CRUD resource.

- [ ] **Step 1: Add failing Playwright/Livewire tests** for responsive table, column variants, filters/search/sort/group/summary/toggle, selection/actions/reorder, empty state, loading indicator, and accessible headers/actions.
- [ ] **Step 2: Run red, inspect native APIs, and implement** a compact seeded table fixture using existing products/orders. Use explicit keys, stable data, real action confirmation, and no sleep-based loading simulation.
- [ ] **Step 3: Test edge cases** for zero rows, missing image/relationship, long product name, selected row reset, invalid filter, and mobile viewport. Ensure no table action mutates seeded records unless the action is explicitly scoped and tested.
- [ ] **Step 4: Run green and commit.** `cd demo && php artisan test --filter=TablesShowcaseTest && ./vendor/bin/pint --test app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/TablesShowcaseTest.php`; `npx playwright test e2e/demo-showcase.spec.ts --grep 'tables'`; commit `Feature: add tables showcase fixtures`.

## Task 7: FTB-013 Infolists fixtures

**Files:** Create `demo/app/Filament/Pages/Showcase/InfolistsShowcase.php`, native infolist fixture support under `demo/app/Filament/Pages/Showcase/Infolists/` if required, `demo/tests/Feature/Filament/Showcase/InfolistsShowcaseTest.php`, and browser coverage.

**Interfaces:** Configure native Filament `Schema`/infolist entries for sections/groups/layouts, rich text, image/media URL, badges, icons, repeatable entries, null/empty values, and readable labels. The fixture must be read-only and use seeded product/order data; each entry has a semantic heading or accessible label.

- [ ] **Step 1: Add failing PHP/Playwright tests** for every distinct entry/layout, light/dark behavior, null/missing relationship, rich text escaping, image alt text, badges/icons, and repeatable rows.
- [ ] **Step 2: Run red, inspect installed APIs, and implement** the focused read-only page; do not duplicate existing resource infolists unless the visual surface is materially distinct.
- [ ] **Step 3: Run green and commit.** `cd demo && php artisan test --filter=InfolistsShowcaseTest && ./vendor/bin/pint --test app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/InfolistsShowcaseTest.php`; `npx playwright test e2e/demo-showcase.spec.ts --grep 'infolists'`; commit `Feature: add infolists showcase fixtures`.

## Task 8: FTB-014 focused actions, modals, and notifications showcase

**Files:** Create `demo/app/Filament/Pages/Showcase/ActionsShowcase.php`, `NotificationsShowcase.php`, any focused native action/form/infolist view files, `demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php`, and browser coverage.

**Interfaces:** Native actions cover primary/danger/success/warning/info/gray, outline, icon-only, disabled, loading, grouped/dropdown, tooltip, confirmation, form modal, slide-over, read-only infolist modal, sizes, headers, footers, footer actions, and accessible cancel/submit labels. Native notifications cover success/danger/warning/info, persistent/transient presentation where the installed API supports it, meaningful titles/body/actions, and deterministic visible fixtures. FTB-016 owns forced-open/visible control; this task owns the variants.

- [ ] **Step 1: Add failing Livewire/Playwright tests** asserting each visually distinct variant, modal size/layout/footer, validation/error, action loading/disabled semantics, notification status/placement/content, keyboard focus trap, escape/cancel behavior, and no accidental persistent mutation.
- [ ] **Step 2: Run red and inspect installed Filament action/notification source.** Implement only native APIs and keep all labels independent from official-demo copy/branding.
- [ ] **Step 3: Implement fixtures with safe allowlists.** Use read-only fixture actions or the already-tested commerce workflow for mutations; keep notifications reproducible through explicit state rather than toast timing.
- [ ] **Step 4: Run green and commit.** `cd demo && php artisan test --filter=ActionsShowcaseTest && ./vendor/bin/pint --test app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/ActionsShowcaseTest.php`; `npx playwright test e2e/demo-showcase.spec.ts --grep 'actions|notifications'`; commit `Feature: add actions modals and notifications showcase`.

## Task 9: FTB-015 Showcase navigation/search/profile/auth/tenant integration

**Files:** Create/modify the single `ShowcasePage` and focused showcase pages; modify `AdminPanelProvider.php`; modify `demo/app/Filament/Auth/Pages/Login.php` only for accessible showcase-safe labels if required; add `demo/tests/Feature/Filament/Showcase/NavigationShowcaseTest.php`; extend `FilamentPanelTest.php`, `e2e/demo-showcase.spec.ts`, and existing `demo-panel.spec.ts` only for integration invariants.

**Interfaces:** `ShowcasePage` is the grouped landing/index surface with native `Page` route and links to the real FTB-011–016 pages. Panel discovery remains the one source for widgets/pages/resources. Native global search, breadcrumbs, sub-navigation/page tabs, topbar/profile/auth controls, and a controlled tenant-switch presentation are demonstrated without requiring a visitor account or tenant membership. Existing Phase 1 dashboard widgets and navigation are integrated; no second registry or copied upstream welcome page is allowed.

- [ ] **Step 1: Add failing browser tests** for Showcase group/index links, dashboard link, search keyboard shortcut/accessible dialog, breadcrumbs/tabs, profile/login/auth states, controlled tenant presentation, sidebar collapse/active/badges, and public access behavior.
- [ ] **Step 2: Add failing PHP/Livewire tests** for page registration, route authorization, search/profile/login invariants, no tenant persistence, and one dashboard widget registration set without duplicates.
- [ ] **Step 3: Implement the landing/navigation integration.** Use native panel/page/search/profile APIs, explicitly label controlled states, preserve login credentials and public preview, and link to real records/pages rather than fake cards.
- [ ] **Step 4: Run green.** Run focused PHP and Playwright tests at desktop and mobile widths, then `cd demo && composer lint:check && composer types:check`; commit `Feature: integrate Filament showcase navigation surfaces`.

## Task 10: FTB-016 safe deterministic forced-state controls

**Files:** Create `demo/app/Filament/Support/ShowcaseState.php` and any small state resolver/value objects; modify showcase pages/widgets only through that interface; add `demo/tests/Feature/Filament/Showcase/ForcedStateTest.php`; extend `e2e/demo-showcase.spec.ts`; update capability inventory to mark controls presentation-only.

**Interfaces:** `ShowcaseState::allowed(): array` returns explicit identifiers; `ShowcaseState::fromRequest(Request $request): self` rejects unknown identifiers; `ShowcaseState::is(string $identifier): bool` is pure; `ShowcaseState::reset(): self` returns ordinary fixture state. Supported identifiers are `default`, `focus`, `disabled`, `loading`, `validation-error`, `empty`, `selected`, `open-modal`, and `visible-notification`. No state identifier executes a domain mutation, bypasses authorization, or relies on timing.

- [ ] **Step 1: Add failing tests** for each allowlisted state, unknown-state rejection, default/reset behavior, no database writes, no session leakage between requests, and reproducible URLs/HTML. Include empty, missing-related-record, stale-count, and validation-error cases.
- [ ] **Step 2: Add failing Playwright tests** that navigate with explicit state parameters, assert the intended state, reload/revisit another state, and prove the ordinary public navigation remains default.
- [ ] **Step 3: Implement the pure resolver and page bindings.** Use request-scoped state only, escape/validate parameters, and make forced open modal/notification state visible without sleeps. Keep state-specific records in memory or test fixture scope; never persist them.
- [ ] **Step 4: Run green and security checks.** Run focused PHP/Playwright tests, verify no writes in query logs for state-only requests, and commit `Feature: add deterministic showcase forced states`.

## Task 11: FTB-017 icon packs and semantic replacements

**Files:** Modify `AdminPanelProvider.php`; create a small icon configuration/value-object boundary under `demo/app/Filament/Support/Icons/` only if needed; modify representative resource/page/action icon declarations; add `demo/tests/Feature/Filament/Showcase/IconConfigurationTest.php`; extend browser coverage and capability/export documentation.

**Interfaces:** Define a serializable icon state `{pack: string, overrides: array<string,string>}` with allowlisted packs/styles and semantic keys. Resolve global defaults plus per-key overrides to native Filament `Heroicon`/installed icon enum values; do not replace icons with CSS glyphs. PanelProvider export output must identify non-CSS icon configuration and reset must restore inherited defaults.

- [ ] **Step 1: Add failing PHP/Playwright tests** for default plus at least two alternative pack/style presets, semantic override precedence, invalid pack/icon rejection, immediate preview on supported surfaces, reset, and exported PanelProvider classification.
- [ ] **Step 2: Run red and inspect native Filament icon configuration APIs.** Implement allowlists and native provider/resource/action configuration, not arbitrary class names or user SVGs.
- [ ] **Step 3: Run green, accessibility-check icon-only controls** for accessible labels/tooltips, and commit `Feature: add semantic Filament icon configuration`.

## Task 12: FTB-018 runtime branding/configuration and export classification

**Files:** Modify `AdminPanelProvider.php`; keep local SVGs in `demo/resources/views/filament/branding/`; create/modify builder-side runtime/theme/export files only where the existing architecture already owns PanelProvider export; add `demo/tests/Feature/Filament/Showcase/RuntimeBrandingTest.php`, relevant builder unit tests, and browser coverage. Do not change builder product identity.

**Interfaces:** Runtime branding state contains `brandName`, `brandLogoLight`, `brandLogoDark`, `favicon`, `logoHeight`, `brandTypography`, `contentWidth`, and `sidebarBehavior`, with classification `preview-emulatable`, `controlled-reload`, or `export-only`. Export emits safe PanelProvider snippets/complete example according to existing FTB-026 conventions and never asks users to overwrite unrelated provider logic. Arbitrary uploaded SVG is rejected; only trusted local asset identifiers are accepted.

- [ ] **Step 1: Add failing PHP, builder, and Playwright tests** for light/dark logos, favicon, height, typography/layout classifications, safe reload behavior, JSON serialization, export snippets, invalid asset rejection, and preservation of `Filament Theme Builder` as the panel brand.
- [ ] **Step 2: Run red and inspect existing theme registry/export interfaces** before adding fields; integrate with those interfaces rather than creating a parallel runtime state store.
- [ ] **Step 3: Implement native PanelProvider configuration and classification.** Preview safe visual properties immediately, trigger controlled reload only for true runtime settings, and document non-CSS PHP configuration in export output.
- [ ] **Step 4: Run green.** Run affected builder tests, focused PHP tests, Playwright branding tests, `cd demo && composer lint:check && composer types:check`; commit `Feature: add runtime panel branding configuration`.

## Task 13: Coverage, documentation, full verification, and final E2E acceptance

**Files:** Modify `TICKETS.md`, `COVERAGE.md`, `docs/ai-operability/demo-showcase-capability-inventory.md`, and create/modify `docs/demo-showcase.md`; extend `demo/tests/Feature/FilamentPanelTest.php`, `e2e/demo-showcase.spec.ts`, and existing smoke/panel specs only for final acceptance.

**Interfaces:** Documentation must link each FTB-011–018 criterion to an implemented route/class/test and must classify every new capability as read-only, presentation-only, or mutation with MCP authorization/confirmation. Final browser suite targets the real public `/demo/admin` stack and fixed state identifiers; final PHP suite targets seeded SQLite and does not rely on committed database contents.

- [ ] **Step 1: Add the final acceptance assertions before documentation claims.** Require public dashboard/login/profile invariants, independent branding, fixed dashboard totals/chart, distinct icons/badges, commerce action/modal/notification flow, all Showcase page links, responsive rendering, every forced state, light/dark behavior, and no duplicate dashboard/navigation registrations.
- [ ] **Step 2: Run the complete red/green verification sequence.** From the repository root run `docker compose -f compose.dev.yaml up --build -d`; then run `docker compose -f compose.dev.yaml ps`, `cd demo && composer test`, `cd .. && npx playwright test e2e/demo-panel.spec.ts e2e/demo-showcase.spec.ts`, `npx playwright test e2e/smoke.spec.ts`, and the repository’s existing root test/build commands. Run `docker compose -f compose.prod.yaml config` and its configured production build/health verification without changing compose topology. Use `npx playwright test --project=chromium` if the existing script does not expose the project flag.
- [ ] **Step 3: Exercise edge/security cases.** Run fresh migrate/seed twice and compare business-key counts/aggregate JSON; test zero orders/products, missing customer/image, invalid action/state/icon/asset, canceled modal, unauthorized mutation, escaped rich text, keyboard focus, contrast, dark mode, mobile layout, and request isolation. Confirm state controls produce no persistent writes and the capability inventory has no UI-only mutation.
- [ ] **Step 4: Update docs only from evidence.** Mark individual FTB-011–018 criteria complete only where tests pass; add each coverage ID and source route/class; document fixed date, reset safety, local branding, official-demo non-copying identity, state allowlist, commands, accessibility/security constraints, and MCP behavior. Do not mark FTB-027/028 or unrelated FTB-032/033/039 work complete.
- [ ] **Step 5: Review the final diff.** Run `git diff --check`, `git status --short`, inspect changed paths for secrets/arbitrary SVG/runtime mutable state, confirm no dependency or compose changes, and verify only intended task commits/files are present. Stop and report any failing production/runtime check instead of weakening the acceptance criteria.
- [ ] **Step 6: Commit.** `git add TICKETS.md COVERAGE.md docs/ai-operability/demo-showcase-capability-inventory.md docs/demo-showcase.md demo/tests/Feature/FilamentPanelTest.php e2e/demo-panel.spec.ts e2e/demo-showcase.spec.ts e2e/smoke.spec.ts && git commit -m "Docs: complete demo showcase acceptance contract"`.

## Self-Review Against Approved Scope

| Requirement | Plan coverage | Evidence required |
|---|---|---|
| Task 1 ticket/docs contract updates | Task 1 | Ticket anchors, coverage IDs, MCP inventory test, no FTB-027/028 changes |
| Phase 1 exact panel branding, local SVG light/dark logos/favicon | Task 2 | PHP and Playwright brand/asset assertions; original local assets; no official identity |
| Distinct semantic icons and deterministic navigation badges | Tasks 2 and 11 | Resource icon/badge tests, icon-pack/reset/export tests, accessible non-color signals |
| Native stats/chart/table dashboard widgets | Task 3 | Fixed-date aggregate tests, native widget registration, empty-state and browser assertions |
| Real commerce actions/modals/notifications | Task 4 | Domain validation, authorization, confirmation, notification, cancel/error tests |
| FTB-011 forms/schemas | Task 5 | Native fixture and browser coverage for distinct controls/layouts/states |
| FTB-012 tables | Task 6 | Native table interactions, responsive/empty/loading/edge-case coverage |
| FTB-013 infolists | Task 7 | Native read-only entries/layouts/null/rich-text/media coverage |
| FTB-014 focused actions/modals/notifications | Task 8 | Variant/modal/footer/notification fixture coverage separate from commerce actions |
| FTB-015 navigation/search/profile/auth/tenant and dashboard integration | Task 9 | One Showcase index and one panel registration path; public/auth/tenant tests |
| FTB-016 safe deterministic forced states | Task 10 | Allowlist, request isolation, no-write tests, explicit Playwright state URLs |
| FTB-017 icon packs/semantic replacements | Task 11 | Native icon configuration, JSON/export/reset and accessibility tests |
| FTB-018 runtime branding/config/export classification | Task 12 | Runtime classification, trusted assets, controlled reload, export tests |
| Deterministic seeded data and edge cases | Tasks 2–4, 6, 10, 13 | Fixed date, repeated seed comparison, missing/empty/invalid cases |
| Accessibility and security | Tasks 4–13 | Keyboard/dialog/focus/contrast/escaping/authorization/asset/state checks |
| AI operability | Tasks 1, 4, 10, 12, 13 | Capability inventory, shared domain path, authorization/confirmation, no privileged presentation control |
| Full verification and real public panel E2E | Task 13 | Composer/Pint/Larastan/PHPUnit, Playwright, Docker dev/prod checks |

## Explicit Non-Goals and Risks

- Do not copy the official Filament demo’s name, logo, exact look, routes, source, text, or data; research only identifies useful first-party surface categories.
- Do not rebuild FTB-009A/B/010 resources, relationship managers, nested resources, or the existing reset/share/upload lifecycle.
- Do not add dependencies, a static frontend showcase, unrestricted destructive/payment/account/tenant operations, or visitor-specific mutable state.
- Filament 5 APIs for `TableWidget`, infolists, icon registration, and runtime panel configuration must be confirmed against the installed vendor source during execution; if a named API differs, adapt the signature to the installed native API and update the task’s exact test contract rather than adding a compatibility package.
- If the existing builder export interface cannot represent a runtime setting without changing its approved contract, classify it as export-only and report the contract gap; do not silently fake it with CSS.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-10-demo-showcase-expansion.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, and iterate quickly.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, in batches with checkpoints for review.

Choose either approach to begin implementation. No implementation or commit is performed by creating this plan.
