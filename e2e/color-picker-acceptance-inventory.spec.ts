import { expect, test } from '@playwright/test'
import { authenticate, baseUrl, chooseToken, openChooser, readCanonical, setPreviewRoute } from './color-picker-acceptance.helpers'

test.describe('semantic and raw color acceptance', () => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires the canonical Compose stack')

  test('applies global/component backgrounds, history, iframe projection, and reload persistence', async ({ page }) => {
    await authenticate(page); await page.goto(baseUrl); const frame = await setPreviewRoute(page, '/demo/admin/forms-showcase')
    await page.getByRole('tab', { name: 'Components' }).click()
    const global = page.locator('#product-name-global-background'); const component = page.locator('#product-name-component-background')
    await openChooser(page, 'Product name Global background'); await chooseToken(page, 'red 500 #fb2c36')
    await expect(global).toHaveValue('#fb2c36')
    await expect.poll(() => frame.locator('.fi-fo-text-input .fi-input').first().evaluate((node) => getComputedStyle(node).backgroundColor)).toBe('rgb(251, 44, 54)')
    await openChooser(page, 'Product name Component background'); await chooseToken(page)
    await expect(component).toHaveValue('#101828')
    await expect.poll(async () => (await readCanonical(page)).overrides.filter((override: { targetId: string }) => override.targetId === 'form.product-name')).toEqual(expect.arrayContaining([expect.objectContaining({ scope: 'global', value: '#fb2c36' }), expect.objectContaining({ scope: 'component', value: '#101828' })]))
    await expect.poll(() => frame.locator('.fi-fo-text-input .fi-input').first().evaluate((node) => getComputedStyle(node).backgroundColor)).toBe('rgb(16, 24, 40)')
    await page.getByRole('button', { name: 'Undo' }).click(); await expect(component).not.toHaveValue('#101828')
    await page.getByRole('button', { name: 'Redo' }).click(); await expect(component).toHaveValue('#101828')
    await page.reload(); await page.getByRole('tab', { name: 'Components' }).click()
    await expect(page.locator('#product-name-global-background')).toHaveValue('#fb2c36'); await expect(page.locator('#product-name-component-background')).toHaveValue('#101828')
  })

  test('offers chooser only for raw color properties and projects to the existing iframe', async ({ page }) => {
    await page.goto(baseUrl); const frame = await setPreviewRoute(page, '/demo/admin/showcase')
    await page.getByRole('button', { name: 'Inspector' }).click(); await frame.locator('.fi-section:visible').first().click()
    for (const property of ['color', 'background-color', 'border-color']) await expect(page.getByRole('button', { name: `Choose Raw ${property} from Tailwind palette` })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Choose Raw border-radius from Tailwind palette' })).toHaveCount(0)
    await openChooser(page, 'Raw background-color'); await chooseToken(page)
    await expect.poll(() => frame.locator('.fi-section:visible').first().evaluate((node) => getComputedStyle(node).backgroundColor)).toBe('rgb(16, 24, 40)')
    await expect.poll(async () => (await readCanonical(page)).rawOverrides).toEqual(expect.arrayContaining([expect.objectContaining({ selector: '.fi-section', properties: expect.objectContaining({ 'background-color': '#101828' }) })]))
    const section = frame.locator('.fi-section:visible').first(); await page.getByRole('button', { name: 'Undo' }).click()
    await expect.poll(() => section.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgb(16, 24, 40)')
    await page.getByRole('button', { name: 'Redo' }).click(); await expect.poll(() => section.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe('rgb(16, 24, 40)')
    await page.getByRole('button', { name: 'Reset raw background-color' }).click(); await expect.poll(() => section.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgb(16, 24, 40)')
  })

  test('persists after reload and reset returns the original canonical value', async ({ page }) => {
    await page.goto(baseUrl); let input = page.locator('#primary-palette-base'); const baseline = await readCanonical(page); const baselineProjection = await page.frame({ url: /\/demo\/admin/ })!.evaluate(() => document.getElementById('ftb-managed-theme')?.textContent ?? '')
    await page.getByRole('button', { name: 'Primary', exact: true }).click(); await openChooser(page, 'primary palette base'); await chooseToken(page)
    await expect.poll(async () => (await readCanonical(page)).foundations.palettes.primary.base).toBe('#101828')
    await page.reload(); await page.getByRole('button', { name: 'Primary', exact: true }).click(); input = page.locator('#primary-palette-base'); await expect(input).toHaveValue('#101828')
    await page.getByRole('button', { name: 'Reset primary palette base' }).click(); await expect(input).toHaveValue(baseline.foundations.palettes.primary.base)
    await expect(page.locator('[data-palette-status="primary-base"]')).toContainText('inherited')
    await expect.poll(async () => (await readCanonical(page)).foundations.palettes.primary.base).toBe(baseline.foundations.palettes.primary.base)
    await expect.poll(() => page.frame({ url: /\/demo\/admin/ })!.evaluate(() => document.getElementById('ftb-managed-theme')?.textContent ?? '')).toBe(baselineProjection)
    await page.reload(); await page.getByRole('button', { name: 'Primary', exact: true }).click(); input = page.locator('#primary-palette-base')
    await expect(input).toHaveValue(baseline.foundations.palettes.primary.base); await expect(page.locator('[data-palette-status="primary-base"]')).toContainText('inherited')
    await expect.poll(() => page.frame({ url: /\/demo\/admin/ })!.evaluate(() => document.getElementById('ftb-managed-theme')?.textContent ?? '')).toBe(baselineProjection)
  })

  test('does not request palette data or generate arbitrary utility classes', async ({ page }) => {
    await page.goto(baseUrl); const urls: string[] = []; await page.on('request', (request) => urls.push(request.url()))
    await openChooser(page, 'Primary color'); await chooseToken(page)
    expect(urls.filter((url) => /palette|tailwind/i.test(url) && !url.includes('/src/'))).toEqual([])
    expect(await page.locator('[class],[style]').evaluateAll((nodes) => nodes.map((node) => `${node.getAttribute('class')} ${node.getAttribute('style')}`).join(' '))).not.toMatch(/text-\[|bg-\[#|#101828/)
  })
})
