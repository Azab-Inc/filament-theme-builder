# Demo Panel Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved demo-first milestone: a deterministic complete e-commerce domain, useful Filament CRUD, and representative relationship workflows before additional builder feature work resumes.

**Architecture:** Keep the existing Laravel 13 / Filament 5 demo as the real public application. Implement the SPECS §14 domain in Eloquent with explicit relationships, factories and deterministic seeders, then layer focused Filament resources and relationship UIs on that model graph. Add backend and browser verification against the real public demo; update roadmap documentation to make the FTB-009A → FTB-009B → FTB-010 sequencing gate explicit.

**Tech Stack:** PHP 8.5, Laravel 13, Eloquent, SQLite, Filament 5 / Livewire 4, PHPUnit 12, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-10-demo-first-roadmap-design.md`; domain contract: `SPECS.md` §§14–15, 34–35, 41.

## Global Constraints

- Preserve the independent builder and Laravel demo application boundary.
- Keep the Filament demo public and reachable under `/demo/admin`; the working demo login must continue to work but must not be required for preview access.
- Demo data is explicitly non-production, disposable, coherent e-commerce data; use no production behavior or unrelated kitchen-sink entities.
- The model graph covers BelongsTo, HasMany, BelongsToMany, and polymorphic relations; seed data is deterministic for repeatable tests and screenshots.
- Use existing Laravel/Filament conventions and installed versions; do not add packages or services.
- TDD for all implementation: add and run a failing automated test before implementation. For user-visible behavior add and run the Playwright test first.
- Keep TICKETS.md and project-level workflow guidance aligned with the approved three-ticket builder sequencing gate. FTB-027 and FTB-028 remain parallel operational work and are explicitly not implemented by this plan.
- No additional builder features before FTB-009A, FTB-009B, and FTB-010 complete.

---

## File Map

| Path | Responsibility |
|---|---|
| `AGENTS.md` | Root development sequencing: no more builder feature work until FTB-009A/B/010 complete; keep parallel FTB-027/028 distinct. |
| `TICKETS.md` | Stable ticket anchors/dependencies and acceptance scopes for the split domain, resources, and relationship slices; document sequencing explicitly. |
| `demo/database/migrations/*.php` | E-commerce relational schema and constraints, in dependency order. |
| `demo/app/Models/*.php` | Eloquent domain models, casts, factories, explicit relationship methods. |
| `demo/database/factories/*.php` | Reusable valid model states and relationship-aware factories. |
| `demo/database/seeders/{DatabaseSeeder,EcommerceDemoSeeder}.php` | Idempotent deterministic dataset without disturbing the existing demo user seeder. |
| `demo/tests/Feature/Domain/*.php` | Schema, relationship, deterministic seeding, and data persistence contracts. |
| `demo/app/Filament/Resources/**` | Filament resource definitions for all 17 SPECS §14 entities, their resource pages, schemas, tables, and supplemental relation managers, matching installed Filament 5 generated conventions. |
| `demo/app/Providers/Filament/AdminPanelProvider.php` | Navigation grouping/order only, following current provider setup. |
| `demo/tests/Feature/Filament/Resources/*.php` | Livewire-backed list/create/edit/view behavior tests for all 17 entity resources and relationship interaction tests. |
| `demo/tests/Feature/FilamentPanelTest.php` | Extend existing public panel assertions only if a new public navigation invariant belongs here. |
| `e2e/demo-panel.spec.ts` | Playwright public demo navigation, representative CRUD behavior across all resource groups, and relationship workflows against the real demo. |
| `playwright.config.ts` | Only adjust existing config if the current webServer/base URL does not already cover `/demo/admin`; preserve existing smoke behavior. |
| `COVERAGE.md` | Create the missing source-of-truth manifest; enumerate all 17 entity resources and distinguish resource CRUD, Relation Managers and Nested Resources. |
| `ARCHITECTURE.md` | Create/extend the architecture guide with demo domain/resource boundaries and disposable deterministic fixture behavior. |

> Implementation convention check: the root guidance refers to `demo/AGENTS.md`, but that file is not present at plan creation. Before changing Laravel code, execution must use the extant `demo/.agents/skills/laravel-best-practices/SKILL.md`, inspect neighboring files, and verify the current Filament 5 resource-generation conventions through installed CLI/help or existing source. Do not invent a conflicting `demo/AGENTS.md` in this milestone. If repository owners add one before execution, it takes precedence for demo files.

## Task 1: Record demo-first sequencing in repository guidance and ticket plan

**Files:** Modify `AGENTS.md`, `TICKETS.md`.

**Interfaces:** Keep existing ticket anchors `#ftb-009`, `#ftb-010`, `#ftb-027`, `#ftb-028` stable. Represent the ordered gate as FTB-009A (domain) → FTB-009B (resources) → FTB-010 (relationship UI); FTB-027/028 retain their separately documented prerequisites and remain parallel operational tickets.

- [ ] **Step 1: Add a failing documentation contract test.** Create `scripts/demo-first-roadmap.test.mjs` using `node:test`, `node:assert/strict`, and `node:fs/promises`. Assert `AGENTS.md` contains the exact gate wording `FTB-009A`, `FTB-009B`, and `FTB-010`, says FTB-027/028 are parallel and outside the current plan; assert `TICKETS.md` contains separate headings for all three milestone slices and dependency ordering. Assert existing `<a id="ftb-009">`, `<a id="ftb-010">`, `<a id="ftb-027">`, `<a id="ftb-028">` remain exactly once. Add the test to the existing root `npm test` command in `package.json` only if it currently omits direct `node --test` inclusion; inspect the script first and preserve its other test inputs.
- [ ] **Step 2: Run red.** Run `node --test scripts/demo-first-roadmap.test.mjs`; expected assertion failures because the gate/split are not documented.
- [ ] **Step 3: Update root `AGENTS.md`.** Add a short subsection under Development Workflow stating after FTB-003, builder feature tickets remain blocked until FTB-009A, FTB-009B and FTB-010 are complete; state FTB-027/028 are parallel operational tickets, not part of this milestone, and do not relax the gate.
- [ ] **Step 4: Update `TICKETS.md` without changing IDs/anchors.** Update the dependency map and FTB-009 / FTB-010 descriptions and acceptance criteria so FTB-009A describes all SPECS §14 entities plus migrations/models/relationships/factories/deterministic seeders, FTB-009B describes core CRUD resources/navigation, and FTB-010 describes representative Relation Managers/Nested Resources and explicit relationship actions. Document the sequence and keep FTB-027/028 as separate parallel operational work; do not move or claim their acceptance criteria complete.
- [ ] **Step 5: Run green.** Run `node --test scripts/demo-first-roadmap.test.mjs`; expected all assertions pass. Run `npm test` if package.json includes the test in the root suite.
- [ ] **Step 6: Commit.** `git add AGENTS.md TICKETS.md scripts/demo-first-roadmap.test.mjs package.json && git commit -m "Docs: sequence demo-first implementation tickets"` (stage `package.json` only if changed).

## Task 2: Define complete e-commerce schema and verify migration constraints (FTB-009A)

**Files:** Create ordered migrations under `demo/database/migrations/`; create `demo/tests/Feature/Domain/EcommerceSchemaTest.php`.

**Interfaces:** Tables/models required by SPECS §14: `customers`, `addresses`, `products`, `categories`, `product_category`, `product_variants`, `tags`, `product_tag`, `reviews`, `orders`, `order_items`, `payments`, `refunds`, `shipments`, `order_status_histories`, `inventories`, `suppliers`, `discounts`, and `notes`. Polymorphic note ownership is `notes.noteable_type` + `notes.noteable_id`. Use integer minor units for monetary columns (e.g. `price_cents`, `subtotal_cents`, `amount_cents`) to avoid floating-point currency. Statuses are stored as stable strings, dates in date/datetime columns, and foreign keys/indexes enforce graph integrity. Nullable `orders.customer_id` / address references are permitted for guest orders and historical retention; order items retain product/variant names and unit price snapshots.

- [ ] **Step 1: Write the failing schema contract.** In `EcommerceSchemaTest`, use `RefreshDatabase`; assert every named table exists; assert required foreign key relationships can persist via schema rather than simply checking table names. The test must also assert pivot uniqueness on `(product_id, category_id)` and `(product_id, tag_id)` via duplicate insert expected `QueryException`, and assert `notes` accepts one note linked polymorphically to a product.
- [ ] **Step 2: Run red.** From `demo/`, run `php artisan test --filter=EcommerceSchemaTest`; expected failure because the domain tables are absent.
- [ ] **Step 3: Implement migrations in FK order.** Create customer/supplier/category/tag/discount base tables; products and their category/tag pivots, variants and inventory; addresses/reviews; orders and order items; payments/refunds/shipments/status history; polymorphic notes. Include created/updated timestamps where models use Eloquent, sensible nullable deletes (`nullOnDelete` only where historical records remain meaningful), cascades for owned pivots/items, unique SKU/email-per-identity constraints as appropriate, money-in-cents columns, and indexes for foreign keys/status lookups. Keep standard framework tables untouched.
- [ ] **Step 4: Run green and migration rollback checks.** `php artisan test --filter=EcommerceSchemaTest` must pass. Run `php artisan migrate:fresh --env=testing --force`, `php artisan migrate:rollback --env=testing --step=1 --force`, and `php artisan migrate --env=testing --force`; verify exit code 0. Roll back the final domain migration, which must be `create_notes_table`, so its dependent polymorphic table can be recreated cleanly. Use the test database configured by `phpunit.xml`; do not target the developer's working `demo/database/database.sqlite` unintentionally.
- [ ] **Step 5: Commit.** Stage only new migrations and `EcommerceSchemaTest.php`; `git commit -m "Feature: add e-commerce demo schema"`.

## Task 3: Add Eloquent models and relationship contracts (FTB-009A)

**Files:** Create `demo/app/Models/{Customer,Address,Product,Category,ProductVariant,Tag,Review,Order,OrderItem,Payment,Refund,Shipment,OrderStatusHistory,Inventory,Supplier,Discount,Note}.php`; create `demo/tests/Feature/Domain/EcommerceRelationshipsTest.php`.

**Interfaces:** Define conventional relationship methods with concrete return types: `Customer::addresses(): HasMany`, `Customer::orders(): HasMany`, `Product::categories(): BelongsToMany`, `Product::tags(): BelongsToMany`, `Product::variants(): HasMany`, `Product::reviews(): HasMany`, `Product::supplier(): BelongsTo`, `Order::customer(): BelongsTo`, `Order::items()/payments()/shipments()/statusHistories(): HasMany`, `OrderItem::order(): BelongsTo`, `OrderItem::product()/variant(): BelongsTo`, `Payment::refunds(): HasMany`, `Note::noteable(): MorphTo`, and `Product::notes()/Order::notes()` as `MorphMany`. Add inverse belongs-to/many methods for all foreign-key links, including supplier/products, category/products, tag/products, address/customer, review/customer+product, shipment/order, inventory/product+variant, discount/orders as defined by the schema. Use Laravel 13 attribute-based fillable/hidden/casts conventions from `User.php` where appropriate; use integer cents and cast enums only if enums are introduced and consistently tested.

- [ ] **Step 1: Write relation persistence tests first.** Verify each relation kind by creating records and asserting relation identity/count; cover the public list above and inverse sides. Include `MorphMany` note retrieval on both a Product and Order. Assert deleting a category removes only its pivot, not its Product; assert deleting an Order cascades order items while preserving unrelated Product records.
- [ ] **Step 2: Run red.** `php artisan test --filter=EcommerceRelationshipsTest`; expected class/relationship errors.
- [ ] **Step 3: Implement focused models.** Each model declares its table only when Laravel naming is non-standard, typed `HasFactory` as generated User model does, explicit fillable/hidden attribute declarations, casts for dates/booleans/JSON, and relationship return types from `Illuminate\Database\Eloquent\Relations`. Do not place Filament form logic or seeding logic in models.
- [ ] **Step 4: Run green and formatting.** `php artisan test --filter=EcommerceRelationshipsTest`; `./vendor/bin/pint --test app/Models tests/Feature/Domain/EcommerceRelationshipsTest.php`.
- [ ] **Step 5: Commit.** `git add app/Models tests/Feature/Domain/EcommerceRelationshipsTest.php && git commit -m "Feature: add e-commerce domain relationships"` (from `demo/`, or use repo-relative `demo/...` paths when running root).

## Task 4: Add model factories and repeatable demo seeding (FTB-009A)

**Files:** Create `demo/database/factories/{Customer,Address,Product,Category,ProductVariant,Tag,Review,Order,OrderItem,Payment,Refund,Shipment,OrderStatusHistory,Inventory,Supplier,Discount,Note}Factory.php`; create `demo/database/seeders/EcommerceDemoSeeder.php`; modify `demo/database/seeders/DatabaseSeeder.php`; create `demo/tests/Feature/Domain/EcommerceSeedTest.php`.

**Interfaces:** The `EcommerceDemoSeeder` is invoked after `UserSeeder` in `DatabaseSeeder`. It generates stable named records with fixed Faker seed (`$this->faker->seed(20261010)` or explicit fixed fixtures) and deterministic IDs/attributes without depending on ambient random state; repeated `db:seed` must not duplicate records. Export stable fixture keys in test assertions by `sku` / `number` / `slug` rather than auto IDs. Seed a useful compact graph with at least two customers, multiple addresses/products/categories/tags/variants, reviews, two orders with several items, payment + refund, shipment, multiple status-history entries, inventory, supplier, discount, and notes attached to different model types. All seed data visibly remains demo/non-production, and `UserSeeder`'s existing user/password contract remains unchanged.

- [ ] **Step 1: Write failing seeder tests.** Assert seeding twice results in the same counts and stable sorted product SKUs/order numbers; assert all entity types have related records and an order's product/item names and cents snapshots are populated; assert `DatabaseSeeder` still creates exactly the advertised login user and the seed graph does not create more Users.
- [ ] **Step 2: Run red.** `php artisan test --filter=EcommerceSeedTest`; expected missing seeder/classes or empty tables.
- [ ] **Step 3: Create factories.** Each factory's `definition()` returns schema-valid states and unique values; `configure()`/states only for reusable domain variations (e.g. paid/refunded order or active/inactive product). Ensure factory relationship defaults use `for()`/`has()` and don't silently create inconsistent FK pairs.
- [ ] **Step 4: Implement deterministic idempotent seeder.** Use `updateOrCreate` keyed by stable unique fields, then sync pivots and replace owned children deterministically where needed. Seed fixed statuses and dates relative to a fixed date, not `now()`. Append `EcommerceDemoSeeder::class` after `UserSeeder::class` in `DatabaseSeeder`.
- [ ] **Step 5: Run green repeatedly.** `php artisan test --filter=EcommerceSeedTest`; `php artisan migrate:fresh --seed --force`; run `php artisan db:seed --force` a second time; compare counts and stable business keys. The tests must not rely on committed SQLite state.
- [ ] **Step 6: Commit.** `git add database/factories database/seeders/DatabaseSeeder.php database/seeders/EcommerceDemoSeeder.php tests/Feature/Domain/EcommerceSeedTest.php && git commit -m "Feature: seed deterministic e-commerce demo data"`.

## Task 5: Build core Filament resources and coherent navigation (FTB-009B)

**Files:** Create resource folders under `demo/app/Filament/Resources/` for all 17 SPECS §14 entities—`CustomerResource`, `AddressResource`, `ProductResource`, `CategoryResource`, `ProductVariantResource`, `TagResource`, `ReviewResource`, `OrderResource`, `OrderItemResource`, `PaymentResource`, `RefundResource`, `ShipmentResource`, `OrderStatusHistoryResource`, `InventoryResource`, `SupplierResource`, `DiscountResource`, and `NoteResource`—including each resource's Filament-generated `Pages` files; add focused schema/table classes only following installed Filament 5 conventions. Modify `demo/app/Providers/Filament/AdminPanelProvider.php`. Create `demo/tests/Feature/Filament/Resources/EntityResourcesTest.php`, `e2e/demo-panel.spec.ts`.

**Interfaces:** Filament resources use Filament 5 schema/table APIs (`form(Schema $schema): Schema`, `table(Table $table): Table`, resource pages `ListRecords`, `CreateRecord`, `EditRecord`, `ViewRecord` as generated by this install). Provide a resource with list/create/edit/view behavior for every entity: customers, addresses, products, categories, variants, tags, reviews, orders, order items, payments, refunds, shipments, status history, inventory, suppliers, discounts, and notes. Organize navigation coherently, for example `Catalog` (Products, Categories, Variants, Tags, Inventory), `Sales` (Orders, Order Items, Payments, Refunds, Shipments, Status History, Discounts), `Customers` (Customers, Addresses, Reviews), and `Operations` (Suppliers, Notes). Resource forms use representative validated inputs; tables provide searchable/sortable/filterable data, status badges where applicable, product image column where supported by existing storage setup (URL or seeded public URL, no upload infrastructure addition), money formatting from integer cents, and meaningful empty/list states. Relation managers and nested resources in FTB-010 supplement these standalone resource surfaces; they do not replace any entity resource or its list/create/edit/view coverage.

- [ ] **Step 1: Add failing resource behavior tests.** Use `Livewire::test()` with `RefreshDatabase`, `actingAs(User::factory()->create())` only where required by existing panel auth; verify public demo `/demo/admin` remains unauthenticated as established by existing tests. For each of the 17 resources assert the list page renders, a seeded row is visible, and create/edit/view behavior persists or updates expected values through `callTableAction` / resource page `fillForm()->call('create'|'save')` APIs available in the installed Filament 5 tests. Include assertions for a status badge label, a formatted currency value, and public panel navigation labels/groups. Use focused test methods/data providers if helpful, while retaining explicit coverage of every entity resource.
- [ ] **Step 2: Run user-visible Playwright red before UI implementation.** Add `e2e/demo-panel.spec.ts` first with tests: open `/demo/admin`, assert group headings and resource links, click Products and Orders and assert stable seeded records/columns, open a product row view and verify image/price/status content. Run `npm run e2e -- --grep 'demo panel'` against current setup; expected missing resource links or content. If npm's existing E2E script cannot accept arguments, run `npx playwright test e2e/demo-panel.spec.ts --grep 'demo panel'` with its currently configured webServers.
- [ ] **Step 3: Run PHP red.** `php artisan test --filter=EntityResourcesTest`; expected resource classes/pages absent.
- [ ] **Step 4: Generate/implement all entity resources with the installed CLI conventions.** Inspect `php artisan make:filament-resource --help` and current `AdminPanelProvider`; use the Filament 5 generated structure for all 17 resources, then implement each resource's list/create/edit/view pages, forms, tables, and navigation. Use `Select::relationship()` / relation form components for simple belongs-to selectors required by resource CRUD, not as a substitute for entity resources or relation-manager workflows. Add eager loading where table columns render relationships.
- [ ] **Step 5: Run focused green tests.** `php artisan test --filter=EntityResourcesTest`; `npm run e2e -- --grep 'demo panel'` (or the explicit Playwright command above). Confirm all 17 resources' list/create/edit/view behavior and public panel assertions pass.
- [ ] **Step 6: Commit.** `git add app/Filament/Resources app/Providers/Filament/AdminPanelProvider.php tests/Feature/Filament/Resources/EntityResourcesTest.php ../../e2e/demo-panel.spec.ts && git commit -m "Feature: add e-commerce Filament resources"` (stage only files that belong to the task; use correct repo-relative paths from current working directory).

## Task 6: Demonstrate Relation Managers, Nested Resources, and relation actions (FTB-010)

**Files:** Add `demo/app/Filament/Resources/Customers/RelationManagers/AddressesRelationManager.php`, `OrdersRelationManager.php`, `ReviewsRelationManager.php`; add `demo/app/Filament/Resources/Products/RelationManagers/VariantsRelationManager.php`, `CategoriesRelationManager.php`, `TagsRelationManager.php`; add nested order-item resource pages using the exact Filament 5 nested-resource convention confirmed from the installed version; update `OrderResource` and `ProductResource`; create `demo/tests/Feature/Filament/Resources/RelationshipWorkflowsTest.php`; update `e2e/demo-panel.spec.ts` and create `COVERAGE.md`. These are additional relationship workflows on top of, not instead of, all 17 Task 5 entity resources.

**Interfaces:** Customer resource relation managers show addresses, orders, and reviews; Product resource shows variants, categories, and tags. Categories/tags use explicit attach/detach actions and table records with searchable/filterable fields. Belongs-to child management demonstrates associate/dissociate (use an Order's customer association or a child resource's supported Filament action); the UI action must persist null/new association as appropriate and must never delete the referenced parent. Nested resource is a full-page related order-item workflow scoped to its parent Order; child create/edit cannot escape the parent route scope. Tests assert the generated Filament routes/panel are public-readable, with mutations tested using the existing supported panel/auth behavior. Update coverage with separate identifiers/types `relation-manager` and `nested-resource`; do not label one as the other.

- [ ] **Step 1: Write failing PHP relationship UI tests.** Add Livewire tests that: render each manager from parent edit/view route; attach a Category to a Product then detach it while the Category and Product remain; attach/remove a Tag similarly; create and dissociate an Address/Customer or Order/Customer association with expected FK changes and no parent deletion; create/update/delete an order item through its nested parent route and assert the item belongs to the correct order. Assert modal form and relationship table render with seeded records.
- [ ] **Step 2: Add/extend Playwright tests before UI implementation.** Test Product → Categories and Tags attach/detach modal interactions, Customer → Addresses/Orders tabs, and Order → nested Items full-page route; assert database-visible effects indirectly through the rendered table and route URL. Run `npx playwright test e2e/demo-panel.spec.ts --grep 'relationship'`; expected failure because relation managers/nested routes/actions do not exist.
- [ ] **Step 3: Run PHP red.** `php artisan test --filter=RelationshipWorkflowsTest`; expected missing manager/page/actions.
- [ ] **Step 4: Implement relation managers.** Follow the installed Filament 5 API for `RelationManager::form(Schema $schema): Schema`, `table(Table $table): Table`, and owner relationship names. Use `AttachAction`, `DetachAction`/`DetachBulkAction` for many-to-many relationships, relationship-aware forms for one-to-many. Keep actions appropriately constrained and confirmation flows enabled for destructive detach operations. Add visible filters/actions/status badges to provide representative theming content.
- [ ] **Step 5: Implement parent-scoped nested full-page order-item CRUD.** Follow installed Filament Nested Resources docs/generator conventions, preserve parent order scoping in query/binding, and expose create/edit/view pages appropriate to the API. If Filament 5 installed package has no dedicated nested-resource primitive, stop and report to the orchestrator rather than faking a “Nested Resource” using an unscoped standalone resource or over-building custom routing.
- [ ] **Step 6: Run focused PHP green.** `php artisan test --filter=RelationshipWorkflowsTest`; `./vendor/bin/pint --test app/Filament/Resources tests/Feature/Filament/Resources/RelationshipWorkflowsTest.php`.
- [ ] **Step 7: Run browser green.** `npx playwright test e2e/demo-panel.spec.ts`; verify attach/detach, associate/dissociate and nested child editing against the actual running public demo. Keep deterministic fixtures and avoid screenshot-only proof.
- [ ] **Step 8: Update `COVERAGE.md`.** Record core resources and separately list relation-manager coverage vs nested-resource coverage, including which relation workflows are exercised.
- [ ] **Step 9: Commit.** `git add app/Filament/Resources tests/Feature/Filament/Resources/RelationshipWorkflowsTest.php ../../e2e/demo-panel.spec.ts ../../COVERAGE.md && git commit -m "Feature: demonstrate Filament relationship workflows"` (stage exact changed files only).

## Task 7: Documentation integration and end-to-end acceptance

**Files:** Modify `TICKETS.md`, `ARCHITECTURE.md` and `COVERAGE.md` only as needed; test files from earlier tasks remain the executable acceptance contract.

**Interfaces:** Mark FTB-009A done only when schema/models/relationships/factories/seeding tests pass; FTB-009B done only when list/create/edit/view behavior and navigation tests pass for all 17 SPECS §14 entity resources; FTB-010 done only when representative managers, nested resource, attach/detach, associate/dissociate all pass. Update documentation without claiming FTB-027/028 complete.

- [ ] **Step 1: Verify docs reflect actual implementation.** In `TICKETS.md`, update acceptance checkboxes and statuses only for the three completed demo slices; add links from FTB-009A/B and FTB-010 to `SPECS.md` §§14–15 and the relevant tests. Create `ARCHITECTURE.md` with the e-commerce model/data-seed and Filament resource boundaries, and ensure the newly created `COVERAGE.md` records core resources and relationship UI categories. Do not create unrelated docs or a website.
- [ ] **Step 2: Run all Laravel tests and static/style checks.** From `demo/`, run `composer test` (currently configured to run Pint check, Larastan, and `php artisan test`); expected green. If the focused test invocation is slow, run `php artisan test` plus `composer run lint:check` and `composer run types:check` separately, but record all outputs.
- [ ] **Step 3: Validate clean repeatable data and route availability.** `php artisan migrate:fresh --seed --force`; `php artisan db:seed --force`; verify stable counts/business keys and `php artisan route:list --path=demo/admin`. Run existing `FilamentPanelTest` and `ApiHealthTest`; require public dashboard + login route behavior to remain intact.
- [ ] **Step 4: Run browser verification against public demo.** Start the repository's documented complete local stack with `docker compose -f compose.dev.yaml up --build -d`; run `npx playwright test e2e/demo-panel.spec.ts`; verify product, order, customer, relationship and nested pages load publicly without login. Run existing E2E smoke suite too. Do not add Compose services/dependencies or alter upload/reset semantics as part of this task.
- [ ] **Step 5: Inspect final diff and report out-of-scope tickets.** Confirm `git status --short` has no unrelated changes staged; verify no FTB-027/028 implementation was pulled in. Check all three milestone tickets' criteria against test evidence.
- [ ] **Step 6: Commit.** Stage only documentation edits and use `git commit -m "Docs: record demo panel foundation completion"` if documentation updates are the only remaining changes; otherwise commit the final scoped documentation/integration changes with `Feature: complete demo panel foundation`.

## Dependencies and Execution Order

```text
Task 1 (guidance/tickets)
  └── Task 2 (schema)
       └── Task 3 (models + relationships)
            └── Task 4 (factories + deterministic seeder) = FTB-009A complete
                  └── Task 5 (all 17 entity Filament resources with list/create/edit/view + navigation) = FTB-009B complete
                       └── Task 6 (supplemental relation managers + nested resource) = FTB-010 complete
                           └── Task 7 (acceptance/docs)

FTB-027 / FTB-028: explicitly out of this plan; continue in parallel tickets
with their own prerequisites and implementation plans.
```

## Self-Review Against Approved Scope

| Requirement | Plan task | Coverage |
|---|---|---|
| Update root AGENTS.md / TICKETS.md sequencing; preserve stable ticket anchors | Task 1 | Explicitly tests IDs/gate; keeps operational tickets parallel |
| Every SPECS §14 entity represented with migrations/models/relationships/factories/seeds | Tasks 2–4 | Lists all 17 entity types (including polymorphic notes) and pivots |
| BelongsTo, HasMany, BelongsToMany, polymorphic relationship graph | Task 3 | Typed relationship interface + persistence assertions |
| Deterministic realistic and disposable demo data | Task 4 | Repeat-seed contract and fixed business keys/dates |
| Every SPECS §14 entity has a Filament resource with list/create/edit/view behavior and navigation | Task 5 | Explicitly covers all 17 named entity resources; Livewire tests verify each and Playwright verifies representative grouped flows |
| Relation Managers and Nested Resources distinct and supplemental to entity resources | Task 6 | Both implementations separately tested and represented in COVERAGE.md; none substitutes for a Task 5 resource |
| Attach/detach and associate/dissociate | Task 6 | Explicit actions and persisted behavior assertions |
| Laravel/PHP + Playwright tests against public demo | Tasks 5–7 | TDD red/green + existing public panel smoke invariants |
| FTB-027/028 explicitly out and parallel | Global constraints, Task 1, dependencies | Not implemented or used to relax gate |

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-10-demo-panel-foundation.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, and iterate quickly.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, in batches with checkpoints for review.

Choose either approach to begin implementation. No implementation or commit is performed by creating this plan.
