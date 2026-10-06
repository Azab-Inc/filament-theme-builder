# Filament Theme Builder — Product Requirements Document

**Status:** Approved product direction  
**Target:** Public alpha on the dev branch, then 1.0 when the Filament 5 coverage manifest is complete  
**License:** MIT  
**Product subtitle:** Build your Filament theme visually.  
**Attribution:** An open-source project from Azaber.

## 1. Product summary

Filament Theme Builder is a free, open-source visual theme editor for FilamentPHP 5.

It gives developers a real Filament application to design against while they visually edit colors, typography, spacing, radii, shadows, layout, icons, branding, component variants, and component states. Changes appear immediately in a live Filament preview. When the user is satisfied, the builder exports a ready-to-use theme.css and, where required, optional PanelProvider configuration.

The product should feel closer to a focused design tool than a code generator. The user should not need to repeatedly edit CSS, rebuild assets, refresh a page, and guess which Filament selector controls a component.

The defining product promise is:

> See the real Filament UI, change it visually, and export maintainable theme code.

## 2. Problem statement

Customizing Filament beyond basic brand colors currently requires developers to know or discover Filament's theme hooks, CSS classes, Tailwind behavior, panel configuration options, and component structure.

This creates several problems:

1. Developers make changes without a fast visual feedback loop.
2. Discovering which selector or configuration option affects a particular Filament component takes time.
3. It is difficult to preview the same change across all relevant Filament components and states.
4. Dark mode, responsive layouts, relation managers, tables, forms, modals, notifications, and other advanced Filament UI are easy to overlook.
5. Existing theme editors tend to cover only palettes or presets rather than the complete first-party Filament surface.
6. A developer who wants highly customized output often needs to maintain a large amount of hand-written CSS without a structured visual representation of the theme.

## 3. Product goals

The product must:

- provide a visual editor for Filament 5;
- use a real Filament application for previews rather than a mocked recreation;
- preview edits in near real time without rebuilding the application on every visual change;
- cover every visually distinct first-party Filament 5 feature before the 1.0 release;
- make simple theme editing approachable while still supporting highly granular overrides;
- support light and dark theme values;
- support desktop, tablet, mobile, and arbitrary preview widths;
- support semantic inspection of elements directly in the preview;
- support both a curated theming registry and advanced arbitrary CSS overrides;
- export readable theme.css output;
- export both vanilla CSS and Tailwind @apply styles;
- support minimal and fully explicit export modes;
- preserve user work locally without requiring an account;
- support temporary anonymous share links;
- remain free and open source;
- be safe to run publicly on a small VPS.

## 4. Non-goals for the initial 1.0

The initial 1.0 will not:

- guarantee visual-editor support for arbitrary third-party Filament plugins;
- require user accounts;
- provide paid tiers;
- act as cloud project storage;
- host custom font files;
- allow arbitrary JavaScript injection;
- run a permanent Node server in production;
- use GitHub Actions;
- ship a full documentation website inside this repository;
- attempt to support Filament 3 or Filament 4;
- replace Filament's own application architecture or resource system.

Third-party plugins may still inherit compatible generated CSS naturally, but they are outside the official coverage contract.

## 5. Target users

### 5.1 Filament application developers

A Laravel developer building an internal tool, SaaS dashboard, CRM, admin panel, marketplace back office, or other Filament application who wants a custom look without repeatedly hand-tuning CSS.

### 5.2 Agencies and freelancers

A developer or agency that ships multiple Filament projects and wants a fast way to create visually distinct client themes, save local variants, and export reusable CSS.

### 5.3 Theme authors

A developer creating or experimenting with more advanced Filament themes who wants granular component controls, state previews, raw CSS escape hatches, and an exhaustive component playground.

### 5.4 Open-source contributors

Contributors who want a clear coverage manifest showing which Filament components are already supported and where new theming coverage is needed.

## 6. Core user journey

A first-time visitor should be able to:

1. Open Filament Theme Builder.
2. See stock Filament in the preview.
3. Change a visible property such as the primary color or border radius.
4. See the change immediately in the real Filament preview.
5. Navigate realistic demo resources and dedicated showcase pages.
6. Toggle dark mode.
7. change the preview width or use desktop/tablet/mobile presets.
8. click an element in Inspector mode and see the relevant semantic editor controls.
9. optionally add a specific component, variant, state, or raw selector override.
10. compare the customized UI against stock Filament.
11. undo/redo or reset individual changes.
12. export theme.css.
13. copy any required PanelProvider configuration.
14. save the editable theme locally, export it as JSON, or create a temporary share link.

## 7. Product principles

### 7.1 Real Filament first

The preview must be an actual Filament 5 application. If a control cannot be demonstrated against real Filament output, it does not count as complete coverage.

### 7.2 Progressive complexity

A beginner should be able to change the global theme without understanding Filament's DOM. Advanced users should be able to drill down from global values to component, variant, and state overrides.

### 7.3 Semantic before raw

Inspector mode should prefer semantic Filament concepts such as Button > Primary > Hover rather than exposing raw selectors first. Raw selector styling remains available as an advanced escape hatch.

### 7.4 Fast feedback

Normal visual changes should feel immediate. Server round trips and full reloads are reserved for settings that truly require Filament runtime configuration.

### 7.5 Maintainable output

Generated CSS should be readable, grouped, commented, and suitable for committing into a real project. The output should not look like opaque generated machine code.

### 7.6 No account required

Local persistence, JSON export/import, and temporary sharing should cover the main workflows without registration.

### 7.7 Coverage is measurable

The project must maintain a public Filament feature coverage manifest. The 1.0 release is gated by that manifest rather than by an arbitrary date.

## 8. Functional requirements

### 8.1 Theme editing

The builder must support:

- semantic Filament colors;
- page, sidebar, topbar, card, input, border, and text surfaces;
- independent light and dark values where relevant;
- generated palettes with advanced shade overrides;
- typography;
- system, Google, and custom font-family choices;
- spacing and density;
- radii;
- borders;
- shadows;
- layout controls;
- component-specific overrides;
- variant-specific overrides;
- state-specific overrides;
- icon packs and individual icon replacement;
- panel branding;
- arbitrary custom CSS.

### 8.2 Preview

The preview must include:

- a realistic e-commerce admin application;
- products;
- categories;
- variants;
- tags;
- reviews;
- customers;
- addresses;
- orders;
- order items;
- payments;
- refunds;
- shipments;
- status history;
- suppliers;
- inventory;
- discounts;
- notes/activity where appropriate;
- relation managers;
- nested resources;
- realistic tables and forms;
- dedicated showcase pages for Filament component families.

### 8.3 Component showcase

The product must have dedicated coverage for visually distinct first-party Filament 5 UI in:

- forms and schemas;
- tables;
- infolists;
- actions;
- modals;
- notifications;
- widgets;
- navigation;
- authentication/profile/tenant UI;
- state demonstrations;
- relation managers;
- nested resources.

### 8.4 Inspector

Inspector mode must:

- highlight elements on hover;
- keep the selected element highlighted;
- show a semantic breadcrumb;
- resolve known elements through the theme-control registry;
- show semantic controls and advanced element styling together;
- prefer stable Filament selectors;
- warn when only a brittle selector can be generated.

### 8.5 States

The showcase must allow important visual states to be forced without awkward manual interaction, including examples such as:

- default;
- hover;
- focus;
- selected;
- disabled;
- loading;
- validation error;
- empty;
- open modal;
- visible notification.

### 8.6 Persistence and sharing

Users must be able to:

- automatically save local work;
- manage multiple named local themes;
- duplicate, rename, delete, and reopen local themes;
- export editable theme JSON;
- import editable theme JSON;
- use versioned client-side schema migrations;
- create a temporary hosted share URL.

Share links:

- use /theme/<id>;
- expire after five days;
- display a toast showing remaining lifetime when opened;
- display a friendly expired-theme page after expiry;
- support one active share per anonymous browser identity;
- support at most five active identities per hashed IP;
- update the same URL when the same identity shares again;
- limit share mutations to once per hour;
- limit the stored payload to 256 KB;
- never store raw IP addresses.

### 8.7 Export

Users must be able to export:

- vanilla CSS, which is the default;
- Tailwind @apply-based CSS;
- Minimal mode, which emits only explicit overrides;
- Fully Explicit mode, which emits the complete chosen theme configuration;
- relevant PanelProvider method calls;
- optionally, a complete example AdminPanelProvider;
- readable installation steps.

Generated CSS should include only a small attribution comment:

> Generated with Filament Theme Builder

### 8.8 Comparison and responsive tools

The preview must support:

- desktop preset;
- tablet preset;
- mobile preset;
- arbitrary draggable width;
- draggable before/after comparison against untouched Filament.

### 8.9 Accessibility

The builder must warn when configured foreground/background combinations fail expected WCAG contrast thresholds. Warnings must not block export.

## 9. Demo safety requirements

The public demo is intentionally disposable.

The demo database must reset from a known SQLite snapshot every ten minutes.

The interface must disclose that demo data resets every ten minutes.

The application may simulate or constrain destructive behavior that could make the showcase unusable before the next reset.

Real upload controls may be demonstrated, but uploads are constrained to:

- JPEG;
- PNG;
- WebP;
- PDF;
- 5 MB maximum per file;
- 25 MB maximum per anonymous user;
- 500 MB global temporary storage ceiling.

When global temporary storage approaches the ceiling, oldest files should be purged until usage is approximately 400 MB.

Temporary uploads are also cleared by the regular demo reset/cleanup process.

## 10. Demo authentication requirements

The main demo remains publicly accessible without authentication.

A real demo login page must exist so authentication UI can be themed and tested.

The page displays:

- Username: user
- Password: password

Those credentials must work.

Authentication/profile/tenant-oriented UI that does not naturally appear in the public demo must still be represented in controlled showcase states.

## 11. Presets

The builder should launch with a small set of visually distinct presets, approximately five to eight, including directions such as:

- Default;
- Minimal;
- Soft;
- Sharp;
- Corporate;
- Midnight;
- Colorful;
- Compact.

The first visit starts from stock Filament rather than from a custom preset.

Applying a preset replaces the current theme and asks for confirmation when it would overwrite unsaved edits.

## 12. Product identity

The product should look like a neutral design tool rather than like an official Filament product or an Azaber-branded dashboard.

Primary identity:

**Filament Theme Builder**  
Build your Filament theme visually.

Subtle footer attribution:

**An open-source project from Azaber**

The interface may take usability inspiration from tools such as tweakcn/shadcn theme editors, but must not copy their branding or create confusion about ownership.

## 13. Analytics and privacy

The hosted product will use Microsoft Clarity for privacy-conscious product analytics.

The site must provide appropriate disclosure/consent behavior where required.

Analytics should focus on product usage, not personal profiling.

Sensitive editor content, especially custom CSS and theme data, should not be unnecessarily exposed to analytics tooling.

## 14. Release strategy

The project uses 0.x releases while coverage is incomplete.

A public hosted Alpha may launch once the core editor, real preview, inspector, persistence, and export flows are useful.

A Beta follows once coverage and operational quality are substantially complete.

Version 1.0 is reached only when:

1. every visually distinct first-party Filament 5 feature identified by the coverage manifest is represented;
2. each relevant visual feature has a supported theming path;
3. light and dark modes work;
4. responsive preview works;
5. Inspector works;
6. vanilla and Tailwind exports work;
7. Minimal and Fully Explicit export modes work;
8. JSON persistence/migration works;
9. temporary sharing works;
10. automated browser and visual regression tests pass;
11. Jenkins build/test pipeline passes;
12. generated installation guidance is accurate.

## 15. Success criteria

The product is successful when a Filament developer can visually produce a distinctive theme without needing to discover Filament selectors manually for the normal workflow.

Qualitative success signals include:

- users can understand the first-edit workflow without reading a documentation site;
- common theme changes preview immediately;
- advanced users can drill down rather than hitting a hard ceiling;
- contributors can identify missing Filament coverage from the public manifest;
- exported CSS is understandable enough to maintain by hand afterward;
- Filament upgrades that break supported selectors are detected before deployment.

Potential analytics signals after public alpha include:

- percentage of sessions that make at least one edit;
- percentage that use Inspector;
- percentage that export CSS;
- percentage that save or share a theme;
- most-used editor sections and presets;
- errors encountered during export or preview.

These metrics are directional product signals, not 1.0 acceptance gates.

## 16. Related project documents

- [SPECS.md](./SPECS.md) — complete technical and behavioral specification.
- [TICKETS.md](./TICKETS.md) — implementation tickets, dependencies, and acceptance criteria.
