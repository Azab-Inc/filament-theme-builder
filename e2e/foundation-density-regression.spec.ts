import { expect, test } from '@playwright/test'

test('density dropdown replaces duplicate preset buttons and updates spacing immediately', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Foundations' }).click()
  await expect(page.getByRole('group', { name: 'Density presets' })).toHaveCount(0)

  await page.locator('#density').selectOption('spacious')
  await expect(page.locator('#density')).toHaveValue('spacious')
  await expect(page.locator('#spacing-2')).toHaveValue('12')
  await expect(page.locator('#spacing-4')).toHaveValue('24')

  await page.locator('#density').selectOption('compact')
  await expect(page.locator('#density')).toHaveValue('compact')
  await expect(page.locator('#spacing-2')).toHaveValue('6')
  await expect(page.locator('#spacing-4')).toHaveValue('12')

  await page.locator('#density').selectOption('default')
  await expect(page.locator('#density')).toHaveValue('default')
  await expect(page.locator('#spacing-2')).toHaveValue('8')
  await expect(page.locator('#spacing-4')).toHaveValue('16')

  await page.locator('#density').selectOption('spacious')
  await page.getByRole('button', { name: 'Reset density' }).click()
  await expect(page.locator('#density')).toHaveValue('default')
  await expect(page.locator('#spacing-2')).toHaveValue('8')
  await expect(page.locator('#spacing-4')).toHaveValue('16')
})
