import { expect, test, type Page } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { installBrowserRelayRoutes } from './support/browser-relay-routes'

test.skip(process.env.COMPOSE_E2E !== '1', 'Browser relay imports require the same-origin Compose gateway.')

async function openImportPreview(page: Page, options: { authorizationFails?: boolean } = {}) {
  await page.addInitScript(() => { if (window.top === window) localStorage.clear() })
  const relay = await installBrowserRelayRoutes(page, options)
  await page.goto(builderBaseUrl)
  await page.getByText('Tools', { exact: true }).click()
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
  await expect(page.locator('[data-toolbar-menu]').nth(1).locator('summary')).toBeFocused()
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

test('browser relay import isolates the preview until the user cancels or confirms', async ({ page }) => {
  const relay = await openImportPreview(page)
  const initialColor = await page.locator('#toolbar-primary-color').inputValue()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible()
  await expect(page.locator('#toolbar-primary-color')).toHaveValue(initialColor)
  await page.mouse.click(8, 8)
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeHidden()
  await expect.poll(() => relay.results.length).toBe(1)
  expect(relay.authorizations).toBe(0)
  expect(relay.invalidBodies).toBe(0)
  expect(relay.results.at(-1)).toMatchObject({ errorCategory: 'operation_failed' })
})

test('failed relay confirmation keeps the modal open and focuses its retryable error', async ({ page }) => {
  const relay = await openImportPreview(page, { authorizationFails: true })
  const before = await page.locator('[data-local-theme-row]').count()
  await page.getByRole('button', { name: 'Confirm import' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import preview' })
  const error = dialog.getByRole('alert')
  await expect(dialog).toBeVisible()
  await expect(error).toContainText('Relay authorization failed')
  await expect(error).toBeFocused()
  expect(await page.locator('[data-local-theme-row]').count()).toBe(before)
  expect(relay.authorizations).toBe(1)
  expect(relay.results).toHaveLength(0)
})
