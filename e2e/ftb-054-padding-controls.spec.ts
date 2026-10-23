import { expect, test } from '@playwright/test'

test('edits hierarchical padding with keyboard access and reset', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Components' }).click()
  const panel = page.getByRole('region', { name: 'Hierarchical padding controls' })
  await expect(panel).toBeVisible()
  const row = panel.locator('[data-padding-target="forms.input"]')
  await expect(row).toContainText('forms.input')
  await row.getByRole('button', { name: /Edit separate/ }).focus()
  await page.keyboard.press('Enter')
  await row.getByLabel('top padding').fill('8px')
  await row.getByLabel('top padding').press('Tab')
  await expect(row).toContainText('8px')
  await row.getByRole('button', { name: 'Reset forms.input padding' }).click()
  await expect(row).toContainText('Native fallback')
})
