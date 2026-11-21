import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

for (const width of [1280, 1908]) {
  test(`gives sidebar controls readable space at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(builderBaseUrl)
    const content = page.locator('.editor-content')
    await expect(content).toBeVisible()
    expect((await content.boundingBox())!.width).toBeGreaterThanOrEqual(300)
    const overflow = await content.evaluate((element) => element.scrollWidth > element.clientWidth)
    expect(overflow).toBe(false)
    const label = page.locator('label[for="heading-font-kind"]')
    const select = page.locator('#heading-font-kind')
    const labelBox = (await label.boundingBox())!
    const selectBox = (await select.boundingBox())!
    expect(selectBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height)
    expect(selectBox.width).toBeGreaterThanOrEqual(150)
  })
}
