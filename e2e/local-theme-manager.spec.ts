import { expect, test } from '@playwright/test'

test.describe('FTB-021 local theme manager', () => {
  test('opens accessibly, restores focus on Escape, and renames a theme', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', { name: 'Manage themes' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Manage themes' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create theme' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await page.getByRole('button', { name: 'Rename Untitled' }).click()
    const name = page.getByRole('textbox', { name: 'Rename theme name' })
    await name.fill('Playwright Theme')
    await page.getByRole('button', { name: 'Save theme name' }).click()

    await expect(page.getByLabel('Active theme')).toHaveText('Playwright Theme')
    await expect(page.getByRole('dialog', { name: 'Manage themes' })).toBeVisible()
  })
})
