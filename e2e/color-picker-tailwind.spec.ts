import { expect, test } from '@playwright/test'

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.describe('Tailwind selection for color fields', () => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires the canonical Compose stack')

  test('chooses gray-900 for the dark page surface and updates its real preview', async ({ page }) => {
    await page.goto(composeBaseUrl)
    const preview = page.frameLocator('iframe[title="Filament preview"]')
    await expect(page.getByRole('heading', { name: 'Filament Theme Builder' })).toBeVisible()
    await page.getByRole('button', { name: 'Dark mode' }).click()

    await page.getByRole('button', { name: 'Choose page surface dark from Tailwind palette' }).click()
    await page.getByRole('searchbox', { name: /search.*color/i }).fill('gray-900')
    await page.getByRole('button', { name: /gray 900 #101828/i }).click()

    await expect(page.locator('#page-surface')).toHaveValue('#101828')
    await expect.poll(async () => {
      const themeId = await page.evaluate(() => localStorage.getItem('ftb-theme-active'))
      const raw = await page.evaluate((id) => id ? localStorage.getItem(`ftb-theme:${id}`) : null, themeId)
      return raw ? JSON.parse(raw).foundations.surfaces.page.dark : null
    }).toBe('#101828')
    await expect.poll(() => preview.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(16, 24, 40)')
  })
})
