# Demo showcase capability inventory

This inventory describes the planned capability contract, not implemented MCP
tools. A status of `not available` is intentional: do not imply current MCP
support. Each row records capability, surface, operation class, authorization,
confirmation, and MCP tool/status.

The official demo is research inspiration only; the showcase has independent
identity, branding, content, and presentation. Showcase/dashboard reads remain
read-only. Forced visual states are presentation-only, in-memory controls and
must never alter demo records.

Showcase navigation, global search, breadcrumbs, tabs, profile/auth controls,
and the controlled tenant presentation are read-only or presentation-only
surfaces. No tenant persistence or tenant membership is used by these surfaces.
No MCP mutation tool is needed for read-only or presentation-only surfaces;
there is no domain mutation to expose or authorize.

| Capability | Surface | Operation | Authorization | Confirmation | MCP tool/status |
| --- | --- | --- | --- | --- | --- |
| `phase-1` | `DemoShowcaseDashboard`, `ResourceIconSet`, `RepresentativeBadgeSet` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.stats` | `CommerceStatsOverviewWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.revenue-orders-chart` | `RevenueOrdersChartWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.recent-orders` | `RecentOrdersWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.low-stock` | `LowStockWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `showcase.forms` | `ShowcaseFormsPage`: `ProductEditorForm`, `CustomerContactForm`, `OrderStatusForm` | read-only | Public showcase policy; fixture-only values | None | No MCP tool; not available |
| `showcase.anonymous-uploads` | `/demo/admin/anonymous-upload` (`AnonymousUploadShowcase`) | mutation | Public allowlisted demo fixture; `TemporaryUploadStorage` enforces MIME, extension, per-session quota, global quota, purge, and private storage | No MCP mutation tool; UI-only file mutation remains bounded by the existing server-side storage boundary | No MCP mutation tool; not available |
| `showcase.anonymous-uploads.mcp-preview` | Laravel Boost `showcase_anonymous_upload_preview` | read-only | Authenticated MCP caller identity is the owner; owner overrides and anonymous MCP calls are rejected; preview delegates to `TemporaryUploadStorage` | Preview returns an opaque five-minute confirmation token; confirmed commit is explicitly refused because binary mutation is not available | No MCP tool for binary mutation; metadata preview available; not available for mutation |
| `showcase.tables` | `/demo/admin/tables-showcase` (`TablesShowcase`): `ProductsTableFixture`, `OrdersTableFixture`, `InventoryTableFixture` | read-only | Public panel visibility applies to public fixture/read surfaces; existing panel authorization governs any protected resource | None | No MCP read tool; not available |
| `showcase.tables.read-commerce` | Planned commerce table record view | read-only | Public panel visibility applies to public reads; existing panel authorization governs protected reads; no tenant scope is implied by this inventory | None | No MCP read tool; not available |
| `showcase.tables.change-commerce-status` | Planned status-change action sample | mutation | If enabled, existing panel authorization and server-side validation must use the applicable resource/domain service and model path | Explicit confirmation before applying status change | No MCP mutation tool; not available |
| `commerce.orders.mark-fulfilled` | `Orders\Pages\ViewOrder`: `markFulfilled` | mutation | Authenticated demo panel user; `OrderWorkflow` revalidates authorization and permits only paid → shipped (or safe shipped retry) | Explicit confirmation before applying status transition | No MCP mutation tool; not available |
| `showcase.infolists` | `ShowcaseInfolistsPage`: `OrderDetailsInfolist`, `CustomerProfileInfolist`, `ProductDetailsInfolist` | read-only | Public showcase policy; seeded records only | None | No MCP tool; not available |
| `showcase.actions` | `ShowcaseActionsPage`: `OrderActionsFixture`, `ProductActionsFixture`, `DeleteProductConfirmationModal`, `OrderStatusModal` | presentation-only | No domain mutation; simulated/in-memory fixture only | No confirmation for visual simulation | No MCP mutation tool; not available |
| `showcase.notifications` | `OrderStatusNotification`, `InventoryWarningNotification`, `ActionFailureNotification` | presentation-only | No domain mutation; fixed message payloads | None | No MCP mutation tool; not available |
| `showcase.navigation` | `ShowcaseIndexPage`, `ShowcaseSidebarNavigation`, `GlobalSearchSurface`, `ProfileMenuSurface`, `LoginSurface`, `TenantSwitcherSurface` | presentation-only | Existing panel authentication/authorization governs real profile and tenant resources; showcase-only states are synthetic | None | No MCP mutation tool; not available |
| `showcase.navigation.authenticated-controls` | Global search, breadcrumbs, tabs, profile menu, login/authentication controls | read-only | Existing panel authentication/authorization; public Showcase index remains explicitly allowlisted | None | No MCP read tool; not available |
| `showcase.navigation.tenant-presentation` | Controlled tenant presentation on `ShowcasePage` | presentation-only | No domain tenant model, membership, session, or persistence is used | None | No MCP mutation tool; not available |
| `showcase.states` | `ShowcaseStateControls` and named state surfaces | presentation-only | No domain data access or mutation | None | No MCP mutation tool; not available |
| `panel.icons` | `IconPackConfiguration`, `SemanticResourceIconOverrides` | mutation | Local builder theme state; no server-side panel data permission | No server commit; explicit user action for local edit/export | No MCP tool; not available |
| `panel.branding` | `PanelBrandingSettings`, PanelProvider/runtime configuration | mutation | Local builder theme state; deployment/runtime configuration remains under project-owner control | Explicit user action before export/application; controlled reload where required | No MCP tool; not available |

## Commerce operation boundary

Read/view operations do not write. If the demo includes real commerce status
actions, mutations must use existing server-side validation, the existing panel
authorization, and the established domain service/model path. Show a preview of
the intended status transition, require explicit confirmation, and revalidate
authorization and current record state when applying it. Deletion, uploads, or
other operations outside this showcase contract are not added here. The
inventory does not grant AI callers extra permissions or claim MCP access where
no purpose-built tool exists.

## Upload MCP evidence boundary

`showcase_anonymous_upload_preview` accepts only a client filename, declared MIME
type, and size. It derives ownership from the authenticated MCP request and
rejects owner overrides, paths, filesystem references, base64, and content
fields. The preview calls the same `TemporaryUploadStorage` validation and
quota decision boundary used by the UI, but performs no writes or cleanup.

The installed Laravel Boost v2.10.3 / Laravel MCP v1.0.1 contract exposes JSON
object arguments and has no verified safe binary upload/resource-input contract.
Consequently, a confirmed commit returns `unsupported_upload_input`; no MCP
mutation coverage is claimed. A future binary transport must be added only if
it can preserve the same authenticated owner, validation, quota, and storage
boundary.
