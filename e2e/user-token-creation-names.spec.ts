import { expect, test } from '@playwright/test'
import { authenticate, baseUrl } from './color-picker-acceptance.helpers'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

for (const kind of ['color', 'palette'] as const) {
  test(`Create token accepts Secondary for a ${kind} and shows the normalized result`, async ({ page }) => {
    await authenticate(page)
    await page.evaluate(() => localStorage.clear())
    await page.goto(baseUrl)
    await page.setViewportSize({ width: 1200, height: 900 })
    await page.locator('[data-user-token-name]').fill('  Secondary  ')
    await page.locator('[data-user-token-kind]').selectOption(kind)
    await page.locator('[data-user-token-value]').fill('#64748b')
    await page.locator('[data-user-token-create]').click()
    await expect(page.locator('[data-user-token-error]')).toHaveCount(0)
    await expect(page.locator('[data-user-token-success]')).toHaveText('Created secondary.')
    await expect(page.locator('[data-user-token-name]')).toHaveValue('')
    if (kind === 'color') await expect(page.getByLabel('Named color secondary', { exact: true })).toHaveValue('#64748b')
    else {
      await page.locator('[data-user-color-tokens] summary').filter({ hasText: /^secondary palette/ }).click()
      await expect(page.getByLabel('Named palette secondary seed', { exact: true })).toHaveValue('#64748b')
      await expect(page.getByLabel('secondary shade 500', { exact: true })).toHaveValue('#64748b')
    }
    await page.locator('[data-user-token-name]').fill('SECONDARY')
    await page.locator('[data-user-token-create]').click()
    await expect(page.locator('[data-user-token-error]')).toHaveText('That token name already exists.')
    await expect(page.locator('[data-user-token-success]')).toHaveCount(0)
  })
}
