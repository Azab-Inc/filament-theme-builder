import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

test('shows a substantial high-contrast divider grip without hover or focus', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.mouse.move(0, 0)
  const divider = page.getByRole('separator', { name: 'Resize editor and preview' })
  for (const width of [1280, 900, 640]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(divider).toBeVisible()
    const grip = divider.locator('span')
    const box = await grip.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(4)
    expect(box!.height).toBeGreaterThanOrEqual(32)
    const contrast = await grip.evaluate((element) => {
      const luminance = (color: string) => {
        const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((n) => {
          const value = n / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
      }
      const foreground = getComputedStyle(element).backgroundColor
      if (foreground === 'rgba(0, 0, 0, 0)') return 1
      const a = luminance(foreground)
      const b = luminance(getComputedStyle(element.parentElement!).backgroundColor)
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    })
    expect(contrast).toBeGreaterThanOrEqual(3)
  }
})
