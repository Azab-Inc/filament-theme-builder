import { test, expect } from '@playwright/test'
import { builderBaseUrl } from './urls'

test('browser import previews before creating a fresh local theme', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await expect(page.getByRole('button', { name: 'Import theme' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Pair local client/i })).toBeDisabled()
  const activeBefore = await page.locator('[data-active-theme-name]').textContent()
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

  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles('e2e/fixtures/theme-import/v1.json')
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Theme name' }).fill('Imported confirmed')
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.locator('[data-active-theme-name]')).toHaveText('Imported confirmed')
})
