import { expect, test } from '@playwright/test'

function contrast(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
      const channel = value / 255
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
  }
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0]! + 0.05) / (values[1]! + 0.05)
}

test('color control boundaries have at least 3:1 contrast against their backgrounds', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires Compose')
  await page.goto(process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175')
  const trigger = page.getByRole('button', { name: 'Choose Primary color from Tailwind palette', exact: true })
  for (const control of [page.getByLabel('Primary color', { exact: true }), page.locator('#toolbar-primary-color'), trigger]) {
    const colors = await control.evaluate(node => {
      const style = getComputedStyle(node)
      return { border: style.borderTopColor, background: style.backgroundColor }
    })
    expect(contrast(colors.border, colors.background)).toBeGreaterThanOrEqual(3)
  }
  await trigger.click()
  const search = page.getByRole('searchbox', { name: 'Search Tailwind colors' })
  const colors = await search.evaluate(node => {
    const style = getComputedStyle(node)
    return { border: style.borderTopColor, background: style.backgroundColor }
  })
  expect(contrast(colors.border, colors.background)).toBeGreaterThanOrEqual(3)
})
