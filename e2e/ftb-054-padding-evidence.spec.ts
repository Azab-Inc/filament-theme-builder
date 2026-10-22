import { expect, test } from '@playwright/test'
import { demoBaseUrl } from './urls'

test('records nonmutating padding evidence from real showcase visual boxes', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)

  await page.goto(`${demoBaseUrl}/demo/admin/forms-showcase`)
  await expect(page.locator('.fi-fo-text-input .fi-input').first()).toBeVisible()
  await expect(page.locator('.fi-fo-textarea textarea').first()).toBeVisible()
  await expect(page.locator('.fi-fo-select.fi-fo-select-native .fi-select-input').first()).toBeVisible()
  await expect(page.locator('.fi-section').first()).toBeVisible()

  await page.goto(`${demoBaseUrl}/demo/admin/tables-showcase`)
  const textCell = page.locator('.fi-ta-table tbody td.fi-ta-cell:has(> .fi-ta-col > .fi-ta-text)').first()
  const imageCell = page.locator('.fi-ta-table tbody td.fi-ta-cell:has(> .fi-ta-col > .fi-ta-image)').first()
  await expect(textCell.locator('> .fi-ta-col > .fi-ta-text')).toBeVisible()
  await expect(imageCell.locator('> .fi-ta-col > .fi-ta-image')).toBeVisible()
  await expect(textCell).toHaveCSS('padding-top', '0px')
  await expect(textCell.locator('> .fi-ta-col > .fi-ta-text')).toHaveCSS('padding-top', '16px')

  await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)
  const button = page.getByRole('button', { name: 'Primary action' })
  await expect(button).toBeVisible()
  const before = await button.evaluate((element) => getComputedStyle(element).padding)
  await button.hover()
  await button.focus()
  expect(await button.evaluate((element) => getComputedStyle(element).padding)).toBe(before)
})
