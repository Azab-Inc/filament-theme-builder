import { expect, test } from '@playwright/test'
import { demoBaseUrl } from './urls'

test('records nonmutating padding evidence from real showcase visual boxes', async ({ page }) => {
  const assertPadding = async (selector: string, values: readonly string[]) => {
    const locator = page.locator(selector).first()
    await expect(locator).toBeVisible()
    for (const [edge, value] of ['top', 'right', 'bottom', 'left'].map((edge, index) => [edge, values[index]] as const)) {
      await expect(locator).toHaveCSS(`padding-${edge}`, value)
    }
  }

  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)

  await page.goto(`${demoBaseUrl}/demo/admin/forms-showcase`)
  await assertPadding('.fi-fo-text-input .fi-input', ['6px', '12px', '6px', '12px'])
  await assertPadding('.fi-fo-textarea textarea', ['6px', '12px', '6px', '12px'])
  await assertPadding('.fi-fo-select.fi-fo-select-native .fi-select-input', ['6px', '32px', '6px', '12px'])
  await assertPadding('.fi-section', ['0px', '0px', '0px', '0px'])
  await assertPadding('.fi-section-header', ['16px', '24px', '16px', '24px'])
  await assertPadding('.fi-section-content', ['24px', '24px', '24px', '24px'])

  await page.goto(`${demoBaseUrl}/demo/admin/tables-showcase`)
  const textCell = page.locator('.fi-ta-table tbody td.fi-ta-cell:has(> .fi-ta-col > .fi-ta-text)').first()
  await assertPadding('.fi-ta', ['0px', '0px', '0px', '0px'])
  await assertPadding('.fi-ta-header', ['16px', '24px', '16px', '24px'])
  await assertPadding('.fi-ta-header-cell', ['14px', '12px', '14px', '12px'])
  await assertPadding('.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-text', ['16px', '12px', '16px', '12px'])
  await assertPadding('.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-image', ['16px', '12px', '16px', '12px'])
  await expect(textCell).toHaveCSS('padding-top', '0px')

  await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)
  const button = page.getByRole('button', { name: 'Primary action' })
  await assertPadding('.fi-btn', ['8px', '12px', '8px', '12px'])
  await assertPadding('.fi-btn.fi-color-primary', ['8px', '12px', '8px', '12px'])
  await assertPadding('.fi-btn.fi-outlined', ['6px', '10px', '6px', '10px'])
  await assertPadding('.fi-btn:disabled', ['8px', '12px', '8px', '12px'])
  await expect(button).toBeVisible()
  const before = await button.evaluate((element) => getComputedStyle(element).padding)
  await button.hover()
  await button.focus()
  expect(await button.evaluate((element) => getComputedStyle(element).padding)).toBe(before)
})
