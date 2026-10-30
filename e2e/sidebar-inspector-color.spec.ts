import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')
test.use({ viewport: { width: 1600, height: 1000 } })

test('selects sidebar icons and inherits label color unless explicitly overridden', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
  await page.goto(`${baseUrl}/demo/admin/login`)
  await page.locator('#form\\.email').fill('user')
  await page.locator('#form\\.password').fill('password')
  await page.locator('#form').evaluate((form) => (form as HTMLFormElement).requestSubmit())
  await expect(page).toHaveURL(/\/demo\/admin$/, { timeout: 15_000 })
  await page.goto(baseUrl)
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  const label = frame.locator('.fi-sidebar-item-label').first()
  const icon = frame.locator('.fi-sidebar-item-icon').first()
  await expect(icon).toBeVisible()
  await page.getByRole('button', { name: 'Inspector' }).click()

  await icon.click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-icon')

  await label.click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-label')
  await page.getByLabel('Raw color', { exact: true }).fill('#123456')
  await expect.poll(() => icon.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')

  await icon.click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-icon')
  await page.getByLabel('Raw color', { exact: true }).fill('#abcdef')
  await expect.poll(() => icon.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(171, 205, 239)')
  await expect.poll(() => label.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')
})
