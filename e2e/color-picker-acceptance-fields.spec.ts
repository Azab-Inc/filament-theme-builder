import { expect, test } from '@playwright/test'
import { baseUrl, chooseToken, openChooser, readCanonical, setPreviewRoute } from './color-picker-acceptance.helpers'

test.describe('color picker field acceptance', () => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires the canonical Compose stack')

  test('updates toolbar primary and a mapped palette base without iframe reload', async ({ page }) => {
    const navigations: string[] = []
    page.on('request', (request) => { if (request.isNavigationRequest()) navigations.push(request.url()) })
    await page.goto(baseUrl)
    const frame = await setPreviewRoute(page, '/demo/admin/showcase')
    await openChooser(page, 'Primary color')
    await chooseToken(page)
    await expect(page.locator('#toolbar-primary-color')).toHaveValue('#101828')
    await expect.poll(() => frame.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ftb-primary').trim())).toBe('#101828')
    navigations.length = 0
    await page.getByRole('button', { name: 'Primary', exact: true }).click()
    await openChooser(page, 'primary palette base')
    await chooseToken(page)
    await expect(page.locator('#primary-palette-base')).toHaveValue('#101828')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.locator('#primary-palette-base')).not.toHaveValue('#101828')
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(page.locator('#primary-palette-base')).toHaveValue('#101828')
    await expect.poll(async () => (await readCanonical(page)).foundations.palettes.primary.base).toBe('#101828')
    expect(navigations).toEqual([])
  })

  test('selects an empty shade override and keeps its generated state visible', async ({ page }) => {
    await page.goto(baseUrl)
    await page.getByRole('button', { name: 'Primary', exact: true }).click()
    const input = page.locator('#primary-shade-900')
    await expect(input).toHaveValue('')
    await expect(page.locator('[data-palette-status="primary-shade-900"]')).toContainText('generated')
    await openChooser(page, 'primary shade 900 override')
    await chooseToken(page)
    await expect(input).toHaveValue('#101828')
    await expect.poll(async () => (await readCanonical(page)).foundations.palettes.primary.overrides[900]).toBe('#101828')
  })

  test('isolates light and dark surface, border, and text fields', async ({ page }) => {
    await page.goto(baseUrl)
    await openChooser(page, 'page surface light'); await chooseToken(page)
    await expect(page.locator('#page-surface')).toHaveValue('#101828')
    await page.getByRole('button', { name: 'Dark mode' }).click()
    await openChooser(page, 'page surface dark'); await chooseToken(page)
    await openChooser(page, 'border default dark'); await chooseToken(page)
    await openChooser(page, 'text primary dark'); await chooseToken(page)
    await expect(page.locator('#page-surface')).toHaveValue('#101828')
    await page.getByRole('button', { name: 'Light mode' }).click()
    await expect(page.locator('#page-surface')).toHaveValue('#101828')
    await expect(page.locator('#border-default-light')).not.toHaveValue('#101828')
  })
})
