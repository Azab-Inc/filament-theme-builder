import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

for (const width of [1280, 420]) {
  test(`palette ramps align and remain editable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(builderBaseUrl)
    const ramps = page.locator('.palette-accordion__ramp:visible')
    await expect(ramps).toHaveCount(6)
    const bounds = await ramps.evaluateAll((elements) => elements.map((element) => {
      const { x, width } = element.getBoundingClientRect()
      return { x, width }
    }))
    for (const ramp of bounds) {
      expect(Math.abs(ramp.width - bounds[0]!.width)).toBeLessThan(1)
      expect(Math.abs(ramp.x - bounds[0]!.x)).toBeLessThan(1)
      expect(ramp.width).toBeGreaterThan(0)
    }
    await page.locator('[data-palette-header="primary"]:visible').click()
    await expect(page.locator('[data-palette-panel="primary"]:visible')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset primary palette base', exact: true })).toBeVisible()
    await page.locator('[data-palette-header="primary"]:visible').click()
    await expect(page.locator('[data-palette-panel="primary"]:visible')).toHaveCount(0)
  })
}
