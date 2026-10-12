# Phase 2 Product Requirements — Filament Dashboard Composer Integration

**Scope slug:** `phase-2-filament-dashboard-composer-integration`
**Status:** Approved product draft; blocked pending completion of all Phase 1 requirements
**Release intent:** Phase 2 development on `dev`, toward v2 after the user merges Phase 1 to `main` and the v1 remote release
**Parent product:** [Filament Theme Builder](../../PRD.md)
**Technical specification:** [./SPECS.md](./SPECS.md)
**Implementation tickets:** [root TICKETS.md Phase 2 anchor](../../TICKETS.md#phase-2-filament-dashboard-composer-integration)

## 1. Product summary

Phase 2 packages the shared compiled Filament Theme Builder UI as a Composer
development dependency that can run inside a developer's own Filament 5
application and panel. It gives an authorized panel user a local visual editing
loop against that application's real panel, with explicit preview and save
boundaries for the project's CSS.

The package identity, Composer coordinates, and supported version matrix are
intentionally deferred. They are engineering decisions for the Phase 2
specification and are not blockers to this product definition.

## 2. Problem statement

The existing builder is useful as a separate builder/demo environment, but a
developer ultimately needs to theme their own Filament application. Manually
copying generated CSS into an unknown project creates uncertainty about which
panel is affected, whether the stylesheet is registered, whether Vite will
rebuild it, and whether hand-written CSS will be lost.

Phase 2 must bring the builder into the user's own authorized panel while
making project-file changes deliberate, reviewable, recoverable, and compatible
with the application's existing Vite/HMR workflow.

## 3. Target users and actors

### 3.1 Target users

- Filament 5 application developers working in their own local projects.
- Agencies and freelancers maintaining multiple Filament applications.
- Theme authors who need a safe preview-to-save workflow against a real panel.

### 3.2 Actors

- An existing authorized user of the Filament panel.
- The user's local Filament application and project filesystem.
- The registered panel theme source, when one is available.
- The existing Vite/HMR development workflow.
- A local MCP client operating under the same authorization boundary.

## 4. Product goals

1. Deliver the shared compiled builder UI through a Composer development package.
2. Activate it only in the user's local environment when
   `FILAMENT_THEME_BUILDER=true`.
3. Allow any existing authorized panel user to use it without an additional
   product gate.
4. Keep the user's real Filament panel visible while the builder dock is open;
   the dock may be collapsed or resized but must not replace the panel.
5. Persist a browser-session draft for the current panel across navigation and
   reload, with an explicit discard action.
6. Use one generator for both preview output and saved output.
7. Discover registered theme sources before searchable project stylesheets.
8. Apply changes only through explicit, reviewable, recoverable save actions.
9. Reuse existing Vite/HMR rather than introducing a second build workflow.
10. Expose equivalent protected preview and confirmation-save behavior through
    local MCP.

## 5. Non-goals

Phase 2 does not:

- support Filament versions outside the approved Filament 5 scope;
- require a user account, new tenant, or additional authorization gate;
- silently edit PHP, panel configuration, registration, Vite configuration, or
  other project files;
- silently install dependencies, execute builds, or modify the project's build
  pipeline;
- automatically import arbitrary CSS files;
- support non-CSS save targets under the Tailwind 4 constraint;
- remove or automatically clean up backups;
- overwrite or delete existing file contents without preserving a complete
  prior version;
- replace the existing Vite/HMR workflow;
- choose the final package name, Composer coordinates, version matrix, or
  provider-specific authentication design in this PRD.

## 6. Scope and requirements

### 6.1 Activation and authorization

- **P2-001** — The integration is delivered as a Composer development package.
- **P2-002** — The integration activates only in a local environment with
  `FILAMENT_THEME_BUILDER=true`.
- **P2-003** — Any existing authorized user of the current panel may access the
  builder; no extra product gate is introduced.
- **P2-004** — Related endpoints retain the panel's existing authentication,
  authorization, and tenant protections where applicable.
- **P2-005** — The integration does not create a separate account or permission
  system.
- **P2-006** — Phase 2 cannot enter implementation until every Phase 1
  requirement is complete; the existing demo-first gate alone is insufficient.

### 6.2 Embedded panel experience

- **P2-010** — The shared compiled builder UI is available inside the user's own
  Filament 5 dashboard and panel.
- **P2-011** — The builder is presented in a collapsible, resizable dock.
- **P2-012** — The panel remains visible and usable whenever the dock is open;
  collapsing the dock hides the builder, not the panel.
- **P2-013** — Dock controls do not prevent normal panel navigation or panel
  interaction.
- **P2-014** — The current panel's draft preview persists in the browser session
  across panel navigation and reload.
- **P2-015** — The user can explicitly discard the current draft preview.

### 6.3 Theme source discovery

- **P2-020** — Registered panel theme source resolution is attempted first.
- **P2-021** — The user can search project CSS, SCSS, and Sass sources.
- **P2-022** — Discovery excludes dependencies, generated outputs, and backups.
- **P2-023** — The user can explicitly choose to create a new CSS target.
- **P2-024** — An unrecognized existing theme produces a notification that
  recommends creating a new CSS file.
- **P2-025** — If the user declines, the builder starts from documented defaults
  rather than importing arbitrary CSS.
- **P2-026** — Choosing Append for an existing target requires acknowledgement
  of a conflict warning.
- **P2-027** — Arbitrary CSS is never imported merely because it was discovered.
- **P2-028** — CSS is the only supported save target for this phase.

### 6.4 Preview and guidance

- **P2-030** — Preview output and save output come from the same generator.
- **P2-031** — The UI distinguishes compiled/applied preview output from output
  actually saved to the project.
- **P2-032** — Existing Vite/HMR is used for project feedback.
- **P2-033** — Missing Vite, registration, PHP, or configuration steps are
  presented as manual guidance.
- **P2-034** — The integration never silently edits PHP or configuration files.
- **P2-035** — The integration never silently installs packages or runs a build.

### 6.5 Save safety

- **P2-040** — Save confirmation shows the target path, generated diff, affected
  panels, and selected mode.
- **P2-041** — Shared stylesheets receive an explicit warning before saving.
- **P2-042** — Append initially creates a clearly identified managed block.
- **P2-043** — Every Append operation first creates a unique, no-clobber
  `old-` backup containing the complete current file before any target
  mutation; later Append operations then update that managed block instead of
  duplicating it.
- **P2-044** — Replace uniquely renames the original file to an `old-` backup
  containing the entire prior file before writing the new output at the
  original path.
- **P2-045** — Replace writes complete buildable CSS at the original path.
- **P2-046** — Both Append and Replace preserve the complete prior contents in a
  backup; neither mode deletes backup files automatically.
- **P2-047** — Existing contents are never silently lost or overwritten outside
  the selected managed/replacement behavior.
- **P2-048** — A failed save rolls back safely while preserving prior and newly
  created versions.
- **P2-049** — Concurrent changes detected after discovery or preview prevent an
  unreviewed save.

### 6.6 Local MCP and AI operability

- **P2-060** — Local MCP uses the same domain services, validation, source
  resolution, authorization, and file-safety protections as the UI.
- **P2-061** — MCP provides preview and explicit confirmation-save flows matching
  the UI.
- **P2-062** — MCP does not grant permissions beyond the existing panel user.
- **P2-063** — Confirmed MCP saves revalidate authorization, target contents, and
  concurrency state before mutation.
- **P2-064** — Phase 2 includes a capability-to-tool inventory, meaningful
  authorization tests, and AI-client end-to-end verification.

### 6.7 Accessibility

- **P2-070** — Dock open, collapse, resize, preview, discard, and save controls
  are keyboard accessible.
- **P2-071** — Dock and save-state controls have accessible names, focus states,
  and status announcements.
- **P2-072** — Conflict, backup, rollback, manual-guidance, and authorization
  states are understandable without relying on color alone.
- **P2-073** — The underlying panel remains operable while the dock is open.

## 7. Core user journeys

### 7.1 Preview an existing registered theme

1. An authorized user opens their local Filament panel.
2. The feature is available because the local flag is enabled.
3. The builder resolves the registered panel theme source first.
4. The user edits the theme and sees generated CSS applied in the visible panel.
5. The draft survives navigation and reload until discarded or saved.

### 7.2 Create a new CSS target

1. The builder finds no recognized theme or the user explicitly selects Create CSS.
2. The builder explains the documented defaults and manual registration steps.
3. The user previews the generated CSS without changing project files.
4. The user reviews the target, diff, panels, and mode before confirming save.

### 7.3 Append safely

1. The user selects an existing CSS target and Append.
2. The builder warns that the stylesheet may be shared.
3. The user acknowledges the conflict warning.
4. Every Append first creates a unique full-content `old-` backup without
   clobbering an existing backup.
5. Only after the backup is durable does the first Append create a managed
   block while preserving all prior contents.
6. Later saves create their own backup first, then update only that managed
   block.

### 7.4 Replace safely

1. The user selects Replace and reviews the complete generated diff.
2. The system uniquely renames the original to a full-content `old-` backup.
3. The system writes complete buildable CSS at the original path.
4. If any step fails or concurrency changes, the operation rolls back without
   deleting either the prior file or its backup; safe restoration copies from
   the retained backup and leaves that backup intact.

## 8. Unhappy paths

- The feature flag is disabled.
- The user is not authorized for the panel.
- No registered or searchable stylesheet exists.
- A discovered stylesheet is a dependency, output, or backup.
- An existing theme cannot be recognized.
- A managed block is malformed or conflicts with the selected target.
- A stylesheet is shared by multiple panels.
- The target changes after preview.
- Generated CSS is invalid or not buildable.
- Vite/HMR or registration is missing.
- A save fails part-way through.
- The MCP caller is unauthenticated or unauthorized.
- The user discards a draft after making preview-only changes.

Each case must produce an actionable message and must not cause silent file
mutation or loss of project contents.

## 9. Success criteria

Phase 2 is product-complete when:

1. A developer can activate the integration locally with the approved flag and
   use it inside their own authorized Filament panel.
2. The panel remains visible and operable throughout the builder workflow.
3. Preview and save use the same generated result.
4. Registered sources are preferred and unsafe discovery imports do not occur.
5. Append and Replace preserve complete prior contents and backups.
6. Failed or concurrent saves do not lose work.
7. Manual setup guidance covers missing PHP/configuration/Vite/registration
   steps without silently editing or executing them.
8. Existing Vite/HMR remains the only project feedback workflow.
9. UI and local MCP flows enforce the same authorization and confirmation rules.
10. TDD, Playwright, authorization, and AI-client checks pass for the supported
    Phase 2 scope.

## 10. Product decisions and boundaries

- **Local-only activation:** Phase 2 is explicitly a local development feature
  controlled by `FILAMENT_THEME_BUILDER=true`.
- **Own applications:** The target is a user's own Filament application and
  panel, not only the repository demo.
- **No extra gate:** Existing panel authorization is sufficient.
- **Visible panel:** The dock may collapse, but it must never obscure the product
  surface as the only view.
- **One generator:** Preview and save cannot drift through separate generation
  implementations.
- **CSS-only target:** PHP/configuration guidance is manual, and arbitrary CSS
  is never imported.
- **Conservative writes:** Both modes preserve complete prior contents; no
  automatic backup cleanup is allowed.
- **Phase dependency:** All Phase 1 requirements must be complete before Phase
  2 implementation begins.
- **Deferred engineering identity:** Package name, Composer coordinates,
  compatibility matrix, provider-specific authentication, managed-block syntax,
  file transaction strategy, and endpoint schemas belong in `./SPECS.md`.

## 11. Product questions

The engineering contracts are finalized in [SPECS.md](./SPECS.md). Package
identity, namespace, and Composer coordinates remain intentionally deferred and
are a release blocker; they must be selected before implementation release and
must not be invented by the technical specification or tickets.

## 12. Traceability

This PRD is the product contract for the stable `phase-2-filament-dashboard-
composer-integration` scope. The planned technical specification must link each
P2 requirement to an interface and verification seam. The planned Phase 2
section in root `TICKETS.md` must link each implementation ticket back to these
requirement IDs and preserve the all-Phase-1 blocker.

Related source decisions:

- Root product direction: [../../PRD.md](../../PRD.md)
- Existing technical boundaries: [../../SPECS.md](../../SPECS.md)
- Existing implementation workflow and Phase 1 gate: [../../TICKETS.md](../../TICKETS.md)
- AI operability rule: inherited from `/home/swagoverlord/.config/opencode/rules/ai-operability.md` in the planning environment; repository implementation must preserve that contract
- Existing capability inventory: [../ai-operability/demo-showcase-capability-inventory.md](../ai-operability/demo-showcase-capability-inventory.md)
