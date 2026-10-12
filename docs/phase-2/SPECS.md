# Phase 2 Technical and Behavioral Specification

**Scope:** `phase-2-filament-dashboard-composer-integration`
**Status:** Finalized contract; implementation and release blocked by package identity and Phase 1 gate
**Product requirements:** [./PRD.md](./PRD.md)
**Parent specification:** [../../SPECS.md](../../SPECS.md)
**Planning baseline:** `f348ac2c504e627690324eea0595f2245c9d215c`
**Implementation branch:** `dev`

This document specifies the Phase 2 Composer integration for users' own
Filament applications. It does not turn the repository demo into the product
target. P2 identifiers are **product requirement identifiers from the PRD**,
not ticket identifiers. The published implementation slices use FTB-042 through
FTB-049.

## 1. Readiness and phase gate

Phase 2 cannot enter implementation until **all Phase 1 requirements** are
complete. The existing demo-first gate is necessary but insufficient:

- FTB-009A, FTB-009B, and FTB-010 are complete.
- FTB-011, FTB-013, FTB-014, and FTB-015 remain incomplete.
- FTB-016, FTB-017, and FTB-018 must also be complete.
- FTB-012 must satisfy its approved Phase 1 acceptance contract, including the
  remaining theme-density integration requirement.
- FTB-040 stable release and the approved Phase 1 requirements must be
  complete before Phase 2 implementation begins.

The current HEAD is only a planning fixed point. Before implementation review,
refresh it after Phase 1 completion and record the new full commit hash. No
Phase 2 ticket is ready until the gate is complete and the package identity is
chosen.

**Implementation tickets:** [FTB-042](../../TICKETS.md#ftb-042) / [GitHub #42](https://github.com/Azab-Inc/filament-theme-builder/issues/42), [FTB-049](../../TICKETS.md#ftb-049) / [GitHub #49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)

P2-006 is a global Phase 2 gate, not a feature requirement. It applies to
every Phase 2 ticket and is intentionally excluded from feature-slice
acceptance claims.

## 2. Product boundary and activation

The package is a Composer development dependency installed in a user's host
Laravel/Filament application. The package must not depend on the repository
demo being present.

Activation requires both conditions:

1. the host application is in its local environment only; and
2. `FILAMENT_THEME_BUILDER=true` is enabled.

The feature flag is an activation switch, not a credential. It must never
replace panel authentication, authorization, tenant checks, CSRF protection,
origin checks, or endpoint middleware. Any user who is already authorized to
use the current panel may use the builder; Phase 2 adds no product permission
or account system.

The package registers only the integration resources needed for the enabled
local feature. It must not silently edit PHP, panel registration, Vite
configuration, Composer manifests, or other application files. Missing setup
is rendered as manual guidance.

**Covered PRD requirements:** P2-001–P2-005.
**Vertical slice:** S1, Package installation and protected dock.

**Implementation ticket:** [FTB-042](../../TICKETS.md#ftb-042) / [GitHub #42](https://github.com/Azab-Inc/filament-theme-builder/issues/42)

## 3. Authoritative panel identity and embedded UI

The host application's active Filament panel is the authoritative integration
context. The implementation must obtain panel identity from the active panel
registration/runtime context, not from a user-supplied request parameter or a
guess based only on a URL. A panel context is represented by a stable panel
identifier plus the application origin and the authorization context required
by the host.

The UI is a compiled shared builder application embedded in the user's own
Filament dashboard/panel. It is presented in a collapsible and resizable dock.
The actual Filament panel remains visible and usable while the dock is open;
collapsing the dock hides the builder, not the panel. Dock controls must not
break panel navigation, Livewire interaction, keyboard navigation, or the
panel's responsive behavior.

The dock must not infer authority from browser storage, a query parameter, or
the feature flag. All protected requests are evaluated by the host panel's
normal authorization boundary.

**Covered PRD requirements:** P2-010–P2-013.
**Vertical slices:** S1 and S2.

**Implementation tickets:** [FTB-042](../../TICKETS.md#ftb-042) / [GitHub #42](https://github.com/Azab-Inc/filament-theme-builder/issues/42), [FTB-043](../../TICKETS.md#ftb-043) / [GitHub #43](https://github.com/Azab-Inc/filament-theme-builder/issues/43)

## 4. Browser-session draft lifecycle

### 4.1 Approved storage contract

Use `sessionStorage` for the active draft. This gives the required persistence
across same-tab panel navigation and reload while naturally isolating separate
browser tabs. The storage key should be derived from the package scope, host
origin, and authoritative panel identifier; it must not contain secrets or
trust a caller-provided panel ID.

This is an approved product contract: drafts persist across same-tab panel
navigation and reload, and are intentionally isolated between browser tabs.

### 4.2 Draft contract

The draft envelope contains:

- schema version;
- authoritative panel context fingerprint;
- source identity and source fingerprint, when selected;
- canonical theme state;
- generated preview hash;
- saved/applied status;
- timestamps and discard metadata.

The draft is restored only when the stored panel context and schema validate.
Invalid, stale, cross-panel, or malformed state is quarantined and cannot
replace current state. A successful discard removes only the current panel's
draft and returns the preview to the saved/stock state; it does not delete
project files, backups, or shared sources.

Preview changes remain browser-local until an explicit save confirmation. A
shared generator preview/save flow is separate from draft restoration and must
not accidentally overwrite the local draft.

**Covered PRD requirements:** P2-014–P2-015.
**Vertical slice:** S2, Preview and draft lifecycle.

**Implementation ticket:** [FTB-043](../../TICKETS.md#ftb-043) / [GitHub #43](https://github.com/Azab-Inc/filament-theme-builder/issues/43)

## 5. Source discovery and setup guidance

### 5.1 Resolution order

Discovery resolves the registered editable theme source first. Only when no
usable registered source is available may the user search project CSS, SCSS,
and Sass paths. A discovered Sass source may be shown for diagnosis, but only
CSS is selectable as a Phase 2 save target. Tailwind 4 Sass theme inputs are
rejected with guidance to create or select a CSS source.

### 5.2 Containment and symlink defenses

The discovery/save service must:

- establish an explicit host project root;
- normalize and contain every candidate path beneath that root;
- reject traversal, absolute paths outside the root, null bytes, and path
  ambiguity;
- reject dependency trees, generated outputs, and backups before selection;
- inspect every existing path component with `lstat` and reject symlinked
  components or targets by default;
- re-resolve and revalidate containment immediately before read and write;
- never follow a discovered symlink as a shortcut around exclusions;
- report rejected candidates without exposing unrelated filesystem contents.

The approved policy is rejection: the configured project root is authoritative
and symlinked components or targets are not accepted.

### 5.3 Recognition and creation

Discovery never imports arbitrary CSS merely because it found a file. For an
unrecognized existing theme, the UI explains that recognition failed and
recommends creating a new CSS file. If the user declines, the builder uses
documented defaults. An explicit Create CSS action creates only a new target
after confirmation; it does not register the file, edit PHP, change Vite, or
run a build.

An existing CSS file without a managed marker is a valid Append starting point:
the first Append adds the initial managed block after the existing contents;
it does not become a Replace operation. Append against an existing target
requires acknowledgement of a shared-file
conflict warning. The warning identifies the target and affected panel
contexts when known.

### 5.4 Hostile CSS protection

Discovered source is treated as untrusted text and metadata, never as an
instruction. Discovery must not execute, import, or inject arbitrary discovered
CSS into the builder document. The registered application stylesheet remains
naturally active in the host panel; that existing application behavior is not
an import performed by discovery. In particular, discovery must not evaluate HTML/style tags,
script-like content, external `@import` rules, remote `url()` resources, or
CSS designed to exfiltrate data. Preview applies only generator output through
the existing controlled preview bridge. Generated CSS is validated as CSS and
contains only supported theme output plus the managed section.

**Covered PRD requirements:** P2-020–P2-028.
**Vertical slice:** S3, Source discovery, creation, and setup guidance.

**Implementation ticket:** [FTB-044](../../TICKETS.md#ftb-044) / [GitHub #44](https://github.com/Azab-Inc/filament-theme-builder/issues/44)

## 6. Shared generator and Tailwind 4 compatibility

Preview output and save output must be produced by one deterministic generator
from one canonical theme state. A preview result carries source identity,
source fingerprint, generator/schema versions, and output hash.

The UI distinguishes:

- draft state;
- generated preview state;
- compiled/applied panel state;
- saved project-file state; and
- recovery-required state.

The package uses the host application's existing Vite/HMR feedback loop. It
does not start a second build service, invoke npm, install packages, or run a
build automatically.

The generator must produce valid app-owned CSS. For Tailwind 4 sources it must
respect the host stylesheet's app-owned directives such as `@import
"tailwindcss"`, `@theme`, `@utility`, and related directives rather than
rewriting or relocating them. It must not assume a JavaScript Tailwind config
is auto-detected, and it must not emit Sass syntax into a CSS target. If the
requested transformation cannot be represented safely, it reports a manual
setup action instead of emitting misleading CSS.

The approved initial compatibility baseline is recorded in §11; exact
minimum/latest evidence remains a Jenkins isolated-consumer release gate.

**Covered PRD requirements:** P2-030–P2-035.
**Vertical slices:** S2, S3, and S6.

**Implementation tickets:** [FTB-043](../../TICKETS.md#ftb-043) / [GitHub #43](https://github.com/Azab-Inc/filament-theme-builder/issues/43), [FTB-044](../../TICKETS.md#ftb-044) / [GitHub #44](https://github.com/Azab-Inc/filament-theme-builder/issues/44), [FTB-047](../../TICKETS.md#ftb-047) / [GitHub #47](https://github.com/Azab-Inc/filament-theme-builder/issues/47)

## 7. Confirmation and append persistence

The save confirmation presents, before mutation:

- target path and authoritative panel context;
- generated diff;
- affected panels;
- Append or Replace mode;
- source fingerprint and generated output hash;
- backup/recovery implications; and
- manual setup steps that remain outside the save.

Shared stylesheets always require an explicit conflict acknowledgement.

### 7.1 Managed section metadata

Every Append operation, including the initial Append and every managed-block
update, must first acquire its lock/hash checks and create a unique, no-clobber
`old-` backup containing the complete current file. Backup creation must be
durable before any target mutation. A backup collision must produce another
unique name or a safe failure; it must never overwrite an existing backup.

Only after that backup exists may Append create or update one clearly marked
managed section containing:

- stable start/end markers;
- managed-section schema version;
- generator version;
- panel/source context identifier;
- canonical theme hash;
- generated output hash; and
- normalized metadata sufficient to round-trip the section.

The metadata is comment-safe and is not treated as executable CSS. Round-trip
parsing requires exactly one valid managed section. Missing, malformed,
nested, or repeated markers are conflicts; the service must not guess or
silently rewrite them. Repeated Append updates the existing managed section
in place. It never duplicates it and never overwrites content outside that
section.

### 7.2 Append safety

Append preserves the complete original file in the newly created backup before
every mutation. It must handle repeated conflicts,
shared stylesheets, malformed managed sections, changed source hashes, and
generated output that fails CSS validation. No backup or unrelated source is
removed automatically.

**Covered PRD requirements:** P2-040–P2-043 and P2-046–P2-047.
**Vertical slice:** S4, Confirm and append with full preservation.

**Implementation ticket:** [FTB-045](../../TICKETS.md#ftb-045) / [GitHub #45](https://github.com/Azab-Inc/filament-theme-builder/issues/45)

## 8. Replace, transaction, and recovery contract

Replace is an explicit complete-file operation. Before writing, it uniquely
renames the original file to an `old-` backup containing the entire prior file.
The rename is no-clobber: a repeated timestamp/name collision causes another
unique name or a safe failure, never overwrite. Only after the rename succeeds
does the original path receive complete buildable CSS from the same generator.

### 8.1 Confirmation binding and revalidation

A save confirmation is single-use and bound to:

- authenticated panel/user context;
- authoritative panel identity;
- target path identity;
- original file hash and metadata;
- generated output hash;
- selected mode;
- short expiry; and
- an unpredictable nonce.

At apply time, permission, activation, path containment, symlink policy, file
hash, source identity, and target mode are revalidated. The confirmation is
consumed only after all checks pass and cannot be replayed. The environment
flag is never accepted as authentication.

### 8.2 Transaction and journal

The implementation uses an exclusive target lock and a journal with
explicit states such as prepared, backup-created, output-staged, committed,
and recovery-required. Writes use a same-directory temporary/staged output and
atomic rename where the host filesystem supports it. The journal records hashes,
paths, backup identity, and operation ID.

On any partial failure, the service must preserve:

- the pre-save file;
- the complete backup;
- any staged or failed output; and
- the journal/recovery record.

It must not delete a failed output merely to make the directory look clean. The
recovery path actively restores the old file when that can be done safely by
copying from the retained backup to the original path, leaving the backup
intact, while preserving the failed output and journal for inspection. If safe
restoration is impossible, the old file and all artifacts remain untouched and
the operation is explicitly marked recovery-required; a message alone is not a
successful recovery. There is no automatic backup purge, arbitrary source
removal, or destructive cleanup, and the operation never changes another
user's files.

Concurrent modification after discovery, preview, lock acquisition, backup,
or staging prevents an unreviewed commit. Recovery never claims success unless
the final file hash matches the generated output hash.

**Covered PRD requirements:** P2-044–P2-049.
**Vertical slice:** S5, Replace and failure recovery.

**Implementation ticket:** [FTB-046](../../TICKETS.md#ftb-046) / [GitHub #46](https://github.com/Azab-Inc/filament-theme-builder/issues/46)

## 9. Local MCP parity

Local MCP exposes equivalent discovery, preview, and confirmation-save
capabilities through the same domain services used by the UI. It must not
create a second authorization or filesystem implementation.

MCP authentication is producer-neutral: the package accepts the authenticated
local MCP host/request context defined by the host integration, not a
provider-specific product login and not `FILAMENT_THEME_BUILDER=true` as a
credential. An MCP caller receives no privileges beyond the corresponding
panel user and panel context.

MCP mutation flow:

1. authenticate and resolve panel context;
2. discover/preview using shared validation;
3. return structured diff, target, affected panels, mode, hashes, and risks;
4. require explicit confirmation;
5. revalidate permission, activation, path, hashes, lock, and nonce;
6. perform the same journaled write; and
7. return structured success or recovery-required state.

The capability-to-tool inventory records operation type, authorization,
confirmation, target scope, and test evidence. Read-only preview and
presentation state do not become privileged mutation tools.

**Covered PRD requirements:** P2-060–P2-064.
**Vertical slice:** S7, Local MCP parity.

**Implementation ticket:** [FTB-048](../../TICKETS.md#ftb-048) / [GitHub #48](https://github.com/Azab-Inc/filament-theme-builder/issues/48)

## 10. Accessibility and panel continuity

Dock open/collapse/resize, preview, discard, confirmation, diff, recovery, and
manual-guidance controls are keyboard accessible and have accessible names.
Focus remains visible, dialogs announce status changes, and conflict/backup/
rollback/authorization states are understandable without color alone.

The underlying Filament panel remains operable while the dock is open. The
integration must not trap focus in a non-modal dock or intercept panel
shortcuts except while a focused control legitimately owns the event.

**Covered PRD requirements:** P2-070–P2-073.
**Vertical slices:** S1, S2, S4, S5, and S7.

**Implementation tickets:** [FTB-042](../../TICKETS.md#ftb-042) / [GitHub #42](https://github.com/Azab-Inc/filament-theme-builder/issues/42), [FTB-043](../../TICKETS.md#ftb-043) / [GitHub #43](https://github.com/Azab-Inc/filament-theme-builder/issues/43), [FTB-045](../../TICKETS.md#ftb-045) / [GitHub #45](https://github.com/Azab-Inc/filament-theme-builder/issues/45), [FTB-046](../../TICKETS.md#ftb-046) / [GitHub #46](https://github.com/Azab-Inc/filament-theme-builder/issues/46), [FTB-048](../../TICKETS.md#ftb-048) / [GitHub #48](https://github.com/Azab-Inc/filament-theme-builder/issues/48)

## 11. Package and consumer architecture

The package should use Laravel's normal package boundary: a service provider,
autoloaded resources, controlled views/assets, and explicit registration hooks.
Automatic Laravel provider discovery may be used for package registration, but
the feature itself remains gated by the local environment and flag. The final
package name, namespace, and Composer coordinates are deliberately withheld.

The compiled builder artifact must be produced by the repository build and
consumed by host applications without requiring a permanent Node process. The
consumer integration must remain isolated from the repository demo and from
other panel instances in the same host application.

The consumer verification strategy is Jenkins-only. It must include isolated
consumer fixtures and supported-version checks without adding GitHub Actions.
The initial supported baseline is PHP 8.5, Laravel 13, Filament 5, Livewire 4,
and Tailwind 4. Jenkins isolated consumer fixtures provide the exact minimum
and latest tested evidence before release claims are made.

Package identity, namespace, and Composer coordinates are deliberately
deferred and are release-blocking. They must be chosen before implementation
release, not inferred in this specification.

**Implementation ticket:** [FTB-049](../../TICKETS.md#ftb-049) / [GitHub #49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)

Official references:

- [Filament official documentation](https://filamentphp.com/docs/getting-started)
- [Laravel package development](https://laravel.com/docs/13.x/packages)
- [Laravel MCP](https://laravel.com/docs/13.x/mcp)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS compatibility](https://tailwindcss.com/docs/compatibility)

## 12. Published vertical slices and ticket mapping

P2 IDs remain requirements. The following eight published implementation
tickets are vertical slices, not horizontal test tickets. They remain blocked
until the Phase 1 gate, FTB-040, and package identity release blocker are
closed.

| Slice | Scope | PRD requirements | Blockers |
|---|---|---|---|
| S1 | Package installation, activation, protected collapsible dock | P2-001–P2-005, P2-010–P2-013, P2-070, P2-073 | Global P2-006 gate + Phase 1 + FTB-040 |
| S2 | Preview and sessionStorage draft lifecycle | P2-014–P2-015, P2-030–P2-032, P2-070 | S1 + Phase 1 + FTB-040 |
| S3 | Source discovery, create-CSS, Tailwind/Sass rejection, manual setup | P2-020–P2-028, P2-033–P2-035 | S1 + Phase 1 + FTB-040 |
| S4 | Confirmation, managed append, metadata roundtrip, full preservation | P2-040–P2-043, P2-046–P2-047, P2-070–P2-072 | S2 + S3 + Phase 1 + FTB-040 |
| S5 | Replace, no-clobber backups, journal, failure recovery | P2-044–P2-049, P2-072 | S4 + Phase 1 + FTB-040 |
| S6 | Shared saved/compiled state across panels | P2-030–P2-035, P2-040, P2-049 | S4 + S5 + Phase 1 + FTB-040 |
| S7 | Local MCP parity and capability inventory | P2-060–P2-064 | S3 + S4 + S5 + Phase 1 + FTB-040 |
| S8 | Consumer install, compatibility, isolation, Jenkins release verification | P2-001, P2-010, P2-030–P2-035, P2-064, P2-073 | Global P2-006 gate + S1–S7 + Phase 1 + FTB-040 |

Each slice must be vertical: implementation, unit/integration tests, Playwright
consumer behavior where applicable, and documentation evidence land together.
Tests are not separate horizontal tickets.

## 13. Verification contract

### Package and consumer integration

- Composer `--dev` installation in a clean host application.
- Activation matrix for local/non-local environment and exact flag values.
- Existing authorized and unauthorized panel users.
- Multiple panels in one host application with no draft or preview leakage.
- Package absent, disabled, enabled, cached configuration, and production-like
  bootstrap behavior.

### Browser behavior

- Panel remains visible while dock opens, resizes, and collapses.
- Draft survives same-tab navigation and reload under the selected storage
  semantics; discard removes only that draft.
- Registered source wins over filesystem discovery.
- Dependencies, outputs, backups, traversal, and symlink candidates are
  rejected.
- Tailwind 4 CSS directives remain app-owned; Sass is rejected as a save target.
- Hostile CSS is not executed or imported.
- Preview, diff, confirmation, append, replace, conflict, and recovery flows.

### Filesystem and domain tests

- Path containment and symlink races.
- Marker parse/roundtrip, malformed/repeated blocks, and repeated Append.
- Full-content preservation and backup no-clobber.
- Lock acquisition, file hash mismatch, permission revalidation, expired and
  single-use confirmations.
- Journal recovery after failure at every write stage.
- Failed output remains available; no automatic source/backup deletion.

### MCP and CI

- Same service calls and results for UI and MCP.
- No privilege escalation and no flag-as-credential behavior.
- Preview-before-save and confirmation replay rejection.
- Capability inventory coverage and an AI-client end-to-end test.
- Jenkins consumer matrix and isolation checks; no GitHub Actions.

## 14. Failure, security, and observability rules

Every rejected operation returns a stable category, human-readable recovery
message, operation ID, and relevant non-secret path/target identity. Logs may
include hashes and operation IDs but must not include CSS secrets, credentials,
confirmation tokens, or unrelated filesystem contents.

Security boundaries include panel authorization, host origin, CSRF/session
protections, project-root containment, symlink rejection, lock ownership,
hash revalidation, nonce single-use, and journal recovery. A failure must be
fail-closed for mutation and fail-preserving for existing files.

**Implementation tickets:** [FTB-045](../../TICKETS.md#ftb-045) / [GitHub #45](https://github.com/Azab-Inc/filament-theme-builder/issues/45), [FTB-046](../../TICKETS.md#ftb-046) / [GitHub #46](https://github.com/Azab-Inc/filament-theme-builder/issues/46), [FTB-048](../../TICKETS.md#ftb-048) / [GitHub #48](https://github.com/Azab-Inc/filament-theme-builder/issues/48), [FTB-049](../../TICKETS.md#ftb-049) / [GitHub #49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)

## 15. Out of scope

- Editing PHP, PanelProvider, Vite, Composer, or registration files.
- Automatic package installation, npm execution, or asset builds.
- Arbitrary CSS import or execution.
- Automatic source or backup cleanup.
- New user accounts, permissions, tenants, or provider-specific product auth.
- Supporting Filament versions outside the approved matrix.
- Replacing Vite/HMR or running a permanent Node production service.
- GitHub Actions.

**Implementation tickets:** [FTB-044](../../TICKETS.md#ftb-044) / [GitHub #44](https://github.com/Azab-Inc/filament-theme-builder/issues/44), [FTB-047](../../TICKETS.md#ftb-047) / [GitHub #47](https://github.com/Azab-Inc/filament-theme-builder/issues/47), [FTB-049](../../TICKETS.md#ftb-049) / [GitHub #49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)

## 16. Release conditions

The engineering contracts in this specification are approved. Unresolved
release conditions are: package identity/namespace/Composer coordinates, the
global all-Phase-1 gate including FTB-040, exact minimum/latest compatibility
evidence from isolated Jenkins consumers, and verified host-authenticated MCP
client flow. Package identity remains intentionally deferred and must be
selected before release; this document must not invent it.

Compatibility is an approved initial baseline of PHP 8.5, Laravel 13, Filament
5, Livewire 4, and Tailwind 4. Exact minimum/latest evidence is a Jenkins
isolated-consumer verification gate, not a reason to weaken the baseline.

**Implementation tickets:** [FTB-042](../../TICKETS.md#ftb-042) / [GitHub #42](https://github.com/Azab-Inc/filament-theme-builder/issues/42), [FTB-043](../../TICKETS.md#ftb-043) / [GitHub #43](https://github.com/Azab-Inc/filament-theme-builder/issues/43), [FTB-044](../../TICKETS.md#ftb-044) / [GitHub #44](https://github.com/Azab-Inc/filament-theme-builder/issues/44), [FTB-045](../../TICKETS.md#ftb-045) / [GitHub #45](https://github.com/Azab-Inc/filament-theme-builder/issues/45), [FTB-046](../../TICKETS.md#ftb-046) / [GitHub #46](https://github.com/Azab-Inc/filament-theme-builder/issues/46), [FTB-047](../../TICKETS.md#ftb-047) / [GitHub #47](https://github.com/Azab-Inc/filament-theme-builder/issues/47), [FTB-048](../../TICKETS.md#ftb-048) / [GitHub #48](https://github.com/Azab-Inc/filament-theme-builder/issues/48), [FTB-049](../../TICKETS.md#ftb-049) / [GitHub #49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)

## 17. Requirement traceability

| PRD requirement range | Technical anchors | Vertical slice |
|---|---|---|
| P2-001–P2-005 | §§2, 11, 12 | S1, S8 |
| P2-006 (global gate only) | §§1, 12, 16, 18 | FTB-042–FTB-049 |
| P2-010–P2-015 | §§3, 4, 12 | S1, S2 |
| P2-020–P2-028 | §5, §13 | S3 |
| P2-030–P2-035 | §6, §12, §13 | S2, S3, S6, S8 |
| P2-040–P2-049 | §§7–8, §13–14 | S4, S5, S6 |
| P2-060–P2-064 | §9, §14 | S7, S8 |
| P2-070–P2-073 | §§3, 4, 7, 8, 10, 13 | S1, S2, S4, S5, S7, S8 |

P2-006 is a phase gate rather than a feature implementation. P2-050 and
P2-074 were not present in the PRD and are intentionally not invented here.
The published FTB-042–FTB-049 tickets map each slice back to the specific P2
requirements and anchors it implements.

## 18. Publication and implementation handoff

Implementation remains release-blocked by the deferred package identity and
the Phase 1 gate. After those are closed:

1. refresh the review baseline from the post-Phase-1 `dev` HEAD;
2. repeat duplicate/scope checks against local docs and GitHub;
3. preserve this spec's anchors and requirement mapping;
4. keep the eight published vertical FTB-042–FTB-049 tickets blocked until the
   Phase 1 gate, FTB-040, and package identity are closed;
5. use TDD and Playwright consumer tests for each slice; and
6. publish exact compatibility and MCP support claims only after their
   verification evidence exists.

Operational and release coverage is explicit: §11 is implemented and verified
by FTB-042, FTB-047, and FTB-049; §14 by FTB-045, FTB-046, FTB-048, and
FTB-049; §15 by FTB-044, FTB-047, and FTB-049; §16 by all FTB-042–FTB-049;
and §18 by all FTB-042–FTB-049.

**Implementation tickets:** [FTB-042](../../TICKETS.md#ftb-042) / [GitHub #42](https://github.com/Azab-Inc/filament-theme-builder/issues/42), [FTB-043](../../TICKETS.md#ftb-043) / [GitHub #43](https://github.com/Azab-Inc/filament-theme-builder/issues/43), [FTB-044](../../TICKETS.md#ftb-044) / [GitHub #44](https://github.com/Azab-Inc/filament-theme-builder/issues/44), [FTB-045](../../TICKETS.md#ftb-045) / [GitHub #45](https://github.com/Azab-Inc/filament-theme-builder/issues/45), [FTB-046](../../TICKETS.md#ftb-046) / [GitHub #46](https://github.com/Azab-Inc/filament-theme-builder/issues/46), [FTB-047](../../TICKETS.md#ftb-047) / [GitHub #47](https://github.com/Azab-Inc/filament-theme-builder/issues/47), [FTB-048](../../TICKETS.md#ftb-048) / [GitHub #48](https://github.com/Azab-Inc/filament-theme-builder/issues/48), [FTB-049](../../TICKETS.md#ftb-049) / [GitHub #49](https://github.com/Azab-Inc/filament-theme-builder/issues/49)
