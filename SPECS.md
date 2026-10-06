# Filament Theme Builder — Technical & Behavioral Specification

**Status:** Approved implementation specification  
**Product requirements:** [PRD.md](./PRD.md)  
**Implementation plan:** [TICKETS.md](./TICKETS.md)  
**Target:** Filament 5  
**Pre-1.0 integration/deployment branch:** dev

This is the implementation contract. PRD.md defines the product problem and outcomes. TICKETS.md contains the executable vertical slices. Each section below links to the ticket or tickets that implement it.

## 1. Repository and application boundary

The project is one repository containing two sibling applications:

- builder — Vue 3, Vite, Pinia, npm;
- demo — Laravel 13, PHP 8.5, Filament 5.

The apps stay independent in source while presenting one product in production. Laravel development uses Sail. Root commands should provide setup, dev, test, E2E, and build shortcuts.

GitHub Actions must not be introduced.

**Tickets:** [FTB-001](./TICKETS.md#ftb-001), [FTB-037](./TICKETS.md#ftb-037)

## 2. Public routing

Production exposes:

- / — compiled Vue builder;
- /theme/<id> — builder loading a shared theme;
- /demo/* — Filament demo;
- /api/* — small Laravel API surface.

Keeping builder and demo on one origin simplifies iframe communication and deployment.

**Tickets:** [FTB-002](./TICKETS.md#ftb-002), [FTB-029](./TICKETS.md#ftb-029), [FTB-035](./TICKETS.md#ftb-035)

## 3. Production runtime

Laravel runs with Octane on FrankenPHP. FrankenPHP's integrated Caddy is the reference web server; the reference stack does not add a second Caddy proxy.

Reference topology:

~~~text
FrankenPHP / Caddy / Octane
├── /          Vue static build
├── /demo/*    Laravel + Filament
└── /api/*     Laravel APIs

Scheduler container
├── demo reset
├── share expiry cleanup
└── upload cleanup

Persistent: shares.sqlite
Disposable/rebuildable: demo.sqlite and demo uploads
~~~

Octane-safe code must not leak request/visitor state through mutable long-lived singletons or statics. Workers must recycle periodically.

**Tickets:** [FTB-035](./TICKETS.md#ftb-035)

## 4. Canonical theme state

Structured, versioned JSON is the single source of truth. CSS and PanelProvider output are projections of that state.

Conceptual domains:

~~~text
schemaVersion
metadata
global foundations
light values
dark values
components
raw inspector overrides
icons
panel/runtime configuration
custom CSS
~~~

Required invariants:

1. Every editable/imported/shared theme has a schemaVersion.
2. Presets are normal theme state.
3. Local themes, JSON files, and shares use the same representation.
4. Older state migrates sequentially to the current schema.
5. Undo/redo operates on meaningful theme changes.

Suggested Pinia domains: theme, history, preview, inspector, localThemes, share, editorUI.

**Tickets:** [FTB-003](./TICKETS.md#ftb-003), [FTB-021](./TICKETS.md#ftb-021), [FTB-022](./TICKETS.md#ftb-022)

## 5. Inheritance

Visual values inherit:

~~~text
Global
↓
Component
↓
Variant
↓
State
~~~

Children default to Inherit rather than storing copies. Resetting an individual override removes it and returns to inherited/default behavior.

Minimal export writes explicit deviations. Fully Explicit export resolves inheritance and writes the complete selected theme representation.

**Tickets:** [FTB-006](./TICKETS.md#ftb-006), [FTB-024](./TICKETS.md#ftb-024)

## 6. Semantic theme-control registry

A version-aware registry maps semantic Filament concepts to real selectors and supported controls.

Each entry should carry a stable semantic ID, label, family, selector set, variant/state metadata, supported controls, compatibility metadata, and inspector matching information.

The registry drives:

- semantic editor controls;
- Inspector resolution;
- CSS generation;
- coverage tracking;
- compatibility work when Filament changes markup.

Stable Filament semantic classes are preferred over structural selectors.

**Tickets:** [FTB-006](./TICKETS.md#ftb-006), [FTB-032](./TICKETS.md#ftb-032)

## 7. Live preview bridge

The preview is the real Filament app in an iframe.

Normal editing flow:

~~~text
Vue control
→ canonical state
→ generated preview CSS
→ postMessage
→ preview bridge
→ managed style element
→ real Filament DOM
~~~

The bridge uses a small versioned message protocol. Conceptual messages include theme CSS replacement, preview mode, inspector enable/disable, hover/select events, ready state, and runtime-refresh requests.

Origin validation is mandatory.

Normal changes such as colors, typography, radii, spacing, component overrides, and custom CSS must not need Laravel requests, page reloads, or Vite rebuilds.

**Tickets:** [FTB-003](./TICKETS.md#ftb-003), [FTB-007](./TICKETS.md#ftb-007)

## 8. Runtime-only Filament settings

Some appearance settings require PHP/Panel configuration.

Every such setting is classified as:

- preview-emulatable;
- runtime-refresh-required;
- export-only.

The preview may emulate a setting only when the result accurately represents Filament behavior. Otherwise use controlled refresh or clearly mark it export-only.

**Tickets:** [FTB-018](./TICKETS.md#ftb-018), [FTB-026](./TICKETS.md#ftb-026)

## 9. Inspector

Inspector is a V1 feature.

Hover highlights the candidate target. Selection keeps a visible outline, resolves the element through the registry when possible, navigates the editor, and displays a semantic breadcrumb such as Button › Primary › Default.

The selected target exposes both:

- normal semantic controls;
- Advanced raw-element styling.

When registry coverage is incomplete, the tool proposes the most stable selector available. Stable Filament classes win over structural selectors. Fragile selectors receive a warning and remain editable.

Raw overrides live in canonical state and participate in history, persistence, JSON, sharing, preview, and CSS export.

**Tickets:** [FTB-007](./TICKETS.md#ftb-007), [FTB-008](./TICKETS.md#ftb-008)

## 10. Foundations

Global editing includes:

- primary, success, warning, danger, info, gray;
- page, sidebar, topbar, card/elevated, input surfaces;
- default/strong borders;
- primary, muted, disabled text;
- separate light/dark values where relevant;
- generated 50–950 shades with individual advanced overrides;
- system fonts, curated Google Fonts, custom font-family;
- global radius, borders, shadows;
- global spacing scale;
- Compact, Default, Spacious density.

The builder does not host custom font files. Export guidance explains how the user's project must load them.

**Tickets:** [FTB-005](./TICKETS.md#ftb-005), [FTB-031](./TICKETS.md#ftb-031)

## 11. Editor information architecture

The editor uses searchable categories rather than one huge form:

- Foundations;
- Layout;
- Components;
- Recently edited;
- Favourites.

Component organization follows Filament concepts where useful: actions, forms/schemas, tables, infolists, widgets, notifications, navigation, modals, and panel UI.

Inspector may jump directly to a category/control.

The editor is desktop-first but must not be intentionally unusable on mobile.

**Tickets:** [FTB-005](./TICKETS.md#ftb-005), [FTB-007](./TICKETS.md#ftb-007)

## 12. Icons

Support:

1. default icon behavior;
2. global icon pack/style presets;
3. individual semantic icon overrides.

Individual overrides beat the chosen pack. When replacement is configuration rather than CSS, export proper Filament configuration instead of a CSS hack.

**Tickets:** [FTB-017](./TICKETS.md#ftb-017), [FTB-026](./TICKETS.md#ftb-026)

## 13. Branding and layout configuration

Support app name, normal logo, dark logo, favicon, logo height, brand typography, content width/sidebar behavior, and agreed appearance-related PanelProvider options.

Brand/runtime values remain part of canonical theme state even when their export target is PHP instead of CSS.

**Tickets:** [FTB-018](./TICKETS.md#ftb-018)

## 14. Demo domain

The real Filament demo is a coherent e-commerce back office.

Models include customers, addresses, products, categories, variants, tags, reviews, orders, order items, payments, refunds, shipments, status history, inventory, suppliers, discounts, and notes/activity where useful.

Relationships deliberately cover BelongsTo, HasMany, BelongsToMany, polymorphic relationships, attach/detach, and associate/dissociate.

Seed data must look realistic while remaining deterministic enough for screenshot tests.

**Tickets:** [FTB-009](./TICKETS.md#ftb-009)

## 15. Relation Managers and Nested Resources

Both are explicit coverage areas. The demo uses Relation Managers where related records naturally belong in a parent resource and Nested Resources where full-page related editing is appropriate.

Relationship UI must include relevant forms, tables, actions, attach/detach, and associate/dissociate flows.

**Tickets:** [FTB-010](./TICKETS.md#ftb-010), [FTB-039](./TICKETS.md#ftb-039)

## 16. Showcase coverage

Dedicated showcase areas cover:

- Forms & Schemas;
- Tables;
- Infolists;
- Actions & Modals;
- Notifications;
- Widgets;
- Navigation;
- Authentication/Profile/Tenant UI;
- States.

The goal is every visually distinct first-party Filament 5 surface, not every API permutation. Identical rendering does not need duplicate fixtures.

All showcase output must be real Filament output.

**Tickets:** [FTB-011](./TICKETS.md#ftb-011), [FTB-012](./TICKETS.md#ftb-012), [FTB-013](./TICKETS.md#ftb-013), [FTB-014](./TICKETS.md#ftb-014), [FTB-015](./TICKETS.md#ftb-015)

## 17. Forced states

Showcase tooling can deterministically force states such as hover, focus, filled, validation error, disabled, loading, selected, empty, open modal, and visible notification.

Forced states must not permanently corrupt demo data and must be stable enough for Playwright screenshots.

**Tickets:** [FTB-016](./TICKETS.md#ftb-016), [FTB-033](./TICKETS.md#ftb-033)

## 18. Demo authentication

The main demo remains public.

A real login route displays:

~~~text
Username: user
Password: password
~~~

Those credentials work, but login is not required for normal preview access.

Profile/authentication/tenant UI that does not naturally appear anonymously is shown through controlled showcase states.

**Tickets:** [FTB-002](./TICKETS.md#ftb-002), [FTB-015](./TICKETS.md#ftb-015)

## 19. Demo database lifecycle

The demo uses a known-good SQLite snapshot restored every ten minutes.

Requirements:

- reset is repeatable and effectively atomic;
- UI says Demo data resets every 10 minutes;
- temporary uploads are cleaned during maintenance;
- destructive operations may be simulated/constrained if unrestricted behavior could ruin the showcase;
- create/edit/action UX remains realistic enough for theming.

shares.sqlite is completely separate and never reset with demo.sqlite.

**Tickets:** [FTB-028](./TICKETS.md#ftb-028), [FTB-035](./TICKETS.md#ftb-035)

## 20. Demo upload safety

Allowed uploads: JPEG, PNG, WebP, PDF.

Limits:

- 5 MB per file;
- 25 MB per anonymous user bucket;
- 500 MB global temporary storage ceiling.

Near the global ceiling, purge oldest temporary files until usage is about 400 MB. Uploaded files must not be executable as application code.

Upload quotas are independent of share-count quotas.

**Tickets:** [FTB-027](./TICKETS.md#ftb-027), [FTB-028](./TICKETS.md#ftb-028)

## 21. Local themes

Users can create, open, rename, duplicate, delete, and autosave multiple local themes.

Autosave is debounced. Deletion requires confirmation. Undo/redo affects the active theme without mutating unrelated saved themes.

**Tickets:** [FTB-021](./TICKETS.md#ftb-021)

## 22. JSON portability and migrations

Editable theme JSON includes schemaVersion.

Import flow:

1. validate envelope and size;
2. run sequential schema migrations;
3. validate current state;
4. open/save as an editable theme.

Invalid input must fail safely without damaging the current theme.

Hosted shares use the same migration mechanism.

**Tickets:** [FTB-022](./TICKETS.md#ftb-022), [FTB-029](./TICKETS.md#ftb-029)

## 23. Advanced Custom CSS

Custom CSS is stored as CSS text, applied after generated CSS, previewed live, and included in local persistence, JSON, shares, and final export.

It is CSS-only. The product must not execute user JavaScript or HTML style tags.

**Tickets:** [FTB-023](./TICKETS.md#ftb-023)

## 24. CSS export

Two independent choices are exposed.

### Strategy

- Minimal — explicit differences only;
- Fully Explicit — resolved complete theme.

### Syntax

- Vanilla CSS — default;
- Tailwind @apply.

Tailwind mode should remain genuinely utility-based. If a selected value needs a custom Tailwind utility/theme token, generate that construct rather than silently producing large vanilla declaration blocks. If a transformation is not safe, warn instead of emitting incorrect code.

Output is readable, grouped, commented, and not minified.

Header comment:

~~~css
/* Generated with Filament Theme Builder */
~~~

**Tickets:** [FTB-004](./TICKETS.md#ftb-004), [FTB-024](./TICKETS.md#ftb-024), [FTB-025](./TICKETS.md#ftb-025)

## 25. PanelProvider export

Users can choose:

- relevant method/configuration snippets;
- complete example AdminPanelProvider.

Snippet mode is recommended for existing applications.

The UI clearly distinguishes CSS settings from PHP/runtime/icon/branding settings and never encourages overwriting unrelated provider logic.

**Tickets:** [FTB-018](./TICKETS.md#ftb-018), [FTB-026](./TICKETS.md#ftb-026)

## 26. Installation guidance

Export produces tailored instructions for the features actually used, including where theme.css belongs, how to register/use the custom theme, any PanelProvider changes, font-loading guidance, and normal asset build steps.

Instructions must work without assuming an otherwise-empty provider.

**Tickets:** [FTB-026](./TICKETS.md#ftb-026)

## 27. Presets

Presets are canonical theme documents.

Initial set should be roughly five to eight distinct directions such as Default, Minimal, Soft, Sharp, Corporate, Midnight, Colorful, and Compact.

Stock Filament is the first-visit default. Applying a preset replaces the current theme and warns before overwriting edited work.

**Tickets:** [FTB-020](./TICKETS.md#ftb-020)

## 28. Responsive preview and comparison

Preview supports Desktop, Tablet, Mobile, and arbitrary draggable width. Current width is visible.

Before/after comparison uses a draggable split between untouched stock Filament and the current theme on equivalent content/state where practical.

**Tickets:** [FTB-019](./TICKETS.md#ftb-019)

## 29. History and reset

Required keyboard behavior:

- Ctrl/Cmd + Z — undo;
- Ctrl/Cmd + Shift + Z — redo.

Reset works at theme, section, component, and individual property levels. Property reset removes the explicit override and returns to inheritance.

**Tickets:** [FTB-003](./TICKETS.md#ftb-003), [FTB-005](./TICKETS.md#ftb-005), [FTB-006](./TICKETS.md#ftb-006)

## 30. Share storage

Sharing uses persistent shares.sqlite, separate from disposable demo state.

A share stores a non-guessable public ID, canonical payload, timestamps, expiry, and privacy-preserving ownership metadata.

Maximum theme payload is 256 KB.

**Tickets:** [FTB-029](./TICKETS.md#ftb-029)

## 31. Share API and ownership rules

Publishing a theme validates the payload, derives the anonymous identity, enforces limits, creates or updates that identity's one active share, and returns public URL + expiry metadata.

Identity combines:

- random browser UUID;
- server-secret keyed hash of normalized IP.

Raw IPs are not persisted.

Limits:

- one active share per browser identity;
- maximum five active browser identities/shares per IP hash;
- one share mutation per hour per identity.

Re-sharing from the same browser identity updates the existing public URL instead of creating another.

These are abuse controls, not human identity guarantees.

**Tickets:** [FTB-029](./TICKETS.md#ftb-029), [FTB-030](./TICKETS.md#ftb-030)

## 32. Share expiry UX

Shares expire after five days.

Opening a valid share shows a toast with the remaining lifetime in human language.

Expired data is purged. An expired URL displays a friendly expiry page with a path to start a new theme.

**Tickets:** [FTB-030](./TICKETS.md#ftb-030)

## 33. Accessibility guidance

The builder calculates contrast for relevant foreground/background combinations and warns when expected thresholds are missed.

Warnings identify the problematic pair but do not block editing, saving, sharing, or export. The tool does not claim whole-product WCAG certification.

**Tickets:** [FTB-031](./TICKETS.md#ftb-031)

## 34. Coverage manifest

COVERAGE.md is the public source of truth for first-party Filament 5 visual coverage.

Entries use stable identifiers and Supported / Partial / Missing status. The builder exposes an interactive coverage page based on the same source of truth.

The manifest records minimum supported and latest tested Filament versions.

1.0 requires all identified visually distinct first-party features to reach the agreed supported state.

**Tickets:** [FTB-032](./TICKETS.md#ftb-032), [FTB-039](./TICKETS.md#ftb-039)

## 35. Testing seams

Tests should prefer external behavior over private implementation.

The highest-value seam is the real Vue builder controlling the real Filament iframe.

### Laravel/PHP

Test share rules, expiry, identity limits, reset behavior, upload quotas/cleanup, and runtime configuration.

### Vue

Test schema migration, inheritance, generators, local-theme state, and history where browser integration is unnecessary.

### Playwright

Test edit → preview, Inspector, light/dark, responsive preview, before/after, JSON flow, CSS export, sharing, and representative demo/auth/showcase states.

### Visual regression

Use deterministic seeded data and forced states for screenshot comparisons across the main showcase families.

Chromium is the primary CI browser, while implementation should stay compatible with modern evergreen browsers.

**Tickets:** [FTB-033](./TICKETS.md#ftb-033)

## 36. Filament upgrade handling

The project supports a compatible Filament 5 range and records minimum supported + latest tested versions.

A new Filament release is tested before deployment. Registry or markup breakage should surface through E2E/visual failures.

Upstream release detection never automatically deploys.

**Tickets:** [FTB-032](./TICKETS.md#ftb-032), [FTB-033](./TICKETS.md#ftb-033), [FTB-034](./TICKETS.md#ftb-034)

## 37. Jenkins

Jenkins is the only CI/CD platform.

One parameterized pipeline always performs required build/test stages. Manual runs expose DEPLOY=false by default; DEPLOY=true deploys only after all required checks pass.

Before 1.0, deployable source is dev.

Jenkins checks hourly for a newer supported Filament release. If one exists, the same pipeline tests the updated dependency in its workspace with deployment disabled. The automatic check must not commit or deploy an unreviewed dependency change.

**Tickets:** [FTB-034](./TICKETS.md#ftb-034)

## 38. Branch and release model

Before 1.0:

~~~text
feature/* → dev
~~~

dev is integration and Alpha/Beta deployment. main is reserved for the stable line.

Releases progress through 0.x, Alpha, Beta, then 1.0 when the acceptance contract is met.

**Tickets:** [FTB-038](./TICKETS.md#ftb-038), [FTB-040](./TICKETS.md#ftb-040)

## 39. Product identity

The builder itself is neutral, compact, restrained, and design-tool oriented.

Primary copy:

**Filament Theme Builder**  
Build your Filament theme visually.

Footer:

**An open-source project from Azaber**

The UI must not imply that the project is an official Filament product or that Filament and Azaber are the same company.

**Tickets:** [FTB-038](./TICKETS.md#ftb-038)

## 40. Microsoft Clarity

Hosted analytics use Microsoft Clarity with appropriate disclosure/consent handling.

Custom CSS and theme-editor content should be masked/excluded where reasonably possible. Local development must work with Clarity disabled.

**Tickets:** [FTB-036](./TICKETS.md#ftb-036)

## 41. Documentation and contribution rules

Before Alpha the repo contains README, PRD, SPECS, TICKETS, CONTRIBUTING, ARCHITECTURE, and COVERAGE.

The future documentation website is a separate repository.

New theme-control coverage should normally include semantic registry support, a real showcase fixture, and appropriate automated tests.

**Tickets:** [FTB-037](./TICKETS.md#ftb-037)

## 42. Alpha acceptance

Public Alpha is ready when a first-time visitor can:

1. start from stock Filament;
2. edit and immediately preview a theme;
3. use Inspector on the supported core set;
4. switch light/dark and viewport sizes;
5. undo/reset;
6. save locally or as JSON;
7. export usable CSS;
8. create/open a temporary share;
9. follow installation guidance.

Operational upload/reset/share safeguards must also work.

Complete Filament coverage is not required for Alpha.

**Tickets:** [FTB-038](./TICKETS.md#ftb-038)

## 43. 1.0 acceptance

1.0 is reached only when:

1. every visually distinct first-party Filament 5 feature identified in COVERAGE.md is supported;
2. each has a real fixture;
3. each relevant visual feature has a semantic or supported advanced theming path;
4. light/dark behavior is verified;
5. responsive preview and before/after work;
6. Inspector works across the coverage surface;
7. Vanilla and Tailwind @apply exports work;
8. Minimal and Fully Explicit exports work;
9. local themes and JSON migrations work;
10. share expiry/limits/persistence work;
11. Playwright and visual regression pass;
12. Jenkins passes against the supported Filament baseline;
13. installation/export guidance is correct.

**Tickets:** [FTB-039](./TICKETS.md#ftb-039), [FTB-040](./TICKETS.md#ftb-040)

## 44. Out of scope

This specification excludes:

- Filament 3/4 support;
- guaranteed arbitrary third-party plugin coverage;
- user accounts;
- paid tiers;
- cloud account project storage;
- custom font hosting;
- arbitrary JavaScript injection;
- GitHub Actions;
- a separate share microservice;
- permanent Node production hosting;
- the full documentation website in this repo;
- automatic deployment solely because a new Filament version was released.

Future work that introduces these items requires new tickets/specification rather than silent scope expansion.
