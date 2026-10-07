import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    headless: true,
  },
  webServer: [
    {
      command: 'npm --prefix builder run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'php artisan serve --host=127.0.0.1 --port=4174',
      cwd: 'demo',
      url: 'http://127.0.0.1:4174/admin/login',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
