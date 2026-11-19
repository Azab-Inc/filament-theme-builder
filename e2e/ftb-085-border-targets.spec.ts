import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { resetBuilderStorage } from './support/reset-builder-storage'

test.skip(process.env.COMPOSE_E2E !== '1', 'FTB-085 requires the Compose gateway.')

for (const [target, selector] of [['form.product-name', '.fi-input-wrp'], ['surface.section', '.fi-section'], ['surface.card', '.fi-ta-ctn']] as const) {
  test(`verified ${target} target projects a physical bottom edge`, async ({ page }) => {
    await page.goto(builderBaseUrl)
    await page.evaluate(resetBuilderStorage)
    await page.reload()
    const border = page.getByRole('group', { name: 'Border', exact: true })
    await border.getByLabel('Border target').selectOption(target)
    await border.getByRole('button', { name: 'bottom', exact: true }).click()
    await border.getByLabel('Border width').fill('2')
    await border.getByLabel('Border width').press('Tab')
    await expect.poll(() => page.evaluate((targetSelector) => {
      const element = (document.querySelector('iframe') as HTMLIFrameElement).contentDocument?.querySelector(targetSelector)
      if (!element) return null
      const style = getComputedStyle(element)
      return { bottom: style.borderBottomWidth, ring: style.getPropertyValue('--tw-ring-shadow') }
    }, selector)).toMatchObject({ bottom: '2px', ring: '0 0 #0000' })
  })
}

test('verified table separator preserves physical sibling edges', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  const border = page.getByRole('group', { name: 'Border', exact: true })
  await border.getByLabel('Border target').selectOption('table.header')
  await border.getByRole('button', { name: 'bottom', exact: true }).click()
  await border.getByLabel('Border width').fill('2')
  await border.getByLabel('Border width').press('Tab')
  await expect.poll(() => page.evaluate(() => {
    const element = (document.querySelector('iframe') as HTMLIFrameElement).contentDocument?.querySelector('.fi-ta-header')
    if (!element) return null
    const style = getComputedStyle(element)
    return { top: style.borderTopWidth, bottom: style.borderBottomWidth, left: style.borderLeftWidth }
  })).toEqual({ top: '0px', bottom: '2px', left: '0px' })
})
