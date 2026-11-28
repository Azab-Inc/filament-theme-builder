# Repository Guidelines

## Application Runtime

The Docker Compose files are the canonical way to run the complete application. Each compose file must start both application parts:

- `builder/` - the Vue theme builder.
- `demo/` - the Laravel and Filament demo application.

### Local Development

Use `compose.dev.yaml` for local development:

```sh
docker compose -f compose.dev.yaml up
```

The development configuration must provide hot reload for edits to the builder and demo so changes are visible as soon as the relevant development server rebuilds.

### Production

Use `compose.prod.yaml` for production:

```sh
docker compose -f compose.prod.yaml up
```

The production configuration must run the complete builder and demo stack using production builds and runtime settings rather than development servers or hot reload.

Do not require separate host commands to start either application when using one of these compose files. If the compose configuration needs a new dependency or service, ask for explicit consent before installing or adding a third-party package.

## Development Workflow

Use test-driven development for every feature and bug fix: write the test first, run it and verify that it fails for the expected reason, then implement the smallest change that makes it pass. For user-visible behavior, create and run the Playwright CLI test before implementation and use it to verify the completed feature or fix. A feature is not done and a bug is not fixed until its test passes.

### Version control

Commit authority follows the shared version-control policy: commit only after approved implementation and required verification settle, and honor any explicit user no-commit instruction. Never push commits or modify remote branches unless the user explicitly requests it. Use the repository's configured commit tool/workflow when committing.

## Theme mode isolation

Treat light and dark mode values as independent theme-context values with inheritance. When a user changes a value in the light theme, the dark theme may inherit that value until the user explicitly changes the same value in dark mode. At that point, persist and render separate light and dark values. Verify this behavior for semantic controls, Inspector/raw overrides, state variants, exports, reset, and undo/redo; never overwrite the other mode when editing the active mode.

### Demo-first implementation gate

Feature sequencing and gate status are maintained in [TICKETS.md](./TICKETS.md) and [implementation-order.md](./implementation-order.md); consult those authoritative records before planning feature work. Preserve TDD and Playwright requirements above for all feature work.

MCP capability navigation starts at the [capability inventory](./docs/ai-operability/demo-showcase-capability-inventory.md), which links product capabilities to their tools and acceptance evidence.

For a fast changed-code gate run `npm run lint:changed`; for the canonical sequential local evidence checkpoint run `npm run verify:local`; inspect or validate the latest git-private checkpoint with `node scripts/verification-checkpoint.mjs identity` or `node scripts/verification-checkpoint.mjs check`.

## More Specific Instructions

- Vue-specific conventions are defined in `builder/AGENTS.md`.
- Laravel and Filament conventions belong in the Laravel guidance file under `demo/`.
- When instructions conflict, the guidance file located closest to the files being changed takes precedence.
