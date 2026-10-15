import { expect, test } from '@playwright/test'

import { builderBaseUrl, previewUrl } from './urls'

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'intermediate', width: 900, height: 900 },
  { name: 'narrow', width: 640, height: 900 },
] as const

test.describe('FTB-050 promoted editor navigation', () => {
  for (const viewport of viewports) {
    test(`keeps the editor panel and live demo usable at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(builderBaseUrl)

      const iframe = page.getByTitle('Filament preview')
      const initialFrame = await iframe.boundingBox()
      expect(initialFrame).not.toBeNull()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      await expect(page.getByRole('radio', { name: 'Sidebar' })).toBeChecked()
      await expect(page.locator('[data-editor-nav-rail]')).toBeVisible()

      const panel = await page.locator('[data-editor-panel]').boundingBox()
      const frame = await iframe.boundingBox()
      expect(panel).not.toBeNull()
      expect(frame).not.toBeNull()
      expect(frame!.x).toBeGreaterThanOrEqual(panel!.x + panel!.width - 1)
      expect(frame!.width).toBeGreaterThan(0)

      await page.getByRole('radio', { name: 'Top navigation' }).check()
      await expect(page.locator('[data-editor-tabs]')).toBeVisible()
      await expect(page.locator('[data-editor-nav-rail]')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)

      await page.getByLabel('Primary color').fill('#0f766e')
      await expect.poll(() => page.frameLocator('iframe[title="Filament preview"]')
        .locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--ftb-primary').trim()))
        .toBe('#0f766e')

      await page.getByRole('tab', { name: 'Components' }).click()
      await expect(page.locator('[data-editor-section="components"]')).toBeVisible()

      const src = await iframe.getAttribute('src')
      await page.getByRole('radio', { name: 'Sidebar' }).check()
      await page.getByRole('button', { name: 'Foundations' }).click()
      await expect(page.locator('[data-editor-nav-rail]')).toBeVisible()
      await expect(page.locator('[data-editor-section="foundations"]')).toBeVisible()
      await expect(iframe).toHaveAttribute('src', src!)
      const finalFrame = await iframe.boundingBox()
      expect(finalFrame).toEqual(initialFrame)
    })
  }

  test('ordinary and former prototype routes expose only production A/B navigation', async ({ page }) => {
    for (const path of ['/', '/?prototype=1&variant=A', '/?prototype=1&variant=B', '/?prototype=1&variant=C', '/?prototype=1&variant=unknown']) {
      await page.goto(`${builderBaseUrl}${path}`)
      await expect(page.getByRole('heading', { name: 'Filament Theme Builder' })).toBeVisible()
      await expect(page.locator('[data-prototype]')).toHaveCount(0)
      await expect(page.getByRole('radio', { name: 'Sidebar' })).toBeVisible()
      await expect(page.getByRole('radio', { name: 'Top navigation' })).toBeVisible()
      await expect.poll(async () => new URL(
        await page.getByTitle('Filament preview').getAttribute('src') ?? '',
        builderBaseUrl,
      ).href).toBe(previewUrl)
    }
  })
})
