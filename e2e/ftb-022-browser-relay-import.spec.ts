import { expect, test, type Page } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { installBrowserRelayRoutes } from './support/browser-relay-routes'

test.skip(process.env.COMPOSE_E2E !== '1', 'Browser relay imports require the same-origin Compose gateway.')

async function openImportPreview(page: Page) {
  await page.addInitScript(() => { if (window.top === window) localStorage.clear() })
  const relay = await installBrowserRelayRoutes(page)
  await page.goto(builderBaseUrl)
  await page.getByRole('button', { name: 'Pair local client' }).click()
  await page.getByRole('button', { name: 'Approve pairing' }).click()
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible()
  return relay
}

test('browser relay import can be cancelled without creating or opening a theme', async ({ page }) => {
  const relay = await openImportPreview(page)
  const activeBefore = await page.locator('[data-active-theme-name]').textContent()
  const countBefore = await page.locator('[data-local-theme-row]').count()
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toContainText('1 → 2 → 3 → 4')
  await page.getByRole('button', { name: 'Cancel import' }).click()
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toHaveCount(0)
  await expect(page.locator('[data-active-theme-name]')).toHaveText(activeBefore ?? '')
  expect(await page.locator('[data-local-theme-row]').count()).toBe(countBefore)
  expect(relay.receipts).toBe(1); expect(relay.previews).toBe(1); expect(relay.authorizations).toBe(0)
  expect(relay.invalidBodies).toBe(0)
  expect(relay.results.at(-1)).toMatchObject({ errorCategory: 'operation_failed' })
})

test('browser relay import requires confirmation and creates one fresh theme', async ({ page }) => {
  const relay = await openImportPreview(page)
  await page.getByLabel('Theme name').fill('Confirmed relay theme')
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect.poll(() => relay.authorizations).toBe(1)
  await expect.poll(() => relay.results.length).toBe(1)
  await expect(page.locator('[data-active-theme-name]')).toHaveText('Confirmed relay theme')
  expect(relay.receipts).toBe(1); expect(relay.authorizations).toBe(1)
  expect(relay.invalidBodies).toBe(0)
  expect(relay.results.at(-1)).toMatchObject({ version: 1, grantId: 'c'.repeat(64), recordId: `import-${'a'.repeat(64)}` })
})

test('browser relay import rejects a stale local revision before apply and mutation', async ({ page }) => {
  const relay = await openImportPreview(page)
  const countBefore = await page.locator('[data-local-theme-row]').count()
  await page.locator('#toolbar-primary-color').fill('#0f766e')
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.getByRole('alert')).toContainText(/stale/i)
  expect(relay.authorizations).toBe(0)
  expect(relay.invalidBodies).toBe(0)
  expect(relay.results.at(-1)).toMatchObject({ errorCategory: 'stale_revision' })
  expect(await page.locator('[data-local-theme-row]').count()).toBe(countBefore)
})
