# Concurrent Filament panel preview isolation

Status: bounded source investigation, 2026-11-19. Branch `dev`; no production code or GitHub issue was changed. Existing unrelated WIP was preserved.

## Finding

**The initial iframe/document requests can independently render `topNavigation = true` and `false` in the current design.** That proven scope does not establish persistence across later Livewire POSTs or clicked navigation, because the setting is read only from the request query. It also does not establish that every #89 panel option can be previewed this way: route, auth, provider-registration, boot-time, class, and callback options require option-by-option classification. The bridge itself is browser-local and does not persist panel settings server-side. The main future risk is accidentally replacing the current request closure with eager or shared mutable state under Octane.

## What the code does today

- The builder creates one Filament iframe per builder page (`builder/src/components/PreviewFrame.vue:34-42`) and uses `/demo/admin` by default (`builder/src/components/BuilderShell.vue:11`). Branding/sidebar data is encoded into that iframe URL as `ftb_branding`; live theme changes are sent with `postMessage` to the iframe's origin (`builder/src/composables/use-preview-theme.ts:21-43`).
- `PanelBrandingSettings::fromRequest()` decodes and validates the query payload on each read; invalid or absent input returns a fresh default value (`demo/app/Support/Branding/PanelBrandingSettings.php:26-45`). `sidebar` accepts `top-navigation`, `collapsible`, or `fully-collapsible` (`:66-73`).
- `AdminPanelProvider` passes **closures**, not a boolean captured during boot, to `brandName`, logos, logo height, content width, sidebar flags, and `topNavigation` (`demo/app/Providers/Filament/AdminPanelProvider.php:31-42`). The top-navigation closure evaluates `PanelBrandingSettings::fromRequest(request())->sidebar()` for the current request.
- Filament 5.9's pinned source confirms `HasTopNavigation::$hasTopNavigation` is `bool | Closure`, `topNavigation(bool | Closure $condition = true)` stores the value, and `hasTopNavigation()` evaluates it (`https://github.com/filamentphp/filament/blob/v5.9.0/packages/panels/src/Panel/Concerns/HasTopNavigation.php`). `PanelProvider` registers a closure that creates/configures a panel (`https://raw.githubusercontent.com/filamentphp/filament/v5.9.0/packages/panels/src/PanelProvider.php`). Thus the current API is closure-supported; an eager `Panel::make()->topNavigation($request...)` value is not required and would be unsafe if reused across requests.
- Panel middleware includes cookies, `StartSession`, `AuthenticateSession`, CSRF, bindings, and Filament dispatch (`demo/app/Providers/Filament/AdminPanelProvider.php:74-87`). That gives each visitor normal cookie/session identity. The preview bypasses auth only for selected dashboard/showcase routes (`demo/app/Http/Middleware/AuthenticatePreviewPanel.php:10-22`); it does not make the visual setting a shared session value.
- The bridge validates message origin and applies only DOM/CSS projections inside the iframe (`demo/resources/views/filament/preview-bridge.blade.php:1-5`, `:665`); it does not mutate `Panel` configuration or a server-wide setting.

## Concrete A/B flow

1. Visitor A loads `/demo/admin?ftb_branding=<validated payload with sidebar=top-navigation>`. During A's request, the closure evaluates `true`; A's rendered panel has top navigation.
2. Visitor B loads `/demo/admin?ftb_branding=<validated payload with sidebar=collapsible>`. During B's request, the same closure evaluates `false`; B's rendered panel has sidebar navigation.
3. **What is proven stops at the initial document.** A's cookies identify A's session, but cookies do not copy `ftb_branding` into a Livewire POST or append it to a clicked navigation URL. `PanelBrandingSettings::fromRequest()` reads only `$request->query('ftb_branding')` (`demo/app/Support/Branding/PanelBrandingSettings.php:26-30`). The inspected bridge has no `fetch`, XHR, Livewire-request, link-URL, `history.pushState`, or `history.replaceState` propagation for `ftb_branding`; its click handler only suppresses clicks while Inspector is enabled and reports inspection (`demo/resources/views/filament/preview-bridge.blade.php:637-650`). Therefore later Livewire/navigation persistence is **unproven and currently has no identified propagation mechanism**. A reload/runtime-preview refresh creates a new iframe document with the builder's current URL; B is not changed.

This also distinguishes **tabs** from visitors: two tabs in one browser normally share the same session cookie, but separate initial iframe URLs can carry different query payloads. That proves initial-document isolation only; after navigation, each tab may lose its query-derived setting unless the URL/request is explicitly propagated. Session-mutating features in two same-session tabs can still race; that is a general Laravel session concern, not evidence that this panel setting leaks.

## Runtime / Octane assessment

- Production is explicitly Octane + FrankenPHP: `OCTANE_SERVER=frankenphp` in `compose.prod.yaml:37-49`, and the image starts `php artisan octane:frankenphp --workers=2 --max-requests=500` (`Dockerfile:40-49`).
- Laravel's official Octane 13.x documentation says the app boots once and is reused, first-party state is reset between requests, but application global/static state is not automatically safe; it specifically warns against injecting a request into a singleton and recommends a resolver closure or passing request data at method time: `https://github.com/laravel/docs/blob/13.x/octane.md#dependency-injection-and-octane`.
- Laravel's current container docs distinguish `singleton` (same instance on subsequent resolutions) from `scoped` (flushed per request/job lifecycle, including Octane): `https://github.com/laravel/docs/blob/13.x/container.md#binding-a-singleton` and `#binding-scoped-singletons`.
- The inspected panel setting is request-derived and held in an immutable value object; no app singleton, static array, Octane cache, or global cache write was found for it. This is the correct isolation shape. Do not put decoded branding/panel settings into config, a singleton, static properties, `Cache::remember()` without a preview key, or Octane tables.
- Laravel's HTTP kernel installs the current request into the container at request dispatch (`https://raw.githubusercontent.com/laravel/framework/v13.35.0/src/Illuminate/Foundation/Http/Kernel.php`, `handle()` / `sendRequestThroughRouter()`). Filament's closure evaluation therefore needs to happen while handling the request, not once in provider boot. The exact production image's generated worker was not present in the worktree because it is created during Docker build, but `Dockerfile:40-42` shows it is generated from the installed Octane stub.

## Livewire / navigation propagation

Filament's official navigation documentation says sidebar/topbar components are not reloaded until navigation away or a menu action, and exposes `refresh-sidebar` / `refresh-topbar` browser events: `https://filamentphp.com/docs/5.x/navigation/overview#reloading-the-sidebar-and-topbar`. This matters for an in-page control: changing `topNavigation` cannot be assumed to morph the already-rendered Livewire navigation. The current builder forces a fresh iframe URL when branding/sidebar changes (`builder/src/composables/use-preview-theme.ts:55-65`), but that is not propagation into subsequent links or Livewire requests. A reload/new iframe is the only currently identified safe propagation boundary. Filament 5.9's top-navigation API accepts closures, while sidebar/topbar component APIs accept closures in the pinned sources (`HasSidebar.php`, `HasTopbar.php`), but that does not make an already-mounted component change layout automatically.

## Existing isolation, gaps, and recommendation

**Existing isolation:** initial request query payload, fresh validated value object, closure evaluation, per-iframe `postMessage` target, origin allowlist, and ordinary per-browser sessions. No inspected path stores `topNavigation` in a shared backend. **Missing/unknown:** query propagation for later Livewire/navigation requests.

**Gaps / unverified claims:** no two-browser/two-session concurrency test was run against the production Compose stack; no test proves two simultaneous Octane workers preserve A/B output; the host worktree lacks `demo/vendor`, so installed-source inspection was pinned to official Filament `v5.9.0` URLs and package/version metadata (`filament/filament 5.9.0`, Laravel `13.35.0`, Octane `2.21.0`) rather than local vendor files. The URL payload is intentionally not a durable per-preview ID; if future preview state becomes server-stored, a session-only key will not isolate two tabs in one session.

**Safe minimal integration recommendation:** retain the current `PanelBrandingSettings::fromRequest(request())` + closure pattern for the initial `topNavigation` document. Before claiming navigation persistence, explicitly choose and verify a propagation mechanism (for example, preserving the signed/validated preview query on generated links and Livewire request URLs, or deliberately reloading the iframe on navigation); do not infer it from cookies. Use an explicit tri-state draft (`unset`, `true`, `false`) in builder state, serialize only the validated setting into the iframe URL or a request-scoped preview document, and export `->topNavigation(true/false)` only when explicit. Reset should remove the explicit value and reload the iframe to host default. Do not use session/global cache as the source of live preview truth. Across #89, classify each option separately: request-time closure-safe visual values differ from eager route/domain/auth middleware, provider registration, boot hooks, classes, and callbacks that cannot safely be treated as per-preview runtime values. If server-side preview records become necessary, generate an unguessable preview ID and key every record by `(preview_id, owner/session)` with expiry and authorization; never key only by user or a global “current preview.”

## Meaningful future concurrency tests

- In Compose production mode, launch two isolated browser contexts concurrently: A requests a payload with `sidebar=top-navigation`, B with `sidebar=collapsible`; assert A's first HTML/DOM has `.fi-topbar` navigation and no sidebar navigation, while B has sidebar navigation and no top-navigation layout. Repeat with requests interleaved across both Octane workers.
- Keep both contexts open, alternate A/B reloads and Livewire navigation, and assert whether the layout remains or is intentionally reset; first verify the request URL/body contains the preview setting, since cookies alone are insufficient. Add a same-browser two-tab case to document session sharing versus initial URL-payload isolation and later query loss.
- Restart/reload workers (`octane:reload` after deployment) and repeat; assert no prior request's layout survives. Add a negative test for malformed/forged payloads falling back to defaults.
- If a preview ID/session store is introduced, run parallel A/B writes, cross-ID reads, expiry, unauthorized ID access, and stale-ID replay tests; assert no cache/static/global key is shared.

## Related issues

- [#90 FTB-088 — Configure Filament panel top navigation](https://github.com/Azab-Inc/filament-theme-builder/issues/90): explicitly requires preserving native default when unset, real preview refresh, persistence/reload/import/export/undo/redo, and installed Filament 5 verification.
- [#89 FTB-087 — Configure Filament 5 panel properties](https://github.com/Azab-Inc/filament-theme-builder/issues/89): umbrella; requires distinguishing closures/classes/callbacks and safe faithful handling.
- [#55 FTB-055 — Add Filament panel topbar visibility control](https://github.com/Azab-Inc/filament-theme-builder/issues/55): related topbar runtime control; explicitly separates host topbar from builder toolbar and requires controlled preview refresh.

## Evidence gaps / blockers

- Provider access: none. Laravel MCP documentation search succeeded first, as required.
- Runtime evidence gap: production Compose concurrency and actual two-worker A/B behavior remain unexecuted.
- Source evidence gap: local `demo/vendor` is absent; exact installed source was verified from official pinned Filament v5.9.0 and Laravel 13.35.0 primary URLs plus MCP-reported package versions.
- No implementation blocker was found for the request-scoped closure approach.
