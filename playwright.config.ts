import { defineConfig, devices } from '@playwright/test'

// Compose gateway smoke tests are opt-in (COMPOSE_E2E=1) and run against an
// externally managed stack (COMPOSE_BASE_URL, default http://127.0.0.1:4175).
// Playwright never starts the Compose stacks itself, so the legacy dev servers
// are only launched for the normal `npm run e2e` workflow.
const composeE2e = process.env.COMPOSE_E2E === '1'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    headless: true,
  },
  webServer: composeE2e
    ? []
    : [
        {
          command:
            'VITE_DEMO_URL=http://127.0.0.1:4174/demo/admin npm --prefix builder run dev -- --host 127.0.0.1 --port 4173',
          url: 'http://127.0.0.1:4173',
          reuseExistingServer: false,
          timeout: 120_000,
        },
        {
          command:
            'php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=127.0.0.1 --port=4174',
          cwd: 'demo',
          url: 'http://127.0.0.1:4174/demo/admin/login',
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ],
})
