import { expect, test } from '@playwright/test'

test('Vue builder scaffold renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173')

  await expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'vuejs.org' })).toHaveAttribute(
    'href',
    'https://vuejs.org/',
  )
})

test('Filament admin login renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/admin/login')

  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/email address/i)).toBeVisible()
})

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test('compose gateway serves builder and same-origin Filament', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const response = await page.goto(composeBaseUrl)
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).not.toContainText('Laravel')

  const admin = await page.request.get(`${composeBaseUrl}/demo/admin/login`)
  expect(admin.ok()).toBeTruthy()
  await page.goto(`${composeBaseUrl}/demo/admin/login`)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/email address/i)).toBeVisible()
})

test('compose gateway serves demo Vite client and proxied API on same origin', async ({ request }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const client = await request.get(`${composeBaseUrl}/_demo-vite/@vite/client`)
  expect(client.ok()).toBeTruthy()
  expect(client.headers()['content-type']).toContain('javascript')
  const api = await request.get(`${composeBaseUrl}/api/health`)
  expect(api.ok()).toBeTruthy()
})
