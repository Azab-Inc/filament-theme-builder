import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')
test.use({ acceptDownloads: true })

test.describe('FTB-008 raw Inspector and FTB-004 CSS export', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
    await page.goto(`${baseUrl}/`)
    await expect(page.getByTitle('Filament preview')).toBeVisible()
    await expect(page.frameLocator('iframe[title="Filament preview"]').getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('edits a typed raw property live without reload or non-GET traffic', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.method() !== 'GET') requests.push(request.method())
    })
    const target = frame.locator('.fi-sidebar').first()
    const beforeUrl = await page.getByTitle('Filament preview').getAttribute('src')

    await page.getByRole('button', { name: 'Inspector' }).click()
    await target.click()
    await expect(page.locator('[data-advanced-inspector]')).toBeVisible()
    await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar')

    await page.locator('#raw-background-color').fill('#0f766e')
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/15, 118, 110|rgb\(15, 118, 110\)/)
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toMatch(/15, 118, 110|rgb\(15, 118, 110\)/)
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/15, 118, 110|rgb\(15, 118, 110\)/)
    expect(await page.getByTitle('Filament preview').getAttribute('src')).toBe(beforeUrl)
    expect(requests).toEqual([])

  })

  test('shows a fragile warning for an editable compound selector and exports raw CSS', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section').first().click()
    await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-section')

    await page.getByLabel('Raw element selector').fill('.fi-section .fi-btn')
    await expect(page.locator('[data-selector-warning]')).toContainText(/fragile|multiple classes/i)
    await page.locator('#raw-border-radius').fill('0.75rem')

    await page.getByRole('button', { name: 'Download vanilla CSS' }).click()
    await expect(page.getByRole('status', { name: /export/i })).toContainText(/download started/i)
  })
})
