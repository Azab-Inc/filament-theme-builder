import { expect, test } from '@playwright/test'

test('keeps toolbar actions grouped behind clear menus', async ({ page }) => {
  await page.goto('/')
  const toolbar = page.locator('[data-editor-header-controls]').first()

  await expect(toolbar.getByRole('button', { name: 'Save theme' })).toBeVisible()
  await expect(toolbar.locator('[data-toolbar-menu]')).toHaveCount(2)

  await toolbar.locator('[data-toolbar-menu]').first().locator('summary').click()
  await expect(toolbar.getByRole('button', { name: 'Export theme JSON' })).toBeVisible()

  await toolbar.locator('[data-toolbar-menu]').nth(1).locator('summary').click()
  await expect(toolbar.getByRole('button', { name: 'Inspector' })).toBeVisible()
})

test('keeps the export menu visible on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 })
  await page.goto('/')
  const toolbar = page.locator('[data-editor-header-controls]').first()
  await toolbar.locator('[data-toolbar-menu]').first().locator('summary').click()
  const exportButton = toolbar.getByRole('button', { name: 'Export theme JSON' })
  const box = await exportButton.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x + box!.width).toBeLessThanOrEqual(420)
  expect(box!.y + box!.height).toBeLessThanOrEqual(800)
})
