# Demo showcase capability inventory

This inventory describes the implemented capability contract. A status of `not available` is intentional: do not imply MCP support. Each row records capability, surface, operation class, authorization, confirmation, and MCP tool/status.

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
| `showcase.anonymous-uploads` | `/demo/admin/anonymous-upload` (`AnonymousUploadShowcase`) | mutation | Public authorization is intentionally allowlisted for this demo fixture; `TemporaryUploadStorage` enforces MIME, extension, per-session quota, global quota, purge, and private storage | Explicit user action; UI-only file mutation remains bounded by the existing server-side storage boundary | No MCP mutation tool; not available |
| `showcase.anonymous-uploads.mcp-preview` | Laravel Boost `showcase_anonymous_upload_preview` | read-only | Authenticated MCP caller identity is the owner; owner overrides and anonymous MCP calls are rejected; preview delegates to `TemporaryUploadStorage` | None | No MCP tool for binary mutation; metadata preview available. A `commit` request requires the opaque five-minute confirmation token, but confirmed binary commit is explicitly refused because safe binary input is unavailable; not available for mutation |
| `showcase.tables` | `/demo/admin/tables-showcase` (`TablesShowcase`): `ProductsTableFixture`, `OrdersTableFixture`, `InventoryTableFixture` | read-only | Public panel visibility applies to public fixture/read surfaces; existing panel authorization governs any protected resource | None | No MCP read tool; not available |
| `showcase.tables.read-commerce` | Planned commerce table record view | read-only | Public panel visibility applies to public reads; existing panel authorization governs protected reads; no tenant scope is implied by this inventory | None | No MCP read tool; not available |
| `showcase.tables.change-commerce-status` | Planned status-change action sample | mutation | If enabled, existing panel authorization and server-side validation must use the applicable resource/domain service and model path | Explicit confirmation before applying status change | No MCP mutation tool; not available |
| `commerce.orders.mark-fulfilled` | `Orders\Pages\ViewOrder`: `markFulfilled` | mutation | Authenticated demo panel user; `OrderWorkflow` revalidates authorization and permits only paid → shipped (or safe shipped retry) | Explicit confirmation before applying status transition | No MCP mutation tool; not available |
| `showcase.infolists` | `ShowcaseInfolistsPage`: `OrderDetailsInfolist`, `CustomerProfileInfolist`, `ProductDetailsInfolist` | read-only | Public showcase policy; seeded records only | None | No MCP tool; not available |
| `showcase.actions` | `ShowcaseActionsPage`: `OrderActionsFixture`, `ProductActionsFixture`, `DeleteProductConfirmationModal`, `OrderStatusModal` | presentation-only | No domain mutation; simulated/in-memory fixture only | No confirmation for visual simulation | No MCP mutation tool; not available |
| `showcase.notifications` | `OrderStatusNotification`, `InventoryWarningNotification`, `ActionFailureNotification` | presentation-only | No domain mutation; fixed message payloads | None | No MCP mutation tool; not available |
| `showcase.navigation` | `ShowcaseIndexPage`, `ShowcaseSidebarNavigation`, `GlobalSearchSurface`, `ProfileMenuSurface`, `LoginSurface`, `TenantSwitcherSurface` | presentation-only | Existing panel authentication/authorization governs real profile and tenant resources; showcase-only states are synthetic | None | No MCP mutation tool; not available |
| `showcase.navigation.authenticated-controls` | Global search, breadcrumbs, tabs, profile menu, login/authentication controls | read-only | Existing panel authentication/authorization; public Showcase index remains explicitly allowlisted | None | No MCP read tool; not available |
| `showcase.navigation.tenant-presentation` | Controlled tenant presentation on `ShowcaseIndexPage` | presentation-only | No domain tenant model, membership, session, or persistence is used | None | No MCP mutation tool; not available |
| `showcase.states` | `/demo/admin/states-showcase` (`ShowcaseStateControls`, `ShowcaseState`) and named state surfaces | presentation-only | Request-scoped allowlisted in-memory state; no domain data access or mutation | None | No MCP mutation tool; not available |
| `panel.icons` | `IconPackConfiguration`, `SemanticResourceIconOverrides`, `IconConfiguration` | mutation | Local builder theme state; deployment/runtime configuration remains under project-owner control | No server commit; explicit user action for local edit/export | No MCP tool; not available |
| `panel.branding` | `PanelBrandingSettings`, PanelProvider/runtime configuration | mutation | Local builder theme state; deployment/runtime configuration remains under project-owner control | Explicit user action before export/application; controlled reload where required | No MCP tool; not available |
| `panel.branding.upload` | `POST /api/branding-assets` | mutation | Public preview upload boundary; project-owner authorization is bounded by `TemporaryUploadStorage`, which enforces image MIME/extension, size, per-session quota, global quota, private storage, and 24-hour purge | Explicit user action; no automatic application to a project | No MCP mutation tool for binary upload; not available |
| `panel.branding.asset-read` | `GET /api/branding-assets/{reference}` | read-only | Public preview asset read uses an opaque validated temporary reference; missing/unsafe references return 404 | None | No MCP read tool; not available |
| `preview.inspector` | Builder Inspector over the read-only/UI-only Filament preview iframe; generic table container/header/body/row, chart canvas-container, parent `.fi-*` surface chooser, and reusable physical table columns 1–32 (including selection/action columns) | read-only | Public preview; builder validates the exact preview origin and iframe source; the bridge returns DOM evidence and owns temporary/persistent outlines only; field-specific/dynamic table classes are filtered, scopes are positional and reusable across matching tables, classless targets remain the exact picked element with parent selection only through the explicit chooser (no silent closest fallback), canvas-drawn text is not an editable DOM target, and highlight groups are capped; theme changes remain on existing validated builder paths | None | No MCP read tool; not available |
| `preview.raw-inspector` | Builder Advanced Inspector raw visual overrides, per-value light/dark links, and minimal vanilla CSS export | mutation | Local builder theme state only; raw selectors, properties, and values are validated by typed allowlists and the iframe bridge revalidates the same contract; linked raw reset clears both modes and the link | Explicit user action in the builder; no server commit | No MCP mutation tool; not available |
| `builder.color-input-methods` | `ColorField`, Custom picker, local Tailwind 4.3.3 palette popover (FTB-051/061), and named user-token references | mutation | Paired browser-local session; local builder theme state and shared color validators remain authoritative; transparent is an explicit color value, not reset/inheritance | UI selection is explicit; MCP applies require paired browser confirmation and apply-time revision revalidation | MCP: `local_theme_token_operation` discovery/read/preview/set/reset through the existing authenticated relay; transparent values use the same typed target validation and history/export path; tested in FTB-061 focused stdio AI-client flow |
| `builder.local-themes.list` | Pinia/local-theme store and `LocalThemeManager` | read-only | Paired browser-local session; no server theme identity | None | MCP: `local_theme_list`; tested in FTB-022 Task 9 |
| `builder.local-themes.export` | Canonical schema-7 export service and local-theme store; schemas 1–6 remain import-compatible and migrate to 7 | read-only | Paired browser-local session; theme membership revalidated | None | MCP: `local_theme_export`; one-shot schema-7 result consumed by owning MCP process; tested in FTB-022 Task 9 |
| `builder.local-themes.import-preview` | Bounded versioned import accepting schema 1–7, migration 1–6 to target schema 7, and preview service | read-only | Paired browser-local session; browser session binding; source and target versions are validated | Browser preview required; preview alone never mutates | MCP: `local_theme_import_preview`; tested in FTB-022 Task 9 |
| `builder.local-themes.import-apply` | Fresh-theme creation through Pinia/local persistence | mutation | Paired browser-local session plus apply-time authorization/revalidation | Explicit browser confirmation; no MCP apply/bypass tool | MCP: browser confirmation bridge, `local_theme_operation_status` (and import-only `local_theme_import_status`); tested in FTB-022 Task 9 |
| `builder.local-themes.pairing` | Browser pairing UI and temporary relay session | mutation | Paired browser-local session; browser owner approves one local MCP process; client label is not identity | Explicit browser pairing approval; browser revoke/disconnect | MCP: `local_theme_pair`, `local_theme_disconnect`; tested in FTB-022 Task 9 |
| `builder.named-tokens-and-mode-links` | Named colors, custom palettes, semantic/raw Inspector targets, and per-value light/dark mode links | mutation | Paired browser-local session; builder theme state is authoritative; the MCP server forwards a bounded intent envelope and the browser runs the same typed target validators/domain actions as the UI | Browser preview plus revision-bound apply grant; no anonymous or direct server mutation | MCP: `local_theme_token_operation`; tested in FTB-058; discovery/read use the canonical export boundary, mutations use `filament-theme-intent.json` through the existing import preview/status flow |

FTB-022 covers only local-theme list/export/import and pairing. It supersedes the
FTB-021 deferral to FTB-048 for those capabilities only; broader FTB-048 work and
all other local-theme operations remain out of scope. The local MCP relay is
disabled by default and only enabled in local/testing environments by explicit
configuration. It does not grant account identity or hosted-client access.

Canonical theme JSON is schema 7. Versioned imports accept schemas 1–7 and migrate
1–6 to 7, preserving legacy values. The existing `local_theme_export` and
`local_theme_import_preview` tools carry the full theme, including named user
tokens and per-value mode links, and import apply still requires browser
confirmation. There are no purpose-built per-token, per-palette, per-link, or
per-lock MCP tools, and no anonymous mutator bypass; do not infer direct MCP
coverage for those UI capabilities. Actual AI-client use of the new capabilities
was not verified.

FTB-051 adds alternate UI input methods, not a new mutation or AI permission.
Opening, searching, changing tabs and dismissing never edit the theme. An explicit
color choice goes through the existing target field's validation, history and
projection path. No MCP tool is introduced or bypassed; this row does not claim
that direct field editing is MCP-capable.

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

`showcase_anonymous_upload_preview` accepts exactly `operation`, `filename`,
`mime_type`, and `size_bytes`, plus the defined confirmation fields
`confirmed` and `confirmation_token`. Its schema uses `operation: preview|commit`
and rejects additional properties. A `preview` request is read-only and needs no
confirmation; only a `commit` request requires the opaque five-minute token. The
handler repeats those checks, including
native argument types, so owner/session overrides, executable-like fields,
paths, filesystem references, base64, and content fields are refused rather
than ignored. Ownership is derived only from the authenticated MCP request.
The preview calls the same `TemporaryUploadStorage` validation and quota
decision boundary used by the UI, but performs no writes or cleanup. It accepts
metadata only: it does not inspect or scan file contents and therefore makes no
content-based executable-file claim.

The installed Laravel Boost v2.10.3 / Laravel MCP v1.0.1 contract exposes JSON
object arguments and has no verified safe binary upload/resource-input contract.
Consequently, an authenticated confirmed commit returns
`unsupported_upload_input`, while an unauthenticated stdio call returns
`authentication_required`; no MCP mutation coverage is claimed. Direct tests
and the actual `mcp:start laravel-boost` stdio transport verify registration,
schema discovery, initialization, tool calling, and owner/session override
refusal. A future binary transport must be added only if it can preserve the
same authenticated owner, validation, quota, and storage boundary.
