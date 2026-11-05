import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

test('raw sidebar color keeps light and dark values isolated', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
  await page.setViewportSize({ width: 1600, height: 1200 })
  await page.goto(baseUrl)

  const frame = page.frameLocator('iframe[title="Filament preview"]')
  const label = frame.locator('.fi-sidebar-item.fi-active .fi-sidebar-item-label').first()
  await expect(label).toBeVisible()

  await page.getByRole('button', { name: 'Inspector' }).click()
  await label.click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-label')

  await page.getByLabel('Raw color', { exact: true }).fill('#123456')
  await expect.poll(() => label.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')

  await page.getByRole('button', { name: 'Dark mode' }).click()
  await expect(frame.locator('html')).toHaveClass(/dark/)
  await expect(page.getByLabel('Raw color', { exact: true })).toHaveValue('#123456')
  await expect.poll(() => label.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')

  await page.getByLabel('Raw color', { exact: true }).fill('#abcdef')
  await expect.poll(() => label.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(171, 205, 239)')

  await page.getByRole('button', { name: 'Light mode' }).click()
  await expect(frame.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByLabel('Raw color', { exact: true })).toHaveValue('#123456')
  await expect.poll(() => label.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')
})
