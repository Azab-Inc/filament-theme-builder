# Filament Theme Builder — Issue Index

**Panel configuration phase classification:** The non-visual children of [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89) are deferred to Composer package Phase 2, marked `composer package phase` and titled `(Composer package phase)`. The exact ticket list and Phase 2 gate are in [TICKETS.md](./TICKETS.md#ftb-087). Visual children retain their `visual config` label and existing phase; #89 spans both phases.

Local issue index added with user permission on 2026-11-18. This index records the border-side request; the pre-existing backlog remains in [TICKETS.md](./TICKETS.md) and GitHub.

| Ticket | GitHub issue | State / Project #30 status | Scope | Dependencies |
| --- | --- | --- | --- | --- |
| [FTB-087](./TICKETS.md#ftb-087) | [#89](https://github.com/Azab-Inc/filament-theme-builder/issues/89) | Open / planning | All Panel properties umbrella; inventory incomplete | All option children |
| [FTB-088](./TICKETS.md#ftb-088) | [#90](https://github.com/Azab-Inc/filament-theme-builder/issues/90) | Open / planning | Panel top navigation | Panel contract; coordinate FTB-055 |
| [FTB-089–102](./TICKETS.md#ftb-089) | [#91–#104](https://github.com/Azab-Inc/filament-theme-builder/issues?q=is%3Aissue%20FTB-0) | Open / planning | Per-option navigation and layout children | Panel contract; coordinate FTB-018/055 |
| [FTB-103–127](./TICKETS.md#ftb-103) | [#105–#129](https://github.com/Azab-Inc/filament-theme-builder/issues?q=is%3Aissue%20FTB-1) | Open / planning | Per-option runtime and authentication children | Panel contract; coordinate FTB-018/055 |
| [FTB-128–157](./TICKETS.md#ftb-128) | [#130–#159](https://github.com/Azab-Inc/filament-theme-builder/issues?q=is%3Aissue%20FTB-1) | Open / planning | Per-option tenancy, search and styling children | Panel contract; coordinate FTB-018/055 |
| [FTB-158–180](./TICKETS.md#ftb-158) | [#160–#182](https://github.com/Azab-Inc/filament-theme-builder/issues?q=is%3Aissue%20FTB-1) | Open / planning | Menus, notifications, auth routes and registrations | Panel contract; verify version differences |
| [FTB-084](./TICKETS.md#ftb-084) | [#88](https://github.com/Azab-Inc/filament-theme-builder/issues/88) | Open / Testing | Border-side controls umbrella | Both child slices; full-unit gate |
| [FTB-085](./TICKETS.md#ftb-085) | [#87](https://github.com/Azab-Inc/filament-theme-builder/issues/87) | Open / Testing | Semantic border-side controls, preview/export and MCP | Implementation present; full-unit gate and acceptance sign-off pending |
| [FTB-086](./TICKETS.md#ftb-086) | [#86](https://github.com/Azab-Inc/filament-theme-builder/issues/86) | Open / Testing | Raw Inspector edge properties, preview/export and MCP | Implementation present; FTB-085 and shared final gate |

## Confirmed gap

The pre-implementation development builder and source were checked on 2026-11-18: Foundations had border colors and one width, Components had separate-edge padding, and raw Inspector exposed only aggregate border properties. This baseline led to the [Border Side Controls spec](./docs/superpowers/specs/2026-11-18-border-side-controls-design.md). The implementation was subsequently saved in commit `4562f2e`.

## Synchronization

All three border issues belong to [GitHub Project #30](https://github.com/orgs/Azab-Inc/projects/30). Their acceptance criteria are mirrored in [TICKETS.md](./TICKETS.md#ftb-084), indexed in [SPECS.md](./SPECS.md#border-side-controls), and sequenced in [implementation-order.md](./implementation-order.md#7-border-side-controls). Implementation is saved in commit `4562f2e`; all remain open in Testing. The [verification checkpoint](./docs/verification/ftb-084-border-sides.md) records 17 passing browser/MCP tests, 21 passing PHP tests, passing type-check/build, and the remaining full-unit failure in concurrent stylesheet naming work. Final acceptance is not claimed.
