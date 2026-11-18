# Filament 5.9 Component and Variant Coverage Design

Date: 2026-11-18

## Problem

The builder can currently theme a small curated set of Filament surfaces. The registry covers foundations, forms, infolists, tables, actions, modals, notifications, navigation, and three dashboard widget roots, but most entries are selector-only surfaces with no controls or variant metadata. The visible symptom is charts: a user can change a chart container background but cannot change the colors of the lines, the grid, the legend, the tooltip, or the chart type (line, bar, pie, and so on).

The underlying gap is broader than charts:

- Unique Filament components and their sub-parts are not inventoried consistently.
- Variant metadata exists in the state model (`ThemeOverride.variantId`), but almost no registry entry declares usable variants and the editor has no generic variant selector.
- Some Filament appearance is not CSS-addressable at all because it is painted onto a `<canvas>` or chosen in PHP (`getType()`). Those need an explicit renderer/runtime contract instead of being forced into CSS controls.

This spec defines the inventory, the coverage status vocabulary, the variant model, and the implementation slices. The chart-specific renderer and export contract is in [chart-widget-theming-design.md](./2026-11-18-chart-widget-theming-design.md).

## Goals

- Inventory every first-party Filament 5.9 component family that the demo can render, including unique sub-parts and variant axes.
- Make coverage status explicit so a selector-only surface is never mistaken for a fully controllable component.
- Define one variant model that works for CSS-addressable variants and renderer-backed variants.
- Make charts first-class: surface colors, geometry, series colors, and chart types.
- Keep preview and export honest: CSS for CSS-addressable appearance; generated PHP/config for canvas datasets and chart types.
- Preserve light/dark independence, inheritance, reset, undo/redo, import/export, and Inspector behavior.

## Non-goals

- Pixel-accurate hit-testing of individual Chart.js elements inside the canvas in v1. Canvas sub-elements are exposed as a structured target list instead.
- Inventing selectors for markup that Filament does not emit. Every selector and property in this spec is verified against the vendored Filament 5.9 package.
- Theming third-party Filament plugins.
- Replacing Filament's chart rendering with a DOM/SVG chart library.
- Arbitrary JavaScript in the preview bridge or exports.

## Baseline evidence

All evidence below is from the vendored demo application, `filament/filament ^5.9`, not from memory or blog posts.

- Chart roots and sentinel elements: `demo/vendor/filament/widgets/resources/views/chart-widget.blade.php`.
- Chart runtime behavior and custom properties: `demo/vendor/filament/widgets/resources/js/components/chart.js`.
- Chart styles: `demo/vendor/filament/widgets/resources/css/chart-widget.css`.
- Stats overview and sparkline: `demo/vendor/filament/widgets/resources/css/stats-overview-widget.css`, `.../js/components/stats-overview/stat/chart.js`, `.../views/stats-overview-widget/stat.blade.php`.
- Official 5.x behavior confirms: `getType()` selects the Chart.js chart type; multiple series colors come from `getData()` dataset `backgroundColor`/`borderColor`; `getOptions()` configures per-chart behavior; `--chart-*` and `--stat-chart-*` custom properties plus sentinel elements style CSS-addressable canvas appearance.
- Existing builder seams: `builder/src/registry/`, `builder/src/models/theme.model.ts`, `builder/src/composables/use-preview-theme.ts`, `demo/resources/views/filament/preview-bridge.blade.php`, `builder/src/utils/vanilla-css-export*.ts`.

## Coverage status vocabulary

Each inventory row and registry entry must use one of:

| Status | Meaning |
| --- | --- |
| `absent` | Component exists in Filament 5.9 but has no registry entry. |
| `surface` | Selector registered; no controls, variants, or states. Inspector can select it. |
| `css-controlled` | Controls exist and map to verified CSS declarations or custom properties. |
| `renderer-controlled` | Controls exist but require a renderer/runtime projection (for example Chart.js datasets or chart type). Not achievable with CSS alone. |
| `partial` | Some sub-parts or variants are covered and others are explicitly listed as missing. |

## Inventory

The inventory is organized by Filament package. "Variant axes" lists user-visible alternatives that must be selectable in the registry/editor. "States" lists interactive/pseudo states that are real for that component.

### Widgets and charts

| Coverage ID | Root(s) | Variant axes | States | Mechanism | Current |
| --- | --- | --- | --- | --- | --- |
| `widget.custom` | `.fi-wi` | custom view | default | CSS | `surface` (missing as its own entry) |
| `dashboard.chart` | `.fi-wi-chart`, `.fi-wi-chart-frame`, `.fi-wi-chart-canvas-ctn` | chart type: line, bar, pie, doughnut, polarArea, radar, scatter, bubble; collapsible; has filter select; has filter schema; empty | default, empty, collapsed, filtered, dark | CSS + renderer | `surface` |
| `dashboard.chart.series` | canvas dataset (not DOM) | dataset 1..N; by index; optional label match | default, hover | renderer | `absent` |
| `dashboard.chart.axes` | canvas | x, y, secondary y (`yAxisID`), radial (`r`) | default | renderer | `absent` |
| `dashboard.chart.legend` | canvas | position (Chart.js option), labels | default | renderer + CSS swatch | `absent` |
| `dashboard.chart.tooltip` | canvas | enabled/disabled, border on/off | hover | CSS sentinel + CSS vars | `absent` |
| `dashboard.stats` | `.fi-wi-stats-overview` | columns, heading/description | default | CSS | `surface` |
| `dashboard.stats.stat` | `.fi-wi-stats-overview-stat` | color, icon, description icon position, placeholder, chart sparkline | default | CSS | `surface` |
| `dashboard.stats.sparkline` | `.fi-wi-stats-overview-stat-chart`, sentinels | fill: start/end/origin/stack/none; line tension; border width | default | CSS vars + sentinels | `absent` |
| `dashboard.table` | `.fi-wi-table` | table variants | default | CSS | `surface` |
| `account.widget` | `.fi-account-widget` | default | default | CSS | `absent` |
| `filament-info.widget` | `.fi-filament-info-widget` | default | default | CSS | `absent` |

Chart-specific acceptance and delivery are in the chart spec. The remaining widget rows are mostly CSS surfaces and can ship in the non-chart coverage slice.

### Schemas and layout

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `form.section` | `.fi-section`, `.fi-sc-section` | contained / not contained, aside, compact, secondary, collapsible, divided, has header, has footer, color | default, collapsed | `css-controlled` (limited) |
| `form.layout.callout` | `.fi-callout` | color, icon present, footer present | default | `surface` |
| `form.layout.empty-state` | `.fi-empty-state` | contained / not contained, compact, color, icon background | default | `surface` |
| `form.layout.fieldset` | `.fi-fieldset` | contained / not contained, label hidden | default | `surface` |
| `form.layout.flex` | `.fi-sc-flex` | direction, dense, wrap, align/justify, gap, responsive from-* | default | `surface` |
| `form.layout.form` | `.fi-sc-form` | dense | default | `surface` |
| `form.layout.fused-group` | `.fi-sc-fused-group` | columns, invalid | default, invalid | `surface` |
| `form.layout.grid` | `.fi-grid`, `.fi-grid-ctn` | columns, direction, order/start, responsive | default | `surface` |
| `form.layout.icon` | `.fi-sc-icon` | size, color | default | `surface` |
| `form.layout.image` | `.fi-sc-image` | size, alignment, circular | default | `surface` |
| `form.layout.text` | `.fi-sc-text` | size, weight, color, badge, copyable | default | `surface` |
| `form.layout.unordered-list` | `.fi-sc-unordered-list` | size, bulleted | default | `surface` |
| `form.layout.tabs` | `.fi-tabs`, `.fi-tabs-item` | contained, vertical | default, active | `surface` |
| `form.layout.wizard` | `.fi-sc-wizard` | contained, vertical, completed | default, active, completed | `surface` |
| `form.layout.actions` | `.fi-sc-actions` | alignment, vertical alignment, sticky, full width | default | `surface` |

### Forms

All roots below are verified in `demo/vendor/filament/forms/resources/css/components/`.

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `form.control.text` | `.fi-fo-text-input`, `.fi-input` | revealable, inline prefix/suffix | default, focus, disabled, invalid | `surface` |
| `form.control.textarea` | `.fi-fo-textarea` | autosizable, inline label | default, focus, disabled, invalid | `surface` |
| `form.control.select` | `.fi-fo-select`, `.fi-select-input` | inline prefix/suffix, inline label | default, focus, disabled, invalid | `surface` |
| `form.control.checkbox` | `.fi-checkbox-input` | default | default, focus, disabled, invalid | `surface` |
| `form.control.radio` | `.fi-fo-radio`, `.fi-radio-input` | inline | default, focus, disabled, invalid | `surface` |
| `form.control.toggle` | `.fi-fo-toggle`, `.fi-toggle` | on/off | default, on, off, disabled | `surface` |
| `form.control.toggle-buttons` | `.fi-fo-toggle-buttons`, `.fi-btn-group` | grouped, inline, full width | default, active, disabled | `surface` |
| `form.control.checkbox-list` | `.fi-fo-checkbox-list` | grid direction, searchable | default, selected, disabled | `surface` |
| `form.control.slider` | `.fi-fo-slider` | pips, tooltips, vertical | default, focus, disabled | `surface` |
| `form.control.color-picker` | `.fi-fo-color-picker` | empty, panel open | default, focus, open | `surface` |
| `form.control.date` | `.fi-fo-date-time-picker` | calendar, time, month select, year input | default, selected, today, focus, disabled | `surface` |
| `form.control.file-upload` | `.fi-fo-file-upload` | avatar/circular, image editor, crop-only, multiple, reorderable, alignment | default, focus, disabled, invalid | `surface` |
| `form.control.key-value` | `.fi-fo-key-value` | inline label, has action | default, focus, disabled | `surface` |
| `form.control.repeater` | `.fi-fo-repeater` | table layout, compact, collapsible, reorderable, alignment | default, collapsed, selected | `surface` |
| `form.control.builder` | `.fi-fo-builder` | block picker, collapsible, preview, add-between, not contained, alignment | default, collapsed | `surface` |
| `form.control.tags-input` | `.fi-fo-tags-input` | reorderable | default, focus, disabled | `surface` |
| `form.control.code-editor` | `.fi-fo-code-editor` | editor theme/focus | default, focus, active line, folded | `surface` |
| `form.control.markdown-editor` | `.fi-fo-markdown-editor` | toolbar, modes | default, focus, disabled | `surface` |
| `form.control.rich-editor` | `.fi-fo-rich-editor` | toolbar with labels, resizable | default, focus, active, disabled | `surface` |
| `form.control.modal-table-select` | `.fi-fo-modal-table-select` | multiple, badges | default, selected, open | `surface` |
| `form.control.one-time-code` | `.fi-one-time-code-input-ctn` | single/multiple groups | default, focus, invalid | `surface` |
| `form.field` | `.fi-fo-field` | inline label, hint, help, error, required mark | default, focus, invalid | `surface` |

### Infolists

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `infolist.entry.text` | `.fi-in-text` | size, weight, color, badge, bulleted, numeric, copyable, placeholder | default | `surface` |
| `infolist.entry.icon` | `.fi-in-icon` | size, color | default | `surface` |
| `infolist.entry.image` | `.fi-in-image` | circular, stacked, size | default | `surface` |
| `infolist.entry.color` | `.fi-in-color` | copyable | default | `surface` |
| `infolist.entry.code` | `.fi-in-code` | default | default | `absent` |
| `infolist.entry.key-value` | `.fi-in-key-value` | inline label | default | `surface` |
| `infolist.entry.repeatable` | `.fi-in-repeatable`, `.fi-in-table-repeatable` | table repeatable, contained | default | `surface` |
| `infolist.layout.flex` | `.fi-sc-flex` | direction, dense, wrap, align/justify | default | `surface` |

### Tables

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `table.container` | `.fi-ta`, `.fi-ta-ctn` | filters above/below content, header adaptive actions, width, loading | default, loading | `surface` |
| `table.header` | `.fi-ta-header` | grouped | default | `surface` |
| `table.header-cell` | `.fi-ta-header-cell` | sortable/sorted, grouped, wrap, alignment | default, sorted, hover | `surface` |
| `table.row` | `.fi-ta-row` | selected, clickable, striped, collapsible, group header | default, selected, hover, collapsed | `absent` |
| `table.cell` | `.fi-ta-cell` | selection, individual search, summary, group selection, alignment, vertical alignment, wrap | default | `absent` |
| `table.cell.text` | `.fi-ta-text` | size, weight, color, badge, bulleted, numeric, copyable, wrap, alignment | default | `surface` |
| `table.cell.image` | `.fi-ta-image` | circular, stacked, overlap 1-7, size | default | `surface` |
| `table.cell.icon` | `.fi-ta-icon` | color, line breaks | default | `absent` |
| `table.cell.color` | `.fi-ta-color` | copyable, alignment | default | `absent` |
| `table.cell.checkbox` | `.fi-ta-checkbox` | alignment | default, checked, disabled | `absent` |
| `table.cell.toggle` | `.fi-ta-toggle` | alignment | default, on, off | `absent` |
| `table.cell.select` | `.fi-ta-select` | default | default, focus | `absent` |
| `table.cell.text-input` | `.fi-ta-text-input` | default | default, focus | `absent` |
| `table.column.layout.split` | `.fi-ta-split` | responsive from-* | default | `absent` |
| `table.column.layout.stack` | `.fi-ta-stack` | alignment, gap | default | `absent` |
| `table.column.layout.grid` | `.fi-ta-grid` | columns, gap, responsive | default | `absent` |
| `table.column.layout.panel` | `.fi-ta-panel` | default | default | `absent` |
| `table.summary.text` | `.fi-ta-summary-row`, `.fi-ta-summary-header-row` | default | default | `absent` |
| `table.summary.icon-count` | summary icon cell | color | default | `absent` |
| `table.summary.range` | summary range cell | default | default | `absent` |
| `table.summary.values` | summary values cell | bulleted | default | `absent` |
| `table.pagination` | `.fi-pagination` | compact | active, disabled | `absent` |
| `table.column-manager` | `.fi-ta-col-manager` | default | open | `absent` |
| `table.empty-state` | `.fi-ta-empty-state` | contained/compact | default | `absent` |
| `table.grouping` | `.fi-ta-group-header-row` | default | default | `absent` |
| `table.reordering` | `.fi-ta-reordering` | default | dragging | `absent` |
| `table.stacked-mobile` | `.fi-ta-table-stacked-on-mobile` | default | default | `absent` |

### Actions

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `action.button` | `.fi-btn`, `.fi-ac` | color: primary, danger, success, warning, info, gray, neutral; outlined; size xs-xl; icon-only; labeled-from breakpoints; grouped; link | default, hover, focus, disabled, processing | `partial` |
| `action.link` | `.fi-link` | color, size, weight | default, hover, disabled | `absent` |
| `action.icon-button` | `.fi-icon-btn` | color, size | default, hover, disabled | `absent` |
| `action.badge` | `.fi-badge` | color, size, icon, delete | default, hover, disabled | `absent` |
| `action.group` | `.fi-ac`, `.fi-btn-group` | alignment, wrapped, sticky, vertical alignment | default | `surface` |
| `action.dropdown` | `.fi-dropdown`, `.fi-dropdown-panel` | width, scrollable, placement | open, closed | `absent` |
| `action.modal` | `.fi-modal-*` | width xs-7xl/container, slide-over, sticky header/footer, close button, alignment | open, closing | `partial` |
| `action.confirmation` | modal variant | default | open | `partial` |
| `action.form` | modal + form | default | open, submitting | `absent` |

### Notifications

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `notification.container` | `.fi-no` | position: top/bottom-start/center/end | visible | `surface` |
| `notification.item` | `.fi-no-notification` | success, danger, warning, info; icon; actions; date | visible, persistent, transient | `surface` |
| `notification.database` | `.fi-no-database` | default | unread, read | `absent` |
| `notification.inline` | inline notification root | default | default | `absent` |

### Support primitives

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `support.avatar` | `.fi-avatar` | circular, size | default | `absent` |
| `support.badge` | `.fi-badge` | color, size, icon, delete | default, disabled | `partial` |
| `support.breadcrumbs` | `.fi-breadcrumbs` | ltr/rtl | default | `absent` |
| `support.button` | `.fi-btn` | see action.button | see action.button | `partial` |
| `support.callout` | `.fi-callout` | color, icon, footer | default | `surface` |
| `support.dropdown` | `.fi-dropdown-*` | width, scrollable | open, closed | `absent` |
| `support.empty-state` | `.fi-empty-state` | contained, compact, color | default | `surface` |
| `support.fieldset` | `.fi-fieldset` | contained, label hidden | default | `surface` |
| `support.grid` | `.fi-grid` | columns, direction, order/start, responsive | default | `surface` |
| `support.icon-button` | `.fi-icon-btn` | color, size | default, hover, disabled | `absent` |
| `support.icon` | `.fi-icon` | size xs-2xl, color | default | `absent` |
| `support.input` | `.fi-input-wrp`, `.fi-input` | prefix/suffix, inline, invalid | default, focus, disabled, invalid | `partial` |
| `support.link` | `.fi-link` | color, size, weight | default, hover, disabled | `absent` |
| `support.loading-indicator` | `.fi-loading-indicator` | default | loading | `absent` |
| `support.loading-section` | `.fi-loading-section` | default | loading | `absent` |
| `support.modal` | `.fi-modal-*` | see action.modal | open | `partial` |
| `support.pagination` | `.fi-pagination` | compact | active, disabled | `absent` |
| `support.section` | `.fi-section` | see form.section | default, collapsed | `partial` |
| `support.tabs` | `.fi-tabs` | contained, vertical | active | `surface` |
| `support.toggle` | `.fi-toggle` | on/off | on, off, disabled | `partial` |
| `support.tooltip` | `.fi-tooltip` | default | visible | `absent` |

### Panel shell, pages, and authentication

| Coverage ID | Root(s) | Variant axes | States | Current |
| --- | --- | --- | --- | --- |
| `panel.body` | `.fi-body` | has topbar, has top navigation, sidebar collapsible/fully-collapsible | dark, light | `absent` |
| `navigation.sidebar` | `.fi-sidebar`, `.fi-sidebar-item`, `.fi-sidebar-group` | grouped, collapsible, active-child, badge | active, hover, collapsed, open | `surface` |
| `navigation.sidebar-badge` | `.fi-sidebar-item-badge-ctn` | color | default | `surface` |
| `navigation.topbar` | `.fi-topbar`, `.fi-topbar-item` | groups, start/end | active, hover | `surface` |
| `navigation.user-menu` | `.fi-user-menu` | default | open | `absent` |
| `navigation.tenant-menu` | `.fi-tenant-menu` | default | open | `surface` |
| `navigation.theme-switcher` | `.fi-theme-switcher` | light, dark, system | active | `absent` |
| `navigation.global-search` | `.fi-global-search*` | results, groups, detail, actions, no-results | open, loading, empty | `surface` |
| `navigation.login` | `.fi-simple-layout`, `.fi-simple-main` | default | default, invalid | `surface` |
| `navigation.auth.simple` | `.fi-simple-layout` | login, register, password reset, email verification, edit profile | default | `partial` |
| `page.header` | `.fi-header` | heading, subheading, breadcrumbs, actions | default | `absent` |
| `page.sub-navigation` | `.fi-page-sub-navigation-*` | sidebar, tabs, dropdown | active | `absent` |
| `page.resource` | `.fi-page`, `.fi-main` | list, create, edit, view, manage-related | default | `absent` |
| `page.relation-manager` | `.fi-resource-relation-manager` | default | default | `absent` |

## Variant model

The existing `ThemeOverride` already carries `componentId`, `variantId`, and `stateId`, and inheritance resolves Global → Component → Variant → State. The missing pieces are registry metadata and editor affordances.

### Registry extensions

Add these concepts to registry entries and controls. Names are descriptive; final TypeScript names are an implementation decision.

- `coverageStatus`: the vocabulary above.
- `variantAxis`: `color | size | layout | chart-type | state | custom` and an ordered list of variant IDs with human labels.
- `controlKind`:
  - `css` — property/value declaration on the root or sub-part.
  - `css-variable` — custom property such as `--chart-line-tension`.
  - `renderer` — projected into a runtime object (Chart.js dataset/options).
  - `runtime-config` — emitted as generated PHP/config guidance rather than live CSS.
- `subParts`: stable IDs with their own selectors (for example legend, tooltip, grid, label, header, footer).
- `projection`: `preview-css | preview-renderer | export-css | export-php | export-js`.
- `supportLevel`: `verified` (tested against the vendored version) or `unverified` (must not be exposed as a control).

### Editor contract

- When an entry declares variants, the component editor shows the variant list. Selecting a variant scopes edits to that `variantId`.
- A variant control defaults to Inherit. Resetting removes the override and falls back to the component/global value.
- Light and dark values remain independent for every variant and sub-part.
- A renderer control is visibly labeled as requiring generated integration and never emits CSS.
- Unsupported combinations are rejected at validation time, not silently ignored.

### Inspector contract

- DOM sub-parts remain individually selectable.
- Canvas charts expose a structured target list when the chart surface is selected: `chart.surface`, `chart.series.N`, `chart.axes.x`, `chart.axes.y`, `chart.legend`, `chart.tooltip`. This is deterministic and testable.
- v1 does not hit-test individual pixels. A later slice may add Chart.js element hit-testing, but it must remain an enhancement, not the only path.

## Chart deep dive

The full contract is in [chart-widget-theming-design.md](./2026-11-18-chart-widget-theming-design.md). Key facts this umbrella relies on:

- Filament 5.9 exposes chart surface appearance through sentinel elements (`fi-wi-chart-bg-color`, `-border-color`, `-grid-color`, `-text-color`, `-tooltip-bg-color`, `-tooltip-text-color`, `-tooltip-border-color`) and custom properties (`--chart-border-width`, `--chart-line-tension`, `--chart-point-radius`, `--chart-point-style`, `--chart-bar-border-radius`, `--chart-legend-box-width`, `--chart-legend-border-radius`, `--chart-tooltip-corner-radius`, `--chart-tooltip-border-width`).
- Per-series colors are dataset properties in `getData()`. They cannot be set by CSS.
- Chart type is returned by `getType()`. It cannot be set by CSS.
- Therefore chart controls split into: CSS-surface controls (live CSS), series palette (renderer), and chart-type variant (renderer/runtime-config).

## Implementation slices

| Ticket | Scope |
| --- | --- |
| [FTB-070](../TICKETS.md#ftb-070) | Epic: Filament component and variant coverage. |
| [FTB-071](../TICKETS.md#ftb-071) | Registry inventory + generic variant-aware component editor. |
| [FTB-072](../TICKETS.md#ftb-072) | Chart widget surface, geometry, legend, and tooltip controls. |
| [FTB-073](../TICKETS.md#ftb-073) | Chart series palette + chart-type variants + preview renderer projection. |
| [FTB-074](../TICKETS.md#ftb-074) | Showcase fixtures and Inspector structured chart targets. |
| [FTB-075](../TICKETS.md#ftb-075) | PHP/config chart export and installation guidance; preview/export parity. |

## Testing strategy

- Unit: registry completeness and uniqueness, coverage-status invariants, variant validation, inheritance, mode isolation, control-kind segregation, export serialization.
- PHP: generated chart config/trait behavior, series index/label mapping, chart types, invalid config, light/dark.
- Playwright: real Filament iframe; computed sentinel colors; Chart.js dataset assertions; type switching; variant selection; undo/redo/reset; export download content; no reload/non-GET mutation.
- Visual regression: a chart matrix covering every chart type, stats sparkline, empty/collapsed/filtered states, and both modes.

## Rollout

- No feature flag is required for registry/inventory work.
- Renderer controls should be introduced behind an explicit "requires integration" label, not silently mixed with CSS controls.
- Update `COVERAGE.md`, `TICKETS.md`, and the GitHub project as slices land. Keep status vocabulary consistent.
