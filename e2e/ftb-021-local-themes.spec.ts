import { expect, test, type Page } from '@playwright/test'

async function openManager(page: Page) {
  await page.getByRole('button', { name: 'Manage themes' }).click()
  const dialog = page.getByRole('dialog', { name: 'Manage themes' })
  await expect(dialog).toBeVisible()
  return dialog
}

async function renameTheme(page: Page, currentName: string, nextName: string) {
  await page.getByRole('button', { name: `Rename ${currentName}` }).click()
  await page.getByRole('textbox', { name: 'Rename theme name' }).fill(nextName)
  await page.getByRole('button', { name: 'Save theme name' }).click()
}

async function saveDensity(page: Page, density: 'compact' | 'default' | 'spacious') {
  await page.getByRole('combobox', { name: 'Density' }).selectOption(density)
  await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue(density)
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
  await page.waitForTimeout(500)
}

test.describe('FTB-021 local themes', () => {
  test('creates, opens, renames, duplicates, and deletes with active fallback', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByLabel('Active theme')).toHaveText('Untitled')
    await openManager(page)
    await renameTheme(page, 'Untitled', 'Theme A')
    await page.keyboard.press('Escape')
    await openManager(page)
    await page.getByRole('button', { name: 'Create theme' }).click()
    await renameTheme(page, 'Untitled', 'Theme B')
    await page.getByRole('button', { name: 'Open Theme A' }).click()
    await expect(page.getByLabel('Active theme')).toHaveText('Theme A')
    await expect(page.getByRole('listitem').filter({ hasText: 'Theme A' })).toHaveAttribute('aria-current', 'true')

    await page.getByRole('button', { name: 'Duplicate Theme A' }).click()
    await expect(page.getByLabel('Active theme')).toHaveText('Theme A copy')
    await expect(page.getByRole('listitem').filter({ hasText: 'Theme A copy' })).toHaveAttribute('aria-current', 'true')

    await page.getByRole('button', { name: 'Delete Theme A copy' }).click()
    const confirmation = page.getByRole('alertdialog', { name: 'Delete Theme A copy?' })
    await expect(confirmation).toBeVisible()
    await confirmation.getByRole('button', { name: 'Confirm delete Theme A copy' }).click()
    await expect(confirmation).toBeHidden()

    await expect(page.getByLabel('Active theme')).toHaveText('Theme B')
    await expect(page.getByRole('button', { name: 'Open Theme A copy' })).toHaveCount(0)
    await expect(page.getByRole('listitem').filter({ hasText: 'Theme B' })).toHaveAttribute('aria-current', 'true')
  })

  test('persists edits after the debounce and restores theme-specific history after reload', async ({ page }) => {
    await page.goto('/')
    await openManager(page)
    await renameTheme(page, 'Untitled', 'Theme A')
    await page.keyboard.press('Escape')
    await saveDensity(page, 'compact')

    await openManager(page)
    await page.getByRole('button', { name: 'Create theme' }).click()
    await renameTheme(page, 'Untitled', 'Theme B')
    await page.keyboard.press('Escape')
    await saveDensity(page, 'spacious')

    await openManager(page)
    await page.getByRole('button', { name: 'Open Theme A' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('compact')
    await saveDensity(page, 'default')
    await page.reload()

    await expect(page.getByLabel('Active theme')).toHaveText('Theme A')
    await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('default')
    await openManager(page)
    await page.getByRole('button', { name: 'Open Theme A' }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('compact')
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('default')

    await openManager(page)
    await page.getByRole('button', { name: 'Open Theme B' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('spacious')
  })

  test('contains focus, closes on Escape, restores the opener, and cancels delete confirmation', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Manage themes' })
    const dialog = await openManager(page)
    await expect(page.getByRole('button', { name: 'Create theme' })).toBeFocused()

    for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab')
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    await openManager(page)
    await page.getByRole('button', { name: 'Delete Untitled' }).click()
    const confirmation = page.getByRole('alertdialog', { name: 'Delete Untitled?' })
    await expect(confirmation).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm delete Untitled' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(confirmation).toBeHidden()
    await expect(page.getByRole('button', { name: 'Delete Untitled' })).toBeVisible()
  })

  test('reports a storage failure without blocking further editor edits', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const prototype = Object.getPrototypeOf(window.localStorage) as Storage
      const originalSetItem = prototype.setItem
      Object.defineProperty(prototype, 'setItem', {
        configurable: true,
        value(this: Storage, key: string, value: string) {
          if (key.startsWith('ftb-theme')) throw new Error('Injected localStorage failure')
          originalSetItem.call(this, key, value)
        },
      })
    })

    await saveDensity(page, 'compact')
    await expect(page.getByRole('status').filter({ hasText: 'Injected localStorage failure' })).toBeVisible()

    await page.getByRole('combobox', { name: 'Density' }).selectOption('spacious')
    await expect(page.getByRole('combobox', { name: 'Density' })).toHaveValue('spacious')
  })
})
