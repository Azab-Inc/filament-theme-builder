import { expect, test, type Page } from '@playwright/test'

const iframeSelector = 'iframe[title="Filament preview"]'

async function openEditor(page: Page) {
  await page.goto('/')
  await expect(page.frameLocator(iframeSelector).getByRole('heading', { name: /dashboard/i })).toBeVisible()
}

async function assertVisibleControlsFitDock(page: Page) {
  const result = await page.evaluate(() => {
    const dock = document.querySelector<HTMLElement>('[data-editor-panel]')!.getBoundingClientRect()
    const clipping = [...document.querySelectorAll<HTMLElement>('[data-editor-content],[data-editor-section],[data-padding-target],fieldset')].filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.className || el.getAttribute('data-padding-target') || el.tagName)
    const visible = [...document.querySelectorAll<HTMLElement>('[data-editor-panel] input,[data-editor-panel] select,[data-editor-panel] button,[data-editor-panel] textarea')].filter((el) => {
      const rect = el.getBoundingClientRect(); return rect.width > 0 && rect.height > 0
    })
    const clipped = visible.filter((el) => {
      const rect = el.getBoundingClientRect(); let node = el.parentElement
      if (rect.left < dock.left - 1 || rect.right > dock.right + 1) return true
      while (node && node !== document.body) {
        const style = getComputedStyle(node); const box = node.getBoundingClientRect()
        if (['hidden', 'auto', 'scroll'].includes(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) return true
        node = node.parentElement
      }
      return false
    }).map(el => el.getAttribute('aria-label') || el.textContent?.trim())
    return { clipping, clipped }
  })
  expect(result).toEqual({ clipping: [], clipped: [] })
}

test.describe('dashboard-first production layout', () => {
  test('keeps the full editor and dominant live dashboard on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await openEditor(page)
    const frame = await page.locator(iframeSelector).boundingBox()
    expect(frame?.width ?? 0).toBeGreaterThanOrEqual(900)
    expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth, y: document.documentElement.scrollHeight }))).toEqual({ x: 1440, y: 1000 })
    await expect(page.getByRole('button', { name: 'Export theme JSON' })).toBeVisible()
  })

  test('puts the real dashboard above the complete scrollable editor on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await openEditor(page)
    const iframe = page.locator(iframeSelector); const frame = await iframe.boundingBox(); const editor = await page.locator('[data-editor-panel]').boundingBox()
    expect(frame?.height ?? 0).toBeGreaterThanOrEqual(280); expect(frame!.y + frame!.height).toBeLessThanOrEqual(editor!.y)
    expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth, y: document.documentElement.scrollHeight }))).toEqual({ x: 390, y: 844 })
  })

  test('preserves production control inventory and live editing paths', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 }); await openEditor(page)
    for (const label of ['Export theme JSON', 'Copy vanilla CSS', 'Download vanilla CSS', 'Undo', 'Redo', 'Inspector']) await expect(page.getByRole('button', { name: label })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Sidebar' })).toBeVisible(); await expect(page.getByRole('radio', { name: 'Top' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Foundations' })).toBeVisible(); await expect(page.getByRole('tab', { name: 'Components' })).toBeVisible(); await expect(page.getByRole('tab', { name: 'Branding' })).toBeVisible(); await expect(page.getByRole('tab', { name: 'Icons' })).toBeVisible()
    await page.getByRole('tab', { name: 'Components' }).click(); await expect(page.getByText('Padding', { exact: false }).first()).toBeVisible()
  })

  test('keeps every padding editor control inside the dock after expansion and scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await openEditor(page)
    await page.getByRole('tab', { name: 'Components' }).click()
    const targets = page.locator('[data-padding-target],[data-padding-context]'); expect(await targets.count()).toBeGreaterThanOrEqual(29)
    const edit = page.getByRole('button', { name: /Edit (?:separate|linked)/ }).first(); await edit.click()
    await assertVisibleControlsFitDock(page)
    await targets.last().scrollIntoViewIfNeeded(); await expect(targets.last().getByRole('button', { name: /Reset/ })).toBeVisible()
    await assertVisibleControlsFitDock(page); await expect(page.frameLocator(iframeSelector).getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('reflows foundations, branding, and icons without clipped controls in both nav modes', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 900, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 700 }]) {
      await page.setViewportSize(viewport); await openEditor(page)
      for (const mode of ['Sidebar', 'Top navigation']) {
        await page.getByRole('radio', { name: mode }).check()
        for (const tab of ['Foundations', 'Branding', 'Icons']) {
          await page.getByRole('tab', { name: tab }).click()
          if (tab === 'Foundations') await page.locator('.palette-accordion__header').first().click()
          await assertVisibleControlsFitDock(page)
        }
      }
      expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }))).toEqual(viewport)
    }
  })
})
