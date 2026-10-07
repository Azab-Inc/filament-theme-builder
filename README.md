# Filament Theme Builder

A visual theme builder for FilamentPHP, with a live Vue builder and an independent Laravel/Filament demo panel.

## Prerequisites

- Node.js 24.12+ (or 22.18+), npm
- PHP 8.5+, Composer
- Docker with the Compose plugin (the Sail `sail-8.5/app` image is used for development)
- Chromium for Playwright (`npx playwright install chromium` after setup)

## Repository layout

- `builder/` — independent Vue 3/Vite application and unit tests
- `demo/` — independent Laravel 13, Filament 5, Composer and Vite application
- Root npm scripts — contributor workflow and browser smoke tests; root tooling does not combine the sibling dependency trees

## Workflow

```sh
npm run setup  # install each dependency tree; initialize demo .env, key, SQLite and migrations
npm run dev    # run Vue, Sail, and demo Vite assets; Ctrl-C stops all services
npm test       # builder unit tests and type check, plus demo Composer quality/tests
npm run e2e    # Playwright Chromium smoke checks for builder and Filament login
npm run build  # production builds for builder and demo assets
```

For E2E testing, install the browser once with `npx playwright install chromium`. The demo login route is checked as a rendered Filament page; this workflow does not add public panel access or demo credentials.

Jenkins is the project's planned/used CI. Do not add GitHub Actions.
