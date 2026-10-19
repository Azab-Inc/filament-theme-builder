import { expect, test } from '@playwright/test'

test.describe('FTB-021 local theme manager', () => {
  test('saves the active theme and creates a selected theme with default Filament styles', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Primary color').fill('#0f766e')

    await page.getByRole('button', { name: 'Manage themes' }).click()
    const dialog = page.getByRole('dialog', { name: 'Manage themes' })
    const themes = dialog.getByRole('list', { name: 'Local themes' }).getByRole('listitem')
    await expect(themes).toHaveCount(1)
    await page.getByRole('button', { name: 'Save theme' }).click()
    await expect(themes).toHaveCount(1)

    await page.getByRole('button', { name: 'Create theme' }).click()
    await expect(themes).toHaveCount(2)
    await expect(themes.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(page.getByLabel('Primary color')).toHaveValue('#6366f1')

    await themes.nth(0).getByRole('button', { name: 'Open Untitled' }).click()
    await expect(page.getByLabel('Active theme')).toHaveText('Untitled')
    await expect(page.getByLabel('Primary color')).toHaveValue('#0f766e')
  })

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
