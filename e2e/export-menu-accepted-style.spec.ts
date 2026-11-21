import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

for (const width of [1280, 420]) {
  test(`accepted export styling survives reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(builderBaseUrl)
    for (const reload of [false, true]) {
      if (reload) await page.reload()
      await page.getByLabel('Export actions', { exact: true }).click()
      const menu = page.locator('details').filter({ has: page.getByLabel('Export actions', { exact: true }) })
      const actions = menu.getByRole('button')
      await expect(actions).toHaveCount(6)
      await expect(actions.first()).toBeVisible()
      await expect(actions.first()).toHaveCSS('padding-top', '8px')
      await expect(actions.first()).toHaveCSS('padding-left', '12px')
      await expect(actions.first()).toHaveCSS('font-weight', '500')
      await expect(actions.first()).toHaveCSS('border-top-width', '0px')
      await expect(actions.nth(1)).toHaveCSS('border-top-width', '0px')
      const bounds = await menu.locator('.toolbar-menu__panel').boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      await page.keyboard.press('Escape')
      await expect(actions.first()).toBeHidden()
    }
  })
}
