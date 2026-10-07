# Filament Theme Builder

A visual theme builder for FilamentPHP, with a live Vue builder and an independent Laravel/Filament demo panel.

## Prerequisites

- Supported development hosts: Linux, macOS, or WSL2, with Docker Engine/Desktop and the Docker Compose plugin available to Sail. Native Windows shells are not supported by these npm scripts.
- Node.js 24.12+ (or 22.18+), npm
- PHP 8.5+, Composer
- Docker with the Compose plugin (the Sail `sail-8.5/app` image is used for development)

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

The Sail app is served on port 8000 by default. If that port is occupied, use `APP_PORT=8001 npm run dev` (update `APP_URL` in `demo/.env` to match if you need app-generated absolute URLs).
All development servers bind to loopback only: builder at `http://127.0.0.1:5173`, demo Vite assets at `http://127.0.0.1:5174`, and Filament login at `http://127.0.0.1:8000/admin/login` by default. Ports 5173 and 5174 are strict and fail instead of silently selecting another port.

After setup, install Playwright's Chromium browser once with `npx playwright install chromium`; on Linux hosts missing browser system libraries, use `npx playwright install --with-deps chromium`. The demo login route is checked as a rendered Filament page; this workflow does not add public panel access or demo credentials.

Jenkins is the project's planned/used CI. Do not add GitHub Actions.
