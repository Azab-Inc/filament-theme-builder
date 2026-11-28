# Filament Theme Builder — Implementation Tickets

**Status vocabulary:** ready-for-agent / in-progress / blocked / done  
**Branch policy before 1.0:** feature branches merge into dev; dev is the active integration and alpha-deployment branch.  
**Ticket style:** each ticket is intended to be a narrow, verifiable vertical slice that can fit in one fresh implementation context.

## How to use this file

- Work tickets whose blockers are all complete.
- Keep ticket IDs stable because SPECS.md deep-links to these anchors.
- When a ticket is implemented, update its status and check its acceptance criteria.
- If a ticket discovers new first-party Filament UI coverage, add that coverage to COVERAGE.md and add or split a ticket rather than silently expanding scope.
- New theme-control coverage should generally include registry coverage, a showcase fixture, and automated verification.
- Deferred color-picker and named-palette design: [FTB-051](#ftb-051) / [GitHub #51](https://github.com/Azab-Inc/filament-theme-builder/issues/51).
- Builder value padlock design: [FTB-052](#ftb-052) / [GitHub #52](https://github.com/Azab-Inc/filament-theme-builder/issues/52).
- Deferred builder component/composable refactor: [FTB-053](#ftb-053) / [GitHub #53](https://github.com/Azab-Inc/filament-theme-builder/issues/53).
- Urgent hierarchical padding design: [FTB-054](#ftb-054) / [GitHub #54](https://github.com/Azab-Inc/filament-theme-builder/issues/54).
- Chat-driven follow-ups: [FTB-057](#ftb-057), [FTB-058](#ftb-058), [FTB-059](#ftb-059), and [FTB-060](#ftb-060).
- Transparent color picker option: [FTB-061](#ftb-061) / [GitHub #61](https://github.com/Azab-Inc/filament-theme-builder/issues/61).
- Per-setting reset to Filament defaults: [FTB-062](#ftb-062) / [GitHub #64](https://github.com/Azab-Inc/filament-theme-builder/issues/64).
- Builder keyboard shortcuts and command modal: [FTB-064](#ftb-064) / [GitHub #66](https://github.com/Azab-Inc/filament-theme-builder/issues/66).
- Editor and demo preview resize handle: [FTB-065](#ftb-065) / [GitHub #67](https://github.com/Azab-Inc/filament-theme-builder/issues/67).
- Builder onboarding tour: [FTB-066](#ftb-066) / [GitHub #68](https://github.com/Azab-Inc/filament-theme-builder/issues/68), split into [FTB-067](#ftb-067), [FTB-068](#ftb-068), and [FTB-069](#ftb-069).
- Filament component/variant coverage: [FTB-070](#ftb-070) / [GitHub #72](https://github.com/Azab-Inc/filament-theme-builder/issues/72), split into [FTB-071](#ftb-071) / [#73](https://github.com/Azab-Inc/filament-theme-builder/issues/73), [FTB-072](#ftb-072) / [#74](https://github.com/Azab-Inc/filament-theme-builder/issues/74), [FTB-073](#ftb-073) / [#75](https://github.com/Azab-Inc/filament-theme-builder/issues/75), [FTB-074](#ftb-074) / [#76](https://github.com/Azab-Inc/filament-theme-builder/issues/76), and [FTB-075](#ftb-075) / [#77](https://github.com/Azab-Inc/filament-theme-builder/issues/77). Specs: [coverage inventory](./docs/superpowers/specs/2026-11-18-filament-component-variant-coverage-design.md) and [chart theming](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md).
- Builder stylesheet compliance: [FTB-076](#ftb-076) / [GitHub #78](https://github.com/Azab-Inc/filament-theme-builder/issues/78), split into [FTB-077](#ftb-077) / [#79](https://github.com/Azab-Inc/filament-theme-builder/issues/79), [FTB-078](#ftb-078) / [#80](https://github.com/Azab-Inc/filament-theme-builder/issues/80), [FTB-079](#ftb-079) / [#81](https://github.com/Azab-Inc/filament-theme-builder/issues/81), [FTB-080](#ftb-080) / [#82](https://github.com/Azab-Inc/filament-theme-builder/issues/82), [FTB-081](#ftb-081) / [#83](https://github.com/Azab-Inc/filament-theme-builder/issues/83), [FTB-082](#ftb-082) / [#84](https://github.com/Azab-Inc/filament-theme-builder/issues/84), and [FTB-083](#ftb-083) / [#85](https://github.com/Azab-Inc/filament-theme-builder/issues/85). Spec: [stylesheet compliance](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md); plan: [implementation](./docs/superpowers/plans/2026-11-18-builder-stylesheet-tailwind-compliance.md).

- Border-side controls: [FTB-084](#ftb-084) / [GitHub #88](https://github.com/Azab-Inc/filament-theme-builder/issues/88), delivered by [FTB-085](#ftb-085) / [#87](https://github.com/Azab-Inc/filament-theme-builder/issues/87) then [FTB-086](#ftb-086) / [#86](https://github.com/Azab-Inc/filament-theme-builder/issues/86). [Spec](./docs/superpowers/specs/2026-11-18-border-side-controls-design.md), [issue index](./ISSUES.md).
- Unique repeated Inspector targeting: [FTB-182](#ftb-182) / [#184](https://github.com/Azab-Inc/filament-theme-builder/issues/184). [Spec](./docs/superpowers/specs/2026-11-26-inspector-unique-element-ids-design.md), [issue index](./ISSUES.md).

## Dependency map

<a id="ftb-181"></a>
### FTB-181 — Update foundation spacing values when density changes

**Status:** done. **GitHub:** [#183](https://github.com/Azab-Inc/filament-theme-builder/issues/183). **Project:** #30 / Done. Narrow FTB-005 regression follow-up; demo-first gate is satisfied.

- [x] Dropdown and preset buttons immediately apply the existing canonical Compact/Default/Spacious spacing presets.
- [x] Commit density and preset spacing keys 1–4 atomically; preserve unrelated spacing keys/settings and existing mode contracts without a schema change. Preview, serialization and persistence coverage passes. Existing generic foundation/MCP setter contracts are unchanged; preset application remains the `setDensity` operation.
- [x] Reset and undo/redo remain coherent.
- [x] Capture failing unit and Playwright CLI regressions before implementation, then pass focused/integration checks, builder type-check, full units and production bundle validation (alternate output directory).

Verified on `dev` at base `d50ce7298aba5a9a56c7493757c6578d1572f017` plus uncommitted fix/tests and preserved pre-existing UI WIP. Original unit regression failed because spacing stayed unchanged; Playwright expected spacing 2 = 6 but received 8. Final focused command from `builder/`: `npm run test:unit -- --run src/__tests__/theme-state-density.spec.ts` (6 passed). Broader settled-production checks: `npm run type-check` passed; `npm run test:unit -- --run` passed (156 files / 729 tests before final test-only expansion); affected integration checks passed (33 tests). Root: `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/foundation-density-regression.spec.ts` passed (1 test: dropdown, Compact/Default/Spacious buttons, Reset).

`npm run build` hit pre-existing root-owned `builder/dist/assets` permissions (`EACCES`); `npm run build-only -- --outDir /tmp/opencode/ftb-builder-dist-final` passed, validating production output without altering existing assets. No dependencies added; unrelated UI WIP preserved. Subsequently committed with user authorization in local commit `5a26a76`; not pushed. Original verification context above is retained.

<a id="ftb-182"></a>
### FTB-182 — Isolate repeated Inspector elements with unique CSS IDs

**Phase:** Phase 1 online builder. **Status:** done. **GitHub:** [#184](https://github.com/Azab-Inc/filament-theme-builder/issues/184). **Project:** #30 / Done.
**Prerequisite:** [FTB-008](#ftb-008) is complete. Coordinate with [FTB-022](#ftb-022),
[FTB-004](#ftb-004), and [FTB-058](#ftb-058). **Spec:** [Inspector Unique Element IDs](./docs/superpowers/specs/2026-11-26-inspector-unique-element-ids-design.md).

### What to build

Add an Advanced Inspector toggle that lets a user isolate one selected element
when several preview elements share the same Filament class selector, such as
two `.fi-section-header` elements. Enabling the toggle generates a stable,
editable valid ID, assigns it to the selected occurrence in the preview, and
routes subsequent raw styling through `#id`. The existing class selector stays
as the shared baseline so the feature can refine one element without silently
changing the others.

### Acceptance criteria

- [x] The Inspector exposes an accessible **Unique element ID** toggle and an
  editable ID field with immediate validation and inline error association.
- [x] Enabling the toggle generates a stable ID, preserves the selected
  source selector and bounded occurrence binding, and assigns the ID only to
  the selected preview element.
- [x] Renaming the ID updates the preview and CSS target without creating a
  duplicate assignment or unsafe selector.
- [x] Duplicate, reserved, malformed, out-of-bounds, and application-owned ID
  cases fail closed without mutating the accepted theme or unrelated DOM.
- [x] The shared class rule remains intact, while edits made through the
  enabled unique target affect only that target. Disabling returns editing to
  the shared selector without deleting unrelated shared properties.
- [x] Light/dark inheritance, explicit overrides, state variants, reset,
  undo/redo, local persistence, and JSON import/export remain independent and
  round-trip the assignment data.
- [x] Vanilla CSS export emits deterministic `#id` rules after their shared
  source rules and reproduces the preview result when the clean fixture has
  the same ID in its markup.
- [x] Preview bridge validation, cleanup, navigation retry, iframe reload, and
  inspector evidence remain safe and deterministic; invalid payloads leave the
  last accepted theme unchanged.
- [x] Failing unit/component tests are written before implementation, followed
   by focused checks, affected integration checks, builder type-check, full
   unit tests, production build, and the required real-browser Playwright
   journey. No new dependency is added.

Completion is saved in local `48bf507`, with runtime/Composer verification
repairs in `62e2302`; original implementation `5a26a76`, state repairs `568cb78`
and Jenkins guardrails `a003098` remain in history. None was pushed.

All acceptance criteria map to actual assertions in the
[verification checkpoint](./docs/verification/ftb-182.md): full builder units
**157 files / 756 tests**, type-check and normal build pass; final full Composer
Pint/PHPStan/**274 tests / 2,398 assertions** pass; **21** bridge/unique browser
and **25** affected browser integration tests pass. Complete parent-sourced
invalid updates preserve accepted DOM/style/state, collisions report an
accessible Inspector error, missing routes skip/retry, and computed mode/state,
shared reset, keyboard/history/persistence/JSON/CSS fixture behavior pass.

Independent review's validation-throw and runtime-signal blockers were repaired
test-first and verified. Node ownership prevention, argv and SIGTERM/SIGINT
checks pass. The historical App timeout did not reproduce; no timeout increase
or root-cause claim is made. Live Jenkins remains an FTB-034 operational
requirement, not an FTB-182 prerequisite. Concurrent toolbar/style edits are
preserved outside these commits. [Environment evidence](./docs/verification/2026-11-27-agent-retrofit.md).

### Out of scope

MCP mutation support, arbitrary custom selectors, automatic IDs for all DOM
elements, application-owned ID replacement, and a general custom CSS editor.

<a id="production-panel-provider-export"></a>
### Required: production-ready PanelProvider export

User requirement added 2026-11-19 to FTB-026 / [#26](https://github.com/Azab-Inc/filament-theme-builder/issues/26), FTB-087 / [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89), and all 46 open `visual config` issues. Pressing Export on the public online builder must deliver correct consumer `app/Providers/Filament/AdminPanelProvider.php` configuration; repository reference: `demo/app/Providers/Filament/AdminPanelProvider.php`.

- [ ] Export only the requesting visitor/tab's draft, preserving explicit false, reset/inheritance, history and import semantics independently of other previews and Octane workers.
- [ ] Generate valid, installed-version-verified method calls for `panel(Panel $panel): Panel`, with imports, enums, escaped PHP values and asset/font setup guidance. Explicit top navigation exports `->topNavigation(true)` or `->topNavigation(false)`; omit inherited/unset options in snippets to preserve host defaults rather than substituting demo defaults.
- [ ] Consumer output must work without request/query preview adapters (`PanelBrandingSettings`, `ftb_branding`, preview IDs), preview bridge hooks, demo-only classes/auth bypasses or temporary asset URLs. Provide portable assets or actionable dependency installation steps and explicit application-specific integration guidance.
- [ ] The live Export flow includes relevant PHP configuration and installation guidance alongside applicable CSS/JSON. Copyable method-call snippets are the default and preserve unrelated provider configuration; optional full providers are clearly examples, not replacements for existing providers.
- [ ] Write failing regressions first; verify actual Export copy/download behavior with concurrent conflicting browser contexts and independent same-session tabs, PHP syntax and Filament API validity, representative generated configuration in a clean reference Filament project without demo dependencies, and applicable MCP export parity.

Shared handoff owner: FTB-026; panel contract owner: FTB-087. Mirrored in all 48 linked GitHub issue bodies in Project #30. Pending acceptance only; phase gates, prerequisites and completion statuses remain in force.

<a id="deployed-preview-isolation"></a>
### Required: deployed multi-user preview isolation

Acceptance requirement added 2026-11-19 to FTB-087 / [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89), all 46 open `visual config` issues (including FTB-018, FTB-055 and FTB-088), and their linked Project #30 issue bodies. Applies to UI and MCP preview changes; existing phases, prerequisites and completion statuses remain in force.

- [ ] Isolate settings per visitor and per preview/tab: conflicting values such as `topNavigation` enabled for A and disabled for B must remain independent through edits, reset, undo/redo, import and refresh.
- [ ] Resolve validated settings in the current request/preview context; do not rewrite shared PHP/configuration files or retain visitor-specific values in global/static/singleton state or unscoped caches. Verify Octane/FrankenPHP worker reuse cannot leak values.
- [ ] Preserve isolated context across iframe reloads, navigation and Livewire requests. Cookies alone do not propagate URL settings; session-only settings do not isolate tabs. Server-stored previews require isolated keys and ownership/authorization checks.
- [ ] Verify the installed Filament API/lifecycle option by option: request-time evaluation where supported, an explicitly isolated strategy for eager/boot-time APIs, and preservation of host authorization and other visitors' settings.
- [ ] Write failing regression coverage first, then pass production Compose Playwright with two isolated browser contexts holding conflicting values concurrently, interleaved changes/reloads/navigation/Livewire where applicable, same-session independent tabs and worker reuse; include equivalent MCP isolation coverage where applicable. Source inspection alone is not completion evidence.

[Source investigation and known propagation/verification gaps](./docs/research/2026-11-19-preview-concurrency-isolation.md). The umbrella owns the shared contract; every applicable visual child must satisfy it.

<a id="ftb-087"></a>
### FTB-087 — Filament 5 panel properties (umbrella)

**Phase classification (user decision):** non-visual panel configuration is deferred to the Composer package phase (Phase 2). Its issues have the `composer package phase` label and `(Composer package phase)` title suffix. The affected tickets are FTB-103–105, 107–109, 111–116, 121–133, 138–140, 142–144, 161, 163–164, and 166–180. Phase 2 remains blocked until FTB-040 and all approved Phase 1 requirements are complete; ticket-specific Phase 2 prerequisites also apply. All other GitHub issues, including closed issues, carry `Phase 1`. The umbrella carries `Phase 1` for its online-builder work, but spans both phases and cannot close until all its children are complete. Phase 1 features also need to be ported to the Composer package in Phase 2. Visual configuration retains its `visual config` label.

**Status:** blocked (planning/inventory incomplete). **GitHub:** [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89). Inventory every documented Panel option, including security, authentication, routing, tenancy and extension APIs, and create a child for each. Preserve host defaults and permissions; specify validated state, migration, real preview, PHP export, and MCP parity. Coordinate existing FTB-018 and FTB-055. Completion requires all children and their verification; the inventory and most children remain outstanding. Sources and initial findings: [research](./docs/research/2026-11-18-panel-properties.md).

<a id="ftb-088"></a>
### FTB-088 — Filament panel top navigation

**Status:** blocked (planning; panel contract and dependencies to be established). **GitHub:** [#90](https://github.com/Azab-Inc/filament-theme-builder/issues/90), child of #89. Configure `topNavigation()` on/off/inherited; retain defaults, persistence, reset, history, import/export, controlled real preview and valid PanelProvider output. Verify desktop/mobile and sidebar/topbar/navigation combinations, with TDD, Compose Playwright and authorized MCP preview/confirmed mutation and actual-client verification. Coordinate FTB-055. Full criteria: [#90](https://github.com/Azab-Inc/filament-theme-builder/issues/90).

### FTB-089–FTB-102 — Navigation and layout settings

**Status:** blocked (planning; establish panel configuration contract and dependencies). Each is a child of [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89) and is in GitHub Project #30. Verify Filament 5.9 signatures, all documented arguments and defaults, interactions and callback/class integration before implementation; coordinate FTB-018 and FTB-055. For each: accessible editing and reset; validation, existing-host defaults, persistence, import/export, undo/redo and migration; faithful real preview where applicable and valid PanelProvider output or explicit integration path; MCP discovery/read/preview/confirmed mutation with authorization, revalidation, capability inventory and actual-client verification; test-first regression and real Compose Playwright for visible behavior. CSS alone cannot stand in for PHP configuration. Full acceptance criteria are in each linked issue.

| Ticket | Option | GitHub issue |
| --- | --- | --- |
| <a id="ftb-089"></a>FTB-089 | `navigation` visibility/custom builder | [#91](https://github.com/Azab-Inc/filament-theme-builder/issues/91) |
| <a id="ftb-090"></a>FTB-090 | `navigationGroups` | [#92](https://github.com/Azab-Inc/filament-theme-builder/issues/92) |
| <a id="ftb-091"></a>FTB-091 | `navigationItems` | [#93](https://github.com/Azab-Inc/filament-theme-builder/issues/93) |
| <a id="ftb-092"></a>FTB-092 | `collapsibleNavigationGroups` | [#94](https://github.com/Azab-Inc/filament-theme-builder/issues/94) |
| <a id="ftb-093"></a>FTB-093 | `sidebarCollapsibleOnDesktop` | [#95](https://github.com/Azab-Inc/filament-theme-builder/issues/95) |
| <a id="ftb-094"></a>FTB-094 | `sidebarFullyCollapsibleOnDesktop` | [#96](https://github.com/Azab-Inc/filament-theme-builder/issues/96) |
| <a id="ftb-095"></a>FTB-095 | `sidebarWidth` | [#97](https://github.com/Azab-Inc/filament-theme-builder/issues/97) |
| <a id="ftb-096"></a>FTB-096 | `collapsedSidebarWidth` | [#98](https://github.com/Azab-Inc/filament-theme-builder/issues/98) |
| <a id="ftb-097"></a>FTB-097 | `sidebarLivewireComponent` | [#99](https://github.com/Azab-Inc/filament-theme-builder/issues/99) |
| <a id="ftb-098"></a>FTB-098 | `topbarLivewireComponent` | [#100](https://github.com/Azab-Inc/filament-theme-builder/issues/100) |
| <a id="ftb-099"></a>FTB-099 | `breadcrumbs`, including hierarchy | [#101](https://github.com/Azab-Inc/filament-theme-builder/issues/101) |
| <a id="ftb-100"></a>FTB-100 | `subNavigationPosition` | [#102](https://github.com/Azab-Inc/filament-theme-builder/issues/102) |
| <a id="ftb-101"></a>FTB-101 | `maxContentWidth` | [#103](https://github.com/Azab-Inc/filament-theme-builder/issues/103) |
| <a id="ftb-102"></a>FTB-102 | `simplePageMaxContentWidth` | [#104](https://github.com/Azab-Inc/filament-theme-builder/issues/104) |

### FTB-103–FTB-127 — Panel runtime and authentication options

**Status:** blocked (planning; establish panel configuration foundations). Each is a child of #89 and belongs to Project #30. Each issue requires documented arguments/defaults, inherited behavior, interaction and dependency analysis, host authorization and secret protection; accessible editing/reset, persistence, import/export, history and migration; faithful preview where applicable and valid PanelProvider output or explicit integration; relevant security and panel isolation tests; authorized MCP discovery/read/preview/confirmed mutation, revalidation, capability inventory and actual-client verification; TDD and real Compose Playwright for visible paths. Verify installed Filament 5.9 and coordinate FTB-018/055. Each linked issue carries its full criteria.

| Ticket | Panel option | GitHub issue |
| --- | --- | --- |
| <a id="ftb-103"></a>FTB-103 | `path` | [#105](https://github.com/Azab-Inc/filament-theme-builder/issues/105) |
| <a id="ftb-104"></a>FTB-104 | `domain` | [#106](https://github.com/Azab-Inc/filament-theme-builder/issues/106) |
| <a id="ftb-105"></a>FTB-105 | `domains` | [#107](https://github.com/Azab-Inc/filament-theme-builder/issues/107) |
| <a id="ftb-106"></a>FTB-106 | `renderHook` | [#108](https://github.com/Azab-Inc/filament-theme-builder/issues/108) |
| <a id="ftb-107"></a>FTB-107 | `bootUsing` | [#109](https://github.com/Azab-Inc/filament-theme-builder/issues/109) |
| <a id="ftb-108"></a>FTB-108 | `spa` and prefetching | [#110](https://github.com/Azab-Inc/filament-theme-builder/issues/110) |
| <a id="ftb-109"></a>FTB-109 | `spaUrlExceptions` | [#111](https://github.com/Azab-Inc/filament-theme-builder/issues/111) |
| <a id="ftb-110"></a>FTB-110 | `unsavedChangesAlerts` | [#112](https://github.com/Azab-Inc/filament-theme-builder/issues/112) |
| <a id="ftb-111"></a>FTB-111 | `databaseTransactions` | [#113](https://github.com/Azab-Inc/filament-theme-builder/issues/113) |
| <a id="ftb-112"></a>FTB-112 | `assets` | [#114](https://github.com/Azab-Inc/filament-theme-builder/issues/114) |
| <a id="ftb-113"></a>FTB-113 | `middleware` | [#115](https://github.com/Azab-Inc/filament-theme-builder/issues/115) |
| <a id="ftb-114"></a>FTB-114 | `authMiddleware` | [#116](https://github.com/Azab-Inc/filament-theme-builder/issues/116) |
| <a id="ftb-115"></a>FTB-115 | `broadcasting` | [#117](https://github.com/Azab-Inc/filament-theme-builder/issues/117) |
| <a id="ftb-116"></a>FTB-116 | `strictAuthorization` | [#118](https://github.com/Azab-Inc/filament-theme-builder/issues/118) |
| <a id="ftb-117"></a>FTB-117 | `errorNotifications` | [#119](https://github.com/Azab-Inc/filament-theme-builder/issues/119) |
| <a id="ftb-118"></a>FTB-118 | `registerErrorNotification` | [#120](https://github.com/Azab-Inc/filament-theme-builder/issues/120) |
| <a id="ftb-119"></a>FTB-119 | `hiddenErrorNotification` | [#121](https://github.com/Azab-Inc/filament-theme-builder/issues/121) |
| <a id="ftb-120"></a>FTB-120 | `disabledErrorNotification` | [#122](https://github.com/Azab-Inc/filament-theme-builder/issues/122) |
| <a id="ftb-121"></a>FTB-121 | `login` | [#123](https://github.com/Azab-Inc/filament-theme-builder/issues/123) |
| <a id="ftb-122"></a>FTB-122 | `registration` | [#124](https://github.com/Azab-Inc/filament-theme-builder/issues/124) |
| <a id="ftb-123"></a>FTB-123 | `passwordReset` | [#125](https://github.com/Azab-Inc/filament-theme-builder/issues/125) |
| <a id="ftb-124"></a>FTB-124 | `emailVerification` | [#126](https://github.com/Azab-Inc/filament-theme-builder/issues/126) |
| <a id="ftb-125"></a>FTB-125 | `emailChangeVerification` | [#127](https://github.com/Azab-Inc/filament-theme-builder/issues/127) |
| <a id="ftb-126"></a>FTB-126 | `profile` | [#128](https://github.com/Azab-Inc/filament-theme-builder/issues/128) |
| <a id="ftb-127"></a>FTB-127 | `multiFactorAuthentication` | [#129](https://github.com/Azab-Inc/filament-theme-builder/issues/129) |

### FTB-128–FTB-157 — Tenancy, search and styling options

**Status:** blocked (planning; establish shared panel configuration contract). Each is a child of #89 and belongs to Project #30. Each issue requires valid values, host defaults, interactions and application callback/class integration; accessible editing/reset, validation, persistence, import/export, history and migration; real preview where applicable and valid PanelProvider output or explicit integration; authorization and tenant-isolation tests; MCP discovery/read/preview/confirmed mutation, revalidation, capability inventory and actual AI-client verification; TDD and Compose Playwright for visible paths. Protect secrets and preserve light/dark isolation. Verify Filament 5.9 and coordinate FTB-018/055. Full criteria are in the linked issues.

| Ticket | Panel option | GitHub issue |
| --- | --- | --- |
| <a id="ftb-128"></a>FTB-128 | `tenant` | [#130](https://github.com/Azab-Inc/filament-theme-builder/issues/130) |
| <a id="ftb-129"></a>FTB-129 | `tenantRegistration` | [#131](https://github.com/Azab-Inc/filament-theme-builder/issues/131) |
| <a id="ftb-130"></a>FTB-130 | `tenantProfile` | [#132](https://github.com/Azab-Inc/filament-theme-builder/issues/132) |
| <a id="ftb-131"></a>FTB-131 | `tenantBillingProvider` | [#133](https://github.com/Azab-Inc/filament-theme-builder/issues/133) |
| <a id="ftb-132"></a>FTB-132 | `requiresTenantSubscription` | [#134](https://github.com/Azab-Inc/filament-theme-builder/issues/134) |
| <a id="ftb-133"></a>FTB-133 | `tenantBillingRouteSlug` | [#135](https://github.com/Azab-Inc/filament-theme-builder/issues/135) |
| <a id="ftb-134"></a>FTB-134 | `tenantMenuItems` | [#136](https://github.com/Azab-Inc/filament-theme-builder/issues/136) |
| <a id="ftb-135"></a>FTB-135 | `searchableTenantMenu` | [#137](https://github.com/Azab-Inc/filament-theme-builder/issues/137) |
| <a id="ftb-136"></a>FTB-136 | `tenantSwitcher` | [#138](https://github.com/Azab-Inc/filament-theme-builder/issues/138) |
| <a id="ftb-137"></a>FTB-137 | `tenantMenu` | [#139](https://github.com/Azab-Inc/filament-theme-builder/issues/139) |
| <a id="ftb-138"></a>FTB-138 | `tenantMiddleware` | [#140](https://github.com/Azab-Inc/filament-theme-builder/issues/140) |
| <a id="ftb-139"></a>FTB-139 | `tenantRoutePrefix` | [#141](https://github.com/Azab-Inc/filament-theme-builder/issues/141) |
| <a id="ftb-140"></a>FTB-140 | `tenantDomain` | [#142](https://github.com/Azab-Inc/filament-theme-builder/issues/142) |
| <a id="ftb-141"></a>FTB-141 | `globalSearch` | [#143](https://github.com/Azab-Inc/filament-theme-builder/issues/143) |
| <a id="ftb-142"></a>FTB-142 | `globalSearchResourceOptIn` | [#144](https://github.com/Azab-Inc/filament-theme-builder/issues/144) |
| <a id="ftb-143"></a>FTB-143 | `globalSearchKeyBindings` | [#145](https://github.com/Azab-Inc/filament-theme-builder/issues/145) |
| <a id="ftb-144"></a>FTB-144 | `globalSearchDebounce` | [#146](https://github.com/Azab-Inc/filament-theme-builder/issues/146) |
| <a id="ftb-145"></a>FTB-145 | `globalSearchFieldSuffix` | [#147](https://github.com/Azab-Inc/filament-theme-builder/issues/147) |
| <a id="ftb-146"></a>FTB-146 | `globalSearchFieldKeyBindingSuffix` | [#148](https://github.com/Azab-Inc/filament-theme-builder/issues/148) |
| <a id="ftb-147"></a>FTB-147 | `darkMode` | [#149](https://github.com/Azab-Inc/filament-theme-builder/issues/149) |
| <a id="ftb-148"></a>FTB-148 | `themeSwitcher` | [#150](https://github.com/Azab-Inc/filament-theme-builder/issues/150) |
| <a id="ftb-149"></a>FTB-149 | `defaultThemeMode` | [#151](https://github.com/Azab-Inc/filament-theme-builder/issues/151) |
| <a id="ftb-150"></a>FTB-150 | `brandName` | [#152](https://github.com/Azab-Inc/filament-theme-builder/issues/152) |
| <a id="ftb-151"></a>FTB-151 | `brandLogo` | [#153](https://github.com/Azab-Inc/filament-theme-builder/issues/153) |
| <a id="ftb-152"></a>FTB-152 | `darkModeBrandLogo` | [#154](https://github.com/Azab-Inc/filament-theme-builder/issues/154) |
| <a id="ftb-153"></a>FTB-153 | `brandLogoHeight` | [#155](https://github.com/Azab-Inc/filament-theme-builder/issues/155) |
| <a id="ftb-154"></a>FTB-154 | `favicon` | [#156](https://github.com/Azab-Inc/filament-theme-builder/issues/156) |
| <a id="ftb-155"></a>FTB-155 | `font` | [#157](https://github.com/Azab-Inc/filament-theme-builder/issues/157) |
| <a id="ftb-156"></a>FTB-156 | `colors` | [#158](https://github.com/Azab-Inc/filament-theme-builder/issues/158) |
| <a id="ftb-157"></a>FTB-157 | `viteTheme` | [#159](https://github.com/Azab-Inc/filament-theme-builder/issues/159) |

### FTB-158–FTB-180 — Menus, notifications, authentication routes and registration

**Status:** blocked (planning; shared panel configuration contract). Each is an issue child of #89 and in Project #30. Each requires version-specific signature/default verification, authorized handling of callbacks/classes and secrets, accessible editing/reset, persistence/import/export/history/migration, real preview when applicable, valid PanelProvider output or explicit integration, authorization and isolation tests, authorized MCP discovery/read/preview/confirmed mutation and actual-client verification, TDD and applicable real Compose Playwright. Coordinate FTB-018/055. See each linked issue for its full criteria. The moving 5.x docs and installed 5.9 source differ for some method names; resolve this before implementation, without assuming an alias exists.

| Ticket | Documented option | GitHub issue |
| --- | --- | --- |
| <a id="ftb-158"></a>FTB-158 | `userMenu` | [#160](https://github.com/Azab-Inc/filament-theme-builder/issues/160) |
| <a id="ftb-159"></a>FTB-159 | `userMenuItems` | [#161](https://github.com/Azab-Inc/filament-theme-builder/issues/161) |
| <a id="ftb-160"></a>FTB-160 | `databaseNotifications` | [#162](https://github.com/Azab-Inc/filament-theme-builder/issues/162) |
| <a id="ftb-161"></a>FTB-161 | Polling: docs `databaseNotificationsPollingInterval`; v5.9 `databaseNotificationsPolling` | [#163](https://github.com/Azab-Inc/filament-theme-builder/issues/163) |
| <a id="ftb-162"></a>FTB-162 | `defaultAvatarProvider` | [#164](https://github.com/Azab-Inc/filament-theme-builder/issues/164) |
| <a id="ftb-163"></a>FTB-163 | `authGuard` | [#165](https://github.com/Azab-Inc/filament-theme-builder/issues/165) |
| <a id="ftb-164"></a>FTB-164 | `authPasswordBroker` | [#166](https://github.com/Azab-Inc/filament-theme-builder/issues/166) |
| <a id="ftb-165"></a>FTB-165 | `revealablePasswords` | [#167](https://github.com/Azab-Inc/filament-theme-builder/issues/167) |
| <a id="ftb-166"></a>FTB-166 | `loginRouteSlug` | [#168](https://github.com/Azab-Inc/filament-theme-builder/issues/168) |
| <a id="ftb-167"></a>FTB-167 | `registrationRouteSlug` | [#169](https://github.com/Azab-Inc/filament-theme-builder/issues/169) |
| <a id="ftb-168"></a>FTB-168 | `passwordResetRoutePrefix` | [#170](https://github.com/Azab-Inc/filament-theme-builder/issues/170) |
| <a id="ftb-169"></a>FTB-169 | Request slug: docs `requestPasswordResetRouteSlug`; v5.9 `passwordResetRequestRouteSlug` | [#171](https://github.com/Azab-Inc/filament-theme-builder/issues/171) |
| <a id="ftb-170"></a>FTB-170 | Reset slug: docs `resetPasswordRouteSlug`; v5.9 `passwordResetRouteSlug` | [#172](https://github.com/Azab-Inc/filament-theme-builder/issues/172) |
| <a id="ftb-171"></a>FTB-171 | `emailVerificationRoutePrefix` | [#173](https://github.com/Azab-Inc/filament-theme-builder/issues/173) |
| <a id="ftb-172"></a>FTB-172 | `emailVerificationPromptRouteSlug` | [#174](https://github.com/Azab-Inc/filament-theme-builder/issues/174) |
| <a id="ftb-173"></a>FTB-173 | `emailVerificationRouteSlug` | [#175](https://github.com/Azab-Inc/filament-theme-builder/issues/175) |
| <a id="ftb-174"></a>FTB-174 | `emailChangeVerificationRoutePrefix` | [#176](https://github.com/Azab-Inc/filament-theme-builder/issues/176) |
| <a id="ftb-175"></a>FTB-175 | `emailChangeVerificationRouteSlug` | [#177](https://github.com/Azab-Inc/filament-theme-builder/issues/177) |
| <a id="ftb-176"></a>FTB-176 | `plugin` | [#178](https://github.com/Azab-Inc/filament-theme-builder/issues/178) |
| <a id="ftb-177"></a>FTB-177 | `plugins` | [#179](https://github.com/Azab-Inc/filament-theme-builder/issues/179) |
| <a id="ftb-178"></a>FTB-178 | `widgets` | [#180](https://github.com/Azab-Inc/filament-theme-builder/issues/180) |
| <a id="ftb-179"></a>FTB-179 | `resources` | [#181](https://github.com/Azab-Inc/filament-theme-builder/issues/181) |
| <a id="ftb-180"></a>FTB-180 | `pages` | [#182](https://github.com/Azab-Inc/filament-theme-builder/issues/182) |

Demo-showcase delivery order (prose delivery order (not hard dependency blockers)): **Phase 1 → FTB-011 → FTB-012 → FTB-013 → FTB-014 → FTB-015 → FTB-016 → FTB-017 → FTB-018**. The dependency map below remains the source of hard blockers. The demo-complete gate is satisfied by current Compose evidence: FTB-009A/B/010, FTB-011, FTB-013, FTB-014, FTB-015, FTB-016, FTB-017, and FTB-018 are done; FTB-012 remains partial solely for theme-density integration and is explicitly not a blocker. Operational FTB-027 and FTB-028 are done, with FTB-028's full-suite documentation-mount gap recorded in its report. Phase 1 owns the branded existing dashboard shell, four commerce widgets (`CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`, `RecentOrdersWidget`, `LowStockWidget`), resource icons, and representative badges. FTB-015 owns the Showcase navigation/index, search/profile/authentication/tenant surfaces and must integrate (not duplicate) Phase 1 widgets/navigation. The official demo is research inspiration only; identity is independent; do not copy official-demo branding, content, or presentation.

```text
FTB-001
├── FTB-002
│   ├── FTB-009A ── FTB-009B ── FTB-010
│   ├── FTB-027 (parallel operational ticket)
│   ├── FTB-028 (parallel operational ticket; blocked by FTB-009A and FTB-027)
│   └── FTB-035
└── FTB-003
    ├── FTB-004 ── FTB-024 ── FTB-026
    │             └── FTB-025 ── FTB-026
    ├── FTB-005
    │   ├── FTB-011
    │   ├── FTB-012
    │   ├── FTB-013
    │   ├── FTB-014
    │   ├── FTB-015
    │   ├── FTB-020
    │   └── FTB-031
    ├── FTB-006 ── FTB-007 ── FTB-008
    │   ├── FTB-017
    │   ├── FTB-018
    │   └── FTB-032
    ├── FTB-019
    ├── FTB-021 ── FTB-022 ── FTB-029 ── FTB-030
    └── FTB-023

Coverage/showcase tickets feed FTB-033 visual regression.
Runtime + persistence + tests feed FTB-034 Jenkins and FTB-035 production.
All public-alpha prerequisites feed FTB-038.
Complete first-party coverage feeds FTB-039, then FTB-040.
FTB-041 is independent and can start immediately.

Builder stylesheet compliance (FTB-076 umbrella closes only when all slices pass):
FTB-077 ── FTB-078 ──┬── FTB-079 ── FTB-081 ── FTB-083
                     ├── FTB-080 ── FTB-081
                     └── FTB-082 ── FTB-083

Phase 2 is release-blocked until all approved Phase 1 requirements and FTB-040
are complete. The eight Phase 2 slices below are vertical implementation
tickets, not horizontal test tickets. P2 identifiers are product requirements
from `docs/phase-2/PRD.md`; the implementation tickets are FTB-042 through
FTB-049. The package identity/namespace/Composer coordinates remain an
explicit release blocker and must not be invented in these tickets.
```

---

<a id="ftb-084"></a>

## FTB-084 — Add border-side controls for top, right, bottom and left (umbrella)

**Status:** testing (implementation present; full-unit gate blocked). **GitHub:** [#88](https://github.com/Azab-Inc/filament-theme-builder/issues/88), Open. **Project #30:** Testing.
**Blocked by:** FTB-085 and FTB-086 completion. **Spec:** [Border Side Controls](./docs/superpowers/specs/2026-11-18-border-side-controls-design.md).

### Problem and outcome

Checked on `dev`, 2026-11-18: the real Compose builder exposes default/strong border colors and a single foundation width; Components' separate-edge controls are padding only. The raw property inventory allows aggregate border color/width/style and radius, with no side properties; validation also rejects multi-value border-width shorthand. No existing tracked border-side feature was found.

Provide discoverable All sides / Top / Right / Bottom / Left border editing on verified border-bearing targets and raw Inspector elements. Support bottom-only, left-only, mixed and no-border cases, immediate real preview, predictable inheritance/reset, mode isolation, persistence, and export parity. Physical sides stay physical in RTL. Border radius is separate.

### Acceptance criteria

- [ ] Complete FTB-085 semantic border controls and FTB-086 raw Inspector support; retain each slice's full verification evidence.
- [ ] Distinguish inherited/native edges, explicit zero/none and mixed values; changing one side preserves siblings. All sides deliberately edits four sides as one history action; selecting a side alone does not mutate the theme.
- [ ] Existing themes and their native edge defaults remain unchanged until explicitly edited; specify migration and precedence before implementation.
- [ ] Light changes inherit into dark until an explicit dark edit; reset, variants/states, mode links, undo/redo, JSON and CSS preserve independent mode/edge values.
- [ ] All advertised border targets have verified Filament selectors/fixtures and computed-style browser evidence, including a ring/box-shadow-backed control where applicable; unsupported targets are identified rather than falsely advertised.
- [ ] MCP discovery/read/preview/confirmed-apply uses the same validated services as UI, with authorization, stale-state revalidation and actual AI-client evidence; update the capability inventory.
- [ ] Follow failing-first unit/integration and Playwright CLI tests, existing demo gate and applicable builder checks. Close only after both vertical slices pass.

**Related:** FTB-006/008/022, FTB-052/054/058/062/070/071. Existing project gates remain authoritative.

**2026-11-18 implementation checkpoint:** Both slices are saved in commit `4562f2e` on `dev`; acceptance is not signed off. Integrated Compose browser/MCP: 17 passed; affected PHP: 21 passed / 150 assertions; type-check and Compose production build passed. Full builder units: 719 passed / 1 failed in the concurrent stylesheet-compliance work (276 forbidden generated `--builder-*` names). The authorized assertion correction preserves the naming rule and does not rename tokens. Issues stay open. See [verification and limitations](./docs/verification/ftb-084-border-sides.md); independent reviewer re-approval is not claimed.

---

<a id="ftb-085"></a>

## FTB-085 — Add semantic border-side controls with preview and export parity

**Status:** testing (implementation present; full-unit gate blocked). **GitHub:** [#87](https://github.com/Azab-Inc/filament-theme-builder/issues/87), Open. **Project #30:** Testing. See the [shared verification checkpoint](./docs/verification/ftb-084-border-sides.md).
**Readiness:** Verify FTB-006/022 foundation evidence; coordinate FTB-071 inventory before editing shared seams. Do not wait for unrelated chart work or waive repository gates.
**Parent:** [FTB-084](#ftb-084). **Spec:** [Border Side Controls](./docs/superpowers/specs/2026-11-18-border-side-controls-design.md).

### What to build

Semantic border-side editing as a usable vertical slice: verified target inventory, Components/semantic Inspector controls, shared validated state, immediate preview, persistence/export and MCP parity.

### Acceptance criteria

- [ ] Before implementation, inventory real border-bearing selectors, wrapper/pseudo-element/ring behavior, supported variants/states and native defaults. Finalize canonical edge fields, limits, backward-compatible migration and shorthand/longhand precedence in the spec. Reuse existing theme/resolution boundaries; do not copy padding storage or invent selectors/defaults.
- [ ] Provide discoverable All sides, Top, Right, Bottom and Left selection with a clear active-side indicator and keyboard-accessible labels; side selection alone is presentation. Expose width including zero plus existing border color/style behavior needed for visible borders. Untouched styles/colors inherit; never silently create a border via an unrelated edit.
- [ ] One-side edits preserve sibling edges; All sides explicitly edits four sides as one undo step. Mixed values are honest; resetting one side removes only that override. Show native/inherited/explicit provenance; preserve native asymmetric borders on old themes.
- [ ] Demonstrate bottom-only, left-only, asymmetric and none on verified real Filament surfaces. Preserve physical sides in RTL; keep radius and shadow/ring controls distinct.
- [ ] Preserve Global → Component → Variant → State inheritance where supported and light-to-dark inheritance until explicit dark override. Verify reset, undo/redo, reload, mode links and any existing value guards.
- [ ] JSON import/export roundtrips edges and modes; minimal CSS emits explicit deviations, fully explicit CSS resolves supported edges correctly, and supported Tailwind export retains equivalent semantics. Use deterministic longhand ordering so broader border rules cannot re-enable disabled edges.
- [ ] Purpose-built MCP discovery/read/preview/confirmed-apply shares validation/resolution/mutation services with UI; authorization, rejected unsafe inputs, stale confirmation and actual AI-client transport are verified and inventoried.
- [ ] Write/run failing-first focused tests and a Playwright CLI test before production changes. Assert actual computed four-edge widths/styles/colors in Compose, keyboard and narrow viewport behavior, variants/states, inheritance, modes, reset/history, persistence and export in a fresh preview. Run applicable builder type-check, unit and build checks; report commands/results.

---

<a id="ftb-086"></a>

## FTB-086 — Add per-side border properties to raw Inspector

**Status:** testing (implementation present; full-unit gate blocked). **Prerequisite:** [FTB-085](#ftb-085)'s shared edge contract is implemented; both slices remain open until verification is complete. **GitHub:** [#86](https://github.com/Azab-Inc/filament-theme-builder/issues/86), Open. **Project #30:** Testing. See the [shared verification checkpoint](./docs/verification/ftb-084-border-sides.md).
**Parent:** [FTB-084](#ftb-084). **Spec:** [Border Side Controls](./docs/superpowers/specs/2026-11-18-border-side-controls-design.md).

### What to build

Extend raw Inspector border editing to individual physical edges using FTB-085's settled edge semantics and shared validation/projection seams. Deliver UI, persistence/export and MCP as one vertical slice. Coordinate FTB-052/062 where value guards/reset semantics overlap. Preserve the demo-first gate and unrelated worktree changes.

### Acceptance criteria

- [ ] Add safe top/right/bottom/left border width, color and style properties to the authoritative raw-property inventory and all dependent UI/DTO/validation, bridge, import, mode-link, token, preview/export and MCP allowlists. Reuse shared border validation; reject unsafe declarations, unsupported values and selectors through existing rules.
- [ ] Raw Inspector exposes All sides / Top / Right / Bottom / Left without requiring typed CSS. Selecting a side does not write state; editing one property affects only that edge/property. Color references retain existing native-picker/token behavior.
- [ ] Existing aggregate raw border properties remain backward compatible. Specify deterministic aggregate/edge precedence independent of edit/serialization order; clearing an edge restores the applicable inherited aggregate/native value. Explicit zero or none is not mistaken for missing data. A group edit is one history action.
- [ ] Top-only, bottom-only, left-only, right-only, mixed and none work against real picked elements; the active selector, mode and state remain scoped. Semantic overrides and raw precedence remain consistent, with sibling targets/edges and unrelated radius/shadow untouched.
- [ ] Verify inherited light-to-dark values and independent dark overrides, reset, undo/redo, mode links, autosave/reload and versioned JSON roundtrips. Both minimal and fully explicit CSS and supported Tailwind output match actual preview without shorthand re-enabling edges.
- [ ] Update MCP raw capability discovery/read/preview/confirmed-apply and inventory through the same services; prove authorization, invalid input rejection, stale-state revalidation and an actual AI-client edge edit.
- [ ] Write/run failing-first unit/integration and Playwright CLI tests before implementation. Verify picked real Filament computed edge styles, keyboard/narrow layout, colors/tokens, modes/states/history, reload/import and exported CSS in a fresh preview; run applicable builder checks and report commands/results.

---

<a id="ftb-065"></a>

## FTB-065 — Resize the editor and demo preview with a divider handle

**Status:** done

**GitHub:** [#67](https://github.com/Azab-Inc/filament-theme-builder/issues/67)

### What to build

Add a draggable vertical resize handle at the boundary between the builder editor sidebar and the embedded demo preview, at the position marked by the red line in the request screenshot. Resizing redistributes the available horizontal space between the editor and preview.

### Acceptance criteria

- [x] A discoverable handle sits on the editor/preview boundary; dragging left or right immediately changes both pane widths while retaining the overall available width.
- [x] The editor and preview remain usable at reasonable minimum widths; resizing is constrained to the available viewport and works across supported viewport sizes and both editor navigation layouts.
- [x] The handle is keyboard-operable, visibly focusable and exposes an accessible name, separator semantics, orientation and current/minimum/maximum values. Pointer and touch interactions work reliably, including when dragging across the embedded preview.
- [x] Resizing preserves the current editor and demo state, theme values, mode isolation, undo/redo and Inspector/preview interactions; the preview responds to its new available width.
- [x] Define and document the initial width, resizing bounds and behavior when the viewport changes; do not introduce unrequested theme/export changes.
- [x] Update the MCP capability inventory: expose any new product capability through appropriately authorized shared services with preview/confirmation and revalidation where applicable, and verify authorization and an actual AI client. Document if resizing is solely ephemeral presentation and how the inventory accounts for it.

### Verification

- [x] Follow TDD: write and run focused failing regression tests before implementing, then verify resizing, bounds, keyboard behavior and relevant state preservation.
- [x] Create and run a failing Playwright CLI test before implementation; verify dragging in both directions, crossing the embedded preview, keyboard operation, viewport constraints, both editor navigation layouts and continued editor/preview functionality against the real application.
- [x] Run applicable builder checks and document actual verification results.

### Completion and verification

Implementation commit: `022c391` (`Feature: resize editor and preview with accessible divider`).

Implemented an accessible pointer/touch/keyboard divider with 280px pane minimums, viewport reclamping and in-memory presentation state. The MCP inventory documents the UI-only ephemeral exception and responsive sizing contract; no domain mutation or MCP authorization/client flow was introduced.

Verification on the integrated working tree based on `94be5cd`: from `builder/`, `npm run type-check` passed and `npm run test:unit -- --run` passed (144 files, 665 tests). From the repository root, `docker compose -f compose.dev.yaml exec -T builder-vite npm run build` passed. `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-065-editor-resize.spec.ts --reporter=line` passed (5 tests); the same command targeting `e2e/ftb-050-editor-layout.spec.ts` passed (10 tests). `git diff --check` passed. Browser coverage includes real Chromium touch across the iframe, both navigation layouts, bounds, keyboard ARIA endpoints, viewport reclamping, and continued mode/history/Inspector behavior.

Failing-first evidence is the initial Playwright run failing because the divider was absent; the supplementary focused unit tests were added afterward. Existing unit-suite assertion drift and dangling closed-panel ARIA references were repaired before the final green run. Pre-existing unrelated working-tree edits were retained and excluded from the implementation commit.

**Related:** FTB-019 responsive preview, FTB-050 editor navigation modes. Follow the repository demo-first gate and existing project guidance.

---

<a id="ftb-052"></a>

## FTB-052 — Add strict per-value builder padlocks

**Status:** blocked
**Blocked by:** FTB-003 functionality stabilization; the unchanged demo-first gate and remaining Phase 1 requirements (including FTB-018); existing foundation/control projection stabilization; [FTB-022](#ftb-022) versioned JSON import/export and migration boundary. FTB-012's density-only partial status is not a blocker.
**Gate note:** local root guidance and tracker issue states may be stale or inconsistent; the root demo-first gate remains in force until its documented acceptance criteria and evidence are resolved. Tracker status alone does not mark the gate complete.
**Spec:** [Builder Value Padlocks](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md), including [lock semantics](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#2-user-visible-contract), [persistence and migration](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#3-state-persistence-and-migration), [MCP and authorization](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#5-mcp-and-authorization-contract), and [testing](./docs/superpowers/specs/2026-10-13-builder-value-padlocks-design.md#7-testing-and-observable-seams).
**GitHub:** [#52](https://github.com/Azab-Inc/filament-theme-builder/issues/52)
**Review fixed point:** `66c8b6e543717f41266b8c100d7cdeaa291dbdb1` (refresh before implementation review if functionality changes).

### What to build

Give every editable builder value a left-side padlock. A lock snapshots the currently resolved effective value—including inherited/CSS-variable values and each generated palette shade—and strictly prevents direct edits, pickers, regeneration, reset, undo/redo, and bulk operations from changing it until explicit unlock. Unlocked values continue to apply in mixed operations, which report skipped locked fields. Unlock only permits future edits and does not silently restore or regenerate anything.

### <a id="ftb-052-lock-semantics"></a>Lock semantics

- [ ] The lock inventory is generated from the complete editable registry/control inventory beyond foundations: icons/resource overrides, fonts, runtime/branding values, raw/component/variant/state paths, aliases, light/dark values, and typography composites are covered; no editable control is silently omitted.
- [ ] Every field has a reusable left-side lock control with stable field naming, keyboard support, `aria-pressed`, accessible label, protection tooltip, and non-color-only locked styling.
- [ ] Locking resolves and stores the effective current value; source expression/provenance remains informational. Missing, malformed, ambiguous, or unresolved values fail without guessing or empty overwrite.
- [ ] Aliases share one canonical lock identity; light/dark values are separate; typography locks the whole composite value; every generated shade 50–950, including 500, can be independently locked.
- [ ] A centralized guard protects direct edits, pickers, selectors, regeneration, per/group reset, undo/redo, and bulk theme/preset/import operations. Explicit unlock is the only protection-state change, and unlock does not restore or regenerate the value.
- [ ] Mixed operations update unlocked values, preserve locked effective values, and report every skipped field and reason.

### <a id="ftb-052-persistence-and-migration"></a>Persistence and migration

- [ ] Versioned lock metadata is included in canonical theme JSON, local autosave, reload/bootstrap, and JSON export/import; old themes migrate to all unlocked.
- [ ] Metadata validates schema/version, canonical paths, value compatibility, source metadata, and integrity hashes. Invalid, stale, duplicate, unknown, or unsafe metadata fails safely without damaging the current theme.
- [ ] Current locks take precedence when merging imported locked/unlocked fields. Serialized locks are restored at bootstrap after validation.
- [ ] Migration preview, exact-key acceptance, and JSON export parity are tested; no keys are added silently.
- [ ] Generated shade projection/materialization freezes the locked shade in actual preview and effective export, while unlocked peer shades still regenerate normally when the base changes.

### <a id="ftb-052-mcp-coverage"></a>MCP coverage

- [ ] Purpose-built MCP discovery/read/preview/apply capabilities expose editable values, effective values, and lock state through the capability inventory.
- [ ] Lock, unlock, and multi-value apply mutations require explicit preview confirmation and revalidate authorization, current state, resolution, compatibility, and locks at apply time.
- [ ] MCP uses the same centralized service as UI, cannot bypass locks or authorization, rejects untrusted selectors/CSS payloads, and reports partial skips.
- [ ] Authorization, malformed input, stale apply, and actual AI-client transport evidence are tested and documented; this is not claimed as UI-only behavior.

### <a id="ftb-052-verification"></a>Verification

- [ ] TDD unit/component tests cover the complete inventory, snapshot/materialization failures, all shade locks, aliases, modes, typography, every blocked operation, partial application, migration, persistence, malformed metadata, stale async rechecks, preview projection, and export parity.
- [ ] Playwright verifies inventory, left-side controls, keyboard/tooltip accessibility, lock/unlock, shade regeneration, reset, undo/redo, import, reload, mode separation, aliases, composite typography, partial reporting, and visible preview/export freezing.
- [ ] MCP capability discovery, confirmation, authorization, revalidation, lock/unlock, partial skip, and AI-client verification pass.
- [ ] Existing demo-first gate, foundation stability prerequisite, and unrelated worktree changes remain intact; no parent issue is modified and no dependency is added.

---

<a id="ftb-001"></a>

## FTB-001 — Bootstrap the sibling-app monorepo

**Status:** done
**Blocked by:** None (can start immediately)

### What to build

Create the repository foundation as one monorepo containing an independent Vue 3 builder application and an independent Laravel 13 / Filament 5 demo application. The local developer experience must support Laravel Sail and simple root-level commands so a contributor can start, test, and build the project without learning two unrelated command sets.

### Acceptance criteria

- [ ] The repository contains independently runnable builder and demo applications.
- [ ] The builder uses Vue 3, Vite, Pinia, and npm.
- [ ] The demo uses Laravel 13, PHP 8.5, Filament 5, and Laravel Sail.
- [ ] Root developer commands exist for setup, development, tests, E2E, and production build.
- [ ] A fresh checkout can be brought to a working local state using documented commands.
- [ ] No GitHub Actions configuration is introduced.
- [ ] Basic smoke tests prove both applications boot.

---

<a id="ftb-002"></a>

## FTB-002 — Deliver the real public Filament preview shell

**Status:** done
**Blocked by:** [FTB-001](#ftb-001)

### What to build

Provide a real Filament 5 preview application that can be embedded by the builder and navigated publicly without authentication. Also provide a real demo login screen whose visible helper text advertises the working credentials user / password, while keeping login optional for the normal preview experience.

### Acceptance criteria

- [x] The Filament panel is reachable publicly without logging in.
- [x] The preview is embeddable by the builder.
- [x] A real login page exists.
- [x] The login page visibly displays Username: user and Password: password.
- [x] Those credentials authenticate successfully.
- [x] Logging out does not prevent continued access to the public preview.
- [x] A subtle notice location exists for future demo-reset messaging.
- [x] The preview exposes a safe bridge hook for later builder communication.

---

<a id="ftb-003"></a>

## FTB-003 — Make the first theme edit work end to end

**Status:** done
**Blocked by:** [FTB-001](#ftb-001), [FTB-002](#ftb-002)

### What to build

Implement the canonical versioned theme state, a Pinia-backed editor state, iframe messaging, and dynamic preview CSS injection so a user can change one global theme value in Vue and see the real Filament preview update immediately without a Vite rebuild or Laravel request. Include undo/redo and debounced local autosave for this first end-to-end slice.

### Acceptance criteria

- [x] Theme state includes an explicit schemaVersion.
- [x] The builder can change at least the global primary color.
- [x] The preview updates immediately through client-side messaging.
- [x] Normal edits do not require a page reload, Laravel request, or asset rebuild.
- [x] Undo and redo work for the edit.
- [x] The current draft is automatically persisted to local storage with a short debounce.
- [x] Reloading the builder restores the current draft.
- [x] The preview accepts messages only from allowed origins/configuration.

---

<a id="ftb-004"></a>

## FTB-004 — Export a usable minimal vanilla theme.css

**Status:** done
**Blocked by:** [FTB-003](#ftb-003), demo-complete gate ([FTB-009A](#ftb-009), [FTB-009B](#ftb-009b), [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015))

### What to build

Turn canonical theme state into readable vanilla CSS and let the user copy or download a minimal theme.css that reproduces the current explicit changes in a normal Filament 5 custom theme.

### Acceptance criteria

- [x] Vanilla CSS is the default export syntax. Evidence: `vanilla-css-export.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] Minimal export emits only explicit overrides rather than every default. Evidence: `vanilla-css-export.spec.ts`.
- [x] Exported CSS is readable, grouped, and commented. Evidence: `vanilla-css-export.spec.ts`.
- [x] The file begins with a small Generated with Filament Theme Builder attribution. Evidence: `vanilla-css-export.spec.ts`.
- [x] Copy and download actions are available. Evidence: `App.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] The exported first-slice theme reproduces the previewed primary-color edit in the validated Filament 5 projection contract. Evidence: exporter and Compose preview integration tests.
- [x] No minification is applied to the downloaded source. Evidence: `vanilla-css-export.spec.ts`.

---

<a id="ftb-005"></a>

## FTB-005 — Deliver complete global foundations editing

**Status:** done
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Expand the editor from the first color edit into the complete global foundation controls: semantic colors, surfaces, light/dark values, palette shade generation and overrides, typography, spacing scale, density, radii, borders, and shadows.

### Acceptance criteria

- [x] Primary, success, warning, danger, info, and gray palettes are editable. Evidence: `builder/src/__tests__/foundation-defaults.spec.ts`, `builder/src/__tests__/App.spec.ts`, and `e2e/theme-foundations.spec.ts` cover the six palette controls.
- [x] Page, sidebar, topbar, card/elevated, input, border, and text layers are editable. Evidence: typed default/control coverage in `foundation-defaults.spec.ts` and the rendered control/reset coverage in `App.spec.ts` and `e2e/theme-foundations.spec.ts`.
- [x] Relevant values can differ between light and dark mode. Evidence: independent defaults and light/dark resolution in `foundation-defaults.spec.ts` and `theme-state.spec.ts`; Compose Playwright verifies mode projection in `theme-foundations.spec.ts`.
- [x] A base color can generate a 50–950 palette. Evidence: `builder/src/__tests__/palette-generator.spec.ts` and `foundation-defaults.spec.ts` assert all eleven shades and deterministic generation.
- [x] Individual generated shades can be overridden. Evidence: `palette-generator.spec.ts`, `theme-state.spec.ts`, and the Compose Playwright shade override/reset journey in `e2e/theme-foundations.spec.ts`.
- [x] System fonts, curated Google Fonts, and custom font-family names are represented. Evidence: `App.spec.ts` and `e2e/theme-foundations.spec.ts` exercise system, curated-name, and custom-name choices; the same E2E test verifies no font loading.
- [x] Density presets include Compact, Default, and Spacious. Evidence: `foundation-defaults.spec.ts`, `theme-state.spec.ts`, and the density controls in `App.spec.ts`/`e2e/theme-foundations.spec.ts`.
- [x] Global spacing scale, radius, border, and shadow controls are available. Evidence: `App.spec.ts` and `e2e/theme-foundations.spec.ts` cover controls, edits, persistence, and resets.
- [x] Preview changes remain immediate. Evidence: `e2e/theme-foundations.spec.ts` verifies real iframe updates/events without reload or non-GET traffic; `builder/src/__tests__/foundation-projection.spec.ts` and `demo/tests/Feature/FilamentPanelTest.php` cover the validated bridge contract.
- [x] Reset-to-default behavior works for every foundation control. Evidence: per-control reset rendering in `App.spec.ts`, store reset/history coverage in `theme-state.spec.ts`, and the Compose Playwright reset/persistence journey in `e2e/theme-foundations.spec.ts`.

FTB-005 evidence was recorded after these fresh checks: `cd builder && npm run type-check && npm run test:unit -- --run && npm run build` (121 unit tests); `docker compose -f compose.dev.yaml exec -T demo-php php artisan test tests/Feature/FilamentPanelTest.php` (7 tests, 43 assertions); `docker compose -f compose.dev.yaml exec -T demo-php php artisan test` (148 tests, 1,394 assertions); `docker compose -f compose.dev.yaml exec -T demo-php vendor/bin/pint --test` (277 files); `docker compose -f compose.dev.yaml exec -T demo-php vendor/bin/phpstan analyse` (251 files, no errors); `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/theme-foundations.spec.ts` (3 passed); and Compose `/api/health` (`{"status":"ok"}`). The full Playwright command was also run: the three FTB-005 tests passed, while nine unrelated existing tests failed because they hard-code unavailable host ports 4173/4174; this does not leave an FTB-005 acceptance gap.

Final hardening wave evidence (2026-10-12): V3 nested payload validation now requires every foundation record, rejects unknown/malformed/non-finite/unsafe values and override identities, and the bridge accepts only exact inventory tuples. The inventory has an explicit classification and absence reason for all 100 FTB-005 controls; UI statuses read that inventory and no longer serialize `explicitPaths`; curated fonts use the shared finite allowlist. Fresh final-pass checks: builder type-check, 126 unit tests, builder production build, focused Compose PHP bridge suite (7 tests, 50 assertions), full Compose PHP suite (148 tests, 1,401 assertions), Pint (277 files), PHPStan (251 files), foundation Playwright (3 passed), and `/api/health` (`{"status":"ok"}`).

FTB-012 density integration and FTB-018 branding/runtime consumption remain separate work. This status does not lift the demo-first gate or claim completion of those tickets.

---

<a id="ftb-006"></a>

## FTB-006 — Implement the semantic theme-control registry and inheritance

**Status:** done
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Create the version-aware registry that maps semantic Filament UI concepts to stable selectors and supported controls. Implement inheritance from Global to Component to Variant to State, with explicit overrides only when a child departs from its inherited value.

### Acceptance criteria

- [x] Registry entries have stable semantic IDs independent of display labels. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — “keeps labels independent from stable semantic IDs” checks stable IDs and labels.
- [x] Entries can declare one or more Filament selectors and supported controls. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — registry metadata and malformed selector/control tests.
- [x] Registry metadata records the Filament compatibility baseline. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — compatibility rejection and conflicting-baseline tests.
- [x] Theme values inherit Global → Component → Variant → State. Evidence: `builder/src/__tests__/theme-resolver.spec.ts` — “resolves Global → Component → Variant → State and nearest parent fallback”.
- [x] Child controls default to Inherit. Evidence: `builder/src/__tests__/theme-state.spec.ts` — “stores Inherit as absence and reset removes only the selected override”.
- [x] Resetting an override returns it to inherited behavior rather than copying the parent value. Evidence: `builder/src/__tests__/theme-state.spec.ts` — reset resolves to legacy global after override removal; `builder/src/__tests__/theme-resolver.spec.ts` — inheritance resolution and explicit-equal-value tests.
- [x] Minimal export can distinguish inherited values from explicit overrides. Evidence: `builder/src/__tests__/theme-serialization.spec.ts` — “minimal serialization keeps only sparse explicit overrides” checks explicit-equal child retention and inherited-copy absence.
- [x] A representative component demonstrates all four inheritance levels. Evidence: `builder/src/__tests__/theme-resolver.spec.ts` — the `button.primary.background` fixture resolves global, component, variant, and state contributions. This is a tested domain example, not a user-visible UI demonstration.
- [x] Registry lookup can resolve an element to a semantic theme target. Evidence: `builder/src/__tests__/theme-registry.spec.ts` — unique selector matches to `button.primary`, `button.secondary`, and `global.primary`, alongside deterministic no-match and ambiguous results.

FTB-006 evidence is limited to the tested registry, resolver, serialization, migration, persistence, and history domain contract. It does not claim a user-visible Inspector or full theme-editor UI; Inspector behavior remains FTB-007.

Remediation evidence: `theme-state.spec.ts` verifies canonical `colors.primary` inheritance without synthetic overrides and duplicate-payload quarantine; `theme-resolver.spec.ts` verifies typed invalid-request/invalid-state results and duplicate identity rejection; `theme-serialization.spec.ts` verifies invalid scope requests are rejected before traversal; `theme-registry.spec.ts` verifies cloned, normalized immutable constraint metadata.

---

<a id="ftb-007"></a>

## FTB-007 — Add semantic Inspector mode

**Status:** done
**Blocked by:** [FTB-006](#ftb-006)

### What to build

Let the user enter Inspector mode, hover real Filament elements, see a visible highlight, select an element, and jump directly to the matching semantic controls while preserving a clear semantic breadcrumb.

### Acceptance criteria

- [x] Inspector mode can be toggled without breaking normal preview navigation.
- [x] Hovered inspectable elements receive a temporary outline.
- [x] The selected element remains visibly outlined.
- [x] Selection resolves through the semantic registry where possible.
- [x] The editor navigates to the matching category/control automatically.
- [x] A semantic breadcrumb is displayed, with canonical labels for mapped controls and bridge evidence for selector-only matches.
- [x] Selecting nested elements chooses a sensible semantic target rather than the most deeply nested DOM node by default.
- [x] Inspector communication works across the builder/preview iframe boundary.

Evidence: `builder/src/__tests__/App.spec.ts`,
`builder/src/__tests__/inspector-protocol.spec.ts`,
`e2e/ftb-007-inspector.spec.ts`, `e2e/ftb-007-bridge.spec.ts`, and
`demo/tests/Feature/PreviewInspectorBridgeTest.php`. The capability contract is
recorded as `preview.inspector` (read-only / UI-only, no MCP mutation tool) in
`docs/ai-operability/demo-showcase-capability-inventory.md`.

---

<a id="ftb-008"></a>

## FTB-008 — Add advanced raw-element styling to Inspector

**Status:** done
**Blocked by:** [FTB-007](#ftb-007)

### What to build

Extend Inspector so a user can style an element even when the curated registry is incomplete. The system should propose a stable selector, expose advanced raw-element controls alongside semantic controls, and warn when a reliable selector cannot be identified.

### Acceptance criteria

- [x] Semantic and Advanced controls are both available for a selected element. Evidence: `App.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] Stable Filament classes are preferred when proposing selectors. Evidence: `raw-overrides.spec.ts`.
- [x] Brittle structural selectors are avoided when a semantic selector exists. Evidence: `raw-overrides.spec.ts`.
- [x] The UI warns when the proposed selector is likely fragile. Evidence: `raw-overrides.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] A user can edit/replace the proposed selector. Evidence: `App.spec.ts` and `e2e/ftb-008-raw-inspector.spec.ts`.
- [x] Raw element overrides become part of canonical theme state. Evidence: `theme-state.spec.ts` and `theme-serialization.spec.ts`.
- [x] Raw overrides participate in undo/redo, persistence, JSON export, and CSS export. Evidence: builder unit/export tests and Compose Playwright coverage.
- [x] Raw overrides do not silently overwrite semantic registry data. Evidence: `theme-state.spec.ts` and `App.spec.ts`.

Review-blocker remediation evidence for `e4ef5fa` (2026-10-14): builder unit
tests (223 passed), type-check, and production build pass; CSS download bytes,
clipboard content, canonical JSON `rawOverrides`, reload/reset, deterministic
section/rule ordering, selector-rename conflict handling, and clean Filament
fixture parity are covered by `App.spec.ts`, `theme-state.spec.ts`,
`vanilla-css-export.spec.ts`, and the six Compose Playwright tests in
`e2e/ftb-008-raw-inspector.spec.ts`. The bridge rejects unsafe selectors,
unsafe values, duplicate selectors, and preserves valid ordering in browser
behavior; PHP bridge tests pass (4 tests, 48 assertions).

---

<a id="ftb-009"></a>

## FTB-009A — Build the realistic e-commerce demo domain

**Status:** done
**Blocked by:** [FTB-002](#ftb-002)

### What to build

Define and persist a coherent e-commerce demo domain rich enough to exercise Filament without turning the preview into unrelated kitchen-sink data. This is the first slice of the former FTB-009; its existing anchor remains stable.

### Acceptance criteria

- [x] All entities in [SPECS.md §14](./SPECS.md#14-demo-domain) are represented, including customers, addresses, products, categories, variants, tags, reviews, orders, order items, payments, refunds, shipments, inventory, suppliers, discounts, and appropriate notes/activity/status history. See [`EcommerceSchemaTest`](./demo/tests/Feature/Domain/EcommerceSchemaTest.php).
- [x] Migrations, Eloquent models, and relationships implement the complete domain graph. See [`EcommerceRelationshipsTest`](./demo/tests/Feature/Domain/EcommerceRelationshipsTest.php).
- [x] Factories and deterministic seeders produce repeatable, non-production disposable demo data. See [`EcommerceSeedTest`](./demo/tests/Feature/Domain/EcommerceSeedTest.php).
- [x] The model graph naturally includes BelongsTo, HasMany, BelongsToMany, and polymorphic relationships.

---

<a id="ftb-009b"></a>

## FTB-009B — Build core CRUD resources and navigation

**Status:** done
**Blocked by:** [FTB-009A](#ftb-009)

### What to build

Expose the seeded e-commerce domain through useful core Filament CRUD resources and coherent navigation.

### Acceptance criteria

- [x] Seed data is deterministic enough for screenshots and repeatable tests (covered by [`EcommerceSeedTest`](./demo/tests/Feature/Domain/EcommerceSeedTest.php)).
- [x] All 17 entities in [SPECS.md §14](./SPECS.md#14-demo-domain) have list/create/edit/view resource surfaces; [`EntityResourcesTest`](./demo/tests/Feature/Filament/Resources/EntityResourcesTest.php) is the executable matrix.
- [x] Core resources expose meaningful lists, create/edit forms, view states, badges, images, money, and status values.
- [x] Core resources are grouped in coherent admin navigation; navigation and public dashboard are covered by `EntityResourcesTest` and [`FilamentPanelTest`](./demo/tests/Feature/FilamentPanelTest.php).
- [x] Navigation feels like one coherent admin application.
- [x] Demo data is explicitly non-production and disposable.

---

<a id="ftb-010"></a>

## FTB-010 — Demonstrate Relation Managers and Nested Resources

**Status:** done
**Blocked by:** [FTB-009B](#ftb-009b)

### What to build

Use the e-commerce model to demonstrate Filament relationship UI as real workflows after the domain and core CRUD resources are ready, including representative Relation Managers, Nested Resources, and explicit relationship actions.

### Acceptance criteria

- [x] At least one resource contains multiple meaningful Relation Managers.
- [x] Nested Resources are used where full-page related editing is appropriate.
- [x] Attach and detach actions are explicitly available where applicable.
- [x] Associate and dissociate actions are explicitly available where applicable.
- [x] Related-record create/edit actions are demonstrated where appropriate.
- [x] Relationship tables contain filters/actions/states useful for theming.
- [x] Relationship forms and modals are represented.
- [x] The coverage manifest distinguishes Relation Managers from Nested Resources. See [SPECS.md §15](./SPECS.md#15-relation-managers-and-nested-resources), [`RelationshipWorkflowsTest`](./demo/tests/Feature/Filament/Resources/RelationshipWorkflowsTest.php), and [`demo-panel.spec.ts`](./e2e/demo-panel.spec.ts).

---

<a id="ftb-011"></a>

## FTB-011 — Cover Forms and Schemas visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create a Forms & Schemas showcase containing every visually distinct first-party Filament 5 form/schema component and layout that matters for theming, and connect those elements to the semantic theme registry.

### Acceptance criteria

- [x] `ShowcaseFormsPage` contains named fixtures `ProductEditorForm` (text, price, select, toggle, date, upload), `CustomerContactForm` (address/contact fields), and `OrderStatusForm` (status and validation states), with relevant registry targets.
- [x] `ProductEditorForm` demonstrates `SectionGridLayout`, `WizardStepsLayout`, and `TabbedFormLayout` as distinct surfaces, not identical API permutations.
- [x] Applicable default, filled, focused, disabled, and validation-error states have a deterministic representation.
- [x] Registry entries exist for the relevant themable surfaces.
- [x] Global/component/variant/state inheritance is demonstrable on the production `form.product-name` target (`.fi-fo-text-input .fi-input`, `background-color`) through the canonical resolver/store and the real focused forms showcase; evidence: `theme-registry.spec.ts`, `theme-resolver.spec.ts`, `theme-state.spec.ts`, and the Compose Playwright forms acceptance test.
- [x] Duplicate API permutations that render identically are not added just to inflate coverage.

Implementation: `0aac781` (`Feature: add forms and schemas showcase`); verification: [`FormsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Completed: native fixtures and selector-only registry coverage include every visually distinct Filament 5.9 form/schema surface with a vendor/runtime CSS root, including the verified Fieldset/Grid, Repeater, Radio, ToggleButtons, Builder, Checkbox, CheckboxList, CodeEditor, ColorPicker, KeyValue, MarkdownEditor, ModalTableSelect, OneTimeCodeInput, RichEditor, Slider, TagsInput, Actions, Callout, EmptyState, Form, FusedGroup, Icon, Image, Text, UnorderedList, Tabs, and Wizard surfaces. DatePicker/DateTimePicker/TimePicker and Select/MultiSelect/MorphToSelect intentionally share one registry entry where Filament renders the same surface; non-visual Hidden, Placeholder, ViewField, Html, Group, and embedded/runtime-only components are not duplicated as visual targets. Deterministic native default/filled/optional-null, focused, disabled, and validation-error evidence is covered by `FormsShowcaseTest` and the Compose Playwright forms acceptance tests. Forced-state controls remain outside this ticket and belong to FTB-016.

---

<a id="ftb-012"></a>

## FTB-012 — Cover Tables visually

**Status:** done (2026-11-28). **GitHub:** [#12](https://github.com/Azab-Inc/filament-theme-builder/issues/12). **Project #30:** Done. Density MCP completion is uncommitted on `dev`, base `7e471f3`; nothing was pushed.
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create a Tables showcase and realistic table fixtures covering all visually distinct first-party Filament table states and capabilities relevant to theme design.

### Acceptance criteria

- [x] `TablesShowcase` contains a native read-only `ProductsTableFixture` with text, image, badge/icon, and distinct column treatments using deterministic seeded products and order counts.
- [x] The fixture demonstrates search, sorting, filters, grouping, pagination, summaries, and column toggling.
- [x] Row selection, bulk actions, row actions, and reorder support are represented where installed; read-only actions require confirmation and do not mutate seeded records.
- [x] Empty and loading states, invalid filters, missing image/relationship data, long names, mobile layout, and selection reset are covered deterministically.
- [x] Coverage is registered in `COVERAGE.md` with Livewire and Playwright sources for table surfaces, rows, headers, controls, and relevant states.
- [x] Table density/spacing changes visibly respond to theme controls. Evidence: `builder/src/__tests__/foundation-projection-scopes.spec.ts` covers the verified `.fi-ta` projection tuple, and `e2e/theme-foundations.spec.ts` verifies Compact/Default/Spacious changes on the native Products/Orders/Inventory tables in the Compose preview iframe without reload or non-GET traffic. The bridge uses only verified Filament 5.9 `.fi-ta-header`, `.fi-ta-header-cell`, `.fi-ta-text`, `.fi-ta-icon`, `.fi-ta-image`, and `.fi-ta-cell.fi-ta-selection-cell` selectors.
- [x] MCP discovery/read/preview/set/reset supports the shared finite density presets through canonical `setDensity`/`resetFoundation` actions, without mode links or a schema change. Failing-first domain/browser regressions and actual stdio-client coverage verify pairing authorization, invalid inputs, preview without mutation, cancellation, revision-bound confirmation, stale rejection, atomic spacing/history, unrelated-value preservation, JSON read/export, reload persistence, and three-table/native geometry parity. Sources: `theme-relay-density.spec.ts`, `e2e/ftb-012-density-mcp.spec.ts`, and the [capability inventory](./docs/ai-operability/demo-showcase-capability-inventory.md).

The native tables and interaction contract are implemented. Density integration is limited to the evidence-backed table selectors above; unrelated Filament controls remain unchanged and FTB-011 partial/native themability gaps are not claimed here.

Implementation: `293b7aa` (`Feature: add tables showcase fixtures`); verification: [`TablesShowcaseTest`](./demo/tests/Feature/Filament/Showcase/TablesShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Completion verification on base `7e471f3` plus only the scoped density MCP implementation/tests/inventory (initial worktree clean):

- `builder/`: `npm run test:unit -- --run src/__tests__/foundation-projection-scopes.spec.ts src/__tests__/foundation-inventory-evidence.spec.ts src/__tests__/theme-state-density.spec.ts` — exit 0, 20 passed. New density boundary units — 16 passed. Initial meaningful red: density intent parsed as null; later tests exposed link/unlink/read contract gaps before repair. The browser red showed missing `foundation_targets` discovery. An initial PHP discovery test had a harness error, not a product regression.
- `builder/`: final `npm run test:unit -- --run --testTimeout=20000 && npm run type-check && npm run build` — exit 0, 158 files / 772 tests, type-check and normal production build passed. Earlier default-5-second full run passed once; a later concurrent run had two timeouts (`App.foundations`, `App.inspector-advanced`), 770 passed. Both files passed in isolation (10 tests) without changing their timeout; the final serialized full run above passed. No crash or flakiness claim is made.
- `demo/`: `vendor/bin/pint --test app/Mcp/Tools/LocalThemeTokenOperation.php tests/Feature/Mcp/LocalThemeToolSchemaTest.php` — exit 0. `php artisan test tests/Feature/Mcp/LocalThemeToolSchemaTest.php tests/Feature/Mcp/LocalThemeToolImportRelayTest.php tests/Feature/Filament/Showcase/TablesShowcaseTest.php tests/Feature/PreviewInspectorBridgeTest.php tests/Feature/AiOperability/DemoShowcaseCapabilityInventoryTest.php` — exit 0, 26 tests / 746 assertions. Initial import-order and inventory-wording failures were repaired before this result.
- Repository root: `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-012-density-mcp.spec.ts` — exit 0, 1 actual stdio/browser journey passed. `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/demo-showcase.spec.ts e2e/theme-foundations.spec.ts --grep 'tables showcase|changes native Products, Orders, and Inventory table density immediately without requests'` — exit 0, 4 passed.
- Repository root: `FTB_BASE_REF=HEAD node builder/scripts/changed-code-standards.mjs` and `git diff --check` — exit 0. One independent read-only review found no confirmed product blocker; its preview/isolation/invalid-client evidence gaps were covered before final verification.

Existing development Compose at `http://127.0.0.1:4175` was verified healthy and source-mounted to this worktree, and reused without restarts or new services. Production bundle compilation passed; production Compose deployment was not run or claimed. Prerequisites FTB-002/005/006 have local completion evidence; their still-open GitHub records remain separate reconciliation work. Historical density-partial statements elsewhere describe the earlier state and do not override this completion. No unrelated issue or Phase 2 release gate is completed by this slice.

---

<a id="ftb-013"></a>

## FTB-013 — Cover Infolists visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create an Infolists showcase containing every visually distinct first-party entry/layout needed for theme design, wired to the semantic registry.

### Acceptance criteria

- [x] `ShowcaseInfolistsPage` contains `OrderDetailsInfolist`, `CustomerProfileInfolist`, and `ProductDetailsInfolist`, including the verified runtime-available first-party entries identified in COVERAGE.md.
- [x] `OrderDetailsInfolist` and `CustomerProfileInfolist` demonstrate distinct section/group layouts without identical API permutations.
- [x] Common states such as empty/null, badges, icons, images, and rich text are demonstrated where visually distinct.
- [x] Registry entries exist for relevant surfaces and states, including both native RepeatableEntry modes.
- [x] Infolists respond correctly to light/dark and global foundation changes on real rendered entries.

Implementation: `31c4110` (`Feature: add infolists showcase fixtures`); verification: [`InfolistsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/InfolistsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Evidence: `InfolistsShowcaseTest` (6 passing tests, 53 assertions), the three focused `e2e/demo-showcase.spec.ts` tests, and the Compose-only foundation integration test in `e2e/theme-foundations.spec.ts` (real light/dark infolist colors and primary badge projection). Vendor/runtime review found the optional Filament `CodeEntry` class but no installed `phiki/phiki` runtime; it is documented as unavailable rather than guessed, copied, or added as a dependency. Shared schema layout selectors remain covered by the existing form registry by design.

---

<a id="ftb-014"></a>

## FTB-014 — Cover Actions, Modals, and Notifications visually

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Create showcase fixtures and registry coverage for Filament actions, buttons, dropdown/action groups, modals, confirmation flows, and notifications across their distinct semantic variants and states.

### Acceptance criteria

- [x] `ShowcaseActionsPage` contains `OrderActionsFixture` and `ProductActionsFixture` with primary, danger, success, warning, info, gray, outline, icon-only, disabled, and loading variants where applicable.
- [x] `DeleteProductConfirmationModal` and `OrderStatusModal` demonstrate representative sizes, headers, footers, forms, destructive confirmation, and loading/action states.
- [x] `OrderStatusNotification`, `InventoryWarningNotification`, and `ActionFailureNotification` demonstrate semantic status styles and layout variations.
- [x] Registry entries expose component, variant, and state-level theming.
- [x] `showcase.notifications` and modal fixtures can be forced visible for theme work without timing-sensitive interaction; forcing is presentation-only and does not persist data.

Implementation: `ca160d1` (`Feature: add actions modals and notifications showcase`); verification: [`ActionsShowcaseTest`](./demo/tests/Feature/Filament/Showcase/ActionsShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Evidence: `ActionsShowcaseTest` (7 passing tests, 114 assertions), the focused Compose Playwright actions/notifications suite (7 passing tests, including forced-visible modal/notification and modal loading coverage), and `builder/src/__tests__/theme-registry.spec.ts` (13 passing tests). The installed Filament 5.9 runtime is the compatibility baseline; no third-party compatibility dependency was added. FTB-016 remains the owner of generalized `ShowcaseStateControls` and is not implied by these presentation-only query tokens.

---

<a id="ftb-015"></a>

## FTB-015 — Cover Widgets, Navigation, Search, and auth/tenant UI

**Status:** done
**Blocked by:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Add visually distinct first-party widgets, sidebar/topbar/navigation patterns, global search, profile/authentication, and tenant-oriented UI to the showcase even when the public demo does not naturally require those flows.

### Acceptance criteria

- [x] Phase 1 provides `DemoShowcaseDashboard` with the branded existing dashboard shell, four widgets (`CommerceStatsOverviewWidget`, `RevenueOrdersChartWidget`, `RecentOrdersWidget`, `LowStockWidget`), resource icons, and `RepresentativeBadgeSet`, all backed by deterministic commerce data. Evidence: `DashboardShowcaseTest`, `e2e/demo-showcase.spec.ts`.
- [x] `ShowcaseIndexPage` is the FTB-015-owned entry for the showcase; FTB-015 integrates (not duplicate) Phase 1 widgets/navigation, and adds `ShowcaseSidebarNavigation`, `GlobalSearchSurface`, `ProfileMenuSurface`, `LoginSurface`, and controlled `TenantSwitcherSurface`. Evidence: `NavigationShowcaseTest`, `e2e/demo-showcase.spec.ts`.
- [x] Global search UI is represented. Evidence: native Ctrl+K search and result assertions in `e2e/demo-showcase.spec.ts`.
- [x] Login/profile/authentication UI is represented. Evidence: `FilamentPanelTest`, `NavigationShowcaseTest`, `e2e/demo-showcase.spec.ts`.
- [x] Tenant-switching UI is represented in a controlled showcase state where applicable. Evidence: no-persistence assertions in `NavigationShowcaseTest` and `e2e/demo-showcase.spec.ts`.
- [x] Registry entries cover the relevant themable surfaces. Evidence: `builder/src/__tests__/theme-registry.spec.ts`, `e2e/theme-registry-selectors.spec.ts`.
- [x] The showcase does not require visitors to actually belong to tenants or maintain personal accounts. Evidence: `AdminPanelProvider::hasTenancy()` remains false and no-write test coverage.

Implementation: `388c545` (`Feature: integrate Filament showcase navigation surfaces`); verification: [`NavigationShowcaseTest`](./demo/tests/Feature/Filament/Showcase/NavigationShowcaseTest.php), `e2e/demo-showcase.spec.ts`.

Completed: deterministic dashboard/widget fixtures, the single ShowcaseIndexPage entry, native navigation/search/profile/login integration, controlled tenant presentation, and verified FTB-015 registry selectors. FTB-016 still owns generalized forced states and is not implied by this ticket.

---

<a id="ftb-016"></a>

## FTB-016 — Add deterministic forced-state controls

**Status:** done
**Blocked by:** [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-014](#ftb-014), [FTB-015](#ftb-015)

### What to build

Give showcase pages controls that intentionally force otherwise transient states such as hover, focus, loading, disabled, validation error, open modal, selected row, empty data, and visible notifications.

### Acceptance criteria

- [x] `ShowcaseStateControls` deterministically switches named surfaces `FormValidationState`, `FormFocusState`, `TableEmptyState`, `TableLoadingState`, `TableSelectedRowState`, `ActionLoadingState`, `ModalOpenState`, and `NotificationVisibleState` (plus representative hover/disabled states).
- [x] Forced states are deterministic and suitable for screenshot testing.
- [x] FTB-016 owns forcing these visual states; state controls are presentation-only, do not persist data, and expose no MCP mutation tool for changing showcase state or demo records.
- [x] Inspector can target the forced state and resolve the correct semantic breadcrumb.
- [x] Theme state can override state-level values and visibly demonstrate inheritance.

---

<a id="ftb-017"></a>

## FTB-017 — Add icon packs and semantic icon replacement

**Status:** done
**Blocked by:** [FTB-006](#ftb-006), [FTB-015](#ftb-015)

### What to build

Let users alter the visual icon system with global pack/style presets and individual semantic Filament icon overrides while keeping exports understandable.

### Acceptance criteria

- [x] `IconPackConfiguration` offers the default pack and multiple alternative pack/style presets; `SemanticResourceIconOverrides` can replace individual resource icons after pack selection.
- [x] Individual semantic icons can be overridden after choosing a pack.
- [x] Icon changes preview immediately.
- [x] Icon configuration is part of theme JSON.
- [x] Required non-CSS configuration is surfaced in PanelProvider/config export rather than faked with brittle CSS.
- [x] FTB-017 owns icon configuration and its PanelProvider/config export path; icons are not duplicated as separate dashboard/showcase work.
- [x] Reset restores inherited/default icon behavior.

---

<a id="ftb-018"></a>

## FTB-018 — Add panel branding and runtime configuration controls

**Status:** done
**Blocked by:** [FTB-006](#ftb-006), [FTB-002](#ftb-002)

### What to build

Support appearance-related panel settings that are not purely CSS, including app name, logos, dark logo, favicon, logo height, brand typography, content/layout options, and other agreed visual PanelProvider settings. Preview instantly where safe and perform controlled preview reloads when true runtime configuration is required.

### Acceptance criteria

- [x] `PanelBrandingSettings` names app name, light/dark logos, favicon, logo height, brand typography, content width, and sidebar behavior, classifying each as CSS-previewable or PanelProvider/runtime configuration.
- [x] Light/dark logos can be represented.
- [x] Favicon and logo height configuration are represented.
- [x] Agreed layout settings such as content width/sidebar behavior are represented.
- [x] Purely visual settings use immediate preview emulation where safe.
- [x] Runtime-only settings trigger a controlled preview update/reload.
- [x] Theme state clearly distinguishes CSS settings from PanelProvider/runtime settings.
- [x] FTB-018 final evidence: Compose PHP suite (165 tests, 1,558 assertions), builder verification, dedicated branding journey, and full Compose Playwright suite (69 passed, 3 skipped by explicit environment gates) pass. The full foundation matrix no longer times out: the Compose dev stack disables the minimized Debugbar pointer interceptor, and showcase dashboard widgets load immediately in the iframe.

---

<a id="ftb-019"></a>

## FTB-019 — Add responsive preview and before/after comparison

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003), [FTB-002](#ftb-002)

### What to build

Give the user desktop, tablet, and mobile viewport presets, arbitrary draggable preview width, and a draggable split comparison between stock Filament and the current customized theme.

### Acceptance criteria

- [ ] Desktop, tablet, and mobile presets are available.
- [ ] The preview width can be dragged to arbitrary supported widths.
- [ ] Current width is visible to the user.
- [ ] Before/after mode compares untouched Filament with the current theme.
- [ ] Split position can be dragged.
- [ ] Inspector behavior remains understandable in custom-theme view.
- [ ] Responsive state persists for the current editing session.

---

<a id="ftb-020"></a>

## FTB-020 — Ship starter theme presets

**Status:** ready-for-agent  
**Blocked by:** [FTB-005](#ftb-005)

### What to build

Provide a small curated set of distinct editable theme presets while keeping stock Filament as the first-visit default.

### Acceptance criteria

- [ ] Stock Filament is the default initial theme.
- [ ] Approximately five to eight presets are available.
- [ ] Presets include distinct directions such as Minimal, Soft, Sharp, Corporate, Midnight, Colorful, and Compact.
- [ ] A preset is represented by normal canonical theme state rather than special-case CSS.
- [ ] Applying a preset replaces the current theme.
- [ ] The user is warned before overwriting modified work.
- [ ] Every preset works in light and dark mode or explicitly defines its supported behavior.

---

<a id="ftb-021"></a>

## FTB-021 — Manage multiple named local themes

**Status:** done
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Turn local persistence from one autosaved draft into a small anonymous local project manager where users can create, rename, duplicate, delete, reopen, and autosave multiple themes.

### Acceptance criteria

- [x] Users can create multiple named local themes. Evidence: `local-theme-store.spec.ts` and the focused Compose journey `e2e/ftb-021-local-themes.spec.ts`.
- [x] Themes can be renamed, duplicated, deleted, and opened. Evidence: `local-theme-store.spec.ts`, `LocalThemeManager.spec.ts`, and the focused Compose journey.
- [x] Editing autosaves to the active local theme with a debounce. Evidence: `local-theme-persistence.spec.ts`, `local-theme-persistence-switch.spec.ts`, and the focused Compose reload journey.
- [x] The current theme is clearly identified. Evidence: `LocalThemeManager.spec.ts` and the focused Compose active-marker journey.
- [x] Destructive deletion asks for confirmation. Evidence: `LocalThemeManager.spec.ts` and the focused Compose delete-confirmation journey.
- [x] Theme history/undo applies to the active theme without corrupting other saved themes. Evidence: `local-theme-persistence-history.spec.ts`, `local-theme-store.spec.ts`, and the focused Compose reopen/history journey.

FTB-021 verification evidence: builder type-check, full unit suite (79 files, 336 tests), and production build pass. The historical focused Compose run recorded 4 passes before this fix wave; the requested fresh focused rerun was incomplete because `http://127.0.0.1:4175` refused connections. The fresh full-suite command remains incomplete: the runner was terminated by the execution harness after 1,200,000 ms while the Compose gateway returned 502s; it had observed 1 passed, 57 failed, 39 fail-fast skips, and 16 not started out of 113, with no Playwright exit status. Compose recovery then failed because both Node services hit npm registry ETIMEDOUT errors, so no terminal full-suite count exists. Exact failures and fix-wave evidence are recorded in `.superpowers/sdd/2026-10-16-multiple-local-themes/task-9-report.md`; this is not evidence against FTB-021 because the gateway was unavailable. The FTB-020 preset-isolation criterion/journey is deferred because FTB-020 is not implemented; no preset capability or unsupported claim is included here. Local-theme MCP remains deferred to FTB-048.

Latest final-HEAD verification: canonical `compose.dev` stack healthy. The combined command `COMPOSE_E2E=1 COMPOSE_BASE_URL=http://127.0.0.1:4175 npx playwright test e2e/ftb-021-local-themes.spec.ts e2e/local-theme-manager.spec.ts` completed with 5 passed (56.0s). The earlier combined run had 4 passed / 1 timeout; the isolated test passed, and the latest combined rerun is clean. Root `npm test` also passed its latest 18 scripts: 338 builder tests, type-check, Pint, PHPStan, and 169 Laravel tests. The earlier full Playwright suite remains incomplete as documented above; this evidence does not claim a full E2E pass.

---

<a id="ftb-022"></a>

## FTB-022 — Add versioned JSON import/export and migrations

**Status:** done
**Blocked by:** [FTB-021](#ftb-021)

### What to build

Let users download and import the editable canonical theme representation. Define schema migrations so older JSON themes can be upgraded sequentially rather than breaking when the builder evolves.

### Acceptance criteria

- [x] Editable themes can be exported as canonical JSON.
- [x] JSON includes schemaVersion; canonical V4 export parity is preserved.
- [x] Valid V1–V4 JSON themes import as fresh browser-local themes after explicit confirmation.
- [x] Invalid or unsupported payloads produce safe errors without damaging current work.
- [x] Sequential migration infrastructure migrates V1 → V2 → V3 → V4.
- [x] Migration tests prove older fixtures open as the current schema.
- [x] Imported themes preserve supported semantic, raw, icon, and runtime state; nonempty custom CSS is explicitly rejected.
- [x] Local MCP list/export/import-preview and browser-confirmed import parity are covered by the capability inventory.

FTB-022 implementation and acceptance evidence: [`versioned theme import and MCP verification`](./docs/superpowers/verification/2026-10-18-versioned-theme-import-mcp.md). The evidence records bounded V1–V4 migration, crash-safe fresh import, the import UI, bounded `ftb:mcp` stdio, exact seven-tool registration, private relay lifecycle/routes, explicit browser confirmation, real Compose stdio/Playwright acceptance, and regression checks. Local-theme MCP supersedes FTB-021's FTB-048 deferral only for the listed capabilities; the relay remains disabled unless explicitly enabled in local/testing.

---

<a id="ftb-023"></a>

## FTB-023 — Add Advanced Custom CSS passthrough

**Status:** ready-for-agent  
**Blocked by:** [FTB-003](#ftb-003)

### What to build

Provide an Advanced Custom CSS editor whose contents are appended after generated CSS, previewed live, stored in canonical theme state, and exported with the theme.

### Acceptance criteria

- [ ] Custom CSS can be edited and previewed.
- [ ] Custom CSS is applied after generated CSS.
- [ ] JavaScript and style-tag injection are not accepted as executable content.
- [ ] Custom CSS participates in local persistence, JSON import/export, and sharing.
- [ ] Undo/redo works for custom CSS edits at a sensible granularity.
- [ ] The UI clearly labels this as an advanced escape hatch rather than the primary editing workflow.

---

<a id="ftb-024"></a>

## FTB-024 — Add Fully Explicit vanilla CSS export

**Status:** ready-for-agent  
**Blocked by:** [FTB-004](#ftb-004), [FTB-006](#ftb-006)

### What to build

Add a second export strategy that writes the complete selected theme configuration rather than only explicit differences, while preserving the existing Minimal mode as the recommended compact option.

### Acceptance criteria

- [ ] Export UI offers Minimal and Fully Explicit modes.
- [ ] Minimal remains available and behaves as before.
- [ ] Fully Explicit resolves inherited values and writes the complete selected theme representation.
- [ ] Generated output remains grouped and readable.
- [ ] Both modes reproduce the same visual result for the same theme.
- [ ] Tests cover inheritance resolution differences between the two modes.

---

<a id="ftb-025"></a>

## FTB-025 — Add Tailwind @apply export

**Status:** ready-for-agent  
**Blocked by:** [FTB-004](#ftb-004), [FTB-006](#ftb-006)

### What to build

Provide Tailwind @apply as an alternative export syntax while keeping vanilla CSS as default. The Tailwind exporter should remain genuinely utility-oriented rather than silently falling back to large blocks of vanilla declarations.

### Acceptance criteria

- [ ] Export syntax selector offers Vanilla CSS and Tailwind @apply.
- [ ] Vanilla CSS remains the default.
- [ ] The Tailwind exporter uses @apply for generated component rules.
- [ ] Custom or arbitrary values are represented through appropriate Tailwind-compatible utilities/definitions rather than arbitrary silent vanilla fallback.
- [ ] Minimal and Fully Explicit strategies both work with Tailwind export.
- [ ] Exported Tailwind theme is verified against the supported Filament/Tailwind baseline.
- [ ] Unsupported transformations produce an explicit warning rather than incorrect output.

---

<a id="ftb-026"></a>

## FTB-026 — Deliver complete export and installation guidance

**Status:** ready-for-agent  
**Blocked by:** [FTB-018](#ftb-018), [FTB-024](#ftb-024), [FTB-025](#ftb-025)

### What to build

Make export a complete handoff from the visual builder into a user's real Filament project by providing theme.css, tailored installation steps, relevant PanelProvider snippets, and an optional complete AdminPanelProvider example.

### Acceptance criteria

- [ ] Copy and download flows work for both CSS syntaxes and both export strategies.
- [ ] The user can copy only the relevant PanelProvider method calls.
- [ ] The user can optionally view/copy a complete example AdminPanelProvider.
- [ ] Snippet mode is presented as the safer default for existing projects.
- [ ] Installation guidance adapts to the selected export/runtime features.
- [ ] Custom font-family guidance explains that the font must be loaded by the user's application.
- [ ] Export does not imply that users should overwrite unrelated provider configuration.
- [ ] A clean reference Filament project can follow the instructions successfully.

---

<a id="ftb-027"></a>

## FTB-027 — Make demo uploads real but safely bounded

**Status:** done
**Blocked by:** [FTB-002](#ftb-002)

### What to build

Allow the public demo to exercise real Filament upload UI while constraining file type and storage abuse.

### Acceptance criteria

- [x] JPEG, PNG, WebP, and PDF uploads are accepted.
- [x] Other file types are rejected.
- [x] Maximum upload size is 5 MB per file.
- [x] Maximum temporary storage attributable to one anonymous user is 25 MB.
- [x] Global temporary upload storage never intentionally exceeds 500 MB.
- [x] When storage approaches the ceiling, oldest files are purged until usage is approximately 400 MB.
- [x] Upload paths cannot execute uploaded content as application code.
- [x] Quota/error states are understandable in the UI.

---

<a id="ftb-028"></a>

## FTB-028 — Reset demo state every ten minutes without breaking the showcase

**Status:** done
**Blocked by:** [FTB-009A](#ftb-009), [FTB-027](#ftb-027)

**Approved regression repair (2026-11-27):** `62e2302` (local, not pushed)
restores valid SQLite snapshots through SQLite3 backup-in-place, preserving
existing PDO handles and destination inode/WAL consistency. Failed/busy restores
preserve data; unavailable SQLite3 fails closed. Generic non-SQLite snapshots
retain atomic replacement. Focused reset **8 tests / 37 assertions** and final
full Composer **274 tests / 2,398 assertions**, Pint and PHPStan pass. Shares and
reset locking remain covered. This repairs the regression only; pre-existing
GitHub/local full-ticket status reconciliation remains separate.

### What to build

Restore the demo from a known-good SQLite snapshot every ten minutes, clean temporary uploads, and constrain destructive actions so the public demo remains useful between resets.

### Acceptance criteria

- [x] A deterministic known-good demo database snapshot exists.
- [x] Scheduler restoration runs every ten minutes.
- [x] Restoration is atomic enough that normal visitors do not see a half-restored database.
- [x] Temporary demo uploads are removed during cleanup.
- [x] The UI displays Demo data resets every 10 minutes.
- [x] Destructive actions that could make the showcase unusable are simulated or constrained.
- [x] Create/edit/action UI still behaves realistically enough for theming.
- [x] Automated tests verify reset behavior.

---

<a id="ftb-029"></a>

## FTB-029 — Create temporary server-backed theme sharing

**Status:** ready-for-agent  
**Blocked by:** [FTB-002](#ftb-002), [FTB-022](#ftb-022)

### What to build

Allow a user to publish the current canonical theme payload to a small persistent share store and receive a clean /theme/<id> URL that another visitor can open and continue editing.

### Acceptance criteria

- [ ] Shares use a persistent SQLite store separate from the disposable demo database.
- [ ] A share contains a versioned canonical theme payload.
- [ ] Maximum payload size is 256 KB.
- [ ] Creating a share returns a non-guessable public ID.
- [ ] /theme/<id> loads the shared theme into the builder.
- [ ] Opening a share does not overwrite existing local themes without an explicit user action/clear behavior.
- [ ] Share storage is not affected by the ten-minute demo reset.

---

<a id="ftb-030"></a>

## FTB-030 — Add anonymous share identity, expiry, rate limits, and expiry UX

**Status:** ready-for-agent  
**Blocked by:** [FTB-029](#ftb-029)

### What to build

Harden sharing for anonymous public hosting by combining a keyed hash of normalized IP with a random browser UUID, enforcing one active share per identity and a five-identity ceiling per IP hash, updating an existing identity's URL in place, rate limiting mutations, and expiring shares after five days.

### Acceptance criteria

- [ ] Raw IP addresses are never persisted for share ownership.
- [ ] IP identity uses a server-secret keyed hash.
- [ ] Browser identity uses a random local UUID.
- [ ] One browser identity has at most one active share.
- [ ] One IP hash has at most five active browser identities/shares.
- [ ] Re-sharing from the same identity updates the same public URL.
- [ ] Share mutation is limited to one operation per hour per identity.
- [ ] Shares expire after five days and are purged.
- [ ] Opening a valid share displays a toast indicating the remaining lifetime in human-friendly days/time.
- [ ] An expired share shows a friendly expired-theme screen with a path to start a new theme.
- [ ] NAT/shared-network users can have separate browser identities within the five-share IP ceiling.

---

<a id="ftb-031"></a>

## FTB-031 — Add non-blocking accessibility contrast guidance

**Status:** ready-for-agent  
**Blocked by:** [FTB-005](#ftb-005)

### What to build

Analyze relevant foreground/background theme combinations and surface WCAG-style contrast warnings without preventing creative or intentionally unconventional exports.

### Acceptance criteria

- [ ] Relevant text/surface combinations display contrast status.
- [ ] Warnings update as colors change.
- [ ] The user can understand which pair is problematic.
- [ ] Warnings do not block preview, save, share, or export.
- [ ] The tool does not claim that contrast checking alone certifies the whole theme as accessible.

---

<a id="ftb-032"></a>

## FTB-032 — Publish and render the Filament coverage manifest

**Status:** ready-for-agent  
**Blocked by:** [FTB-006](#ftb-006)

### What to build

Create the public source-of-truth coverage manifest and an interactive in-app coverage view showing supported, partial, and missing first-party Filament 5 visual features.

### Acceptance criteria

- [ ] COVERAGE.md exists and uses stable semantic feature identifiers.
- [ ] Entries can express supported, partial, and missing coverage.
- [ ] Entries can reference relevant semantic registry concepts/showcase areas.
- [ ] The builder renders an interactive coverage page derived from the same source of truth or a generated equivalent.
- [ ] Coverage includes Relation Managers and Nested Resources separately.
- [ ] Coverage includes authentication/profile/tenant UI.
- [ ] The manifest records the minimum supported and latest tested Filament versions.
- [ ] The manifest is usable as the objective 1.0 gate.

---

<a id="ftb-033"></a>

## FTB-033 — Establish Playwright E2E and visual regression coverage

**Status:** ready-for-agent  
**Blocked by:** [FTB-007](#ftb-007), [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015), [FTB-016](#ftb-016), [FTB-019](#ftb-019), [FTB-026](#ftb-026)

### What to build

Create high-level browser tests around the real builder/iframe boundary and deterministic screenshot regression coverage for the showcase so upstream Filament markup/style changes are detected.

### Acceptance criteria

- [ ] Playwright runs the critical user journey from edit to preview to export.
- [ ] Inspector selection is tested across the iframe boundary.
- [ ] Light/dark and representative responsive widths are tested.
- [ ] Deterministic screenshots exist for the main showcase families.
- [ ] Forced component states are included in visual regression.
- [ ] Screenshot fixtures use deterministic demo data.
- [ ] Test failures clearly distinguish behavior failures from visual diffs.
- [ ] Chromium is the primary CI browser while code remains compatible with modern evergreen browsers.

---

<a id="ftb-034"></a>

## FTB-034 — Build the single parameterized Jenkins pipeline

**Status:** ready-for-agent  
**Blocked by:** [FTB-033](#ftb-033), [FTB-035](#ftb-035)

**2026-11-27 initial verification slice:** one Jenkinsfile now wires locked
dependency setup, root contracts, changed-TypeScript checks, builder/demo
builds, Composer checks and job-owned bounded Compose browser verification with
logs/artifacts. Node contract tests pass; no live Jenkins endpoint is available.
This is partial work only: deployment, release monitoring, full visual regression
and this ticket's existing prerequisites/acceptance remain outstanding. No GitHub
Actions or Git hooks were added. [Evidence](./docs/verification/2026-11-27-agent-retrofit.md).

### What to build

Create one Jenkins pipeline that builds and tests the repository on every relevant run and deploys only when explicitly requested. Add hourly detection of new Filament releases that invokes the same pipeline with deployment disabled.

### Acceptance criteria

- [ ] One Jenkinsfile/pipeline is the CI/CD source of truth.
- [ ] Pipeline runs PHP/Laravel tests, builder tests, build steps, Playwright, and visual regression.
- [ ] Manual runs expose a simple DEPLOY boolean parameter.
- [ ] DEPLOY=false never updates the public environment.
- [ ] DEPLOY=true deploys only after all required stages pass.
- [ ] Until 1.0, deployment targets the current dev branch build.
- [ ] Jenkins checks hourly for a newer supported Filament release.
- [ ] A detected release runs dependency update/build/tests with DEPLOY=false.
- [ ] No GitHub Actions workflow is added.

---

<a id="ftb-035"></a>

## FTB-035 — Provide production Docker deployment with Octane + FrankenPHP

**Status:** ready-for-agent  
**Blocked by:** [FTB-001](#ftb-001), [FTB-002](#ftb-002), [FTB-028](#ftb-028), [FTB-030](#ftb-030)

### What to build

Provide the production deployment topology for a VPS using Laravel Octane on FrankenPHP with FrankenPHP's integrated Caddy, compiled Vue assets, a separate scheduler container, persistent share storage, and disposable demo storage.

### Acceptance criteria

- [ ] Production does not require a permanent Node process.
- [ ] FrankenPHP/Caddy serves the builder assets and Laravel routes according to the agreed URL layout.
- [ ] Laravel runs through Octane/FrankenPHP.
- [ ] Scheduler runs independently from request workers.
- [ ] shares.sqlite is persistent across deploys and demo resets.
- [ ] Demo SQLite state and temporary uploads can be safely reset.
- [ ] Octane worker configuration avoids leaking request-specific state between visitors.
- [ ] Worker recycling/restart behavior is configured.
- [ ] A production deployment can be performed from documented commands on a clean VPS host with Docker.

---

<a id="ftb-036"></a>

## FTB-036 — Add Microsoft Clarity with privacy controls

**Status:** ready-for-agent  
**Blocked by:** [FTB-001](#ftb-001)

### What to build

Integrate Microsoft Clarity for basic product analytics while providing appropriate disclosure/consent behavior and avoiding unnecessary capture of sensitive editor content.

### Acceptance criteria

- [ ] Clarity can be enabled through deployment configuration.
- [ ] Appropriate privacy disclosure/consent handling is present where required.
- [ ] Theme/custom-CSS editor content is excluded or masked from analytics capture where reasonably possible.
- [ ] Product analytics do not become an identity/account system.
- [ ] Local development can run without Clarity.

---

<a id="ftb-037"></a>

## FTB-037 — Publish contributor and architecture documentation

**Status:** ready-for-agent  
**Blocked by:** [FTB-001](#ftb-001), [FTB-032](#ftb-032)

### What to build

Provide the repository documentation required for outside contributors to understand the sibling-app architecture, branch policy, coverage rules, testing expectations, and how to add theme-control coverage.

### Acceptance criteria

- [ ] README explains product purpose, local setup, and current release state.
- [ ] CONTRIBUTING explains feature-branch → dev workflow before 1.0.
- [ ] ARCHITECTURE documents the builder/demo boundary, theme state, registry, preview bridge, persistence, and deployment at a stable conceptual level.
- [ ] Contribution guidance requires appropriate registry/showcase/test coverage for new UI theming support.
- [ ] Documentation explicitly states that Jenkins is used and GitHub Actions are not.
- [ ] Documentation points to the separate future docs-site repository as out of scope for this repo.

---

<a id="ftb-038"></a>

## FTB-038 — Harden and publish the public Alpha

**Status:** ready-for-agent  
**Blocked by:** [FTB-026](#ftb-026), [FTB-028](#ftb-028), [FTB-030](#ftb-030), [FTB-031](#ftb-031), [FTB-033](#ftb-033), [FTB-034](#ftb-034), [FTB-035](#ftb-035), [FTB-036](#ftb-036), [FTB-037](#ftb-037)

### What to build

Prepare a public Alpha that is genuinely useful even though the full Filament 5 coverage manifest is not yet complete. Confirm operational limits, privacy messaging, core editing/export flows, and safe deployment.

### Acceptance criteria

- [ ] A first-time visitor can edit a stock Filament theme and export usable CSS.
- [ ] Inspector, light/dark, responsive preview, undo/redo, local save, JSON import/export, and sharing are usable.
- [ ] Public demo reset/upload limits work under real hosted conditions.
- [ ] Clarity/privacy behavior is deployed as intended.
- [ ] The hosted product identifies itself as Filament Theme Builder with the subtitle Build your Filament theme visually.
- [ ] Footer reads An open-source project from Azaber.
- [ ] The UI does not imply official ownership by the Filament project.
- [ ] Alpha limitations and current coverage are visible.
- [ ] Deployment originates from dev via Jenkins with DEPLOY=true.

---

<a id="ftb-039"></a>

## FTB-039 — Complete and verify the Filament 5 coverage contract

**Status:** ready-for-agent  
**Blocked by:** [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-012](#ftb-012), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015), [FTB-016](#ftb-016), [FTB-017](#ftb-017), [FTB-018](#ftb-018), [FTB-032](#ftb-032), [FTB-033](#ftb-033)

### What to build

Close every remaining gap in the public Filament 5 coverage manifest and perform an integration verification that every visually distinct first-party feature has a real fixture and a supported theming path through the semantic registry or advanced Inspector.

### Acceptance criteria

- [ ] No first-party Filament 5 visual feature identified by the manifest remains Missing.
- [ ] Any Partial entry has been resolved or explicitly documented as non-themable/identical with justification.
- [ ] Every covered feature has a real demo/showcase fixture.
- [ ] Every relevant feature can be themed semantically or through the supported advanced path.
- [ ] Light/dark behavior is verified across the coverage set.
- [ ] Screenshot regression coverage is updated for the final coverage set.
- [ ] Minimum supported and latest tested Filament versions are current.
- [ ] The coverage manifest objectively indicates readiness for 1.0.

---

<a id="ftb-040"></a>

## FTB-040 — Cut the 1.0 release

**Status:** ready-for-agent  
**Blocked by:** [FTB-038](#ftb-038), [FTB-039](#ftb-039)

### What to build

Graduate the project from the 0.x Alpha/Beta lifecycle to the first stable 1.0 release once the agreed acceptance contract is satisfied.

### Acceptance criteria

- [ ] All 1.0 product acceptance criteria in PRD.md are satisfied.
- [ ] COVERAGE.md indicates complete first-party Filament 5 visual coverage.
- [ ] Jenkins passes against the current supported Filament version.
- [ ] Vanilla/Tailwind and Minimal/Fully Explicit exports are validated.
- [ ] Shared themes, reset behavior, upload limits, and production persistence are validated.
- [ ] Public documentation reflects stable 1.0 behavior.
- [ ] main receives the stable release according to the agreed branch policy.
- [ ] A 1.0.0 release/tag is created only after the stable branch is verified.

---

<a id="ftb-041"></a>

## FTB-041 — Keep resource navigation count badges synced to the primary color

**Status:** ready-for-agent
**Blocked by:** None (can start immediately)

### What to build

Keep every resource sidebar count badge visually consistent with the configured primary color, including after navigation and page reload.

### Acceptance criteria

- [ ] All resource sidebar count badges use the primary color consistently.
- [ ] Badge colors remain correct after navigating between resources.
- [ ] Badge colors remain correct after reloading the page.
- [ ] Regression coverage verifies the primary-color styling for all resource sidebar count badges and its stability after navigation and reload.

---

<a id="phase-2-filament-dashboard-composer-integration"></a>

# Phase 2 — Filament Dashboard Composer Integration

All Phase 2 tickets are **blocked** by [FTB-040](#ftb-040) and by completion of
all approved Phase 1 requirements: FTB-009A, FTB-009B, FTB-010, FTB-011,
FTB-012, FTB-013, FTB-014, FTB-015, FTB-016, FTB-017, and FTB-018. The
demo-first gate alone is insufficient. Package identity, namespace, and
Composer coordinates are also release-blocking and intentionally deferred.

The review fixed point for this planning publication is
`f348ac2c504e627690324eea0595f2245c9d215c`; it must be refreshed after Phase
1 and FTB-040 before implementation review.

<a id="ftb-042"></a>

## FTB-042 — Package installation and protected collapsible dock

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§2](./docs/phase-2/SPECS.md#2-product-boundary-and-activation), [§3](./docs/phase-2/SPECS.md#3-authoritative-panel-identity-and-embedded-ui), [§10](./docs/phase-2/SPECS.md#10-accessibility-and-panel-continuity)
**GitHub issue:** [#42](https://github.com/Azab-Inc/filament-theme-builder/issues/42)
**PRD requirements:** [P2-001–P2-005](./docs/phase-2/PRD.md#61-activation-and-authorization), [P2-010–P2-013](./docs/phase-2/PRD.md#62-embedded-panel-experience), [P2-070–P2-073](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Deliver the Composer development-package installation and local-only activation
flow inside a user's own authorized Filament panel. Embed the compiled builder
in a collapsible/resizable dock while keeping the actual panel visible and
usable. Preserve the panel's existing authentication, authorization, tenant,
CSRF, origin, and endpoint protections without adding a second permission
system.

### Acceptance criteria

- [ ] Installation works in a host application using the approved baseline and
      does not require the repository demo.
- [ ] The integration activates only in the local environment with
      `FILAMENT_THEME_BUILDER=true`; the flag is never treated as credentials.
- [ ] Existing authorized panel users can access the dock without an extra
      product gate; unauthorized users cannot.
- [ ] The panel remains visible and operable while the dock is open, resized,
      or collapsed.
- [ ] Multiple panels do not share authoritative identity, preview state, or
      authorization context.
- [ ] Keyboard and accessibility behavior is covered in the same vertical
      slice.

<a id="ftb-043"></a>

## FTB-043 — Preview and sessionStorage draft lifecycle

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§4](./docs/phase-2/SPECS.md#4-browser-session-draft-lifecycle), [§6](./docs/phase-2/SPECS.md#6-shared-generator-and-tailwind-4-compatibility), [§10](./docs/phase-2/SPECS.md#10-accessibility-and-panel-continuity)
**GitHub issue:** [#43](https://github.com/Azab-Inc/filament-theme-builder/issues/43)
**PRD requirements:** [P2-014–P2-015](./docs/phase-2/PRD.md#62-embedded-panel-experience), [P2-030–P2-032](./docs/phase-2/PRD.md#64-preview-and-guidance), [P2-070](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Provide the browser-local preview loop and active draft lifecycle. Use the
approved same-tab `sessionStorage` semantics, restore only valid state for the
authoritative panel, and keep preview-only state separate from project-file
save state.

### Acceptance criteria

- [ ] Preview output and save output use the same deterministic generator.
- [ ] Drafts persist across same-tab panel navigation and reload.
- [ ] Separate browser tabs do not share the active draft.
- [ ] Draft storage is scoped to host origin and authoritative panel identity.
- [ ] Invalid, stale, malformed, or cross-panel drafts are quarantined safely.
- [ ] Explicit discard removes only the current draft and restores saved/stock
      preview state.
- [ ] The UI distinguishes draft, generated preview, compiled/applied, and
      saved states.

<a id="ftb-044"></a>

## FTB-044 — Source discovery, CSS creation, and setup guidance

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§5](./docs/phase-2/SPECS.md#5-source-discovery-and-setup-guidance), [§6](./docs/phase-2/SPECS.md#6-shared-generator-and-tailwind-4-compatibility), [§13](./docs/phase-2/SPECS.md#13-verification-contract)
**GitHub issue:** [#44](https://github.com/Azab-Inc/filament-theme-builder/issues/44)
**PRD requirements:** [P2-020–P2-028](./docs/phase-2/PRD.md#63-theme-source-discovery), [P2-033–P2-035](./docs/phase-2/PRD.md#64-preview-and-guidance)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Implement safe theme-source discovery and explicit CSS-target creation. Resolve
the registered panel source first, then searchable project stylesheets, while
containing paths to the configured project root and rejecting symlinks. Keep
registered application CSS naturally active in the panel, but never inject
arbitrary discovered CSS into the builder. Provide manual setup guidance for
registration, PHP, Vite, or build steps.

### Acceptance criteria

- [ ] Registered editable theme source resolution precedes filesystem search.
- [ ] Search supports CSS, SCSS, and Sass discovery, but only CSS is a
      selectable save target.
- [ ] Dependencies, generated outputs, backups, traversal, outside-root paths,
      null bytes, and symlinked components/targets are rejected.
- [ ] Unrecognized CSS recommends creating a new CSS file; declining uses
      documented defaults.
- [ ] An unmarked CSS file is a valid Append starting point and receives the
      initial managed block after existing contents.
- [ ] Tailwind 4 Sass inputs are rejected with actionable guidance.
- [ ] Hostile CSS is treated as text/metadata and cannot execute, import remote
      resources, or enter the builder through discovery.
- [ ] No PHP, registration, Vite, dependency, or build mutation occurs
      automatically.

<a id="ftb-045"></a>

## FTB-045 — Confirm, append, and preserve complete prior contents

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042), [FTB-043](#ftb-043), [FTB-044](#ftb-044); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§7](./docs/phase-2/SPECS.md#7-confirmation-and-append-persistence), [§13](./docs/phase-2/SPECS.md#13-verification-contract), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules)
**GitHub issue:** [#45](https://github.com/Azab-Inc/filament-theme-builder/issues/45)
**PRD requirements:** [P2-040–P2-043, P2-046–P2-047](./docs/phase-2/PRD.md#65-save-safety), [P2-070–P2-072](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Deliver the explicit confirmation and safe Append flow. Show the target,
generated diff, affected panels, mode, hashes, and recovery implications.
Append must preserve all existing contents, create or update one versioned
managed comment section, and handle repeated conflicts without duplicating or
overwriting unrelated CSS.

### Acceptance criteria

- [ ] Confirmation identifies target path, panel context, generated diff,
      affected panels, mode, and source/output hashes.
- [ ] Shared stylesheets require an explicit conflict acknowledgement.
- [ ] Every Append operation first creates a unique, no-clobber `old-` backup
      containing the complete current file before any target mutation.
- [ ] The initial Append to an unmarked CSS file creates one managed section
      only after that backup is durable, without removing existing contents.
- [ ] Managed markers contain versioned round-trip metadata and hashes.
- [ ] Malformed, nested, or duplicate markers fail closed without guessing.
- [ ] Repeated Append updates the existing managed section exactly once.
- [ ] Content outside the managed section remains byte-for-byte preserved.
- [ ] No source, backup, or unrelated user file is removed automatically.

<a id="ftb-046"></a>

## FTB-046 — Replace, journaled writes, and active failure recovery

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-045](#ftb-045); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§8](./docs/phase-2/SPECS.md#8-replace-transaction-and-recovery-contract), [§13](./docs/phase-2/SPECS.md#13-verification-contract), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules)
**GitHub issue:** [#46](https://github.com/Azab-Inc/filament-theme-builder/issues/46)
**PRD requirements:** [P2-044–P2-049](./docs/phase-2/PRD.md#65-save-safety), [P2-072](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Deliver complete Replace behavior and the journaled filesystem transaction.
Replace intentionally writes a complete generated CSS scaffold at the original
path after uniquely renaming the original to an `old-` backup containing the
entire old file. Locks,
file hashes, single-use confirmation binding, permission revalidation, failed
output retention, and active recovery must protect against partial failure and
concurrent edits.

### Acceptance criteria

- [ ] Replace uniquely renames the original to a full-content `old-` backup
      without clobbering an existing backup.
- [ ] Replace writes complete buildable CSS at the original path; preserving
      append-only directives is not a Replace requirement.
- [ ] Confirmation is bound to user/panel, target, hashes, mode, expiry, and a
      single-use nonce.
- [ ] Apply revalidates authorization, activation, containment, symlink policy,
      hashes, lock ownership, and target mode.
- [ ] Journal states record staged output, backup, commit, and recovery status.
- [ ] Partial failure preserves prior file, backup, failed/staged output, and
      journal; it never cleans up by deletion.
- [ ] Recovery restores the old file by copying from the retained backup when
      safe, leaves that backup intact, and otherwise marks explicit
      recovery-required without claiming success.
- [ ] Concurrent edits prevent unreviewed writes and never modify another
      user's files.

<a id="ftb-047"></a>

## FTB-047 — Shared saved/compiled state across panels

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-045](#ftb-045), [FTB-046](#ftb-046); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§6](./docs/phase-2/SPECS.md#6-shared-generator-and-tailwind-4-compatibility), [§8](./docs/phase-2/SPECS.md#8-replace-transaction-and-recovery-contract), [§11](./docs/phase-2/SPECS.md#11-package-and-consumer-architecture)
**GitHub issue:** [#47](https://github.com/Azab-Inc/filament-theme-builder/issues/47)
**PRD requirements:** [P2-030–P2-035](./docs/phase-2/PRD.md#64-preview-and-guidance), [P2-040, P2-049](./docs/phase-2/PRD.md#65-save-safety)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Make generated preview, saved project state, and compiled/applied panel state
coherent across multiple panels in a host application. Use authoritative panel
identity and shared generator results without allowing one panel's draft,
registration, or applied CSS state to leak into another.

### Acceptance criteria

- [ ] Panel identity is resolved from the host Filament runtime rather than
      caller-supplied identifiers.
- [ ] Preview and saved output report the same generator/schema/output hashes.
- [ ] Saved, compiled/applied, stale, and recovery-required states are distinct.
- [ ] Multiple panels sharing a stylesheet show affected-panel impact before
      save and do not silently claim isolated effects.
- [ ] Existing Vite/HMR remains the only project feedback path.
- [ ] No automatic install, registration, PHP edit, or build is performed.

<a id="ftb-048"></a>

## FTB-048 — Local MCP parity and capability inventory

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-044](#ftb-044), [FTB-045](#ftb-045), [FTB-046](#ftb-046); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§9](./docs/phase-2/SPECS.md#9-local-mcp-parity), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules)
**GitHub issue:** [#48](https://github.com/Azab-Inc/filament-theme-builder/issues/48)
**PRD requirements:** [P2-060–P2-064](./docs/phase-2/PRD.md#66-local-mcp-and-ai-operability)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Expose local MCP discovery, preview, and confirmation-save behavior through the
same services and protections as the UI. Authenticate through the host's
authenticated local MCP session/request and resolve the same panel context;
the feature flag is never a credential and MCP receives no extra privileges.

### Acceptance criteria

- [ ] MCP and UI use the same source resolution, generator, validation,
      authorization, locking, journal, and filesystem safety boundaries.
- [ ] MCP preview returns structured target, diff, hashes, affected panels,
      risks, and confirmation requirements.
- [ ] Save requires explicit confirmation and revalidates permission, hashes,
      lock, nonce, activation, and containment before mutation.
- [ ] Unauthenticated or unauthorized MCP requests are rejected.
- [ ] Replay, stale confirmation, cross-panel, and concurrent-change cases are
      denied without mutation.
- [ ] Capability inventory records operation, authorization, confirmation,
      target scope, and evidence.
- [ ] The supported AI-client flow is verified before MCP support is claimed.

<a id="ftb-049"></a>

## FTB-049 — Consumer installation, isolation, and Jenkins release verification

**Status:** blocked
**Blocked by:** [FTB-040](#ftb-040), [FTB-042](#ftb-042), [FTB-043](#ftb-043), [FTB-044](#ftb-044), [FTB-045](#ftb-045), [FTB-046](#ftb-046), [FTB-047](#ftb-047), [FTB-048](#ftb-048); all approved Phase 1 requirements listed above; package identity release blocker
**Spec:** [§11](./docs/phase-2/SPECS.md#11-package-and-consumer-architecture), [§12](./docs/phase-2/SPECS.md#12-published-vertical-slices-and-ticket-mapping), [§13](./docs/phase-2/SPECS.md#13-verification-contract), [§14](./docs/phase-2/SPECS.md#14-failure-security-and-observability-rules), [§15](./docs/phase-2/SPECS.md#15-out-of-scope), [§16](./docs/phase-2/SPECS.md#16-release-conditions), [§18](./docs/phase-2/SPECS.md#18-publication-and-implementation-handoff)
**GitHub issue:** [#49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)
**PRD requirements:** [P2-001](./docs/phase-2/PRD.md#61-activation-and-authorization), [P2-010](./docs/phase-2/PRD.md#62-embedded-panel-experience), [P2-030–P2-035](./docs/phase-2/PRD.md#64-preview-and-guidance), [P2-064](./docs/phase-2/PRD.md#66-local-mcp-and-ai-operability), [P2-073](./docs/phase-2/PRD.md#67-accessibility)
**Review fixed point:** `f348ac2c504e627690324eea0595f2245c9d215c`

### What to build

Verify the complete package as a consumer-facing release candidate. Run
isolated Jenkins consumer applications against the approved initial baseline:
PHP 8.5, Laravel 13, Filament 5, Livewire 4, and Tailwind 4. Establish exact
minimum/latest evidence, panel isolation, installation behavior, protected
activation, browser journeys, MCP verification, and release-blocking package
identity checks without introducing GitHub Actions.

### Acceptance criteria

- [ ] Clean consumer applications install the package as a Composer development
      dependency without the repository demo.
- [ ] Isolated Jenkins fixtures verify the exact minimum and latest tested
      versions for the approved PHP/Laravel/Filament/Livewire/Tailwind baseline.
- [ ] Consumer tests cover local-only activation, authorized access, panel
      continuity, draft isolation, discovery, Append, Replace, recovery, and
      MCP parity.
- [ ] Multiple panel instances and unrelated consumer files remain isolated.
- [ ] Jenkins is the release verification path; no GitHub Actions workflow is
      added.
- [ ] Package identity, namespace, and Composer coordinates are explicitly
      selected before release; no placeholder identity is published.
- [ ] No readiness or release claim is made while FTB-040, Phase 1, package
      identity, or exact compatibility evidence remains incomplete.

---

<a id="ftb-050"></a>

## FTB-050 — Promote editor panel navigation modes A and B

**Scope slug:** `editor-layout-modes-promotion`

**Status:** done

**Blocked by:** [FTB-003](#ftb-003) functionality stabilization; Phase 1/demo-first gate ([FTB-009A](#ftb-009), [FTB-009B](#ftb-009b), [FTB-010](#ftb-010), [FTB-011](#ftb-011), [FTB-013](#ftb-013), [FTB-014](#ftb-014), [FTB-015](#ftb-015)); completion of remaining Phase 1 requirements [FTB-016](#ftb-016), [FTB-017](#ftb-017), and [FTB-018](#ftb-018); stabilization of existing builder functionality, including the current foundation/control projection work. FTB-012 remains partial only for theme-density integration and is not a gate blocker. Re-evaluate existing blockers before work; this ticket introduces no parent.

**Spec:** [Editor Layout Modes Promotion](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md), especially [dual-mode geometry](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#dual-mode-contract-and-layout-geometry), [real theme controls](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#real-theme-controls-and-binding), [accessibility](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#accessibility), [promotion and prototype cleanup](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#promotion-and-prototype-cleanup), and [Playwright acceptance](./docs/superpowers/specs/2026-10-12-editor-layout-modes-promotion.md#playwright-acceptance-and-test-seams).

**Prototype reference:** [`ThrowawayThemePrototype.vue`](./builder/src/components/ThrowawayThemePrototype.vue), gated by `?prototype=1&variant=A|B|C`; preserve all three visual variants unchanged. Production promotes A and B only; C is out of scope.

**GitHub issue:** [#50](https://github.com/Azab-Inc/filament-theme-builder/issues/50)

**Review fixed point:** `1416388f7b313c51298830d786277b19c35dc195`

### What to build

After the existing gate and functionality stabilization are satisfied and a
separate explicit approval is recorded, promote two navigation modes inside the
builder's existing editor side panel: A (Sidebar), with a vertical internal
navigation rail beside the selected editor content; and B (Top navigation),
with horizontal internal tabs (such as Navigation, Foundations, Components)
above the selected content. An accessible segmented/radio toggle switches only
the panel navigation mode while preserving draft/theme/UI state and keeping the
same real iframe document alive. The overall builder/editor/demo split and the
demo's placement and iframe behavior are unchanged by this toggle. Existing
canonical state, editor behavior, and live-preview bridge remain authoritative.
C is explicitly not a production mode. After verification, remove only the
prototype switcher/query path and replace it with the production A/B toggle;
keep the prototype A/B/C visual references intact.

### Acceptance criteria

- [x] Production replacement begins only after the specified blockers are complete and promotion is explicitly approved.
- [x] Sidebar mode presents a vertical navigation rail inside the editor side panel, beside its selected section content; Top navigation mode presents horizontal section tabs inside that same panel above its selected content.
- [x] An accessible segmented/radio “Editor navigation” toggle selects Sidebar or Top navigation and supports keyboard operation.
- [x] Switching panel navigation modes does not change the overall builder/editor/demo split, move/resize/hide the real Filament demo, or reload/navigate its iframe.
- [x] Switching modes preserves canonical draft/theme state, unsaved edits, selected editor section/control, and relevant UI state; the same iframe document remains alive.
- [x] Existing theme controls in both modes display and mutate real canonical state; no inert or static mock controls/values are promoted.
- [x] At desktop, intermediate, and narrow widths, panel navigation and content remain reachable within the existing editor panel without page-level horizontal overflow; the live demo remains in its existing placement and usable.
- [x] Semantic structure, keyboard/focus behavior, zoom/reflow, iframe naming, and automated accessibility checks meet the design contract.
- [x] Playwright verifies real state-to-iframe updates, responsive panel behavior, accessibility-relevant interaction, and iframe continuity and unchanged placement.
- [x] Playwright verifies each panel mode at responsive widths, Sidebar→Top navigation→Sidebar state/draft persistence, keyboard-accessible mode switching, real state-to-iframe updates, and iframe document continuity.
- [x] After approval and verification, remove the prototype switcher/query path from production and replace it with the real A/B toggle; preserve prototype visual references A/B/C unchanged. No prototype-only content leaks into production; C is not selectable as a production mode.
- [x] No third-party dependency or new MCP capability is introduced; existing functionality remains the priority.

FTB-050 evidence (2026-10-15): production unit/type/build checks passed (`235` builder unit tests); the dedicated Playwright suite passed `4` tests at 1280×900, 900×900, and 640×900 with no page horizontal overflow and unchanged iframe geometry/document; screenshots and live measurements recorded during verification were panel/iframe `511.125/693.875` px at 1280, `351.53125/473.46875` px at 900, and `292.5/292.5` px at 640, with 773/755/755 px heights respectively. Full Compose Playwright passed `88` tests with `3` pre-existing opt-in skips. Full PHP passed `169` tests/1,639 assertions, Pint passed 296 files, PHPStan passed 265 files, and `/api/health` returned `{"status":"ok"}`. `ThrowawayThemePrototype.vue` remains unchanged; production no longer imports or exposes its query gate. No MCP capability or dependency was added.

Accessibility follow-up (2026-10-15): builder type-check, production build, and all `235` unit tests passed. The dedicated FTB-050 Playwright suite passed all `10` tests, including deterministic duplicate-ID/dangling-ARIA-reference checks, tablist/tab/tabpanel contract checks in both modes, hidden inactive panels, keyboard selection/focus, and `:focus-visible`. Full Compose Playwright passed `94` tests with `3` existing opt-in skips (`97` total); all three responsive viewport checks, iframe continuity, and dependent editor navigation tests passed. Sidebar now uses vertical arrow-key navigation and Top mode uses horizontal arrow-key navigation. `ThrowawayThemePrototype.vue` remains unchanged and no dependency was added.

Reachability follow-up (2026-10-15): the dedicated FTB-050 200% zoom test passed twice at a 640px viewport, asserting the document's `scrollWidth` does not exceed its `clientWidth` (no overflow concealment), focus/visibility/in-viewport reachability of all seven export and Inspector header actions, Undo/Redo, both navigation-mode radios, and all four navigation tabs. The full Compose Playwright suite passed `94` tests with `3` existing opt-in skips (`97` total). Builder type-check, all `235` unit tests, and production build passed. The 900px editor/demo side-by-side check remains passing; no CSS changes were needed.

---

<a id="ftb-051"></a>

## FTB-051 — Add native color pickers and named Tailwind palette choices

**Scope slug:** `color-picker-tailwind-palette-selection`

**Priority:** high

**Status:** done — popover A implemented and accepted on 2026-10-21

**Blocked by:** None. The demo-first/FTB-003/FTB-016/017/018 and foundation-stabilization prerequisites are satisfied. FTB-012's density-only partial status is unchanged.

**Spec:** [Color Picker and Tailwind Palette Selection](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md), especially [field coverage](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#1-user-visible-behavior-and-field-coverage), [palette source/version decision](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#2-palette-contract-and-explicit-provenance-decision), [editing/validation semantics](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#3-editing-validation-and-preservation-semantics), [accessibility](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#4-accessibility-and-interaction-contract), [state and preview projection](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#5-state-preview-bridge-and-projection-boundary), [responsive/performance](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#6-responsive-behavior-and-performance), [unit and Playwright verification](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#7-observable-test-seams-and-acceptance-verification), [failure/compatibility](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#8-compatibility-failure-and-operational-behavior), [blockers](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#9-sequencing-and-blockers), and [out of scope](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#10-out-of-scope).

**GitHub issue:** [#51](https://github.com/Azab-Inc/filament-theme-builder/issues/51)

**Review fixed point:** `022affc`.

**Plan:** [Approved popover A implementation](./docs/superpowers/plans/2026-10-20-color-picker-tailwind-palette-selection.md). Prototype at `/?color-prototype=1&variant=A` is a temporary visual reference, not production code.

### What to build

Add a native browser color picker and a searchable named Tailwind color palette button to every existing editable color field. A named choice immediately sets only that field, while preserving its current label, ID, mode, validation, reset/undo/redo, persistence, and projection behavior. Keep CSS variable/token references intact unless the user explicitly replaces them. The local palette dataset must be deterministic and dependency-free. Promote the approved field-level popover only; the broader Studio shell remains separate.

### Acceptance criteria

- [x] Every existing editable color field—including palette bases/editable shades, page/surface, sidebar, topbar, card/elevated, input, borders, and text colors, with each existing light/dark value—exposes a native picker and a named-palette button without changing existing labels, field IDs, or mode behavior. See [§1](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#1-user-visible-behavior-and-field-coverage).
- [x] The palette is accessible by family and shade, searchable by family/shade/full token name, includes the approved 50–950 stops, applies a chosen name immediately to the targeted field, and behaves deterministically. See [§2](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#2-palette-contract-and-explicit-provenance-decision).
- [x] Exact upstream palette source/version, data snapshot, license, and attribution are recorded; the approved source is Tailwind CSS 4.3.3 and the implementation adds no runtime dependency or network request for palette data. See [§2](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#2-palette-contract-and-explicit-provenance-decision) and [§8](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#8-compatibility-failure-and-operational-behavior).
- [x] Existing valid hex and alpha handling, invalid/incomplete input behavior, recovery, reset, one-edit undo/redo, persistence, and validation semantics are preserved. See [§3](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#3-editing-validation-and-preservation-semantics).
- [x] Opening or dismissing the picker never silently rewrites CSS variable/token references; native picker incompatibility leaves the existing value unchanged. See [§3](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#3-editing-validation-and-preservation-semantics).
- [x] Keyboard navigation, visible focus, field-specific accessible names, Escape, outside-click dismissal, focus restoration, and narrow viewport/reflow behavior pass accessibility verification. See [§4](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#4-accessibility-and-interaction-contract) and [§6](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#6-responsive-behavior-and-performance).
- [x] Valid selections use the existing canonical state and validated preview bridge path; no unsupported selectors/tokens, direct style mutation, schema change, or invalid projection is introduced. See [§5](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#5-state-preview-bridge-and-projection-boundary).
- [x] Unit/component tests and Playwright tests cover complete field inventory, data/search, input validation, token preservation, modes, reset/history/persistence, mapped preview behavior, keyboard/dismissal, responsive behavior, and no generated arbitrary Tailwind class strings. See [§7](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#7-observable-test-seams-and-acceptance-verification).
- [x] No new MCP operation is introduced; capability inventory records this UI-only enhancement, and any existing AI edit path remains subject to shared validation/authorization/confirmation rules. See [§7](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#7-observable-test-seams-and-acceptance-verification).
- [x] No new color fields, CSS generation/projection targets, backend services, or third-party dependency are added. See [§10](./docs/superpowers/specs/2026-10-12-color-picker-tailwind-palette-selection.md#10-out-of-scope).

---

<a id="ftb-053"></a>

## FTB-053 — Refactor builder into components, composables, and utilities

**Scope slug:** `builder-component-composable-refactor`

**Priority:** normal refactor

**Status:** done

**Blocked by:** None. FTB-003, the Phase 1/demo-first gate, and foundation/control stabilization prerequisites are satisfied. FTB-050, FTB-051, and FTB-052 remain separate coordination concerns.

**Spec:** [Refactor builder into components, composables, and utilities](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md), especially [boundaries and invariants](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#2-boundaries-and-invariants), [service migration inventory](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#3-current-service-migration-inventory), [App.vue decomposition](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#4-appvue-decomposition-contract), [behavior preservation](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#5-behavior-preservation-contract), and [verification](./docs/superpowers/specs/2026-10-14-builder-component-composable-refactor.md#6-test-and-verification-contract).

**GitHub:** [#53](https://github.com/Azab-Inc/filament-theme-builder/issues/53)

**Review fixed point:** `8ef2524` (implementation verification point).

### What to build

Decompose the oversized `App.vue` into cohesive visual components and focused `useX` composables, and migrate all 15 current `src/services` modules to `src/utils` or `src/composables` according to their actual boundary. Split foundation recovery into pure recovery logic plus injected storage/browser orchestration. Use one expand-contract sequence in this single ticket: establish parity seams, migrate consumers, retire any temporary facade, delete `src/services`, and verify the complete application end to end. Builder styling may use only the explicitly approved minimal Tailwind CSS 4.3.3 build pipeline (`tailwindcss` and `@tailwindcss/vite` dev dependencies plus the Vite plugin); preserve the one-time `src/main.ts` `app.css` import and theme/utilities-only CSS imports, with no Preflight and no other added third-party dependencies.

### Acceptance criteria

- [x] `App.vue` is a composition shell; toolbar, export/status, recovery, foundations, modes, typography, layout, branding/uploads, icons, semantic controls, raw Inspector, and preview-frame responsibilities live in cohesive components/composables.
- [x] All 15 services are classified and migrated; pure functions remain plain and Vue/browser-free, Vue/lifecycle/browser orchestration uses focused `useX` composables, and no `src/services` references or unused compatibility facade remain.
- [x] Pinia remains the single canonical state/history/persistence authority. Effective values, provenance, reset/inherit, light/dark, alpha, responsive, and decimal-spacing semantics are unchanged. Models, DTOs, and registries remain in their designated folders.
- [x] Existing DOM IDs, ARIA labels/roles, data hooks, CSS selectors, preview origin/source/schema/message semantics, runtime refresh, clipboard fallback, download cleanup, uploads/quota errors, recovery paths, and prototype no-effect behavior remain unchanged.
- [x] Existing JSON, CSS, icon PHP, branding JSON/PHP, schema, color, selector, and export semantics retain golden parity; no product feature, third-party dependency beyond the approved Tailwind CSS 4.3.3 builder CSS pipeline, backend service, MCP capability, or gate relaxation is introduced. Tailwind is imported once by `src/main.ts` through `src/app.css`; that stylesheet imports only Tailwind theme and utilities layers and does not enable Preflight.
- [x] All shared/domain types declared in `App.vue` or composables are moved into dedicated `.model.ts`/`.dto.ts` files; type-boundary tests/checks prevent the editor's shared navigation/section types from being redeclared in those implementation files.
- [x] Repeated field-row markup/mutation logic is described before extracting a focused shared control; components use typed props/emits/refs without a monolithic `useApp` or excessive prop drilling.
- [x] TDD unit/component tests, type-check, build, and Playwright CLI/MCP verification cover utility parity, lifecycle cleanup/multiple mounts, real iframe edit/Inspector behavior, exports, branding uploads/errors, recovery, native defaults, history, and no leaked listeners.
- [x] Implementation refreshes the fixed point, preserves concurrent worktree changes, and records unchanged AI-operability capability inventory and evidence without adding tools.

**Completion evidence (2026-10-16):** 70 builder test files / 269 tests passed; type-check and production build passed; final builder audit found no files over 100 lines and no named type declarations outside dedicated model/DTO files; Compose Playwright smoke, Inspector, exports, branding/icons, foundation mutation, and FTB-050 layout-mode checks passed with zero browser errors.

---

<a id="ftb-054"></a>

## FTB-054 — Add hierarchical padding controls (Urgent)

**Scope slug:** `hierarchical-padding-controls`

**Priority:** high (urgent)

**Status:** done (2026-11-26; integrated work subsequently committed in local `5a26a76`, not pushed) — implementation, focused verification, and actual stdio MCP journey complete

**Blocked by:** None after readiness reconciliation against the existing FTB-003/006/022/053 completion evidence and root demo-first gate record. The registry padding extension and V5 migration are implementation deliverables, not missing predecessor tickets. Existing FTB-004 vanilla CSS and canonical JSON parity remain acceptance requirements. FTB-012 remains partial only for density integration; FTB-052 remains future coordination only. Preserve unrelated App/Studio prototype and test/guidance edits.

**Coordination, not blockers:** FTB-024 Fully Explicit vanilla export and FTB-025 Tailwind `@apply` export integrate conditionally if those future modes exist; neither is required or implemented by this urgent ticket.

**Spec:** [Hierarchical Padding Controls](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md), especially [coverage](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#2-verified-target-coverage-contract), [canonical inheritance](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#4-canonical-value-and-inheritance-contract), [preview/export parity](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#6-preview-and-export-parity), [MCP](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#9-mcp-and-capability-inventory-contract), and [verification](./docs/superpowers/specs/2026-10-14-hierarchical-padding-controls.md#10-test-and-verification-contract).

**GitHub:** [#54](https://github.com/Azab-Inc/filament-theme-builder/issues/54)

**Review fixed point:** `94e1bd7bbb2796458ad267525bc45dd4de698bcf` (`dev`, refreshed 2026-10-22).

**Plan:** [Hierarchical padding controls implementation](./docs/superpowers/plans/2026-10-22-hierarchical-padding-controls.md). Approved decisions: schema V5, leaf-only global/section defaults, and one canonical resolver/projection with existing paired revision-bound MCP confirmation. See spec §13.

**Verification update (2026-11-26):** Existing padding implementation passed focused unit/store/registry/projection/UI coverage (49 tests including the read-parser regression), type-check, 13 affected PHP tests (130 assertions), real Compose iframe padding journeys (3 tests), alternate-output production build, and `git diff --check`. The MCP extension includes discover/read/preview/confirm/set/reset tools, typed relay intents, invalid target/value coverage, canonical resolved/provenance reads, and capability-inventory entries. The actual stdio-client journey passed (1 test, 1.2 minutes) after the gateway recovered, covering discovery, unauthorized set rejection, invalid target rejection, preview→confirm→set, read/provenance, and reset→confirm. The broader builder unit suite still has two unrelated App timeout failures (739 passed, 2 failed), and the standard build output remains blocked by existing `builder/dist` permissions; alternate-output build passed. Work remains uncommitted and unrelated dirty changes are preserved.

### What to build

Give users semantic padding controls that inherit from global default through section, individual component, and existing variant/state scopes. Users can edit linked all-sides padding or independent edges, see effective values and their source, reset explicit values back to inheritance/native Filament behavior, and observe immediate real-demo preview plus CSS/JSON export parity. The implementation must cover every verified mapped visual target without blanket DOM selectors or duplicate nested padding.

### Acceptance criteria

- [x] A validated registry coverage matrix identifies stable target IDs, exact verified Filament selectors, group/visual boundaries, compatibility evidence, supported edges/units, and supported/unmapped/excluded status for global, Forms, Tables, Buttons, and other mapped registry groups. It includes concrete input, textarea, select, table container/header/header-cell/cell, and button targets where the real Filament fixtures verify them; it does not invent fake selectors or style icons, checkbox/radio internals, `html`, `body`, menus, or arbitrary wrappers.
- [x] The editor presents an explicit registry-driven tree: Global; Forms with Default, Input, Textarea, and Select; Tables with Default, Header, and Cell; Buttons with Default; and other verified groups. Variant/state controls remain beneath their mapped component target, while unsupported groups are identified rather than rendered as fake controls.
- [x] Padding stores four optional canonical edges; omission differs from explicit zero; each edge resolves most-specific inheritance through global → section → component → variant → state; effective value, source, explicitness, and native/unmapped status are exposed without persisting resolved copies. Parent changes preserve child explicit overrides and reset removes only the selected explicit edge/record.
- [x] Linked editing intentionally writes all four edges as one history entry; separate editing changes only the selected edge; switching presentation modes never silently overwrites heterogeneous edges and clearly represents mixed values. Existing density, spacing scale, light/dark, color, raw override, branding, and unrelated semantic state remain unchanged.
- [x] Values reuse the existing raw visual-value allowlist: unitless zero, nonzero numeric lengths with currently allowed units, and existing bounded nonnegative spacing lists where applicable; semantic spacing-scale choices resolve to canonical validated CSS lengths and never emit literal token names. Actual emitted CSS values are validated for finiteness, allowed syntax, and injection safety; no arbitrary `calc(...)`, `var(...)`, URL, declaration, or executable content is accepted, and unsupported input is rejected rather than silently coerced. Per-edge values remain individual declarations, not a composite shorthand.
- [x] The real Filament iframe updates immediately through the shared canonical preview path. Playwright computed-style evidence proves all four edges for global/Forms input/textarea/select/Tables container-header-cell/Buttons targets, native-before/after reset, no duplicate nested padding, keyboard/narrow/zoom behavior, and no reload or non-GET mutation.
- [x] Existing FTB-004 vanilla CSS and canonical JSON exports use the same resolver/registry result as preview. Padding inheritance is semantic, not DOM inheritance: preview and minimal CSS materialize resolved explicit global/section/component/variant/state values on each mapped target's verified selector. Reset recomputes the next explicit ancestor value or removes the declaration for native fallback. JSON retains only sparse explicit edges, including zero; native/unmapped values are not emitted. Future Fully Explicit/Tailwind exporters integrate only if available and are not prerequisites. Old-theme migration preserves all unrelated theme state.
- [x] Unit/store tests cover registry evidence, per-edge inheritance, source/effective resolution, parent preservation, native fallback, linked/separate history, reset/undo/redo, persistence, old JSON migration, validation quarantine, and preview/CSS/JSON parity. If FTB-052 exists, padding lock identities prevent locked per-edge bulk changes; padlocks are not otherwise implemented here.
- [x] Purpose-built MCP discovery/read/preview/confirm/set/reset capabilities use the same services, authorization, validation, resolver, export, and lock boundaries as the UI; confirmation and apply-time revalidation are tested with invalid/stale/unauthorized cases and an actual AI-client journey. The capability-to-tool inventory records this coverage and logs contain no sensitive values or arbitrary payloads.
- [x] The implementation refreshes the full review fixed point, preserves unrelated dirty worktree changes, adds no third-party dependency/server service, does not modify or close parent tickets, and does not claim the demo-first gate or FTB-012 complete.

---

<a id="ftb-055"></a>

## FTB-055 — Add Filament panel topbar visibility control

**Scope slug:** `filament-topbar-visibility`

**Priority:** normal

**Status:** blocked (planning only; not ready-for-agent)

**Blocked by:** FTB-018 runtime/PanelProvider foundation and FTB-006 canonical theme-state, inheritance, and export foundation, pending prerequisite readiness review/evidence, plus existing repository gates. This Phase 1 runtime control is not blocked by a blanket all-Phase-1 release rule, and it introduces no parent ticket or dependency cycle.

**Spec:** [Filament topbar visibility](./SPECS.md#filament-topbar-visibility)

**GitHub:** [#55](https://github.com/Azab-Inc/filament-theme-builder/issues/55)

**Review fixed point:** `5bd91bdb305c5c3873662fdaf55c750ba6522425` (actual full `dev` HEAD at planning publication; refresh before implementation review).

### What to build

Add a Show/Hide control in the builder's Panel/runtime group for the **Filament host panel topbar**. This is not the builder editor toolbar, topbar color styling, sidebar mode, or top navigation, and it must not be implemented as a blanket root CSS filter. The control must remain available in the builder while the host topbar is hidden and must re-enable the topbar without losing theme state.

Use sparse tri-state canonical semantics: unset/inherited preserves the current host/native default; explicit values are strict booleans (`true` or `false`, never truthy strings). Existing JSON that lacks the field migrates with no change. Reset removes the explicit value and returns to the native/current default. The setting participates in canonical autosave/reload, JSON import/export, validation, reset, undo/redo, and controlled runtime preview refresh.

The preview must use the existing runtime-refresh protocol. It may clear the active Inspector document only as the documented existing side effect, while retaining the editor draft and existing origin/protocol and runtime-side-effect guards. Verify real Filament 5.9 behavior with live DOM evidence for desktop/mobile, sidebar, and top-navigation combinations. Preserve native search, profile/user, notification, sidebar/mobile controls, and top-navigation contents; do not invent an alternate menu or artificially move hidden contents. Warn and preserve the selected setting for unsupported/conflicting combinations rather than silently changing it. The official Filament 5 `PanelProvider` contract is `->topbar(false)`; the installed runtime is authoritative.

PanelProvider export emits `->topbar(true)` or `->topbar(false)` as valid PHP booleans and omits the call when inherited. CSS export and installation instructions must not claim that CSS alone hides the actual Filament topbar.

### Acceptance criteria

- [ ] The accessible builder control is in the Panel/runtime group, remains mutable when the host topbar is hidden, and is distinct from the builder's own toolbar, sidebar/top-navigation mode, and topbar color controls.
- [ ] Unset/true/false state is canonical and strictly validated; old JSON without the field is unchanged after migration; reset returns to the native/current default; autosave, reload, JSON import/export, invalid-state recovery, undo, and redo preserve the semantics.
- [ ] Controlled preview refresh follows the existing bridge protocol, retains the editor draft, applies origin/protocol guards, and records the existing Inspector-document side effect without broad CSS hiding.
- [ ] Real Filament DOM Playwright evidence confirms removal/restoration on desktop and mobile, including sidebar and top-navigation combinations, while recording native search, profile/user, notification, sidebar/mobile, and top-navigation behavior.
- [ ] PanelProvider export tests assert `->topbar(true)` and `->topbar(false)`, valid PHP booleans, omission for inherited, and no CSS-only hiding claim.
- [ ] Any unsupported/conflicting navigation combination warns without silently changing the selected topbar value or promising an alternate menu UI.
- [ ] Purpose-built MCP discovery/read/preview/confirm/set/reset uses the same domain services, authorization, strict validation, confirmation, and apply-time revalidation as the UI. Capability inventory coverage, meaningful authorization tests, and actual AI-client verification are required; no UI-only mutation shortcut or unsupported capability claim is added.
- [ ] No third-party dependency, server service, parent-ticket edit, or unrelated worktree change is introduced; implementation refreshes the recorded full fixed point and does not claim FTB-012 or any unrelated release gate complete.

---

<a id="ftb-056"></a>

## FTB-056 — Make all text colors customizable throughout Filament

**Scope slug:** `component-text-color-controls`

**Priority:** normal

**Status:** blocked (planning only; not ready-for-agent)

**Blocked by:** the genuine demo-first gate and existing foundation/control projection stabilization; verified FTB-006 registry/inheritance extension; and the FTB-022 canonical JSON/migration boundary. FTB-053 is coordination only when shared builder seams are touched. FTB-051 and FTB-052 are reusable-control/padlock coordination only when those capabilities exist, not new dependency cycles. FTB-031 remains separate, non-blocking contrast guidance. FTB-024/FTB-025 are future export coordination only and are not required to start this feature.

**Spec:** [Component text-color controls](./SPECS.md#component-text-color-controls)

**GitHub:** [#56](https://github.com/Azab-Inc/filament-theme-builder/issues/56)

**Related tickets:** [FTB-005](#ftb-005), [FTB-006](#ftb-006), [FTB-007](#ftb-007), [FTB-008](#ftb-008), [FTB-016](#ftb-016), [FTB-022](#ftb-022), [FTB-031](#ftb-031), [FTB-051](#ftb-051), [FTB-052](#ftb-052), [FTB-053](#ftb-053), [FTB-054](#ftb-054)

**Review fixed point:** `7e506177994f5785147ed98a869ed27b4b53834a` (actual full `dev` HEAD at planning publication; refresh before implementation review).

### What to build

Make every text color throughout the Filament application customizable, not just headings or existing mapped controls. This includes body/heading/widget/card/stat text and chart labels/legends; button/action labels across variants, sizes, and states; badges, links, navigation/sidebar/topbar items, breadcrumbs, tabs, menus, tooltips, user/tenant controls; form values/options/placeholders/labels/legends/hints/help/errors/validation/affixes/upload/rich-editor text; table headers/cells/summaries/filters/sorting/pagination; empty/loading/error states; notifications, modals, slide-overs, infolists; authentication/profile/showcase surfaces; and all other application-rendered text. This is a minimum list, not an exhaustive whitelist.

Add missing registry mappings, semantic controls, fixtures, and preview/export support as part of this ticket. A target being currently unmapped is not a reason to exclude it or close the ticket as complete. Verify real selectors or the actual text-rendering mechanism rather than guessing, applying one root color, or requiring manual Advanced/raw CSS as the solution.

Use the existing shared color field/picker and Tailwind choices from FTB-051 when available, and integrate FTB-052 value locks when present without making either ticket a hard blocker. Build a focused component/composable from the repository's existing boundaries; do not grow a monolithic `App.vue` implementation, add a competing inheritance resolver, or add dependencies.

### Contract

- [ ] An exhaustive coverage matrix inventories all application-rendered text across routes, components, nested slots, dynamic overlays, interaction states, and light/dark modes. Each entry links its verified selector or rendering mechanism, semantic editor control, effective color/source, and real preview/export evidence. Missing mappings and controls are implemented, not excluded.
- [ ] Automated inventory checks fail for uncovered in-scope text targets. Newly discovered text is added and implemented; an unsupported/unmapped row remains an open acceptance gap. Representative browser journeys alone cannot satisfy complete coverage.
- [ ] Sparse inheritance/resolution is global foundation → component → variant → state. Each supported component exposes effective value and source. Group/category controls exist only where the registry has a common verified layer. Native defaults are preserved when unset; semantic badge/error colors are not erased by blanket styling.
- [ ] Light/dark values are independent. Actual normal/hover/focus/active/selected/disabled states are covered wherever applicable. `::placeholder`, child labels, text-fill properties, SVG text, and chart/editor renderer text use their verified rendering mechanism; no class names or state mappings are invented.
- [ ] Button text foreground is separate from button background. Inherited text does not implicitly recolor icon families; icons change only where an existing registry/design contract explicitly verifies that behavior.
- [ ] Canonical state remains sparse and preserves old-theme migration, validation, autosave/reload, undo/redo, reset, preview bridge, and vanilla foreground export. Themes without this scope retain unrelated values unchanged; invalid values fail safely and stale applies cannot overwrite newer state.
- [ ] Preview uses the existing iframe protocol with no full reload, network mutation, or raw CSS injection. Export reproduces each target's verified rendering mechanism; renderer/configuration-based text has a matching integration/export path and is never misrepresented as controllable by CSS alone.
- [ ] Purpose-built MCP discovery/read/preview/confirm/set/reset uses the same registry, resolver, validation, authorization, confirmation, and apply-time revalidation as the UI. Capability inventory and actual AI-client evidence are required; this is not UI-only behavior.

### Verification

- [ ] TDD unit/store/resolver tests cover the complete inventory, inheritance/source/effective values, mode/state separation, child slots and placeholder specificity, native fallback, unrelated numeric and non-color values remaining untouched, invalid input, stale apply, persistence/migration, reset, undo/redo, and export parity.
- [ ] Playwright against the real Filament iframe verifies computed colors for representative primary/secondary/hover/disabled buttons, form values/placeholders/labels, table headers/cells, navigation links, badges, widgets, modal/notification/infolist text, native-before/after reset, no reload/non-GET mutation, and clean native baseline behavior.
- [ ] MCP discovery, preview confirmation, authorization, apply revalidation, and AI-client verification pass. No third-party dependency, prototype, unrelated app/style/test change, parent-ticket edit, or gate relaxation is introduced.

---

<a id="ftb-057"></a>

## FTB-057 — Complete theme palette references and native picker follow-up

**Status:** done (2026-11-25). **GitHub:** [#57](https://github.com/Azab-Inc/filament-theme-builder/issues/57).

Implemented in commit `59ee76a`; follow-up to closed [FTB-051](#ftb-051). Existing unrelated dirty work was preserved.

- [x] Preserve built-in palette and custom-token choices with friendly labels, mode-aware swatches, and searchable Theme popover.
- [x] Preserve explicit native-picker replacement of inherited, reference, and alpha values without changes on open or cancel.
- [x] Verify bounded references, preview, export, light/dark isolation, reset and history; preserve existing native Filament variables.
- [x] Verify MCP capability inventory and the actual AI-client path using shared authorization and validation; document the unrelated outstanding gap.
- [x] Review and commit the relevant implementation without including unrelated work, then record commit and verification evidence.

Completion evidence: focused builder units passed (18 tests / 6 files), `npm run type-check` passed, alternate-output production build passed, and canonical Compose Playwright `e2e/color-reference-picker.spec.ts` passed (4 tests). The actual stdio MCP journey `e2e/ftb-058-token-operation-mcp.spec.ts` executed named-color creation, reference application, and export before timing out in the later shared stale-operation flow; this is outside FTB-057's palette/native-picker behavior. The capability inventory PHP check remains blocked by an unrelated assertion that rejects the already-documented MCP row for FTB-085. GitHub comment: [verification update](https://github.com/Azab-Inc/filament-theme-builder/issues/57#issuecomment-7170843381). Historical detailed evidence: [color reference picker verification](./docs/superpowers/verification/2026-10-28-color-reference-picker.md). No new dependency or code change was required; commit `59ee76a` contains the relevant implementation.

---

<a id="ftb-058"></a>

## FTB-058 — Complete Inspector scopes, named colors, and mode links

**Status:** done (2026-11-03). **GitHub:** [#58](https://github.com/Azab-Inc/filament-theme-builder/issues/58). **Draft PR:** [#62](https://github.com/Azab-Inc/filament-theme-builder/pull/62), targeting `dev`.

Implemented and independently verified in isolated branch `feature/complete-inspector-scopes-named-colors-and-mode-links`, commits `8239f07` and `6402dba`. Related to FTB-007, FTB-008, FTB-022 and FTB-052; it does not complete those broader tickets.

- [x] Verify generic table header/body/row and positional-column targets and selectable chart/container parent surfaces.
- [x] Verify custom palettes and single color tokens, validation, preview, persistence, export, migration, and safe references.
- [x] Verify per-value light/dark mode links, confirmation, unlinking, reset, undo/redo and mode isolation for semantic and raw contexts. Mode links do not by themselves satisfy the broader strict padlock contract in FTB-052.
- [x] Verify MCP capability inventory, authorization, shared validation, and an actual AI-client flow; document and resolve gaps.
- [x] Review, isolate and commit the relevant implementation and synchronize evidence before closure.

Completion evidence: [FTB-058 verification](./docs/verification/ftb-058/README.md). Full builder: **625 tests / 135 files passed**; full PHP: **269 tests / 2,330 assertions passed**; affected Compose integration: **19 passed**; feature browser acceptance: **3 passed**; actual stdio MCP/browser journey: **1 passed**. Type-check, production build, Pint, PHPStan, root contracts (18 tests), and independent review pass. Matched before/after screenshots are recorded. The MCP intent path executes the same browser domain services and canonical validation as the UI with revision-bound confirmation. Original dirty worktree preserved. PR remains draft; no merge or deployment.

---

<a id="ftb-059"></a>

## FTB-059 — Verify sidebar icon selection and label-color inheritance

**Status:** done (2026-11-25). **GitHub:** [#59](https://github.com/Azab-Inc/filament-theme-builder/issues/59).

Sidebar behavior was implemented in commit `bd39243` and completed with integrated verification on the larger dirty worktree. The follow-up correction limits inheritance to `color`; the requested sidebar-specific icon inheritance remains an explicit scoped exception and does not apply to other icon families. Related to FTB-007, FTB-008 and FTB-056.

- [x] Inspector can select sidebar icons independently.
- [x] Sidebar label color applies to its icon by default, while an explicit icon color remains independent.
- [x] Verify default, hover, focus and selected states; independent light/dark values and inheritance; reset, undo/redo, preview and CSS export including icon override precedence.
- [x] Verify no unintended non-color properties are applied to icons and no other icon families are recolored.
- [x] Verify the integrated committed change, including actual browser interaction and applicable MCP discovery, authorization, validation and AI-client evidence; reconcile any outstanding work before closure.

Completion evidence on the integrated dirty worktree: focused units `raw-overrides`, `raw-inspector-state`, and `mode-isolation-domain` passed (63 tests); `npm run type-check` passed; alternate-output production build passed; `git diff --check` passed; sidebar Inspector Compose browser coverage passed (sidebar icon selection/inheritance, state colors, light/dark isolation, undo/redo, reset and CSS download); raw border integration passed (5 tests); applicable stdio MCP raw Inspector coverage passed through FTB-085 (1 test). The implementation was tightened so only `color` expands from sidebar labels to icons; non-color properties remain label-only. Existing unrelated dirty worktree changes were preserved and no commit was made.

---

<a id="ftb-060"></a>

## FTB-060 — Restore reliable builder and preview verification

**Status:** done. **GitHub:** [#60](https://github.com/Azab-Inc/filament-theme-builder/issues/60).

Verification follow-up for the chat-driven color picker, Inspector and sidebar work. Diagnose failures before attributing causes; do not assume source-contract staleness or resource contention without evidence.

- [x] Investigate `css-entrypoint.spec.ts` expectation against the existing dashboard stylesheet and correct the applicable contract or implementation.
- [x] Reproduce and diagnose both failures in `demo/tests/Feature/PreviewInspectorBridgeTest.php`; capture the exact failed assertions and determine whether authentication, fixture, contract or application behavior is responsible.
- [x] Establish a reliable full builder unit run and record commands, execution time, exit status and relevant revision/worktree state; investigate timeouts and failures rather than labelling them flaky.
- [x] Run applicable PHP, type-check, build and Compose Playwright checks on the settled integrated state; report any remaining blockers precisely.
- [x] Record evidence and synchronize affected follow-up tickets without changing unrelated behavior or bypassing authentication.

FTB-060 completed (2026-11-02): full builder units passed 643 tests in 437s with an explicit 20s per-test timeout after diagnosing two default-timeout failures under suite load; type-check and build passed. Full PHP passed 268 tests/2,309 assertions. The affected Compose bridge/Inspector/sidebar suite passed 16 tests in 192s. Stale inventory/schema contracts and the Inspector icon-target assertion were corrected without changing unrelated behavior. Details: [verification](./docs/superpowers/verification/2026-11-02-ftb-060.md).

Picker full unit run: 637 passed, 1 failed (`css-entrypoint.spec.ts`); PHP bridge: 6 passed, 2 failed, response included login page. A later full unit attempt timed out at 300 seconds. See the [picker verification report](./docs/superpowers/verification/2026-10-28-color-reference-picker.md).

---

<a id="ftb-061"></a>

## FTB-061 — Add an explicit transparent option to every color picker

**Status:** ready-for-agent. **GitHub:** [#61](https://github.com/Azab-Inc/filament-theme-builder/issues/61).

### What to build

Add an explicit no-color / transparent choice to every color picker, so users can make backgrounds and other color properties transparent. Transparent is an intentional color value, distinct from clearing an override or resetting to an inherited/default value.

### Acceptance criteria

- [ ] Every color picker offers a clearly labeled, keyboard-accessible transparent choice and visibly indicates when it is selected, including for backgrounds, borders and text.
- [ ] Selecting transparent renders the actual affected preview property transparent; reset still restores inheritance or the default rather than selecting transparent.
- [ ] Light and dark values remain independent, including inheritance until a mode is explicitly edited; semantic controls, Inspector/raw overrides and applicable variants/states preserve that behavior.
- [ ] Transparent values survive autosave/reload, local themes, undo/redo, JSON import/export and applicable CSS exports; exports reproduce the preview.
- [ ] Existing colors, references, alpha controls, reset behavior and themes remain compatible.
- [ ] Purpose-built MCP discovery/read/preview/apply and reset support the same transparent behavior using shared validation and authorization, confirmation and apply-time revalidation; update the capability inventory and verify an actual AI-client flow.

### Verification

- [ ] Follow TDD: add and run focused failing regression tests before implementation, then verify persistence, mode isolation, reset, history, projection and export.
- [ ] Create and run a failing Playwright CLI test before implementation and verify the completed behavior in the real Filament preview, including a transparent background and reset/inheritance.

**Related:** FTB-051, FTB-057, FTB-058, FTB-022. Follow the repository demo-first gate and existing project guidance.

---

<a id="ftb-062"></a>

## FTB-062 — Add per-setting reset to Filament defaults

**Status:** ready-for-agent. **GitHub:** [#64](https://github.com/Azab-Inc/filament-theme-builder/issues/64).

### What to build

Provide a Reset control next to every editable setting, including color pickers, selectors, typography, spacing and other values. Reset restores the affected setting to its Filament default, without changing unrelated settings. For example, resetting the input background in dark mode restores the native dark input background and leaves the light value untouched.

### Acceptance criteria

- [ ] Inventory every editable setting, including foundations, semantic controls, Inspector/raw overrides, variants and states; provide a visible, keyboard-accessible Reset next to each individual control, including next to Choose color.
- [ ] Reset restores the verified native Filament default for that setting and context. Where a setting has no applicable Filament default, define and communicate its appropriate default behavior explicitly rather than silently guessing.
- [ ] Light and dark resets are independent. Resetting dark restores the native dark default even if dark would otherwise inherit a customized light value; the light value is unchanged. Verify the reverse direction as applicable.
- [ ] Reconcile the existing inheritance-based reset contract in SPECS.md and related design documents with this explicitly requested default-restoring behavior; preserve a distinct way to resume inheritance where needed and make the difference clear.
- [ ] Reset affects only the selected value and context, including nested targets and state variants; preserve unrelated edits and respect applicable value locks and explicit mode links.
- [ ] Preview reflects the restored default; autosave/reload, local themes, undo/redo, JSON import/export and applicable CSS exports preserve and reproduce the correct result. Existing themes migrate without unintended visual changes.
- [ ] Expose the capability through purpose-built MCP discovery/read/preview/confirm/apply using shared validation and authorization, apply-time revalidation and the capability inventory; verify an actual AI-client flow.

### Verification

- [ ] Use TDD with meaningful failing tests before implementation covering inventory, defaults versus inheritance, context and mode isolation, persistence, history, export and MCP authorization.
- [ ] Create and run a failing Playwright CLI test before implementation. In the real Filament preview, customize light and dark input backgrounds, reset dark, assert the native dark default and unchanged light value, then verify history and reload.

**Related:** FTB-005, FTB-006, FTB-007, FTB-008, FTB-022, FTB-052, FTB-054, FTB-058 and FTB-061. Follow the repository demo-first gate and existing project guidance.

---

<a id="ftb-064"></a>

## FTB-064 — Add builder keyboard shortcuts and command modal

**Status:** ready-for-agent. **GitHub:** [#66](https://github.com/Azab-Inc/filament-theme-builder/issues/66).

### What to build

Add direct keyboard shortcuts for the builder toolbar, its Export and Tools dropdown items, and every editor sidebar section. Ctrl+/ opens a modal listing all available commands and their actual shortcuts; provide the equivalent Cmd+/ on macOS. Choose sensible, conflict-aware default combinations for individual commands.

### Acceptance criteria

- [ ] Inventory the current toolbar, Export and Tools dropdowns, and sidebar sections at implementation time; every actionable item has a direct shortcut and an entry in the modal. Include Save theme; the primary color input, native picker and Choose color; the primary mode-link control; Light and Dark; Undo, Redo and Inspector; all six current export/copy actions; Manage themes, theme import and local client pairing actions; and Foundations, Components, Branding, Icons and conditional Inspector sections. Include any additional actions present in those surfaces when implemented.
- [ ] Each shortcut invokes the same action as its existing control. For controls requiring a value, selection, confirmation or multi-step interaction, focus the relevant control or open its existing workflow rather than inventing a value or bypassing confirmation. Context-dependent or disabled actions remain unavailable when the original control is unavailable, including pairing approval and Inspector selection.
- [ ] Ctrl+/ (Cmd+/ on macOS) opens a clearly labelled, keyboard-accessible modal that lists the complete command inventory, descriptive names, platform-appropriate actual bindings and availability. Commands and shortcuts remain synchronized from a single authoritative inventory; the modal can be dismissed with Escape, manages focus and restores focus on close.
- [ ] Use distinct, discoverable defaults that avoid browser/OS and existing Filament shortcut conflicts as far as practical; preserve Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z for undo/redo. Document any unavoidable platform or browser limitations truthfully. Shortcuts do not trigger unexpectedly while typing in inputs, textareas, selects or contenteditable elements, during composition, or when a dialog/control owns the keystroke; define and test the modal-opening behavior in those contexts.
- [ ] Shortcuts behave consistently with the existing controls in both editor navigation layouts, respect active and unavailable states, and preserve theme values, light/dark isolation, undo/redo, existing preview/Inspector behavior and existing authorization/confirmation flows. Account for focus in the embedded preview and document any browser or iframe limits rather than claiming unsupported global handling.
- [ ] Maintain the MCP capability inventory: shortcut and modal presentation do not create privileged mutations or bypass existing purpose-built tools. Any newly exposed underlying product capability must use shared services, validation, authorization, preview/confirmation and apply-time revalidation, with meaningful authorization tests and actual AI-client verification as applicable.

### Verification

- [ ] Follow TDD: write and run focused failing regression tests first, then test the command inventory, shortcut mapping, contextual availability, editable/composition guards, lifecycle cleanup and existing action parity.
- [ ] Create and run failing Playwright CLI coverage before implementation, then verify Ctrl+/ and Cmd+/ handling, modal keyboard/focus behavior, representative direct shortcuts from every toolbar/dropdown/sidebar group, both navigation layouts, editable-field isolation, preview focus behavior and existing confirmation/disabled states against the real builder and Filament preview. Verify the complete inventory and direct binding coverage through automated tests.
- [ ] Run the applicable builder type-check, unit tests and production build; report actual browser/platform coverage and any limitations.

**Related:** FTB-003, FTB-007, FTB-008, FTB-021, FTB-022, FTB-050 and the editor keyboard-wayfinding research. Follow the repository demo-first gate and existing project guidance.

---

<a id="ftb-063"></a>

## FTB-063 — Select table badges with the Inspector

**Status:** done. **GitHub:** [#65](https://github.com/Azab-Inc/filament-theme-builder/issues/65).

### Problem

Hovering or clicking a status badge in the dashboard Inspector selected its containing table cell rather than the badge text.

### Acceptance criteria

- [x] Hovering and clicking a dashboard status badge highlights and selects the badge.
- [x] Inspector exposes a badge selector, while the surrounding table cell remains separately selectable.
- [x] Existing Inspector and bridge interactions continue to work.

### Completion and verification

Fixed in commit `96e3715`: the preview bridge prioritizes badge targets before promoting table descendants to cells.

The Playwright regression first failed on the missing badge hover highlight before the fix. On the settled change, `COMPOSE_E2E=1 npx playwright test e2e/ftb-007-inspector.spec.ts e2e/inspector-badge.spec.ts` passed 13 tests. Focused bridge, outline, table-row and badge checks passed 6 tests. `git diff --check` passed.

Related: FTB-007 and FTB-008. This fix does not close those broader tickets.


---

<a id="ftb-066"></a>

## FTB-066 — Add a Driver.js onboarding tour for the builder

**Status:** done (2026-11-19; FTB-067/068/069 integrated on `dev`)
**Spec:** [Driver.js onboarding tour design](./docs/superpowers/specs/2026-11-18-driverjs-onboarding-tour-design.md)
**GitHub:** [#68](https://github.com/Azab-Inc/filament-theme-builder/issues/68)
**Children:** [FTB-067](#ftb-067) / [#69](https://github.com/Azab-Inc/filament-theme-builder/issues/69), [FTB-068](#ftb-068) / [#70](https://github.com/Azab-Inc/filament-theme-builder/issues/70), [FTB-069](#ftb-069) / [#71](https://github.com/Azab-Inc/filament-theme-builder/issues/71)

### What to build

Add a short, skippable first-run tour using Driver.js that explains the builder chrome, live Filament preview, Inspector, foundations, theme management, and exports. The tour uses stable `data-tour` anchors, persists completion separately from theme state, and can be replayed from Tools. Implement through the three child tickets; this umbrella adds no separate code path.

### Acceptance criteria

- [x] First visit starts the tour after the preview shell is mounted and the iframe is visible; Skip dismisses it and records completion.
- [x] Next/Back/Done and Escape work. Incomplete tours restart at step one; Tools > Take a tour always replays from step one.
- [x] Completion uses versioned local storage isolated from theme JSON, exports, undo/redo, and autosave; invalid values fail safely.
- [x] Seven steps cover welcome, editor navigation, foundations, live preview, Inspector, themes/exports, and finish; missing optional targets are skipped safely.
- [x] Both editor navigation layouts, narrow viewport, light/dark mode, keyboard traversal, focus return, screen-reader content, and reduced motion are verified.
- [x] No tour action mutates theme values, mode, undo/redo, Inspector selection, or exports.
- [x] TDD and Playwright are used as required by repository guidance.

### Verification

- [x] All three child tickets are done with their focused failing-first evidence and settled verification.
- [x] Run builder type-check, unit tests, production build, and the focused Playwright tour suite; record actual results.
- [x] Keep unrelated worktree changes out of implementation commits.

### Integrated completion evidence — 2026-11-19

Driver.js `1.3.6` is pinned. Seven stable-anchor steps share one lifecycle; schema-1 completion is browser-local and independent of theme state. Automatic startup requires iframe load plus an exact-origin/source validated bridge handshake. HTTP 404/500 and delayed preview startup are covered. No server persistence or MCP tour tool is introduced; the capability inventory records this presentation-only boundary.

- Builder cwd: `npm run type-check` passed; focused storage/lifecycle/preview/protocol units passed (20 tests), and Inspector accessibility/protocol checks passed (14 tests).
- Builder cwd: `npm run test:unit -- --run --testTimeout=30000 --hookTimeout=30000` passed **155 files / 728 tests**, 560.94s. Earlier default-5s runs timed out in App structure/recovery; the single-worker retry hit a 360s shell timeout. These are not reported as passing or flaky.
- Repository cwd: `docker compose -f compose.dev.yaml exec -T builder-vite npm run build` passed. Host output permissions required the canonical Compose build path.
- Repository cwd: `COMPOSE_E2E=1 npx playwright test e2e/onboarding-tour.spec.ts` passed **16 tests**, including both layouts × actual light/dark modes × 1280/420px widths (800px height), keyboard/focus, replay/cleanup, interrupted startup, preview failures, and JSON/CSS output equality. Two strengthened interrupted/missing-target assertions subsequently passed with `--grep 'interrupted first-run|optional target'`; unchanged scenarios retain their evidence.
- Three affected legacy toolbar/Inspector browser checks passed. The entire legacy E2E suite was not certified; unrelated menu-order/field-label/tab/color-picker failures were observed during broader toolbar probing.
- One read-only review identified load-only readiness as blocking; the bridge handshake repair and failed-preview regressions resolve that finding. Focus evidence blocks the external `live.js` injection in tests without modifying the unrelated local `builder/index.html` change.
- Initial red runs included missing storage-module import and absent tour/dependency; later focused red assertions exposed invalid-date/storage-access, close lifecycle, focus, and final-button gaps before repairs. No claim of a separate per-slice commit or manual screen-reader audit is made.

Implementation commit: `6164b994eedc36b2349e33dc1894b4015071003e` (`Feature: add the Driver.js builder onboarding tour`). Ticket synchronization is saved separately; no push or PR was requested.

**Dropdown follow-up (2026-11-19):** Fixed toolbar scroll-container clipping that hid Tools/Export menus. Toolbar controls now wrap with visible overflow; narrow-screen menus align to the left of their trigger. The test-first regression reproduced clipped pointer hit-testing at 1920, 1280 and 420px before the CSS fix. Settled checks: `COMPOSE_E2E=1 npx playwright test e2e/toolbar-dropdown-visibility.spec.ts` passed 10 cases across 1920/1280/768/640/420px and actual light/dark modes, including full-menu hit-testing, no toolbar scrolling, Escape/focus return, and Take a tour replay. All 16 onboarding tests passed in the affected combined run; one dropdown case timed out before app controls appeared (snapshot contained only devtools/live-mode UI, Compose remained healthy). The final dropdown run blocks unrelated `live.js` injection and passed all 10 cases. Builder focused `stylesheet-compliance`, `css-entrypoint`, and `App.toolbar` units passed 6 tests; Compose `npm run build` (including type-check) passed. Desktop/mobile screenshots were visually inspected. No theme/export code changed; the full unit suite was not rerun for this CSS-only fix. See `Fix - UI: prevent toolbar dropdown clipping` in git history.

**Navigation highlight follow-up:** Moved the `editor-navigation` tour anchor from the Sidebar/Top navigation layout-selector fieldset to the actual Editor sections tablist in both layouts. New `e2e/onboarding-navigation-target.spec.ts` first reproduced the wrong highlighted fieldset, then passed for Sidebar and Top navigation, asserting Foundations/Components/Branding/Icons are inside the highlighted tablist and no layout radio is included. Settled repository check: `COMPOSE_E2E=1 npx playwright test e2e/onboarding-navigation-target.spec.ts e2e/onboarding-tour.spec.ts` passed **18 tests**. Builder focused navigation/structure/tour units passed 14 tests; `npm run test:unit -- --run --testTimeout=30000 --hookTimeout=30000` passed **156 files / 734 tests**, 292.30s. Compose `npm run build`, including type-check, passed. No theme state or navigation behavior changed. See `Fix - UI: highlight section navigation in the onboarding tour` in git history; unrelated concurrent work remains outside that commit.

**Inspector-first and retention guidance follow-up (user-approved):** Step 4 now highlights the actual Inspector button in the top toolbar before step 5 explains preview interaction. The tour remains seven steps and does not toggle Inspector. Step 7 explains that theme changes are saved in this browser’s local storage, exporting keeps a copy outside the browser, and a Composer package for project integration is coming soon. Temporary demo records are not represented as local-storage data. Unit regressions first failed on the old step order and finish copy; four real-browser regressions first showed the live-preview title at step 4. Settled checks: focused tour units **10 passed**; `COMPOSE_E2E=1 npx playwright test e2e/onboarding-instructions.spec.ts e2e/onboarding-navigation-target.spec.ts e2e/onboarding-tour.spec.ts` **22 passed**; full builder units with `--run --testTimeout=30000 --hookTimeout=30000` **156 files / 736 tests passed**, 213.45s; Compose production build/type-check passed. The mechanical UI detector returned no findings, and rendered Inspector/finish steps were visually inspected at desktop/mobile sizes. The approved design spec carries the updated order and retention wording. No storage/export implementation changed. See `Fix - UI: clarify Inspector and theme retention in the tour` in git history.

**Non-goals:** touring inside the Filament iframe; analytics, accounts, server persistence, or a second tour library.

**Related:** FTB-003, FTB-005, FTB-006, FTB-007, FTB-008, FTB-019, FTB-021, FTB-022, FTB-050, FTB-064.

---

<a id="ftb-067"></a>

## FTB-067 — Add the Driver.js tour engine and first-run flow

**Status:** done (2026-11-19; see [integrated evidence](#ftb-066))
**Blocked by:** none
**Parent:** [FTB-066](#ftb-066)
**Spec:** [Driver.js onboarding tour design](./docs/superpowers/specs/2026-11-18-driverjs-onboarding-tour-design.md)
**GitHub:** [#69](https://github.com/Azab-Inc/filament-theme-builder/issues/69)

### What to build

Create the tour engine and first-run lifecycle with the welcome, editor navigation, foundations, and live-preview steps. Add Driver.js as an exact pinned dependency, typed step definitions and manifest, `use-onboarding-tour`, stable anchors, readiness gating, reduced-motion handling, and versioned completion storage isolated from theme state.

### Acceptance criteria

- [x] Driver.js is pinned to an exact reviewed version; no second tour library is introduced.
- [x] First visit shows the tour once after the shell and iframe are ready; Skip and Escape close it and record completion.
- [x] Next/Back/Done traverse the implemented steps; incomplete tours restart at step one on the next visit.
- [x] Stored progress survives reload; malformed or legacy values fail safely and show the tour without touching theme storage.
- [x] Missing anchors are skipped without crashing the remaining tour.
- [x] Repeated starts do not duplicate overlays or listeners; reduced motion disables animation.

### Verification

- [x] Write focused failing unit tests for startup gating, persistence validation, navigation, skip/replay, missing anchors, reduced motion, and cleanup before implementation.
- [x] Create and run a failing Playwright CLI test for first-run display, Skip persistence, and replay before implementation.
- [x] Run builder type-check, unit tests, production build, and focused Playwright coverage on the settled change.

**Related:** FTB-003, FTB-005, FTB-050.

---

<a id="ftb-068"></a>

## FTB-068 — Complete tour steps, replay, and Tools entry

**Status:** done (2026-11-19; see [integrated evidence](#ftb-066))
**Blocked by:** [FTB-067](#ftb-067)
**Parent:** [FTB-066](#ftb-066)
**Spec:** [Driver.js onboarding tour design](./docs/superpowers/specs/2026-11-18-driverjs-onboarding-tour-design.md)
**GitHub:** [#70](https://github.com/Azab-Inc/filament-theme-builder/issues/70)

### What to build

Complete the seven-step tour with Inspector, themes/exports, and finish steps, and add a keyboard-reachable Tools > Take a tour action that always restarts from step one. Use the existing engine and lifecycle; do not add a second tour state or library.

### Acceptance criteria

- [x] Welcome, editor navigation, foundations, Inspector, live preview, themes/exports, and finish are covered in order.
- [x] Tools > Take a tour restarts from step one after completion and after a skipped tour.
- [x] No step opens a menu, changes mode, selects an editor section, or mutates theme state.
- [x] Missing optional targets are skipped and remaining steps stay ordered and usable.
- [x] Tour copy is short, accurate for Filament 5.9, and does not claim unsupported capabilities.

### Verification

- [x] Extend focused failing unit tests for the complete manifest, replay entry, ordering, missing targets, and no theme mutation before implementation.
- [x] Extend failing Playwright CLI coverage for every step, Tools replay, and unchanged theme/export/undo state before implementation.
- [x] Run builder type-check, unit tests, production build, and focused Playwright coverage on the settled change.

**Related:** FTB-007, FTB-008, FTB-021, FTB-022, FTB-064.

---

<a id="ftb-069"></a>

## FTB-069 — Harden and verify the onboarding tour

**Status:** done (2026-11-19; see [integrated evidence](#ftb-066))
**Blocked by:** [FTB-067](#ftb-067), [FTB-068](#ftb-068)
**Parent:** [FTB-066](#ftb-066)
**Spec:** [Driver.js onboarding tour design](./docs/superpowers/specs/2026-11-18-driverjs-onboarding-tour-design.md)
**GitHub:** [#71](https://github.com/Azab-Inc/filament-theme-builder/issues/71)

### What to build

Harden the tour across both editor layouts, narrow viewports, light/dark mode, keyboard and focus behavior, screen-reader content, reduced motion, repeated replay, and cleanup. Verify that tour activity leaves theme state, Inspector selection, undo/redo, and export output unchanged.

### Acceptance criteria

- [x] The tour works in both layouts, at desktop and narrow widths, and in light and dark mode.
- [x] Tab, Enter/Space, Escape, focus entry/return, and Skip are verified against the real builder; limitations are documented truthfully.
- [x] Popover content is available to assistive technology, includes textual step counts, and remains reachable on narrow viewports.
- [x] Reduced motion disables Driver.js animation.
- [x] No tour action changes theme, mode, undo/redo, Inspector selection, or export output.
- [x] No duplicate overlays or dangling listeners remain after repeated open/close cycles or unmount.

### Verification

- [x] Create and run failing Playwright CLI tests for both layouts, narrow viewport, keyboard/focus, Escape, reduced motion, repeated replay, and unchanged theme/export state before fixes.
- [x] Run builder type-check, unit tests, production build, and the complete focused Playwright tour suite on the settled change.
- [x] Record browser coverage, viewport sizes, and any Driver.js limitations.

**Related:** FTB-019, FTB-050, FTB-064.

---

<a id="ftb-070"></a>

## FTB-070 — Complete Filament component and variant coverage (umbrella)

**Status:** ready-for-agent (umbrella; do not implement directly)
**Blocked by:** None
**Specs:** [Component and variant coverage](./docs/superpowers/specs/2026-11-18-filament-component-variant-coverage-design.md), [Chart widget theming](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md)
**Children:** [FTB-071](#ftb-071) / [#73](https://github.com/Azab-Inc/filament-theme-builder/issues/73), [FTB-072](#ftb-072) / [#74](https://github.com/Azab-Inc/filament-theme-builder/issues/74), [FTB-073](#ftb-073) / [#75](https://github.com/Azab-Inc/filament-theme-builder/issues/75), [FTB-074](#ftb-074) / [#76](https://github.com/Azab-Inc/filament-theme-builder/issues/76), [FTB-075](#ftb-075) / [#77](https://github.com/Azab-Inc/filament-theme-builder/issues/77)
**GitHub:** [#72](https://github.com/Azab-Inc/filament-theme-builder/issues/72)

### What to build

Track the verified Filament 5.9 component and variant inventory and the slices that turn selector-only surfaces into editable, exportable controls. Charts are the first vertical slice because canvas rendering exposes the gap most clearly; forms, tables, actions, notifications, schemas, support primitives, and panel surfaces follow without inventing selectors.

### Acceptance criteria

- [ ] Every inventory row in the coverage spec has a registry status of `absent`, `surface`, `css-controlled`, `renderer-controlled`, or `partial`; no row silently disappears.
- [ ] Each child slice has a stable ticket, acceptance criteria, TDD/Playwright obligations, and a link back to this umbrella.
- [ ] `COVERAGE.md` and the GitHub project reflect the same coverage state and do not claim unsupported capabilities.
- [ ] Chart controls distinguish CSS-addressable appearance from renderer-backed series colors and chart types in both UI copy and export.
- [ ] Remaining non-chart family controls are recorded as follow-up scope rather than folded into chart tickets.

### Verification

- [ ] Inventory spot-checks resolve each selector and property against the vendored Filament 5.9 package.
- [ ] No child ticket relies on an unverified selector, custom property, or renderer behavior.
- [ ] Close only when every child is done or explicitly deferred with a recorded reason.

**Related:** FTB-006, FTB-007, FTB-008, FTB-026, FTB-032, FTB-039.

---

<a id="ftb-071"></a>

## FTB-071 — Add the component/variant inventory and variant-aware editing seams

**Status:** ready-for-agent
**Blocked by:** None
**Parent:** [FTB-070](#ftb-070)
**Spec:** [Component and variant coverage](./docs/superpowers/specs/2026-11-18-filament-component-variant-coverage-design.md)
**GitHub:** [#73](https://github.com/Azab-Inc/filament-theme-builder/issues/73)

### What to build

Turn the verified inventory into registry metadata with an explicit coverage status and a generic variant model. Add the editor affordances that let a user choose a component variant, edit it with inheritance and mode isolation, and see which controls are CSS-addressable versus renderer/runtime-backed. Use the existing registry, override, and projection seams; do not add a parallel theme state.

### Acceptance criteria

- [ ] Every family in the coverage spec is represented in the registry with verified selectors, coverage status, and declared variants/states where they exist.
- [ ] Registry entries distinguish `css`, `css-variable`, `renderer`, and `runtime-config` controls; unsupported controls are not exposed.
- [ ] A component with multiple variants exposes a variant selector and scopes edits through the existing Global → Component → Variant → State inheritance.
- [ ] Variant and state overrides default to Inherit; reset removes the override and restores inherited behavior.
- [ ] Light and dark values remain independent across component, variant, and state scopes.
- [ ] Inspector resolution and exported CSS continue to use only verified selectors and never emit renderer-only values as CSS.
- [ ] The registry catalog and coverage tests fail on duplicate selectors, unknown variants/states, or missing coverage-status metadata.

### Verification

- [ ] Write and run focused failing unit tests for inventory completeness, coverage-status invariants, variant/state validation, inheritance, reset, and mode isolation before implementation.
- [ ] Add a Playwright CLI journey that selects a variant, edits it in both modes, resets one value, and confirms the other mode and inherited values are untouched.
- [ ] Run builder type-check, focused unit tests, production build, and the focused Playwright journey on the settled change.
- [ ] Verify the exported CSS contains variant-scoped rules only for CSS-addressable controls.

**Related:** FTB-005, FTB-006, FTB-007, FTB-008, FTB-022, FTB-032.

---

<a id="ftb-072"></a>

## FTB-072 — Add chart surface, geometry, legend, and tooltip controls

**Status:** ready-for-agent
**Blocked by:** [FTB-071](#ftb-071)
**Parent:** [FTB-070](#ftb-070)
**Spec:** [Chart widget theming](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md)
**GitHub:** [#74](https://github.com/Azab-Inc/filament-theme-builder/issues/74)

### What to build

Expose the chart appearance Filament 5.9 makes CSS-addressable: surface, border, grid, and text colors through the verified sentinel elements, plus line tension, point radius/style, bar radius, border width, legend swatch shape, and tooltip shape/colors through the verified custom properties. Apply the same treatment to the stats overview sparkline with its `--stat-chart-*` properties. Do not expose series colors or chart types in this ticket.

### Acceptance criteria

- [ ] Chart surface, border, grid, text, and tooltip colors map to the verified `fi-wi-chart-*` sentinel elements and follow light/dark mode independently.
- [ ] Geometry controls map to `--chart-border-width`, `--chart-line-tension`, `--chart-point-radius`, `--chart-point-style`, `--chart-bar-border-radius`, `--chart-legend-box-width`, `--chart-legend-border-radius`, `--chart-tooltip-corner-radius`, and `--chart-tooltip-border-width`.
- [ ] Sparkline controls map to `--stat-chart-border-width`, `--stat-chart-line-tension`, and `--stat-chart-fill`, with the verified sentinel colors.
- [ ] Controls that do not apply to the active chart type are hidden or disabled with an explanation.
- [ ] Reset returns each value to Filament's native default; undo/redo and JSON/CSS round-trip work.
- [ ] Exported vanilla CSS and Tailwind `@apply` contain the selected values and no renderer-only dataset or chart-type data.

### Verification

- [ ] Write and run focused failing unit tests for selector mapping, custom-property values, mode isolation, reset, and CSS export before implementation.
- [ ] Create and run a failing Playwright CLI test that reads computed sentinel colors and custom properties in the real iframe, switches mode, and confirms independence.
- [ ] Run builder type-check, focused units, production build, and the focused Playwright test on the settled change.

**Related:** FTB-005, FTB-006, FTB-008, FTB-024, FTB-026.

---

<a id="ftb-073"></a>

## FTB-073 — Add chart series palettes and chart-type variants

**Status:** ready-for-agent
**Blocked by:** [FTB-071](#ftb-071), [FTB-072](#ftb-072)
**Parent:** [FTB-070](#ftb-070)
**Spec:** [Chart widget theming](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md)
**GitHub:** [#75](https://github.com/Azab-Inc/filament-theme-builder/issues/75)

### What to build

Add per-series color controls and all eight Filament chart-type variants for the chart widget. Preview through the real Chart.js instances in the iframe with a validated renderer projection; do not replace Filament's Alpine chart component. Series colors and chart types are renderer-backed controls and must be labeled as requiring generated chart integration.

### Acceptance criteria

- [ ] Series controls are discovered from the demo chart's datasets and keyed by zero-based index, with optional label guards; unconfigured series keep Filament's native colors.
- [ ] Series colors support independent light/dark values, background/border, and the applicable point/hover colors, and participate in undo/redo and reset.
- [ ] All eight variants are selectable: line, bar, pie, doughnut, polar area, radar, scatter, bubble. Incompatible variants warn and are not silently applied.
- [ ] The bridge discovers charts with `Chart.getChart(canvas)`, validates an allowlisted `chartProjection`, applies dataset colors, and refreshes with `chart.update('resize')`.
- [ ] Incompatible type changes recreate the Chart instance with Filament-compatible defaults while preserving data, labels, and safe user options.
- [ ] The preview does not trigger a Livewire request, full reload, or non-GET mutation; polling/data updates and mode switches re-apply the theme.
- [ ] CSS export excludes series and chart-type values; the canonical JSON round-trips them.

### Verification

- [ ] Write and run focused failing unit tests for series validation, variant validation, renderer/CSS segregation, mode isolation, reset, and JSON round-trip before implementation.
- [ ] Create and run a failing Playwright CLI test that reads `Chart.getChart(canvas)` datasets, edits each series, switches every chart type, checks undo/redo/reset, and verifies light/dark independence and no reload.
- [ ] Run builder type-check, focused units, production build, the PHP bridge tests, and the focused Playwright suite on the settled change.

**Related:** FTB-006, FTB-008, FTB-022, FTB-033, FTB-072.

---

<a id="ftb-074"></a>

## FTB-074 — Add chart/widget variant fixtures and structured chart Inspector targets

**Status:** ready-for-agent
**Blocked by:** [FTB-073](#ftb-073)
**Parent:** [FTB-070](#ftb-070)
**Spec:** [Chart widget theming](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md)
**GitHub:** [#76](https://github.com/Azab-Inc/filament-theme-builder/issues/76)

### What to build

Provide deterministic showcase fixtures for every chart type and the stats sparkline, including single- and multi-series charts, empty, collapsed, filtered, and polling states. When the Inspector selects a chart surface, expose a structured target list (`chart.surface`, `chart.series.N`, `chart.axes.x`, `chart.axes.y`, `chart.legend`, `chart.tooltip`) rather than pretending canvas pixels are DOM elements. Add the stable demo chart-key map used by the preview bridge.

### Acceptance criteria

- [ ] The showcase renders all eight chart types and stats sparklines with documented deterministic data.
- [ ] Empty, collapsed, filtered, and polling update states are reachable without manual database changes.
- [ ] Selecting a chart canvas exposes the structured chart targets and routes them to the matching controls; the UI states that canvas points are not individual DOM targets.
- [ ] The demo chart-key map is explicit, bounded, and unavailable to user applications except through the documented fixture contract.
- [ ] Fixtures do not change production dashboard data or require third-party packages.

### Verification

- [ ] Add focused unit tests for chart-key mapping, target validation, and unavailable/invalid targets before implementation.
- [ ] Create and run a failing Playwright CLI test for every chart type, sparkline, empty/collapsed/filtered states, and structured Inspector selection before implementation.
- [ ] Run the PHP demo tests, builder type-check, focused units, production build, and the focused Playwright suite on the settled change.

**Related:** FTB-015, FTB-016, FTB-033, FTB-058.

---

<a id="ftb-075"></a>

## FTB-075 — Export chart configuration, mode sync, and installation guidance

**Status:** ready-for-agent
**Blocked by:** [FTB-073](#ftb-073)
**Parent:** [FTB-070](#ftb-070)
**Spec:** [Chart widget theming](./docs/superpowers/specs/2026-11-18-chart-widget-theming-design.md)
**GitHub:** [#77](https://github.com/Azab-Inc/filament-theme-builder/issues/77)

### What to build

Extend the export handoff with chart-specific outputs: the CSS already generated for CSS-addressable appearance, a versioned PHP config for chart types and per-series palettes, a generated trait for `getType()` and `getData()`, and a small generated mode-sync script so series colors follow Filament's client-side light/dark switch. Integrate with the existing export/installation guidance rather than creating a second export surface.

### Acceptance criteria

- [ ] Export emits a valid, versioned PHP config with chart keys, validated types, zero-based series indices, optional labels, and light/dark colors.
- [ ] Export emits a documented trait or equivalent helper for `getType()` and `getData()` without overwriting unrelated widget logic.
- [ ] The mode-sync script is generated, dependency-free, registered once per panel, idempotent, and limited to matching theme config.
- [ ] Without the mode-sync script, export truthfully states that series colors use the light palette in both modes; it never claims live dark support.
- [ ] Installation guidance explains config location, trait usage, key/label matching, asset registration, and that unconfigured charts/series remain unchanged.
- [ ] CSS export and PHP export remain separate: no dataset colors or chart types in CSS; no CSS-only properties presented as PHP requirements.
- [ ] Invalid or stale config falls back safely and reports the mismatch without applying the wrong color.

### Verification

- [ ] Write and run focused failing PHP and unit tests for config shape, trait behavior, label mismatch, invalid type, mode sync, idempotence, and CSS/PHP separation before implementation.
- [ ] Create and run a failing Playwright CLI test that downloads/copies each export and verifies the expected content; verify preview/export parity for a representative multi-series chart in both modes.
- [ ] Run PHP tests, builder type-check, focused units, production build, and the focused Playwright suite on the settled change.
- [ ] Document any limitation that remains, including third-party chart plugins and per-scale options.

**Related:** FTB-004, FTB-022, FTB-024, FTB-026, FTB-073.

---

<a id="ftb-076"></a>

## FTB-076 — Bring builder stylesheets into the Tailwind v4 token standard (umbrella)

**Scope slug:** `builder-stylesheet-tailwind-compliance`

**Priority:** normal refactor; blocks consistent builder theming

**Status:** ready-for-agent

**Blocked by:** None. Slices [FTB-077](#ftb-077) through [FTB-083](#ftb-083) must all be done before this ticket can close. This is a behavior-preserving builder refactor; it does not change demo coverage, export output, or relax any repository gate.

**Spec:** [Builder Stylesheet Tailwind Compliance](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md)
**Plan:** [Implementation plan](./docs/superpowers/plans/2026-11-18-builder-stylesheet-tailwind-compliance.md)
**GitHub:** [#78](https://github.com/Azab-Inc/filament-theme-builder/issues/78)

### What to build

Make every stylesheet under `builder/src/styles` comply with [builder/src/styles/AGENTS.md](./builder/src/styles/AGENTS.md): one central token source, Tailwind v4 `@apply` for all selector styling, native CSS nesting, no scattered literals, no avoidable duplication, and preserved behavior/specificity. Split the two oversized stylesheets and prove visual parity in the real application.

This umbrella owns the standard, the final audit, and the evidence index. Implementation is delivered through the seven slices below.

### Acceptance criteria

- [ ] `builder/src/styles/tokens.css` is the only file declaring `@theme` and is imported first by `app.css`.
- [ ] Every selector rule in the 14 governed stylesheets uses `@apply`; raw declarations remain only inside `@theme`, `@utility`, custom-property definitions, and the documented `@layer base` block.
- [ ] No hex, `rgb()`, `oklch()`, named-color, or reusable dimension literal appears outside `tokens.css`.
- [ ] Descendants, states, and modifiers use native nesting; no block exceeds three levels.
- [ ] No `!important` survives outside the documented `prefers-reduced-motion` allowlist.
- [ ] `dashboard-first-editor.css` and `visual-prototype.css` are split per the spec with import order and cascade preserved.
- [ ] Component-imported stylesheets that use `@apply` declare `@reference "../app.css";`.
- [ ] The compliance guard, type-check, full unit suite, and production build pass from `builder/`.
- [ ] Export golden tests are unchanged and pass for both vanilla and Tailwind `@apply` strategies.
- [ ] Computed-style assertions and five-mode, two-width screenshots match the pre-change baseline.
- [ ] The Filament demo iframe receives no builder stylesheet rules.

### Verification

- [ ] Write the compliance guard first and record its expected failing run before conversion work.
- [ ] Run `npm run test:unit -- --run`, `npm run type-check`, and `npm run build` from `builder/` on the settled change.
- [ ] Run Playwright computed-style assertions and capture default, `?inspect=1`, `?visual-prototype=1`, `?dashboard-prototype=1`, and `?guidelines-prototype=1` at 1440px and 390px; compare with `docs/verification/ftb-076-stylesheet-compliance/baseline/`.
- [ ] For each slice, capture the exact failing assertion/obtained value before the fix.
- [ ] Record command, cwd, result, tested revision, and working-tree state once in the evidence README.
- [ ] Obtain one independent read-only review; resolve blocking findings only.

### Slices

| Ticket | Scope |
| --- | --- |
| [FTB-077](#ftb-077) | Baseline capture and Prettier un-minification |
| [FTB-078](#ftb-078) | Token foundation, utilities, base block, compliance guard |
| [FTB-079](#ftb-079) | `editor-shell`, `editor-navigation`, `editor-responsive`, `editor-mobile` |
| [FTB-080](#ftb-080) | `color-field`, `foundation-surfaces`, `foundation-controls`, `local-theme-dialog` |
| [FTB-081](#ftb-081) | `dashboard-first-editor` split and conversion |
| [FTB-082](#ftb-082) | `inspect`, `theme`, `dashboard`, and `guidelines` prototypes |
| [FTB-083](#ftb-083) | `visual-prototype` split and conversion |

**Related:** [FTB-053](#ftb-053) (builder structural refactor), [FTB-050](#ftb-050) (editor layout), [FTB-033](#ftb-033) (visual regression).

---

<a id="ftb-077"></a>

## FTB-077 — Capture stylesheet baselines and un-minify the prototype sheets

**Scope slug:** `builder-stylesheet-baseline`

**Priority:** normal DX

**Status:** ready-for-agent

**Blocked by:** None
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Stylesheet compliance](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#11-verification-contract)
**GitHub:** [#79](https://github.com/Azab-Inc/filament-theme-builder/issues/79)

### What to build

Establish the visual and computed-style baseline every later slice compares against, and format the two minified stylesheets so their conversion diffs are reviewable. `theme-prototype.css` is three physical lines and `inspect-prototype.css` is twelve; neither can be responsibly reviewed or converted in that state.

### Acceptance criteria

- [ ] Baseline screenshots exist for the default builder and `?inspect=1`, `?visual-prototype=1`, `?dashboard-prototype=1`, `?guidelines-prototype=1` at 1440px and 390px.
- [ ] Baseline computed values are recorded for the sentinels in the spec: root, header/toolbar, primary button, current nav item, input, focused control, popover/dialog, and pane grid.
- [ ] `theme-prototype.css` and `inspect-prototype.css` are formatted with the repository Prettier configuration.
- [ ] Formatting is committed alone as `Autogen: format minified builder prototype stylesheets`.
- [ ] Formatted files produce no visual change against the captured baseline.
- [ ] Evidence lives under `docs/verification/ftb-076-stylesheet-compliance/` with commands, revision, and file list.

### Verification

- [ ] Create and run the Playwright baseline script before any formatting; record its passing output.
- [ ] Run `npx prettier --write` only on the two named files from `builder/`.
- [ ] Re-run the same capture and compare; report any pixel difference instead of accepting it.
- [ ] Run `git diff --check` and confirm no selector or declaration changed semantically.

**Related:** [FTB-033](#ftb-033), [FTB-076](#ftb-076).

---

<a id="ftb-078"></a>

## FTB-078 — Add builder style tokens, utilities, and the compliance guard

**Scope slug:** `builder-style-token-foundation`

**Priority:** high (unblocks every conversion slice)

**Status:** ready-for-agent

**Blocked by:** [FTB-077](#ftb-077)
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Tokens](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#5-token-architecture), [utilities](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#6-utility-catalog-and-exception-policy), [guard](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#10-compliance-guard)
**GitHub:** [#80](https://github.com/Azab-Inc/filament-theme-builder/issues/80)

### What to build

Create the single token and utility source the remaining slices consume, and a permanent guard that fails when the directory drifts from the documented standard. The guard must be written first so its failure is real evidence of the starting state.

### Acceptance criteria

- [ ] `builder/src/styles/tokens.css` declares `@theme` color groups for builder chrome and each prototype family, derived from existing values, plus radii, shadows, sizing, and type steps actually used.
- [ ] Distinct focus colors remain distinct: `--color-builder-focus`, `--color-focus-indigo`, `--color-focus-gold`, `--color-focus-brand`.
- [ ] `@utility` definitions exist only where built-ins cannot express the rule: `scrollbar-thin`, `bg-checkerboard`, `pb-safe`, `font-inherit`, `popover-shell`, `dialog-shell`, and the four focus-ring utilities.
- [ ] One documented `@layer base` block provides the `box-sizing` and form-inheritance behavior that Preflight would otherwise supply.
- [ ] `app.css` imports `tokens.css` before every `./styles/*` component stylesheet and stays at or below 100 lines.
- [ ] `stylesheet-compliance.spec.ts` enforces literal, raw-declaration, `!important`, `@theme`, `@reference`, and import-order rules with actionable file/line output.
- [ ] The guard allowlists only `@media (prefers-reduced-motion: reduce)` for `!important` and documents that decision in a test comment.
- [ ] `css-entrypoint.spec.ts` is updated for `tokens.css` without weakening its existing assertions.
- [ ] Light/dark ownership of Filament tokens is untouched and no component stylesheet needs a dark-specific value.

### Verification

- [ ] Run the guard before implementation and record the expected failure counts per file.
- [ ] Write focused unit tests for token/utility presence and for each guard rule, including a passing fixture and a failing fixture.
- [ ] Run the focused guards, `npm run type-check`, and `npm run build`; unknown `@apply` utilities must fail the build rather than being silently skipped.
- [ ] Confirm `tokens.css` itself passes the literal rule and that every token is referenced by at least one rule or documented for a named slice.

**Related:** [FTB-079](#ftb-079), [FTB-080](#ftb-080), [FTB-081](#ftb-081), [FTB-082](#ftb-082), [FTB-083](#ftb-083).

---

<a id="ftb-079"></a>

## FTB-079 — Convert editor chrome stylesheets to tokens and @apply

**Scope slug:** `builder-editor-chrome-styles`

**Priority:** normal

**Status:** ready-for-agent

**Blocked by:** [FTB-078](#ftb-078)
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Cascade contract](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#7-cascade-and-specificity-contract)
**GitHub:** [#81](https://github.com/Azab-Inc/filament-theme-builder/issues/81)

### What to build

Convert `editor-shell.css`, `editor-navigation.css`, `editor-responsive.css`, and `editor-mobile.css` from flat literal CSS to nested `@apply` rules backed by `tokens.css`, without moving rules or changing computed output.

### Acceptance criteria

- [ ] All four files use native nesting; repeated full selectors are folded under their parent.
- [ ] All color, radius, shadow, spacing, type, and z-index literals are replaced by tokens or built-in utilities.
- [ ] Focus rings use the matching `focus-ring-*` utility and keep their existing width, color, and offset per surface.
- [ ] The sr-only clip block becomes `sr-only`; `scrollbar-width: thin` becomes `scrollbar-thin`.
- [ ] `[aria-checked="true"]` switch rules are scoped to their toolbar ancestor instead of matching arbitrary same-document markup.
- [ ] Existing selected, hover, disabled, and focus-visible appearance and all responsive breakpoints are unchanged.
- [ ] `:has(.editor-nav-rail)` grid behavior and mobile overrides are preserved.
- [ ] No rule is moved between files and no rule is wrapped in a cascade layer.

### Verification

- [ ] Run the compliance guard for these files and record the failing-first output.
- [ ] Run focused unit/component tests, `npm run type-check`, `npm run build`.
- [ ] Create and run Playwright computed-style assertions for header, toolbar button, current nav item and tab, input/trigger, focus ring, and workspace columns at 1440px and 390px.
- [ ] Compare screenshots with the FTB-077 baseline and report any difference.

**Related:** [FTB-050](#ftb-050), [FTB-065](#ftb-065), [FTB-078](#ftb-078).

---

<a id="ftb-080"></a>

## FTB-080 — Convert field, foundation, and dialog controls to tokens and @apply

**Scope slug:** `builder-control-styles`

**Priority:** normal

**Status:** ready-for-agent

**Blocked by:** [FTB-078](#ftb-078)
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Utility catalog](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#6-utility-catalog-and-exception-policy)
**GitHub:** [#82](https://github.com/Azab-Inc/filament-theme-builder/issues/82)

### What to build

Convert `color-field.css`, `foundation-surfaces.css`, `foundation-controls.css`, and `local-theme-dialog.css`, including the color popover's checkerboard and sizing, the foundation control base, and the local theme dialog's backdrop and constrained dimensions.

### Acceptance criteria

- [ ] All four files use `@apply` and nesting; flat one-rule-per-line bundles become component blocks.
- [ ] The transparent checkerboard uses `bg-checkerboard`; popover and dialog sizing use `popover-shell` and `dialog-shell`.
- [ ] `::backdrop`, `[type="color"]`, `[aria-pressed]`, `[aria-selected]`, `:has()` layout overrides, and the scoped toolbar-button rule keep identical computed output.
- [ ] Control height, radius, border, background, error color, and disabled opacity resolve from tokens or built-ins.
- [ ] The only surviving `!important` is inside the reduced-motion media block and the guard accepts it.
- [ ] The direct `.grid-cols-3` override is expressed through the utility layer without changing the rendered grid.
- [ ] Micro typography (monospace stacks, caption sizes, transforms) is preserved through named type tokens rather than literals.

### Verification

- [ ] Run the compliance guard for these files and record the failing-first output.
- [ ] Run focused units, type-check, and build.
- [ ] Playwright: open the color popover, the transparent and custom panels, the local theme dialog, and a foundation panel; assert computed border, radius, shadow, outline, width, and backdrop color.
- [ ] Verify the four surfaces at 1440px and 390px and compare with baseline screenshots.

**Related:** [FTB-051](#ftb-051), [FTB-052](#ftb-052), [FTB-021](#ftb-021).

---

<a id="ftb-081"></a>

## FTB-081 — Split and convert the dashboard-first editor stylesheet

**Scope slug:** `builder-dashboard-editor-styles`

**Priority:** normal

**Status:** ready-for-agent

**Blocked by:** [FTB-078](#ftb-078), [FTB-079](#ftb-079), [FTB-080](#ftb-080)
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Split contract](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#81-dashboard-first-editorcss-357-lines)
**GitHub:** [#83](https://github.com/Azab-Inc/filament-theme-builder/issues/83)

### What to build

Split the 357-line, last-imported `dashboard-first-editor.css` into layout, controls, and responsive files, then convert each to nested `@apply` with tokens while preserving its override relationship to the `editor-*` sheets.

### Acceptance criteria

- [ ] `dashboard-editor-layout.css`, `dashboard-editor-controls.css`, and `dashboard-editor-responsive.css` replace the original, imported adjacently in that order at the end of `app.css`.
- [ ] Declaration order, selector intent, and the overrides that depend on being imported last are preserved.
- [ ] All literals are replaced by tokens or built-ins, including the resize handle, container query, nav buttons, fields, color-field overrides, and foundation rows.
- [ ] `!important` layout overrides are removed by correcting selector context or order rather than by escalating specificity.
- [ ] `css-entrypoint.spec.ts` asserts the three imports and still checks uniqueness and resolvability.
- [ ] Container-query behavior, pane widths, resize handle interaction, and both navigation layouts are unchanged.
- [ ] No rule is wrapped in a cascade layer and no sibling stylesheet changes precedence.

### Verification

- [ ] Run the guard and record the failing-first output, then pass.
- [ ] Run units, type-check, build.
- [ ] Playwright: assert pane grid columns, resize handle size/cursor, dashboard toolbar buttons, field sizing, nav current state, and foundation row grid at 1440px and 390px in both navigation layouts.
- [ ] Compare screenshots with the baseline; confirm the resize interaction from FTB-065 still passes (`e2e/ftb-065-editor-resize.spec.ts`).

**Related:** [FTB-065](#ftb-065), [FTB-050](#ftb-050), [FTB-079](#ftb-079), [FTB-080](#ftb-080).

---

<a id="ftb-082"></a>

## FTB-082 — Convert legacy prototype stylesheets to tokens and @apply

**Scope slug:** `builder-legacy-prototype-styles`

**Priority:** normal

**Status:** ready-for-agent

**Blocked by:** [FTB-078](#ftb-078)
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Prototype isolation](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#9-prototype-isolation)
**GitHub:** [#84](https://github.com/Azab-Inc/filament-theme-builder/issues/84)

### What to build

Convert `inspect-prototype.css`, `theme-prototype.css`, `dashboard-prototype.css`, and `guidelines-prototype.css`, preserving their intentionally different palettes while removing private token definitions and literals from points of use.

### Acceptance criteria

- [ ] Each prototype family resolves color, radius, shadow, and type values from its own token group in `tokens.css`; no local `--ink`/`--muted`/`--line`/`--paper` definitions remain.
- [ ] `dashboard-prototype.css` and `guidelines-prototype.css` declare `@reference "../app.css";` and pass the guard's reference rule.
- [ ] All rules use `@apply` with nesting; minified rule bundles are expanded into readable component blocks.
- [ ] `.inspect, .prototype { margin: -8px }` is replaced by root-scoped behavior with the same rendered result.
- [ ] Only identical switcher/focus/button geometry is consolidated through `@utility`; distinct colors, widths, and palettes remain distinct.
- [ ] `!important` is limited to the reduced-motion allowlist.
- [ ] Dev-only behavior, query-parameter selection, and the absence of production effect are unchanged.

### Verification

- [ ] Run the guard for these files and record the failing-first output.
- [ ] Run units, type-check, build.
- [ ] Playwright: visit `?inspect=1`, `?dashboard-prototype=1`, and `?guidelines-prototype=1` at 1440px and 390px; assert computed sentinels and compare screenshots with the baseline.
- [ ] Confirm no rendered difference in the switcher pill, toolbar, dock, and sample surfaces.

**Related:** [FTB-007](#ftb-007), [FTB-050](#ftb-050), [FTB-083](#ftb-083).

---

<a id="ftb-083"></a>

## FTB-083 — Split and convert the visual prototype stylesheet

**Scope slug:** `builder-visual-prototype-styles`

**Priority:** normal

**Status:** ready-for-agent

**Blocked by:** [FTB-078](#ftb-078), [FTB-082](#ftb-082)
**Parent:** [FTB-076](#ftb-076)
**Spec:** [Split contract](./docs/superpowers/specs/2026-11-18-builder-stylesheet-tailwind-compliance-design.md#82-visual-prototypecss-706-lines)
**GitHub:** [#85](https://github.com/Azab-Inc/filament-theme-builder/issues/85)

### What to build

Split the 706-line `visual-prototype.css` into shell, canvas, switcher, and details files behind a thin aggregator, then convert all four to nested `@apply` with `--color-visual-*` tokens. `BuilderVisualPrototype.vue` keeps a single stylesheet import.

### Acceptance criteria

- [ ] `visual-prototype-shell.css`, `visual-prototype-canvas.css`, `visual-prototype-switcher.css`, and `visual-prototype-details.css` exist; `visual-prototype.css` only `@import`s them in that order.
- [ ] Every split file declares `@reference "../app.css";` and passes the guard.
- [ ] All 706 lines use `@apply` and nesting, including the appended override block and mobile media queries.
- [ ] The private `--vp-*` definitions move to the visual token group; `var(--vp-swatch)` and other runtime variables keep working.
- [ ] The surviving `!important` and arbitrary `#0002`/rgba shadows are replaced by tokenized equivalents with identical computed output.
- [ ] Dock, canvas, preview toolbar, switcher, section content, and foundation-group layouts are unchanged at desktop and mobile widths.
- [ ] `BuilderVisualPrototype.vue` remains a single-import consumer and no Vue `<style>` block is introduced.

### Verification

- [ ] Run the guard for the four files and record the failing-first output.
- [ ] Run units, type-check, build.
- [ ] Playwright: visit `?visual-prototype=1` at 1440px and 390px; assert computed sentinels for root, dock, canvas, switcher, and shade rows, and compare screenshots with the baseline.
- [ ] Confirm the aggregator order compiles and the visual mode still loads with no console errors.

**Related:** [FTB-082](#ftb-082), [FTB-050](#ftb-050), [FTB-033](#ftb-033).
