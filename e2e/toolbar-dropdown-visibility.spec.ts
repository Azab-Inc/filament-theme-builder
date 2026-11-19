import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/live.js**', (route) => route.abort())
})

const scenarios = ['Light', 'Dark'].flatMap((mode) =>
  [1920, 1280, 768, 640, 420].map((width) => ({ mode, width })),
)

for (const { mode, width } of scenarios) {
  test(`toolbar dropdowns escape the toolbar without scrolling at ${width}px in ${mode} mode`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await page.getByRole('button', { name: `${mode} mode` }).click()
    const toolbar = page.locator('[data-editor-header-controls]')
    const initialScroll = await toolbar.evaluate((element) => element.scrollTop)

    for (const anchor of ['tools', 'exports']) {
      const trigger = page.locator(`[data-tour="${anchor}"]`)
      await trigger.click()
      const panel = trigger.locator('..').locator('.toolbar-menu__panel')
      await expect(panel).toBeVisible()
      const visibility = await panel.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const samples = [box.top + 4, box.bottom - 4].map((y) =>
          element.contains(document.elementFromPoint(box.x + box.width / 2, y)),
        )
        return { left: box.left, right: box.right, bottom: box.bottom, samples }
      })
      expect(visibility.left).toBeGreaterThanOrEqual(0)
      expect(visibility.right).toBeLessThanOrEqual(width)
      expect(visibility.bottom).toBeLessThanOrEqual(800)
      expect(visibility.samples, 'the full dropdown must receive pointer input, not be clipped').toEqual([true, true])
      expect(await toolbar.evaluate((element) => element.scrollTop)).toBe(initialScroll)
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
      await expect(panel).toBeHidden()
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.locator('[data-tour="tools"]').click()
    await page.getByRole('button', { name: 'Take a tour' }).click()
    await expect(page.locator('.driver-popover:visible')).toContainText('Step 1 of 7')
    await page.getByRole('button', { name: 'Skip tour' }).click()
  })
}
