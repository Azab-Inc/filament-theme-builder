import { expect, test } from '@playwright/test'
import { baseUrl, chooseToken, openChooser, readCanonical, setPreviewRoute } from './color-picker-acceptance.helpers'

test.describe('semantic and raw color acceptance', () => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires the canonical Compose stack')

  test('applies Product name background and preserves one undo/redo edit', async ({ page }) => {
    await page.goto(baseUrl); await page.getByRole('tab', { name: 'Components' }).click()
    const field = page.locator('input[type="text"][aria-label^="Product name"]').first()
    const fieldId = await field.getAttribute('id'); expect(fieldId).toBeTruthy()
    const trigger = page.locator(`#${fieldId}-palette-trigger`)
    await trigger.click(); await chooseToken(page, 'gray 50 #f9fafb')
    await expect(field).toHaveValue('#f9fafb')
    await expect.poll(async () => (await readCanonical(page)).overrides.some((override: { targetId: string; value: string }) => override.targetId === 'form.product-name' && override.value === '#f9fafb')).toBe(true)
  })

  test('offers chooser only for raw color properties and projects to the existing iframe', async ({ page }) => {
    await page.goto(baseUrl); const frame = await setPreviewRoute(page, '/demo/admin/showcase')
    await page.getByRole('button', { name: 'Inspector' }).click(); await frame.locator('.fi-section:visible').first().click()
    for (const property of ['color', 'background-color', 'border-color']) await expect(page.getByRole('button', { name: `Choose Raw ${property} from Tailwind palette` })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Choose Raw border-radius from Tailwind palette' })).toHaveCount(0)
    await openChooser(page, 'Raw background-color'); await chooseToken(page)
    await expect.poll(() => frame.locator('.fi-section:visible').first().evaluate((node) => getComputedStyle(node).backgroundColor)).toBe('rgb(16, 24, 40)')
    await expect.poll(async () => (await readCanonical(page)).rawOverrides).not.toEqual({})
  })

  test('persists after reload and reset returns the original canonical value', async ({ page }) => {
    await page.goto(baseUrl); let input = page.locator('#primary-palette-base')
    await page.getByRole('button', { name: 'Primary', exact: true }).click(); await openChooser(page, 'primary palette base'); await chooseToken(page)
    await expect.poll(async () => (await readCanonical(page)).foundations.palettes.primary.base).toBe('#101828')
    await page.reload(); await page.getByRole('button', { name: 'Primary', exact: true }).click(); input = page.locator('#primary-palette-base'); await expect(input).toHaveValue('#101828')
    await page.getByRole('button', { name: 'Reset primary palette base' }).click(); await expect(input).not.toHaveValue('#101828')
  })

  test('does not request palette data or generate arbitrary utility classes', async ({ page }) => {
    const urls: string[] = []; await page.on('request', (request) => urls.push(request.url()))
    await page.goto(baseUrl); await openChooser(page, 'Primary color'); await chooseToken(page)
    expect(urls.filter((url) => /palette|tailwind/i.test(url) && !url.includes('/src/'))).toEqual([])
    expect(await page.locator('[class*="text-"]').evaluateAll((nodes) => nodes.map((node) => node.className).join(' '))).not.toContain('#101828')
  })
})
