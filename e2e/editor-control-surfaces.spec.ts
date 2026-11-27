import { expect, test } from '@playwright/test'

test('keeps editor controls on the shared surfaced field language', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Components' }).click()

  const panel = page.locator('#editor-panel-components')
  const fieldset = panel.locator('fieldset').first()
  const paddingCard = panel.locator('[data-padding-target="forms.input"]').first()

  await expect(fieldset).toHaveCSS('border-radius', '4px')
  await expect(fieldset).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(fieldset.locator('legend')).toHaveCSS('background-color', 'rgb(230, 242, 238)')
  await expect(fieldset.getByRole('button', { name: 'Reset Product name global background' })).toHaveCSS('border-radius', '5.6px')
  await expect(paddingCard).toHaveCSS('border-radius', '4px')
  await expect(paddingCard).toHaveCSS('background-color', 'rgb(255, 255, 255)')

  const colorField = fieldset.locator('[data-color-field="product-name-global-background"]')
  await expect(colorField.locator('label.sr-only')).toHaveCSS('opacity', '0')
  await expect(colorField.locator('label.sr-only')).toHaveCSS('position', 'absolute')
  await expect(colorField.locator('input.color-field__text')).toHaveCSS('border-radius', '6px')

  const background = page.getByRole('textbox', { name: 'Product name global background', exact: true })
  await background.fill('#123456')
  await expect(page.locator('#product-name-global-status')).toHaveText('Explicit (global)')
  await page.getByRole('button', { name: 'Reset Product name global background' }).click()
  await expect(page.locator('#product-name-global-status')).toHaveText('Inherited from unresolved')
})

test('keeps editor controls usable across shell widths and sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const panel = page.locator('#editor-panel-components')
  await expect(page.locator('.editor-workspace')).not.toHaveAttribute('style', /--editor-pane-width/)
  await page.getByRole('tab', { name: 'Components' }).click()
  await panel.scrollIntoViewIfNeeded()

  const row = panel.locator('.component-control-row').first()
  const colorField = row.locator('.color-field')
  await expect(row).toBeVisible()
  await expect(colorField.locator('.color-field__text')).toHaveCSS('writing-mode', 'horizontal-tb')
  await expect.poll(async () => colorField.locator('.color-field__text').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(80)
  await expect.poll(async () => colorField.locator('.color-field__trigger').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(60)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Components' }).click()
  await panel.scrollIntoViewIfNeeded()
  await expect(row).toBeVisible()
  await expect.poll(async () => colorField.locator('.color-field__text').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(80)
  await expect(colorField.locator('.color-field__trigger')).toBeVisible()

  for (const section of ['Foundations', 'Branding']) {
    await page.getByRole('tab', { name: section }).click()
    await expect(page.getByRole('tabpanel')).toBeVisible()
  }
  await page.getByRole('button', { name: 'Inspector' }).click()
  await expect(page.getByRole('tabpanel')).toBeVisible()
  await page.getByRole('tab', { name: 'Components' }).click()
  await expect(page.getByRole('region', { name: 'Hierarchical padding controls' })).toBeVisible()
})
