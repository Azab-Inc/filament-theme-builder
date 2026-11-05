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

test('toolbar disclosures dismiss on Escape and outside pointer input and remain exclusive', async ({ page }) => {
  await page.goto('/')
  const menus = page.locator('[data-toolbar-menu]')
  const exportMenu = menus.nth(0)
  const toolsMenu = menus.nth(1)
  await exportMenu.locator('summary').click()
  await toolsMenu.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(exportMenu).not.toHaveAttribute('open', '')
  await expect(toolsMenu).toHaveAttribute('open', '')
  await page.keyboard.press('Escape')
  await expect(toolsMenu).not.toHaveAttribute('open', '')
  await expect(toolsMenu.locator('summary')).toBeFocused()

  await exportMenu.locator('summary').click()
  await page.mouse.click(8, 8)
  await expect(exportMenu).not.toHaveAttribute('open', '')
})

test('editor tabs use one tab stop and orientation-aware arrow navigation', async ({ page }) => {
  await page.goto('/')
  const tabs = page.getByRole('tablist', { name: 'Editor sections' })
  const foundations = tabs.getByRole('tab', { name: 'Foundations' })
  await expect(foundations).toHaveAttribute('tabindex', '0')
  await expect(tabs.getByRole('tab', { name: 'Components' })).toHaveAttribute('tabindex', '-1')
  await foundations.focus()
  await page.keyboard.press('ArrowDown')
  await expect(tabs.getByRole('tab', { name: 'Components' })).toBeFocused()
  await expect(tabs.getByRole('tab', { name: 'Components' })).toHaveAttribute('aria-selected', 'true')
})

test('color source tabs have a single tab stop and respond to arrow keys', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Choose Primary color from Tailwind palette' }).click()
  const tabs = page.getByRole('tablist', { name: 'Primary color color source' })
  const tailwind = tabs.getByRole('tab', { name: 'Tailwind' })
  await expect(tailwind).toHaveAttribute('tabindex', '0')
  await expect(tabs.getByRole('tab', { name: 'Custom' })).toHaveAttribute('tabindex', '-1')
  await tailwind.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(tabs.getByRole('tab', { name: 'Custom' })).toBeFocused()
  await expect(tabs.getByRole('tab', { name: 'Custom' })).toHaveAttribute('aria-selected', 'true')
})

test('editor tabs keep one matching visible panel and no horizontal overflow at desktop, 2x-width proxy, and mobile', async ({ page }) => {
  await page.goto('/')
  const expected = ['Foundations', 'Components', 'Branding', 'Icons']
  for (const width of [1280, 640, 420]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const tabs = page.getByRole('tablist', { name: 'Editor sections' })
    const vertical = await page.locator('[data-editor-nav-rail]').isVisible()
    for (let index = 0; index < expected.length; index += 1) {
      const tab = tabs.getByRole('tab', { name: expected[index] })
      if (index === 0) await tab.click()
      else await page.keyboard.press(vertical ? 'ArrowDown' : 'ArrowRight')
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      const controlledId = await tab.getAttribute('aria-controls')
      expect(controlledId).toBeTruthy()
      await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1)
      await expect(page.locator(`#${controlledId}`)).toBeVisible()
      await expect(page.locator(`#${controlledId}`)).toHaveAttribute('aria-labelledby', await tab.getAttribute('id') ?? '')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  }
})

test('Inspector evidence points to its selected visible tabpanel', async ({ page }) => {
  await page.goto('/')
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await page.getByRole('button', { name: 'Inspector' }).click()
  await frame.locator('.fi-section:visible').first().click()
  const tab = page.getByRole('tab', { name: 'Inspector' })
  await expect(tab).toBeVisible()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  const panelId = await tab.getAttribute('aria-controls')
  expect(panelId).toBeTruthy()
  await expect(page.locator(`#${panelId}`)).toHaveCount(1)
  await expect(page.locator(`#${panelId}`)).toBeVisible()
  await expect(page.locator(`#${panelId}`)).toHaveAttribute('aria-labelledby', await tab.getAttribute('id') ?? '')
  await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1)
})

test('visible editor fields are named and have an accessible label in each production section', async ({ page }) => {
  await page.goto('/')
  const labels = ['Foundations', 'Components', 'Branding', 'Icons']
  for (const label of labels) {
    await page.getByRole('tab', { name: label }).click()
    const panel = page.locator('[role="tabpanel"]:visible')
    if (label === 'Foundations') await panel.locator('[data-palette-header="primary"]').click()
    const missing = await panel.locator('input:visible, select:visible, textarea:visible').evaluateAll((fields) =>
      fields.filter((field) => {
        const control = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        return !control.name || !(control.getAttribute('aria-label') || control.labels?.length || control.getAttribute('aria-labelledby'))
      }).map((field) => ({ tag: field.tagName, id: field.id, name: (field as HTMLInputElement).name })),
    )
    expect(missing, `${label} fields missing name or accessible label`).toEqual([])
  }
})

test('color popover search and invalid custom value keep field labels and error association', async ({ page }) => {
  await page.goto('/')
  const foundations = page.locator('#editor-panel-foundations')
  await foundations.locator('[data-palette-header="primary"]').click()
  await foundations.getByRole('button', { name: 'Choose primary palette base from Tailwind palette' }).click()
  const popover = page.getByRole('dialog', { name: 'primary palette base color choices' })
  const search = popover.getByRole('searchbox', { name: 'Search Tailwind colors' })
  await expect(search).toHaveAttribute('name', 'tailwind-color-search')
  await popover.getByRole('tab', { name: 'Custom' }).click()
  const custom = popover.getByRole('textbox', { name: 'primary palette base custom color', exact: true })
  await custom.fill('not-a-color')
  await expect(custom).toHaveAttribute('aria-invalid', 'true')
  const errorId = await custom.getAttribute('aria-describedby')
  expect(errorId).toBeTruthy()
  await expect(popover.locator(`#${errorId}`)).toBeVisible()
})
