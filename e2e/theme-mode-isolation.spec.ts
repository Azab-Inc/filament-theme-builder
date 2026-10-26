import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

test('inherits light text into dark mode and keeps a dark edit separate', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto(baseUrl)

  await expect(page.locator('header [aria-label="Light mode"]')).toBeVisible()
  await expect(page.locator('fieldset [aria-label="Light mode"]')).toHaveCount(0)

  await page.getByLabel('Text primary light', { exact: true }).fill('#123456')
  await page.getByRole('button', { name: 'Dark mode' }).click()
  const preview = page.frameLocator('iframe[title="Filament preview"]')
  await expect(preview.locator('html')).toHaveClass(/dark/)
  await expect.poll(() => preview.locator('body').evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')
  await expect(page.getByLabel('Text primary dark', { exact: true })).toHaveValue('#123456')

  await page.getByLabel('Text primary dark', { exact: true }).fill('#abcdef')
  await expect.poll(() => preview.locator('body').evaluate((element) => getComputedStyle(element).color)).toBe('rgb(171, 205, 239)')
  await page.getByRole('button', { name: 'Light mode' }).click()
  await expect(page.frameLocator('iframe[title="Filament preview"]').locator('html')).not.toHaveClass(/dark/)
  await expect.poll(() => preview.locator('body').evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')
  await expect(page.getByLabel('Text primary light', { exact: true })).toHaveValue('#123456')
  await page.getByRole('button', { name: 'Dark mode' }).click()
  await expect(page.getByLabel('Text primary dark', { exact: true })).toHaveValue('#abcdef')
})
