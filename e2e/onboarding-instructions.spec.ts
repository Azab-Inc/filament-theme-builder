import { expect, test } from '@playwright/test'

for (const layout of ['Sidebar', 'Top navigation']) {
  for (const width of [1280, 420]) {
    test(`locates Inspector before preview guidance and explains local storage in ${layout} at ${width}px`, async ({ page }) => {
      await page.route('**/live.js**', (route) => route.abort())
      await page.setViewportSize({ width, height: 800 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.getByRole('radio', { name: layout, exact: true }).check()
      const inspector = page.getByRole('button', { name: 'Inspector', exact: true })
      const initialInspectorState = await inspector.getAttribute('aria-pressed')
      await page.locator('[data-tour="tools"]').click()
      await page.getByRole('button', { name: 'Take a tour' }).click()
      const popover = page.locator('.driver-popover:visible')
      for (let step = 1; step < 4; step += 1) await popover.getByRole('button', { name: 'Next' }).click()

      await expect(popover).toContainText('Step 4 of 7')
      await expect(popover.locator('.driver-popover-title')).toHaveText('Find the Inspector')
      await expect(popover).toContainText('top toolbar')
      await expect(inspector).toHaveClass(/driver-active-element/)
      await expect(inspector).toBeInViewport()
      await expect(inspector).toHaveAttribute('aria-pressed', initialInspectorState ?? 'false')

      await popover.getByRole('button', { name: 'Next' }).click()
      await expect(popover).toContainText('Step 5 of 7')
      await expect(popover.locator('.driver-popover-title')).toHaveText('See the live preview')
      await popover.getByRole('button', { name: 'Next' }).click()
      await popover.getByRole('button', { name: 'Next' }).click()
      await expect(popover).toContainText('Step 7 of 7')
      await expect(popover).toContainText('Your theme changes are saved in this browser’s local storage.')
      await expect(popover).toContainText('Export your theme to keep a copy outside this browser.')
      await expect(popover).toContainText('A Composer package for using themes in your project is coming soon.')
      await expect(inspector).toHaveAttribute('aria-pressed', initialInspectorState ?? 'false')
      await popover.getByRole('button', { name: 'Done' }).click()
    })
  }
}
