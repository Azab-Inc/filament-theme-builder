import { expect, test } from '@playwright/test'

const demoBaseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4174'

test.describe('demo showcase panel identity and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/login`)
    await page.getByLabel(/username/i).fill('user')
    await page.getByRole('textbox', { name: /password/i }).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)
  })

  test('branding uses the independent local identity in light and dark modes', async ({ page }) => {
    await expect(page.getByRole('img', { name: 'Filament Theme Builder' }).first()).toBeVisible()
    await expect(page.getByText('Filament Demo', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('img', { name: 'Filament', exact: true })).toHaveCount(0)
    await expect(page.locator('.fi-logo-light svg').first()).toBeAttached()
    await expect(page.locator('link[rel="icon"][href^="data:image/svg+xml;base64,"]')).toHaveCount(1)

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    await expect(page.locator('.fi-logo-dark svg').first()).toBeAttached()
    await expect(page.getByRole('img', { name: 'Filament Theme Builder' }).last()).toBeVisible()
  })

  test('navigation keeps its groups with distinct semantic icons and seeded accessible badges', async ({ page }) => {
    for (const group of ['Catalog', 'Sales', 'Customers', 'Operations']) {
      await expect(page.locator('.fi-sidebar-group-label', { hasText: group })).toBeVisible()
    }
    for (const item of ['Products', 'Orders', 'Customers', 'Suppliers', 'Notes']) {
      const link = page.getByRole('link', { name: new RegExp(item) })
      await expect(link).toBeVisible()
    }
    const iconMarkup = await Promise.all(['Products', 'Orders', 'Customers'].map(async (item) =>
      page.getByRole('link', { name: new RegExp(item) }).locator('svg').evaluate((icon) => icon.innerHTML),
    ))
    expect(new Set(iconMarkup).size).toBe(3)
    for (const [item, tooltip] of [['Products', 'Total products'], ['Orders', 'Total orders'], ['Customers', 'Total customers']]) {
      const link = page.getByRole('link', { name: new RegExp(item) })
      await expect(link.locator('.fi-sidebar-item-badge-ctn .fi-badge')).toHaveText('2')
      await expect(link.locator('.fi-sidebar-item-badge-ctn [x-tooltip]')).toHaveAttribute('x-tooltip', new RegExp(tooltip))
    }
  })
})
