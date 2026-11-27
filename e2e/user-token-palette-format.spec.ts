import { expect, test } from '@playwright/test'
import { authenticate, baseUrl } from './color-picker-acceptance.helpers'
import { resetBuilderStorage } from './support/reset-builder-storage'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

test('custom palettes use the built-in palette header and shade editor format', async ({ page }) => {
  await authenticate(page)
  await page.evaluate(resetBuilderStorage)
  await page.goto(baseUrl)
  await page.locator('[data-user-token-name]').fill('secondary')
  await page.locator('[data-user-token-kind]').selectOption('palette')
  await page.locator('[data-user-token-value]').fill('#64748b')
  await page.locator('[data-user-token-create]').click()
  const tokens = page.locator('[data-user-color-tokens]')
  const header = tokens.locator('.palette-accordion__header').filter({ hasText: 'secondary' })
  await expect(header).toBeVisible()
  await expect(header.locator('.palette-accordion__marker')).toBeVisible()
  await expect(header.locator('.palette-accordion__ramp > span')).toHaveCount(11)
  await header.click()
  await expect(tokens.locator('.palette-accordion__shade')).toHaveCount(11)
  await expect(page.getByLabel('Named palette secondary seed', { exact: true })).toHaveValue('#64748b')
  await page.getByLabel('secondary shade 500', { exact: true }).fill('#123456')
  await expect(page.getByLabel('secondary shade 500', { exact: true })).toHaveValue('#123456')
})
