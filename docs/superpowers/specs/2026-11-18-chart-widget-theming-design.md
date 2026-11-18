# Chart Widget Theming and Variant Design

Date: 2026-11-18

Parent inventory: [Filament 5.9 Component and Variant Coverage Design](./2026-11-18-filament-component-variant-coverage-design.md)

## Problem

Charts are the clearest example of a Filament component whose appearance is not fully CSS-addressable. Filament 5.9 renders charts with Chart.js onto a `<canvas>`. A stylesheet can reach the surrounding surface, grid, text, tooltip, and some geometry through sentinel elements and custom properties, but it cannot reach:

- the color of an individual dataset/series;
- the chart type returned by `getType()`;
- per-scale or per-series options configured in `getOptions()`.

The builder currently registers `.fi-wi-chart` as a selector-only surface. The Inspector can select it and change its background, but the user cannot edit the line colors, the legend, the tooltip, the axes, or choose a line/bar/pie variant. The same gap exists in miniature for the stats overview sparkline.

## Goals

- Expose every chart property Filament 5.9 makes themeable with CSS, in both light and dark mode.
- Expose per-series palette controls for an arbitrary number of datasets.
- Expose chart-type variants (line, bar, pie, doughnut, polar area, radar, scatter, bubble) as selectable variants, with honest preview and export behavior.
- Keep the preview live and deterministic, using the real Filament chart runtime.
- Generate a PHP/config handoff for series colors and chart type, plus the minimal generated mode-sync needed for client-side light/dark switching.
- Preserve inheritance, reset, undo/redo, mode isolation, JSON round-trip, and export parity.

## Non-goals

- Pixel hit-testing of individual Chart.js points, bars, or arcs in v1.
- Theming arbitrary custom Chart.js plugins or data-label plugins.
- Replacing Chart.js or moving charts to SVG/DOM.
- Changing the user's chart data, datasets, labels, or filters.
- Setting per-scale tick colors that Filament does not expose; only the properties listed below are in scope.
- Editing chart options that only make sense per widget (`getOptions()` callbacks, animations, scales display). Those remain the application's responsibility.

## Verified Filament 5.9 surface

### Sentinel elements (colors)

Located inside `.fi-wi-chart-frame`:

| Element | Class | Controls |
| --- | --- | --- |
| Background | `.fi-wi-chart-bg-color` | Dataset fill/background color |
| Border | `.fi-wi-chart-border-color` | Dataset border/line color |
| Grid | `.fi-wi-chart-grid-color` | X/Y grid lines; radial grid for polar area |
| Text | `.fi-wi-chart-text-color` | Axis labels and chart text |
| Tooltip background | `.fi-wi-chart-tooltip-bg-color` | Tooltip background |
| Tooltip text | `.fi-wi-chart-tooltip-text-color` | Tooltip title and body |
| Tooltip border | `.fi-wi-chart-tooltip-border-color` | Tooltip border |

These are styled with an ordinary `color` declaration. Filament reads the computed color in JavaScript. Light/dark mode works through CSS inheritance and the `html.dark` class.

### Custom properties (geometry and tooltip/legend shape)

Set on `.fi-wi-chart` or an ancestor:

| Property | Type | Default | Applies to |
| --- | --- | --- | --- |
| `--chart-border-width` | unitless number | `2` | Dataset outlines |
| `--chart-line-tension` | unitless number | `0` | Line curve |
| `--chart-point-radius` | unitless number | `2` | Line/radar/scatter markers |
| `--chart-point-style` | keyword | `circle` | Marker shape; `none` hides |
| `--chart-bar-border-radius` | unitless number | `2` | Bar corners |
| `--chart-legend-box-width` | unitless number | `12` | Legend swatch width |
| `--chart-legend-border-radius` | unitless number | `2` | Legend swatch corner radius |
| `--chart-tooltip-corner-radius` | unitless number | `4` | Tooltip corners |
| `--chart-tooltip-border-width` | unitless number | `0` | Tooltip border width |

Supported `--chart-point-style` values: `circle`, `cross`, `crossRot`, `dash`, `line`, `rect`, `rectRounded`, `rectRot`, `star`, `triangle`, and `none`.

### Stats sparkline

Set on `.fi-wi-stats-overview-stat` or an ancestor:

| Property | Type | Default | Applies to |
| --- | --- | --- | --- |
| `--stat-chart-border-width` | unitless number | `2` | Sparkline thickness |
| `--stat-chart-line-tension` | unitless number | `0.5` | Sparkline curve |
| `--stat-chart-fill` | keyword | `start` | Fill target: `start`, `end`, `origin`, `stack`, `none` |

Sparkline colors use `.fi-wi-stats-overview-stat-chart-bg-color` and `.fi-wi-stats-overview-stat-chart-border-color`. The stat's Filament color (`success`, `danger`, and so on) drives the defaults.

### Not CSS-addressable

| Property | Source | Why CSS cannot change it |
| --- | --- | --- |
| Per-series `backgroundColor` | `getData()['datasets'][n]` | Dataset JSON is created by PHP; Chart.js paints it on canvas. |
| Per-series `borderColor` | `getData()['datasets'][n]` | Same. |
| Hover and point colors | Filament normalizes them from dataset colors | Same. |
| Chart type | `getType()` | Server-side method; Chart.js instance type. |
| Legend position | `getOptions()` | Chart.js option; can be exposed later as a renderer preset, not CSS. |
| Axis display/ticks | `getOptions()` | Chart.js option. |

## Chart variants

Filament documents and ships these chart widget classes and type strings:

| Variant ID | `getType()` | Filament class | Notes |
| --- | --- | --- | --- |
| `line` | `line` | `LineChartWidget` | Default showcase type. |
| `bar` | `bar` | `BarChartWidget` | Filament derives hover border colors from bar background. |
| `pie` | `pie` | `PieChartWidget` | Arc colors; legend swatches derived. |
| `doughnut` | `doughnut` | `DoughnutChartWidget` | Arc colors; hole. |
| `polarArea` | `polarArea` | `PolarAreaChartWidget` | Radial grid and tick colors. |
| `radar` | `radar` | `RadarChartWidget` | Line/point controls apply. |
| `scatter` | `scatter` | `ScatterChartWidget` | Point colors; border color treated as point background. |
| `bubble` | `bubble` | `BubbleChartWidget` | Point radius is data-driven per bubble. |

Mixed datasets are possible in Chart.js but not exposed in v1 because Filament's type is a single string.

Variant-specific control visibility:

- Line, radar, scatter: line tension, point radius, point style, border width.
- Bar: bar border radius, border width.
- Pie, doughnut, polar area: arc colors, border width; line/point properties are not applicable.
- Bubble: point colors and border width; per-point radius comes from data.
- All: surface, border, grid, text, legend swatch, tooltip.

## Renderer contract

### Preview

The preview uses the real Filament chart runtime. The builder bridge must discover existing Chart.js instances without replacing Filament's Alpine component.

- Discovery: `Chart.getChart(canvas)` for every `canvas[x-ref="canvas"]` inside `.fi-wi-chart`.
- Target key: the demo fixture supplies a stable chart key. Because Filament does not emit a per-widget attribute, the demo maps chart keys in fixture order and exposes that map to the bridge. The builder must not infer arbitrary application chart keys from DOM order in user applications; preview order is a demo-only contract.
- Series selection: by dataset index, with optional label matching. The builder shows the dataset labels returned by the fixture; the export uses indices and optional labels.
- Apply series colors:
  - Set `dataset.backgroundColor` and `dataset.borderColor`.
  - For bars, let Filament's existing dataset normalization derive hover colors where possible; if a hover color is explicitly set, it must be in the allowlist and exported.
  - For line/scatter, also set `dataset.pointBackgroundColor` when the theme explicitly controls points.
  - Call `chart.update('resize')` so per-element colors and points refresh. Do not use `'none'`.
- Apply chart type:
  - Changing `chart.config.type` in place is only safe when the target type has compatible scales and dataset shape. The bridge must validate compatibility before applying.
  - For incompatible type changes (for example line to pie), destroy and recreate the Chart instance with the new type and Filament-compatible defaults. Preserve data, labels, and user options.
  - The preview must not mutate the widget's PHP data or trigger a Livewire request.
- Re-apply:
  - On theme message, active-mode change, chart data update (`updateChartData`/`updateStatsOverviewChartData`), Livewire navigation, and `ftb:theme:updated`.
  - On mode change, re-read the mode and apply the matching palette.
- Cleanup: remove listeners and restore destroyed charts on bridge teardown/navigation.

### Message safety

- Extend the existing `ftb:theme:update` payload with a validated `chartProjection`. Do not accept arbitrary JavaScript, Chart.js options, or dataset data from the builder.
- Allowlist: chart keys, series indices, labels (bounded length), hex/rgba colors, numeric geometry, keyword enums, and chart type IDs.
- Reject unknown keys, excess series, invalid numbers, and out-of-range values. Keep the existing exact-key validation style used by the bridge.
- No network, storage, or secret access.

## Export contract

### Split of responsibilities

| Output | Mechanism | Mode behavior |
| --- | --- | --- |
| Chart surface, sentinel colors, geometry, legend/tooltip shape | Vanilla CSS / Tailwind `@apply` | Live light/dark through CSS |
| Chart type | Generated PHP trait call or snippet | Per widget |
| Per-series palette | Generated PHP config + trait | Light/dark source values |
| Live light/dark series switching | Generated mode-sync script | Reads `html.dark` and updates datasets |

A pure PHP handoff cannot react to Filament's client-side theme switch: the mode is stored in the browser (`Alpine.store('theme')` and the `dark` class), while dataset colors are rendered into the Chart.js config by PHP. The generated handoff therefore includes a small, first-party mode-sync script. It is generated by the builder and registered like a Filament chart plugin; it is not a general-purpose adapter and does not patch charts without a matching theme config.

If the user declines the mode-sync script, the export must state that series colors use the light palette in both modes. It must never claim live dark support without the script.

### Generated configuration

The builder emits a versioned config, for example `config/filament-theme-builder.php`:

```php
<?php

return [
    'schemaVersion' => 1,
    'charts' => [
        // Stable key chosen by the user; the demo fixture uses these keys.
        'revenue-orders' => [
            'type' => 'line',
            'series' => [
                0 => [
                    'label' => 'Revenue (cents)',
                    'light' => ['border' => '#d97706', 'background' => 'rgba(217, 119, 6, 0.15)'],
                    'dark' => ['border' => '#fbbf24', 'background' => 'rgba(251, 191, 36, 0.20)'],
                ],
                1 => [
                    'label' => 'Orders',
                    'light' => ['border' => '#2563eb', 'background' => 'rgba(37, 99, 235, 0.15)'],
                    'dark' => ['border' => '#60a5fa', 'background' => 'rgba(96, 165, 250, 0.20)'],
                ],
            ],
        ],
    ],
];
```

Rules:

- Series are keyed by zero-based dataset index. Optional `label` is a guard, not the primary key.
- If a configured label does not match the dataset label at runtime, the trait must skip that series and report it through a log/debug channel, not apply the wrong color silently.
- Unconfigured series keep Filament's existing colors.
- Colors accept hex and `rgba()`. No CSS variables in dataset values.
- Chart type is a validated enum from the variant table.

### Generated trait

```php
trait InteractsWithFilamentThemeCharts
{
    protected function themeChartType(string $key, string $default): string;

    protected function themeChartData(array $data, string $key): array;

    protected function themeChartAssets(): string; // once per panel, or documented include
}
```

Usage:

```php
protected function getType(): string
{
    return $this->themeChartType('revenue-orders', 'line');
}

protected function getData(): array
{
    return $this->themeChartData([
        'labels' => $labels,
        'datasets' => $datasets,
    ], 'revenue-orders');
}
```

`themeChartData` applies the light palette at render time. The mode-sync script applies the dark palette when `html.dark` is present and restores light when it is removed. Both must be idempotent so Livewire updates do not duplicate colors or listeners.

### Installation guidance

Export must include:

- Where the config file belongs and that it is optional.
- The trait import and the exact `getType()`/`getData()` changes.
- How to register the generated mode-sync asset once per panel.
- That chart type is per widget key; renaming the key in PHP must match the config.
- That unconfigured charts and unconfigured series remain unchanged.
- That the CSS export handles surface colors and geometry and does not contain dataset colors.

## UI contract

- The chart editor groups controls into: Surface, Geometry, Legend, Tooltip, Axes, Series, Variant.
- Every renderer control has a clear "Requires generated chart integration" note with a link to the export guidance. It is not styled like a CSS control.
- The Series section lists the datasets discovered from the demo chart, with a color control per series and a per-series reset. Users can add palette slots for series that are not currently in the demo? No: only discovered series are editable; additional slots are a follow-up.
- The Variant section lists all eight chart types. Some variants may be incompatible with the current dataset shape; incompatible combinations show a warning and are not silently applied.
- Mode isolation applies to every control. A dark series color never overwrites the light value.
- Reset returns the series to Filament's native color and the variant to the widget's original `getType()`.
- The Inspector chart surface opens the same structured chart controls. Canvas sub-elements are not DOM targets.

## Testing

### Unit

- Registry entries for every chart family and sub-part, with verified selectors and no invented controls.
- Control-kind segregation: CSS controls never enter the renderer projection; renderer controls never enter CSS export.
- Series validation: index, label, color format, max series, duplicate index, unknown keys.
- Variant validation: allowed types, incompatible combinations, reset behavior.
- Mode isolation: light and dark values are independent for surface, geometry, series, and variant.
- Inheritance: global → chart → variant → state for CSS controls; series palette does not bypass inheritance.
- Export serialization: config shape, stable ordering, omission of unset values, no dataset colors in CSS.
- Import/JSON round-trip and schema migration.

### PHP

- Trait applies type and palette by key/index/label.
- Label mismatch skips the series safely.
- Unconfigured series keep native colors.
- Invalid config falls back safely.
- Mode-sync assets render once and are idempotent.
- The generated config is valid PHP.

### Playwright against the real iframe

- Select the chart surface and verify computed sentinel colors, geometry custom properties, and dark/light independence.
- Read `Chart.getChart(canvas)` and assert dataset colors per series, after direct edits, undo, redo, and reset.
- Switch every chart type; assert the canvas instance type and that data/labels survive.
- Verify the stats sparkline custom properties and sentinel colors.
- Verify empty, collapsed, filtered, and polling-update states do not lose the applied theme.
- Verify no full page reload and no non-GET mutation.
- Download/copy CSS and PHP/config exports and assert they contain the expected values and do not contain renderer values in CSS.

### Visual regression

- Chart matrix: eight types, one multi-series and one single-series, light/dark, default/hover tooltip (where capturable deterministically), empty, collapsed.
- Stats sparkline: fill variants `start`, `none`, light/dark.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Chart.js type switching invalidates scales/datasets. | Validate compatibility; recreate the instance with safe defaults for incompatible changes; test all eight types. |
| Dark mode palette is stale because PHP cannot see client mode. | Generated mode-sync script reads `html.dark`; without it, export explicitly states light-only series colors. |
| Dataset order differs between builder fixture and user app. | Index is primary; label is an optional guard; mismatches skip rather than miscolor. |
| Polling/Livewire updates replace chart data and drop colors. | Re-apply on `updateChartData`, `updateStatsOverviewChartData`, and `ftb:theme:updated`; trait reapplies on each render; test polling. |
| CSS controls accidentally claim to change series colors. | Control-kind metadata and UI labels; export separates CSS and PHP; tests assert separation. |
| Canvas Inspector feels broken because points are not DOM. | Structured chart target list after selecting the surface; explicit copy that points are not individual DOM targets. |
| Generated integration is not installed. | Export guidance and preview-only warning; no false export claims. |
