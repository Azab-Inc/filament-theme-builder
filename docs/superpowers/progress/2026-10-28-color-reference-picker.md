# Color-reference chooser and native replacement picker

## Approved request

- Include built-in palette colors alongside named user colors/palettes in the color-field dropdown.
- Display friendly labels (`primary 500`, `secondary`) rather than internal references.
- Offer the same theme palette choices inside the color popover.
- Fix the disabled black native picker for inherited/empty/non-hex values, while preserving the original value until explicit replacement.

## Boundaries

Current dev HEAD `82004b7` plus substantial prior uncommitted work. Preserve everything outside this focused change. No DeepSeek, packages, branch changes, or ticket edits. Capture task-start versions/hashes of touched files in a durable scoped baseline before edits.

Keep built-in references bounded to six supported palette families and eleven shade keys. Selecting a built-in shade stores its existing safe `var(--family-shade)` reference; user tokens retain canonical `user.*` identities with friendly presentation only. Preserve mode-aware references, strict preview validation and JSON/CSS export. Literal-only seed controls must not offer invalid references.

Use one typed option catalog/label transformation for dropdown and popover to avoid duplicating palette and token mappings. A Theme tab can be added while retaining the existing default Tailwind tab and accessible keyboard/focus/escape behavior. Actual swatch values must follow active theme mode. No writes on opening/searching/changing tabs.

For native replacement, remove the disabling condition that prevents choosing a new hex color when the existing value cannot be represented. Keep the existing draft/canonical value intact on open/cancel; use clearly explained fallback display. Never silently replace alpha or variable values with black. Confirm explicit input/change applies once.

## Task ledger

| Task | Owner | Status |
| --- | --- | --- |
| Reproduce disabled native picker and missing palette choices | controller | completed; native, missing swatches, semantic chooser, untouched-color mismatch, and linked-reference regressions reproduced |
| Friendly shared catalog, dropdown and popover integration, native replacement fix | controller | completed; shared catalog, mode-aware swatches, private aliases, validation parity, and native replacement behavior integrated |
| Focused/full verification and independent review | controller / reviewer | completed; focused checks, browser journeys, build/type-check, and scoped independent review passed; known unrelated/stale-contract failures recorded |

## Accepted integration decisions and evidence

- Palette choices use private `--ftb-palette-<family>-<shade>` variables. These expose canonical builder colors without overriding unrelated native Filament variables. Legacy native palette references remain accepted. No schema or permission change.
- UI options are shared between the grouped dropdown and searchable Theme popover. Custom color labels are just names; custom palette shades are `name shade`. Swatches follow the active mode. Generating seed controls retain literal-only input choices.
- Foundation editor inputs retain their canonical expression separately from the effective color, so selecting a reference does not lose its visible dropdown selection.
- Native controls remain enabled for replacement of empty/reference/alpha values without opening/search/tab/cancel writes. An explicit Use black action supports the fallback-black choice.
- Built-in reference locks resolve the active color through a shared helper for lock creation and linked edits, avoiding mode-dependent appearances under a lock.
- Initial worker changes were partial: no swatches or semantic/bridge parity. Controller serialized further changes after the worker returned; no concurrent writer and no DeepSeek.
- New Compose tests reproduced absent swatches, unavailable semantic dropdown, and disabled inherited native input (the last with the original disabling guard restored only for the controlled red run). A further red test showed selecting an untouched shade applied native Amber instead of the advertised builder shade; private aliases repair that while preserving native variables.
- Final targeted browser command passed 10/11 initially; the last token-creation case was login-throttled before feature interaction (Too many login attempts; 10-second cooldown). A bounded isolated rerun of that exact case passed. The four new picker journeys and five existing picker boundary journeys passed unchanged in the first run.
- Final type-check and production build passed. Final focused unit run passed. The full unit run had 637 passing tests and one known unrelated `css-entrypoint.spec.ts` failure because the dirty `app.css` contains `dashboard-first-editor.css`.
- Final PHP bridge run had 6 passing and 2 failing tests. Both failures are stale source/login-contract assertions in `PreviewInspectorBridgeTest`: `test_preview_bridge_requires_v5_padding_messages` and `test_preview_bridge_rejects_forged_sources_and_duplicate_padding_contexts`; the returned response was the login page rather than the expected bridge source. These were not changed or repaired in this task.
- Independent scoped re-review passed for correctness and quality with no blocking findings. Actual AI-client MCP usage was not verified; no new direct per-field MCP mutation tools were added.

## Acceptance / evidence

Run new unit and real Compose Playwright tests RED before production changes. Cover built-ins with zero custom tokens; simple user-color labels and custom-palette shade labels; explicit reference selection in foundations/raw/semantic controls and mode-aware live/export behavior; empty/variable/alpha native picker enabled, opening/cancel preservation, one explicit change; popover Theme choices and keyboard/focus/scroll at narrow widths. Preserve safe-value rejection.

Report commands/cwd/env/exit plus baseline/final hashes and scoped diff in `docs/superpowers/verification/2026-10-28-color-reference-picker.md`. Final builder type-check, full units, production build; focused native Compose browser checks. Known unrelated CSS-entrypoint unit failure, stale PHP bridge assertions/login response, and resource-contention-sensitive inventory tests are recorded limitations, not permission to change unrelated behavior or claim a fully green run.
