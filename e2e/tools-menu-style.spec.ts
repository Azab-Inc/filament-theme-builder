import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

for (const width of [1280, 420]) {
  test(`Tools menu keeps every action and aligned rows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(builderBaseUrl)
    await page.getByLabel('Theme tools', { exact: true }).click()
    const menu = page.locator('[data-toolbar-menu][open]')
    for (const label of ['Take a tour', 'Manage themes', 'Import theme', 'Pair local client']) {
      const action = menu.getByRole('button', { name: label, exact: true })
      await expect(action).toBeVisible()
      await expect(action).toHaveCSS('padding-left', '12px')
      await expect(action).toHaveCSS('font-weight', '500')
    }
    const bounds = await menu.locator('.toolbar-menu__panel:visible').boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await menu.getByRole('button', { name: 'Manage themes', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Manage themes', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Close theme manager', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
  })
}
