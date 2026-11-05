import { expect, test } from '@playwright/test'
import { authenticate, baseUrl } from './color-picker-acceptance.helpers'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

test('a dark-first primary edit does not block switching back to untouched light mode', async ({ page }) => {
  await authenticate(page)
  await page.evaluate(() => localStorage.clear())
  await page.goto(baseUrl)
  const root = page.frameLocator('iframe[title="Filament preview"]').locator('html')
  await expect(root).toBeVisible()
  const lightPrimary = await page.getByLabel('Primary color text', { exact: true }).inputValue()
  await page.getByRole('button', { name: 'Dark mode' }).click()
  await page.getByLabel('Primary color text', { exact: true }).fill('#654321')
  await expect(root).toHaveClass(/dark/)
  await expect.poll(() => root.evaluate((node) => getComputedStyle(node).getPropertyValue('--ftb-primary').trim())).toBe('#654321')
  await page.getByRole('button', { name: 'Light mode' }).click()
  await expect(root).not.toHaveClass(/dark/)
  await expect(page.getByLabel('Primary color text', { exact: true })).toHaveValue(lightPrimary)
  await page.getByRole('button', { name: 'Dark mode' }).click()
  await expect(root).toHaveClass(/dark/)
  await expect(page.getByLabel('Primary color text', { exact: true })).toHaveValue('#654321')
})
