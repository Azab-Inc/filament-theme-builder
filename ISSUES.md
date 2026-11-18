# Filament Theme Builder — Issue Index

Local border-side issue index, created with user permission on 2026-11-18. Other project backlog records remain in [TICKETS.md](./TICKETS.md) and GitHub.

| Ticket | GitHub issue | State / Project #30 status | Scope | Dependencies |
| --- | --- | --- | --- | --- |
| [FTB-084](./TICKETS.md#ftb-084) | [#88](https://github.com/Azab-Inc/filament-theme-builder/issues/88) | Open / Testing | Border-side controls umbrella | Both child slices; full-unit gate |
| [FTB-085](./TICKETS.md#ftb-085) | [#87](https://github.com/Azab-Inc/filament-theme-builder/issues/87) | Open / Testing | Semantic border-side controls, preview/export and MCP | Implementation present; full-unit gate and acceptance sign-off pending |
| [FTB-086](./TICKETS.md#ftb-086) | [#86](https://github.com/Azab-Inc/filament-theme-builder/issues/86) | Open / Testing | Raw Inspector edge properties, preview/export and MCP | Implementation present; FTB-085 and shared final gate |

## Synchronization

All three issues belong to [GitHub Project #30](https://github.com/orgs/Azab-Inc/projects/30). Acceptance criteria are mirrored in [TICKETS.md](./TICKETS.md#ftb-084), indexed in [SPECS.md](./SPECS.md#border-side-controls), and sequenced in [implementation-order.md](./implementation-order.md#7-border-side-controls).

The [verification checkpoint](./docs/verification/ftb-084-border-sides.md) records 17 passing browser/MCP tests, 21 passing PHP tests, passing type-check/build, and the remaining full-unit failure in concurrent stylesheet naming work. All issues remain open in Testing pending final acceptance.
