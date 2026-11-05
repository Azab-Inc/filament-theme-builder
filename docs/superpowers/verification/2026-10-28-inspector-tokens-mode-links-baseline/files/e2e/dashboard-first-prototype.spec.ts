import { expect, test, type Page } from '@playwright/test'

const route = '/?dashboard-prototype=1'
const iframeSelector = 'iframe[title="Filament preview"]'

async function loadedDashboard(page: Page) {
  await page.goto(route)
  const iframe = page.locator(iframeSelector)
  await expect(page.frameLocator(iframeSelector).getByRole('heading', { name: /dashboard/i })).toBeVisible()
  return iframe
}

test.describe('dashboard-first prototype', () => {
  test('keeps real dashboard visible with live feedback and canonical resets', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const iframe = await loadedDashboard(page)
    const box = await iframe.boundingBox(); expect(box?.width ?? 0).toBeGreaterThanOrEqual(800)
    await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('textbox', { name: 'Primary color' })).toHaveAttribute('name', 'primary-color')
    await expect(page.getByRole('textbox', { name: 'Primary color' })).toHaveAttribute('autocomplete', 'off')
    await page.getByRole('textbox', { name: 'Primary color' }).fill('#112233')
    await expect.poll(() => iframe.evaluate(el => el.contentWindow?.eval('getComputedStyle(document.documentElement).getPropertyValue("--primary-500")'))).toContain('#112233')
    await page.getByRole('textbox', { name: 'Primary color' }).fill('invalid')
    await expect(page.getByText('Use a six-digit hex color.')).toBeVisible(); await expect(page.getByRole('textbox', { name: 'Primary color' })).toHaveAttribute('aria-invalid', 'true')
    await expect.poll(() => iframe.evaluate(el => el.contentWindow?.eval('getComputedStyle(document.documentElement).getPropertyValue("--primary-500")'))).toContain('#112233')
    await page.getByRole('button', { name: 'Reset Primary color' }).click()
    await expect.poll(() => iframe.evaluate(el => el.contentWindow?.eval('getComputedStyle(document.documentElement).getPropertyValue("--primary-500")'))).not.toContain('#112233')
    await page.getByRole('button', { name: 'Surfaces' }).click(); const surface = page.getByRole('textbox', { name: 'Page surface' }); await expect(surface).toHaveAttribute('name', 'page-surface'); await expect(surface).toHaveAttribute('spellcheck', 'false'); await page.getByRole('textbox', { name: 'Page surface' }).fill('#eeeeee')
    await expect.poll(() => iframe.evaluate(el => el.contentWindow?.eval('document.getElementById("ftb-managed-theme")?.textContent'))).toContain('#eeeeee')
    await page.getByRole('button', { name: 'Reset Page surface' }).click()
  })

  test('keeps iframe identity and styles isolated through dock/export interactions', async ({ page }) => {
    const iframe = await loadedDashboard(page)
    const identity = await iframe.evaluate(el => ({ src: (el as HTMLIFrameElement).src, marker: !!el.contentWindow?.document.querySelector('#ftb-preview-bridge') }))
    await page.evaluate(() => { const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!; const frame = iframe.contentWindow!; frame.eval('window.__dashboardRepairMarker = "dashboard-first-marker"; const node = document.createElement("meta"); node.id = "dashboard-first-marker-node"; document.head.appendChild(node)'); (window as Window & { dashboardFrame?: Window }).dashboardFrame = frame })
    await page.getByRole('searchbox', { name: 'Find foundation settings' }).fill('no matching setting')
    await expect(page.getByText('No matching foundation settings')).toBeVisible(); await page.getByRole('button', { name: 'Clear search' }).click()
    await page.getByRole('button', { name: 'Export draft JSON' }).click(); await expect(page.getByText('Browser-only JSON')).toBeVisible()
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download draft JSON' }).click(); await expect(await download).toBeTruthy()
    const state = await iframe.evaluate(el => ({ src: (el as HTMLIFrameElement).src, marker: !!el.contentWindow?.document.querySelector('#ftb-preview-bridge'), pointer: getComputedStyle(el).pointerEvents }))
    expect(state.src).toBe(identity.src); expect(state.marker).toBe(identity.marker); expect(state.pointer).toBe('auto')
    expect(await page.evaluate(() => { const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!; const frame = iframe.contentWindow!; return frame === (window as Window & { dashboardFrame?: Window }).dashboardFrame && frame.eval('window.__dashboardRepairMarker') === 'dashboard-first-marker' && !!frame.document.querySelector('#dashboard-first-marker-node') })).toBe(true)
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ftb-theme')))).toEqual([])
  })

  test('supports desktop and short mobile bounded layouts without overlays', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 }); await loadedDashboard(page)
    expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth, y: document.documentElement.scrollHeight }))).toEqual({ x: 900, y: 900 })
    for (const height of [844, 700]) {
      await page.setViewportSize({ width: 390, height }); const iframe = await loadedDashboard(page); const box = await iframe.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(280); await page.getByRole('button', { name: 'Export draft JSON' }).click()
      const dock = await page.locator('.db-dock').boundingBox(); const openBox = await iframe.boundingBox()
      expect(openBox!.y + openBox!.height).toBeLessThanOrEqual(dock!.y); expect(dock!.y).toBeLessThan(height); expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth, y: document.documentElement.scrollHeight }))).toEqual({ x: 390, y: height })
      const center = { x: openBox!.x + openBox!.width / 2, y: openBox!.y + openBox!.height / 2 }
      expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.matches('iframe[title="Filament preview"]'), center)).toBe(true)
    }
    await page.getByRole('button', { name: 'Layout' }).click(); await page.getByRole('combobox', { name: 'Density' }).selectOption('compact'); await page.getByRole('button', { name: 'Reset Density' }).click(); await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('default'); await page.getByRole('button', { name: 'Reset Radius' }).click()
    await expect(page.getByRole('region', { name: 'Live Filament dashboard preview' })).toBeVisible()
  })
})
