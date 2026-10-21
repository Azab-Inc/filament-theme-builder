import { expect, test } from '@playwright/test'

test('Create replaces a customized theme with canonical defaults and preserves its source', async ({ page }) => {
  const previewFrame = () => page.frame({ url: /\/demo\/admin/ })
  const openPreviewActions = async () => previewFrame()?.goto(new URL('/demo/admin/actions-showcase', page.url()).href)
  await page.goto('/')
  await openPreviewActions()
  const originalId = await page.evaluate(() => localStorage.getItem('ftb-theme-active')!)
  const defaults = await page.evaluate((id) => JSON.parse(localStorage.getItem(`ftb-theme:${id}`)!), originalId)
  const preview = page.frameLocator('iframe[title="Filament preview"]')
  const previewPrimary = () => preview.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--primary-500').trim())
  await expect.poll(previewPrimary).not.toBe('')
  const defaultPreviewPrimary = await previewPrimary()
  const primaryButton = preview.locator('.fi-btn.fi-color-primary').first()
  await expect(primaryButton).toBeVisible()
  const defaultButtonBackground = await primaryButton.evaluate((element) => getComputedStyle(element).backgroundColor)
  await page.locator('#toolbar-primary-color').fill('#123456')
  await expect.poll(() => page.evaluate((id) => JSON.parse(localStorage.getItem(`ftb-theme:${id}`)!).colors.primary, originalId)).toBe('#123456')
  const customized = await page.evaluate((id) => {
    const state = JSON.parse(localStorage.getItem(`ftb-theme:${id}`)!)
    state.rawOverrides = [{ selector: '.fi-btn.fi-color-primary', properties: { 'background-color': '#e11d48' } }]
    localStorage.setItem(`ftb-theme:${id}`, JSON.stringify(state))
    localStorage.setItem('ftb-theme', JSON.stringify(state))
    return state
  }, originalId)
  await expect.poll(previewPrimary).toBe('#123456')
  await page.reload()
  await openPreviewActions()
  await expect(page.locator('#toolbar-primary-color')).toHaveValue('#123456')
  await expect.poll(() => primaryButton.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(225, 29, 72)')
  await expect.poll(previewPrimary).toBe('#123456')

  await page.getByRole('button', { name: 'Manage themes' }).click()
  await page.getByRole('button', { name: 'Create theme' }).click()
  await expect(page.locator('#toolbar-primary-color')).toHaveValue(defaults.colors.primary)
  await expect.poll(previewPrimary).toBe(defaultPreviewPrimary)
  await expect.poll(() => primaryButton.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(defaultButtonBackground)
  const created = await page.evaluate(() => {
    const id = localStorage.getItem('ftb-theme-active')!
    return { id, state: JSON.parse(localStorage.getItem(`ftb-theme:${id}`)!), history: JSON.parse(localStorage.getItem(`ftb-theme-history:${id}`)!) }
  })
  expect(created.state).toEqual(defaults)
  expect(created.state).not.toEqual(customized)
  expect(created.history).toEqual({ snapshots: [defaults], cursor: 0 })
  expect(await page.evaluate((id) => JSON.parse(localStorage.getItem(`ftb-theme:${id}`)!), originalId)).toEqual(customized)

  await page.reload()
  await openPreviewActions()
  await expect(page.locator('#toolbar-primary-color')).toHaveValue(defaults.colors.primary)
  await page.getByRole('button', { name: 'Manage themes' }).click()
  await page.getByRole('listitem').first().getByRole('button', { name: 'Open Untitled' }).click()
  await expect(page.locator('#toolbar-primary-color')).toHaveValue('#123456')
  await expect.poll(previewPrimary).toBe('#123456')
  await expect.poll(() => primaryButton.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(225, 29, 72)')
})
