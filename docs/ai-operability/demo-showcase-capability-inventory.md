# Demo showcase capability inventory

This inventory describes the planned capability contract, not implemented MCP
tools. A status of `not available` is intentional: do not imply current MCP
support. Each row records capability, surface, operation class, authorization,
confirmation, and MCP tool/status.

The official demo is research inspiration only; the showcase has independent
identity, branding, content, and presentation. Showcase/dashboard reads remain
read-only. Forced visual states are presentation-only, in-memory controls and
must never alter demo records.

| Capability | Surface | Operation | Authorization | Confirmation | MCP tool/status |
| --- | --- | --- | --- | --- | --- |
| `phase-1` | `DemoShowcaseDashboard`, `ResourceIconSet`, `RepresentativeBadgeSet` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.stats` | `CommerceStatsOverviewWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.revenue-orders-chart` | `RevenueOrdersChartWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.recent-orders` | `RecentOrdersWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `dashboard.low-stock` | `LowStockWidget` | read-only | Public dashboard policy; no authenticated identity required | None | No MCP read tool; not available |
| `showcase.forms` | `ShowcaseFormsPage`: `ProductEditorForm`, `CustomerContactForm`, `OrderStatusForm` | read-only | Public showcase policy; fixture-only values | None | No MCP tool; not available |
| `showcase.tables` | `ShowcaseTablesPage`: `ProductsTableFixture`, `OrdersTableFixture`, `InventoryTableFixture` | read-only | Public panel visibility applies to public fixture/read surfaces; existing panel authorization governs any protected resource | None | No MCP read tool; not available |
| `showcase.tables.read-commerce` | Planned commerce table record view | read-only | Public panel visibility applies to public reads; existing panel authorization governs protected reads; no tenant scope is implied by this inventory | None | No MCP read tool; not available |
| `showcase.tables.change-commerce-status` | Planned status-change action sample | mutation | If enabled, existing panel authorization and server-side validation must use the applicable resource/domain service and model path | Explicit confirmation before applying status change | No MCP mutation tool; not available |
| `showcase.infolists` | `ShowcaseInfolistsPage`: `OrderDetailsInfolist`, `CustomerProfileInfolist`, `ProductDetailsInfolist` | read-only | Public showcase policy; seeded records only | None | No MCP tool; not available |
| `showcase.actions` | `ShowcaseActionsPage`: `OrderActionsFixture`, `ProductActionsFixture`, `DeleteProductConfirmationModal`, `OrderStatusModal` | presentation-only | No domain mutation; simulated/in-memory fixture only | No confirmation for visual simulation | No MCP mutation tool; not available |
| `showcase.notifications` | `OrderStatusNotification`, `InventoryWarningNotification`, `ActionFailureNotification` | presentation-only | No domain mutation; fixed message payloads | None | No MCP mutation tool; not available |
| `showcase.navigation` | `ShowcaseIndexPage`, `ShowcaseSidebarNavigation`, `GlobalSearchSurface`, `ProfileMenuSurface`, `LoginSurface`, `TenantSwitcherSurface` | presentation-only | Existing panel authentication/authorization governs real profile and tenant resources; showcase-only states are synthetic | None | No MCP mutation tool; not available |
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
