import { expect, test } from '@playwright/test'

const url = (variant: string, extra = '') => `/?guidelines-prototype=1&variant=${variant}${extra}`

test.describe('editor guideline prototypes', () => {
  test('switches variants and preserves URL history', async ({ page }) => {
    await page.goto(url('actions'))
    await expect(page.getByRole('heading', { name: 'Action hierarchy' })).toBeVisible()
    await page.getByRole('button', { name: 'Next prototype' }).click()
    await expect(page).toHaveURL(/variant=navigation/)
    await page.goBack()
    await expect(page).toHaveURL(/variant=actions/)
  })

  test('actions undo redo and export dialog are keyboard accessible', async ({ page }) => {
    await page.goto(url('actions'))
    const name = page.getByRole('textbox', { name: 'Theme name' })
    const undo = page.getByRole('button', { name: 'Undo' })
    const redo = page.getByRole('button', { name: 'Redo' })
    await expect(undo).toBeDisabled(); await expect(redo).toBeDisabled()
    await name.fill('Draft name'); await expect(undo).toBeEnabled(); await undo.click()
    await expect(name).toHaveValue('Northstar admin'); await expect(redo).toBeEnabled(); await redo.click()
    await expect(name).toHaveValue('Draft name')
    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByRole('dialog', { name: 'Export handoff' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export JSON mock' })).toBeFocused()
    await page.getByRole('button', { name: 'Close export handoff' }).click()
    await expect(page.getByRole('button', { name: 'Export' })).toBeFocused()
    await page.getByRole('button', { name: 'Export' }).click(); await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Export handoff' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Export' })).toBeFocused()
  })

  test('navigation searches, reloads, and retains editable samples', async ({ page }) => {
    await page.goto(url('navigation'))
    await page.getByRole('searchbox', { name: 'Find settings' }).fill('no such setting')
    await expect(page.getByText('No matching settings')).toBeVisible(); await expect(page).toHaveURL(/q=no\+such\+setting/)
    await page.reload(); await expect(page.getByText('No matching settings')).toBeVisible()
    await page.getByRole('button', { name: 'Clear search' }).click(); await expect(page.getByText('Body font')).toBeVisible()
    const font = page.getByRole('textbox', { name: 'Body font' }); await font.fill('System UI')
    await page.getByRole('button', { name: 'Colors' }).click(); await page.getByRole('button', { name: 'Typography' }).click()
    await expect(font).toHaveValue('System UI'); await page.goBack(); await expect(page).toHaveURL(/group=Colors/); await page.goForward(); await expect(page).toHaveURL(/group=Typography/)
  })

  test('committed search sessions restore previous query on back and forward', async ({ page }) => {
    await page.goto(url('navigation', '&q=font&group=Typography'))
    const search = page.getByRole('searchbox', { name: 'Find settings' })
    await search.fill('heading'); await page.keyboard.press('Enter'); await search.blur()
    await expect(page).toHaveURL(/q=heading/); await expect(page.getByText('Heading scale')).toBeVisible()
    await page.goBack(); await expect(page).toHaveURL(/q=font/); await expect(page.getByText('Body font')).toBeVisible()
    await page.goForward(); await expect(page).toHaveURL(/q=heading/); await expect(page.getByText('Heading scale')).toBeVisible()
  })

  test('tokens validate drafts and preserve the last valid preview', async ({ page }) => {
    await page.goto(url('tokens')); const input = page.getByRole('textbox', { name: 'Page Surface' })
    await input.fill('#bad'); await expect(page.getByText('Enter a six-digit hex color')).toBeVisible(); await expect(input).toHaveAttribute('aria-invalid', 'true')
    await input.fill('#112233'); await expect(page.getByTestId('token-preview')).toHaveCSS('background-color', 'rgb(17, 34, 51)')
    await input.fill('invalid draft'); await expect(page.getByText('Choose the supported inherited token')).toBeVisible(); await expect(page.getByText('Override')).toBeVisible(); await expect(page.getByTestId('token-preview')).toHaveCSS('background-color', 'rgb(17, 34, 51)')
    await input.fill('var(--gray-50)'); await expect(page.locator('.gp-badge')).toHaveText('Inherited'); await expect(page.getByTestId('token-preview')).toHaveCSS('background-color', 'rgb(249, 250, 251)')
    await page.getByRole('button', { name: 'Reset to inherited' }).click(); await expect(input).toHaveValue('var(--gray-50)')
    await input.fill('var(--unknown-token)'); await expect(page.getByText('Choose the supported inherited token')).toBeVisible(); await expect(page.getByTestId('token-preview')).toHaveCSS('background-color', 'rgb(249, 250, 251)')
  })

  test('keyboard wayfinding changes active sections and isolates inputs', async ({ page }) => {
    await page.goto(url('keyboard')); await page.getByRole('link', { name: 'Skip to editor' }).click()
    await expect(page.getByRole('heading', { name: 'Editor canvas' })).toBeFocused(); const input = page.getByRole('textbox', { name: 'Theme name' }); await input.focus(); await page.keyboard.press('ArrowRight'); await expect(page).toHaveURL(/variant=keyboard/)
    await page.getByRole('link', { name: 'Components' }).click(); await expect(page.getByRole('link', { name: 'Components' })).toHaveAttribute('aria-current', 'page'); await expect(page.getByRole('link', { name: 'Foundations' })).not.toHaveAttribute('aria-current', 'page'); await expect(page.locator('#gp-preview')).toBeFocused(); await page.keyboard.press('ArrowRight'); await expect(page).toHaveURL(/variant=mobile/)
  })
})
