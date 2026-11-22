import { expect, test } from '@playwright/test'

for (const layout of ['Sidebar', 'Top navigation']) {
  test(`navigation tour highlights section tabs rather than layout controls in ${layout}`, async ({ page }) => {
    await page.route('**/live.js**', (route) => route.abort())
    await page.goto('/')
    await page.getByRole('radio', { name: layout, exact: true }).check()
    await page.locator('[data-tour="tools"]').click()
    await page.getByRole('button', { name: 'Take a tour' }).click()
    const popover = page.locator('.driver-popover:visible')
    await popover.getByRole('button', { name: 'Next' }).click()
    await expect(popover).toContainText('Find your way around')

    const highlighted = page.locator('[data-tour="editor-navigation"].driver-active-element')
    await expect(highlighted).toHaveAttribute('role', 'tablist')
    await expect(highlighted).toHaveAttribute('data-tour', 'editor-navigation')
    await expect(highlighted.getByRole('tab', { name: 'Foundations', exact: true })).toBeVisible()
    await expect(highlighted.getByRole('tab', { name: 'Components', exact: true })).toBeVisible()
    await expect(highlighted.getByRole('tab', { name: 'Branding', exact: true })).toBeVisible()
    await expect(highlighted.getByRole('tab', { name: 'Icons', exact: true })).toBeVisible()
    await expect(highlighted.getByRole('radio')).toHaveCount(0)
    await popover.getByRole('button', { name: 'Skip tour' }).click()
  })
}
