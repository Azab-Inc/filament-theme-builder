# Inspector element coverage — verification report

## Scope and baseline

- Baseline commit: `d60e0b6` on branch `dev`.
- Verification ran against the existing Compose development stack at `http://127.0.0.1:4175`; all four services were healthy at discovery.
- Read root and builder guidance plus `rules/ai-operability.md`. No MCP tool or editable-control changes were in scope.
- The partial implementation already included edits to evidence/protocol/validation, bridge, tests, and a pending test change to the schema version expectation. The schema assertion in already-dirty `demo/tests/Feature/FilamentPanelTest.php` is restored to baseline `message.theme.schemaVersion === 3`; the partial work's Inspector bridge assertions remain. Other unrelated dirty paths (`builder/src/App.vue`, `builder/src/app.css`, `.gitignore`, prototypes) were preserved. No prototype, app shell/style, package, dependency, or seed data was changed.
- No pre-existing red evidence accompanied the partial changes. Per TDD, the added exact-target/ancestor regression was run before changing the resolver and failed as expected (`selector-only`, expected `no-match`); after correcting the test fixture to an unregistered `.fi-unmapped-child`, the test passes with the resolver guard.

## Implementation summary

- Preview selection now targets the event's nearest visual DOM element rather than walking a hard-coded ordered selector list. SVG/path/use clicks inside interactive controls resolve to the meaningful button/link ancestor; visible classless elements remain selectable with a null safe selector.
- Evidence carries an optional exact `targetSelector`; protocol grammar remains constrained to the existing safe `fi-*` selector grammar and requires the exact selector to appear in the bounded candidate list. Existing protocol version, source, and origin validation remain unchanged.
- A shared target matcher considers only selectors present in reported `candidateSelectors`, and only when their terminal class overlaps the selected element's own `targetSelector`. It performs no registry-wide fallback. The preview bridge now emits a candidate such as `.fi-fo-text-input .fi-input` only when that class is on an actual ancestor and `target.matches(selector)` confirms it selects the current target. Thus wrapper elements can be skipped while candidate provenance remains DOM-verified. A global-search `.fi-input` reports its actual `.fi-global-search .fi-input` ancestor candidate, not the product form candidate. Ancestor-only candidates such as `.fi-section` do not match a child `.fi-unmapped-child`. Only the existing editable allowlist maps the observed product form candidate to Components; raw proposals otherwise keep the exact selected selector. Classless targets remain unavailable.
- Added capture-phase `mousedown` suppression while Inspector is enabled. Filament opens the filter dropdown on `mousedown`, before the existing click suppression; the initial real-pointer regression showed that click-only interception still allowed the dropdown to toggle. Existing hover/selection clear, disable, navigation/reload and click suppression paths remain.

## Independent-review corrections: compound provenance and selected target

The first review correction restored Product name mapping from a registered same-target compound. The follow-up review caught an unsafe registry-wide fallback: an unrelated global-search input has target `.fi-input.fi-input-has-inline-prefix` and actual global-search ancestors, but the registry-wide terminal-class scan could still assign `.fi-fo-text-input .fi-input` to it. The negative unit regression captured those real selector shapes and failed before this repair: resolution incorrectly returned `editorTarget: form.product-name`, and raw proposal incorrectly returned the product-name selector. The implementation now strictly requires the semantic compound itself to appear in `candidateSelectors`; it cannot infer a relationship from registry membership alone.

| Red/green test evidence | Working directory | Result |
| --- | --- | --- |
| `npm run test:unit -- --run src/__tests__/inspector-protocol.spec.ts src/__tests__/raw-overrides.spec.ts` (before this scoped repair) | `builder/` | **Expected red:** the unrelated search evidence (`.fi-input.fi-input-has-inline-prefix`, `.fi-global-search .fi-input`) resolved to editable `form.product-name`; raw selector was `.fi-fo-text-input .fi-input`. |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-007-inspector.spec.ts --grep 'mapped product input|keeps global search input'` (after scoped repair) | repository root | **Passed:** real authenticated Product name and global search pointer clicks; product candidate present only for Product name; global-search evidence stays local and doesn't navigate to Product name. |
| Same focused unit command after repair | `builder/` | **Passed:** 19 tests across Inspector protocol and raw selector proposals. |

The bridge creates bounded safe class paths only from actual ancestors (up to five levels / 30 observed classes), validates each candidate with `target.matches`, and keeps the wire candidate list capped at 20. The matcher looks up registry entries only for those reported candidates, and the terminal selector must overlap the selected target's own class tokens. The real-pointer regressions verify Product name resolves to Components, while global search remains non-Product and its raw selector remains the exact selected target. Unknown child-to-ancestor behavior remains unit-tested.

## Authenticated rendered-route audit

Authentication reused the established FTB-054 helper flow in the builder page: navigate to `/demo/admin/login`, fill `#form\\.email` with `user`, fill `#form\\.password` with `password`, call `requestSubmit()`, verify `/demo/admin`, then open the builder. `php artisan route:list --path=admin` reported 84 routes. The settled Playwright audit visited the 34 GET URLs below; each requested URL matched the observed route, and none rendered the Sign in page. Counts are `B` breadcrumbs, `L` breadcrumb links, `T` table headings, `F` button[aria-label=Filter] triggers, `R` table rows, `S` sections, and `C` input/select/textarea controls.

| Observed URL (requested URL matched) | B | L | T | F | R | S | C |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/demo/admin` | 1 | 0 | 2 | 0 | 3 | 2 | 4 |
| `/demo/admin/showcase` | 1 | 0 | 0 | 0 | 0 | 6 | 2 |
| `/demo/admin/forms-showcase` | 1 | 0 | 0 | 0 | 0 | 6 | 33 |
| `/demo/admin/tables-showcase` | 1 | 0 | 3 | 3 | 13 | 0 | 36 |
| `/demo/admin/infolists-showcase` | 1 | 0 | 0 | 0 | 0 | 5 | 3 |
| `/demo/admin/actions-showcase` | 1 | 0 | 0 | 0 | 0 | 5 | 2 |
| `/demo/admin/notifications-showcase` | 1 | 0 | 0 | 0 | 0 | 2 | 2 |
| `/demo/admin/states-showcase` | 1 | 0 | 0 | 0 | 0 | 3 | 2 |
| `/demo/admin/anonymous-upload` | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| `/demo/admin/profile` | 0 | 0 | 0 | 0 | 0 | 0 | 4 |
| `/demo/admin/addresses` | 1 | 1 | 0 | 1 | 3 | 0 | 11 |
| `/demo/admin/categories` | 1 | 1 | 0 | 1 | 3 | 0 | 11 |
| `/demo/admin/customers` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/discounts` | 1 | 1 | 0 | 1 | 1 | 0 | 12 |
| `/demo/admin/inventories` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/notes` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/order-status-histories` | 1 | 1 | 0 | 1 | 10 | 0 | 21 |
| `/demo/admin/orders` | 1 | 1 | 0 | 1 | 2 | 0 | 10 |
| `/demo/admin/payments` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/product-variants` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/products` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/refunds` | 1 | 1 | 0 | 1 | 1 | 0 | 10 |
| `/demo/admin/reviews` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/shipments` | 1 | 1 | 0 | 1 | 1 | 0 | 10 |
| `/demo/admin/suppliers` | 1 | 1 | 0 | 1 | 1 | 0 | 10 |
| `/demo/admin/tags` | 1 | 1 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/products/create` | 1 | 1 | 0 | 0 | 0 | 0 | 10 |
| `/demo/admin/products/2` | 1 | 1 | 0 | 0 | 0 | 1 | 2 |
| `/demo/admin/products/2/edit` | 1 | 1 | 1 | 0 | 1 | 0 | 14 |
| `/demo/admin/orders/create` | 1 | 1 | 0 | 0 | 0 | 0 | 15 |
| `/demo/admin/orders/1` | 1 | 2 | 0 | 0 | 0 | 0 | 2 |
| `/demo/admin/orders/1/edit` | 1 | 2 | 0 | 0 | 0 | 0 | 15 |
| `/demo/admin/orders/1/order-items` | 1 | 3 | 0 | 1 | 2 | 0 | 11 |
| `/demo/admin/orders/1/order-items/create` | 1 | 3 | 0 | 0 | 0 | 0 | 10 |

This covers all configured static showcase pages, the dashboard/showcase landing pages, profile, every standalone resource index, nested order-items list, GET create routes for Product and Order, view/edit for Product record 2 and Order record 1, and nested order-item create. No forms were submitted and no seeded records were modified. Not visited: per-record create/view/edit siblings for Address, Category, Customer, Discount, Inventory, Note, Order Status History, Payment, Product Variant, Refund, Review, Shipment, Supplier, and Tag; nested order-item record view/edit; other record IDs; and routes outside the 84 configured admin routes.

### Concrete source mapping for unvisited resource CRUD siblings

The 84-route list includes data-specific CRUD URLs; it is not a count of 84 distinct page templates. The unvisited per-record siblings use the same resource page shells as the visited Product and Order representatives:

- Resource route declarations are in each `demo/app/Filament/Resources/*/*Resource.php::getPages()`. For example, `Addresses/AddressResource.php::getPages()` maps its index/create/view/edit page names to `Pages/ListAddresses.php`, `CreateAddress.php`, `ViewAddress.php`, and `EditAddress.php`.
- The thin page classes extend Filament's shared `ListRecords`, `CreateRecord`, `ViewRecord`, and `EditRecord` shells and associate the resource. Concrete examples: `Addresses/Pages/CreateAddress.php`, `EditAddress.php`, and `ViewAddress.php`. The representative Product and Order routes exercised those same base shells.
- Table schemas are delegated by resource table adapters to `demo/app/Filament/Support/EntityResourceTable.php::configure()` (columns, filters, actions); form adapters delegate to `EntityResourceForm.php::configure()`; infolist adapters delegate to `EntityResourceInfolist.php::configure()`. Repository search found these shared configuration calls across resource table/schema adapters (69 matching references overall). Entity-specific fields/content differ, but the rendered Filament table/form/infolist element families use those shared builders.
- The nested order-item resource uses the same `EntityResourceTable`, `EntityResourceForm`, and `EntityResourceInfolist` adapters under `demo/app/Filament/Resources/Orders/Resources/OrderItems/`; its collection and create paths were visited. Order's infolist adds order-specific entries after shared configuration (`Orders/Schemas/OrderInfolist.php`).

This mapping justifies exercising representative markup families, not claiming every row ID, content variant, or parameterized URL was visited. Additional record IDs, all per-resource CRUD siblings for the 14 listed resource families, and nested order-item record view/edit remain untested.

The real-pointer regression is unconditional on authenticated tables-showcase: it requires a visible Filter button, opens its panel with Inspector off, enables Inspector, then inspects the table title, filter trigger, and open filter select. It verifies the panel remains expanded, select value and row count remain unchanged, and Apply filters is suppressed. It also checks a product resource breadcrumb link is inert while Inspector is on and navigates normally while off. The classless-leaf test marks and checks the exact selected node, empty raw selector, and “No safe selector was detected.”

## Verification evidence

Commands were run in these directories against baseline `d60e0b6` plus the current working-tree changes. Evidence pertains to these relevant files; current SHA-256 values are listed below.

| Command | Working directory | Result |
| --- | --- | --- |
| `COMPOSE_E2E=1 npx playwright test e2e/ftb-007-inspector.spec.ts --grep 'mapped product input|keeps global search input'` | repository root | **Passed:** 2 real authenticated pointer regressions; selected evidence and resulting editor/raw targets checked. |
| `npm run test:unit -- --run src/__tests__/inspector-protocol.spec.ts src/__tests__/raw-overrides.spec.ts` | `builder/` | **Passed:** 2 files, 19 tests. Covers candidate-provenance matching, global-search/product isolation, unknown-child/ancestor rejection, scoped raw target, and classless unavailability. |
| `npm run type-check` | `builder/` | **Passed:** `vue-tsc --build`. |
| `npm run build` | `builder/` | **Passed:** Vite production build (219 modules). |
| Earlier settled full affected Playwright suite before this narrow matcher repair | repository root | **Previously passed 20/20.** The two Product/global-search mapping tests were invalidated and rerun separately above. The authenticated route audit and other 18 cases were unchanged and were not repeated as requested. |
| `php artisan route:list --path=admin` | `demo/` | **Passed:** inventory lists 84 configured admin routes; the audit visited 34 GET URLs. |
| `git diff --check` | repository root | **Passed:** no whitespace errors. |
| `npm run test:unit` (earlier run; not rerun for this handoff) | `builder/` | **Known unrelated failure:** 122 files / 534 tests passed; one CSS entrypoint test expects 9 imports while pre-existing dirty `builder/src/app.css` includes `dashboard-first-editor.css`. Neither file was changed or rerun. |

The first real-pointer regression exposed a genuine Filament `mousedown` toggle that bypassed click suppression. The subsequent compound-selector repairs are captured above. After the latest scope correction, the two affected pointer tests passed, focused unit tests passed 19/19, and type-check/build passed. The previously successful 20-test suite and route audit are reused only for unaffected cases; mapping tests were rerun. The full unit suite's unrelated CSS import failure remains as previously evidenced and was not rerun. The source-text PHP assertion in the dirty FilamentPanelTest was restored to baseline and is not claimed as passing; bridge-origin/source/version security coverage remains from the prior successful bridge suite.

## Relevant current file hashes

```text
8efe97acf563419c109157a7e6f1dc3340b42d3f04aa6ba56806abc0ce944160  builder/src/models/inspector-target-evidence.model.ts
0889752eead4f602a22537d7a61d5d780dd850a2f949049891ba2e51d49a7399  builder/src/utils/inspector-protocol.ts
0a754b9b698a668aec156e444f19740e6b5469b3c79db090a63dc9812120f3e3  builder/src/utils/inspector-target-matching.ts
cd7df4922b7aebb1cdd5455760691805683070d8d4c4843001380b9f4384fb00  builder/src/utils/raw-override-validation.ts
ee2f4f3592c07b09a963b57893fee23014230a9b9e5341b39eb99bd8376ed4dd  builder/src/__tests__/inspector-protocol.spec.ts
a9076c57f7e6ffae91a9853642065928bbf7266ff56e7557d2dcc96b05542619  builder/src/__tests__/raw-overrides.spec.ts
e125c8b3952f0e3c6115d9e8da76d9ff14c77a5260d0de73c67b524d119abd0f  demo/resources/views/filament/preview-bridge.blade.php
07e839d5f03daf7d322c277cf12d61483f779a8e052ff28ab4f4d55cfcf60784  demo/tests/Feature/FilamentPanelTest.php
5c75b4f5b2118d2e3ba8099db6e34f826b928d28d8fdd95102dd2f1dfa22812c  e2e/ftb-007-inspector.spec.ts
3bdd2ada665704a307cca015658fda714cb5c381a8fb454b4b66e62d43be998c  e2e/ftb-007-bridge.spec.ts
e75803e6c58238af3b94b150453b98bc8feb7aa4b6257ee6234c51b9490af5ca  e2e/ftb-008-raw-inspector.spec.ts
```

## Review handoff

Ready for independent review. The only known check issue is the unrelated pre-existing full-unit CSS entrypoint expectation mismatch. Some parameterized resource siblings and other record IDs were intentionally not visited; representative create/view/edit paths and all resource list families were audited. No commit was created.
