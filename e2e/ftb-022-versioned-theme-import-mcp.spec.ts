import { test, expect } from '@playwright/test'
import { builderBaseUrl } from './urls'

async function localThemeCollection(page: import('@playwright/test').Page) {
  return page.locator('[data-local-theme-row]').evaluateAll((rows) => rows.map((row) => ({
    id: row.getAttribute('data-local-theme-row'), name: row.querySelector('strong')?.textContent?.trim(),
  })))
}

async function browserStorage(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort(([left], [right]) => left.localeCompare(right))))
}

test('browser import previews before creating a fresh local theme', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await expect(page.getByRole('button', { name: 'Import theme' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Pair local client/i })).toBeDisabled()
  const activeBefore = await page.locator('[data-active-theme-name]').textContent()
  const themesBeforeCancel = await localThemeCollection(page)
  const storageBeforeCancel = await browserStorage(page)
  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles('e2e/fixtures/theme-import/v1.json')
  const preview = page.getByRole('dialog', { name: 'Import preview' })
  await expect(preview).toBeVisible()
  await expect(preview).toContainText('v1.json')
  await expect(preview).toContainText('1 → 2 → 3 → 4')
  await expect(preview).toContainText('SHA-256')
  await expect(preview).toContainText('51 bytes')
  await expect(page.locator('[data-active-theme-name]')).toHaveText(activeBefore ?? '')
  await page.getByRole('textbox', { name: 'Theme name' }).fill('Imported example')
  await page.getByRole('button', { name: 'Cancel import' }).click()
  await expect(page.locator('[data-active-theme-name]')).not.toHaveText('Imported example')
  expect(await localThemeCollection(page)).toEqual(themesBeforeCancel)
  expect(await browserStorage(page)).toBe(storageBeforeCancel)

  const themesBeforeInvalidFile = await localThemeCollection(page)
  const storageBeforeInvalidFile = await browserStorage(page)
  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') })
  const importError = page.getByRole('alert')
  await expect(importError).toBeVisible()
  await expect(importError).toHaveText(/\S+/)
  expect(await localThemeCollection(page)).toEqual(themesBeforeInvalidFile)
  expect(await browserStorage(page)).toBe(storageBeforeInvalidFile)
  await page.getByRole('button', { name: 'Cancel import' }).click()

  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles('e2e/fixtures/theme-import/v1.json')
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Theme name' }).fill('Imported confirmed')
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.locator('[data-active-theme-name]')).toHaveText('Imported confirmed')
})
