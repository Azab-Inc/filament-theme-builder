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

### Demo-first implementation gate

After FTB-003, remaining builder feature work stays blocked until the demo-complete gate is satisfied: FTB-009A (demo domain), FTB-009B (core resources), FTB-010 (relationship UI), FTB-011 (forms/schemas), FTB-013 (infolists), FTB-014 (actions/modals/notifications), and FTB-015 (widgets/navigation/search/auth/tenant UI) must be done. FTB-012 (tables) is explicitly partial; only theme-density integration remains, and it does not block the next builder phase. FTB-016/017/018 and operational FTB-027/028 remain separate pending demo work and are not prerequisites for this gate. Preserve TDD and Playwright requirements above for all feature work.

## More Specific Instructions

- Vue-specific conventions are defined in `builder/AGENTS.md`.
- Laravel and Filament conventions belong in the Laravel guidance file under `demo/`.
- When instructions conflict, the guidance file located closest to the files being changed takes precedence.
