import { expect, test } from '@playwright/test'

test.describe('editor guideline prototype responsive boundary', () => {
  test('mobile workspace retains edits without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?guidelines-prototype=1&variant=mobile')
    await page.getByRole('textbox', { name: 'Theme name' }).fill('Mobile draft'); await page.getByRole('button', { name: 'Preview workspace' }).click()
    await expect(page.getByRole('heading', { name: 'Mobile draft' })).toBeVisible(); await page.getByRole('button', { name: 'Edit workspace' }).click(); await expect(page.getByRole('textbox', { name: 'Theme name' })).toHaveValue('Mobile draft')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390); await expect(page.getByText('Prototype · Changes are not saved')).toBeVisible()
    expect(await page.evaluate(() => [...document.styleSheets].some(sheet => { try { return [...sheet.cssRules].some(rule => rule.cssText.includes('safe-area-inset-bottom')) } catch { return false } }))).toBe(true)
  })

  test('ordinary route does not mount the prototype', async ({ page }) => {
    await page.goto('/'); await expect(page.getByText('Prototype · Changes are not saved')).toHaveCount(0)
  })
})
