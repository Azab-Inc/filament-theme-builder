import { expect, test } from '@playwright/test'
import { authenticate, baseUrl } from './color-picker-acceptance.helpers'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

for (const explicitDarkBase of [false, true]) {
  test(`preview ignores stale palette caches with explicit dark base ${explicitDarkBase}`, async ({ page }) => {
    await authenticate(page)
    await page.evaluate(() => localStorage.clear())
    await page.goto(baseUrl)
    const preview = page.frameLocator('iframe[title="Filament preview"]')
    await expect(preview.locator('html')).toBeVisible()
    await preview.locator('html').evaluate(() => {
      const capture = { message: null as unknown, accepted: 0 }
      Object.assign(window, { paletteTestCapture: capture })
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'ftb:theme:update') capture.message = structuredClone(event.data)
      })
      window.addEventListener('ftb:preview-message-accepted', () => capture.accepted++)
    })
    await page.getByLabel('Primary color text', { exact: true }).fill('#123456')
    await page.getByRole('button', { name: 'Dark mode' }).click()
    if (explicitDarkBase) await page.getByLabel('Primary color text', { exact: true }).fill('#654321')
    await expect(preview.locator('html')).toHaveClass(/dark/)
    const expected = explicitDarkBase ? '#654321' : '#123456'
    await expect.poll(() => preview.locator('html').evaluate((node) => getComputedStyle(node).getPropertyValue('--primary-500').trim())).toBe(expected)
    const payload = await preview.locator('html').evaluate(() => {
      return (window as unknown as { paletteTestCapture: { message: Record<string, unknown> } }).paletteTestCapture.message
    })
    const send = async (forgedProjection: boolean) => {
      await preview.locator('html').evaluate(() => {
        (window as unknown as { paletteTestCapture: { accepted: number } }).paletteTestCapture.accepted = 0
      })
      await page.evaluate(({ message, forge }) => {
        const altered = structuredClone(message) as {
          theme: { foundations: { palettes: { primary: { dark?: { base?: string; shades?: Record<string, string> } } } } }
          projection: { mappings: Array<{ id: string; value: string }> }
        }
        const palette = altered.theme.foundations.palettes.primary
        palette.dark = { ...palette.dark, shades: { ...palette.dark?.shades, 500: '#ff00ff' } }
        if (forge) altered.projection.mappings.find((entry) => entry.id === 'palette.primary.shades.500')!.value = '#ff00ff'
        document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.contentWindow!.postMessage(altered, location.origin)
      }, { message: payload, forge: forgedProjection })
    }
    await send(false)
    await expect.poll(() => preview.locator('html').evaluate(() => (window as unknown as { paletteTestCapture: { accepted: number } }).paletteTestCapture.accepted)).toBe(1)
    await expect.poll(() => preview.locator('html').evaluate((node) => getComputedStyle(node).getPropertyValue('--primary-500').trim())).toBe(expected)
    await send(true)
    // A subsequent valid message provides a barrier after the forged message.
    await page.getByLabel('Primary color text', { exact: true }).fill('#112233')
    await expect.poll(() => preview.locator('html').evaluate((node) => getComputedStyle(node).getPropertyValue('--primary-500').trim())).toBe('#112233')
    await expect.poll(() => preview.locator('html').evaluate(() => (window as unknown as { paletteTestCapture: { accepted: number } }).paletteTestCapture.accepted)).toBe(1)
  })
}
