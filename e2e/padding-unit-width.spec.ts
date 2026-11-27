import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

for (const width of [1280, 420]) {
  test(`padding units remain readable and editable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(builderBaseUrl)
    await page.getByRole('tab', { name: 'Components', exact: true }).click()
    const row = page.locator('[data-padding-context="forms.select-component"]')
    const unit = row.getByRole('combobox', { name: 'forms.select · Component linked padding unit', exact: true })
    await expect(unit).toBeVisible()
    const dimensions = await unit.evaluate((element) => {
      const style = getComputedStyle(element)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      context.font = style.font
      const longest = Math.max(...Array.from((element as HTMLSelectElement).options, (option) => context.measureText(option.text).width))
      return { available: element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), required: longest + 24 }
    })
    expect(dimensions.available).toBeGreaterThanOrEqual(dimensions.required)
    for (const value of ['px', 'rem', 'vmin', 'vmax']) {
      await unit.selectOption(value)
      await expect(unit).toHaveValue(value)
    }
    await row.getByRole('spinbutton', { name: 'forms.select · Component linked padding', exact: true }).fill('2')
    await expect(row).toContainText('2vmax')
    const bounds = await unit.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
  })
}
