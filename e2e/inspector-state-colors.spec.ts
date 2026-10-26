import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

test('sidebar label default and current colors are independently editable', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
  await page.setViewportSize({ width: 1600, height: 1200 })
  await page.goto(baseUrl)
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  const label = frame.locator('.fi-sidebar-item.fi-active .fi-sidebar-item-label').first()
  await expect(label).toBeVisible()
  await page.getByRole('button', { name: 'Inspector' }).click()
  await label.click()
  await expect(page.locator('[data-advanced-inspector]')).toBeVisible()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-label')
  await expect(page.getByRole('group', { name: 'Inspector state' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await page.getByRole('button', { name: 'Hover' }).click()
  await page.getByRole('button', { name: 'Default' }).click()
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()

  await page.getByLabel('Raw color', { exact: true }).fill('#ffffff')
  await expect.poll(() => label.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(255, 255, 255)')
  await page.getByRole('button', { name: 'Selected' }).click()
  await page.getByLabel('Raw color', { exact: true }).fill('#dc2626')
  await expect.poll(() => label.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(220, 38, 38)')
  const sibling = frame.locator('.fi-sidebar-item:not(.fi-active) .fi-sidebar-item-label').first()
  const siblingColor = await sibling.evaluate((el) => getComputedStyle(el).color)
  expect(siblingColor).not.toBe('rgb(220, 38, 38)')

  await page.getByRole('button', { name: 'Default' }).click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-label')
  await page.getByRole('button', { name: 'Hover' }).click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-btn:hover .fi-sidebar-item-label')
  await page.getByLabel('Raw color', { exact: true }).fill('#0f766e')
  await sibling.hover()
  await expect.poll(() => sibling.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(15, 118, 110)')
  await expect.poll(() => label.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(220, 38, 38)')

  await page.getByRole('button', { name: 'Focus' }).click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-sidebar-item-btn:focus .fi-sidebar-item-label')
  await page.getByLabel('Raw color', { exact: true }).fill('#2563eb')
  await sibling.evaluate((el) => (el.parentElement as HTMLElement).focus())
  await expect.poll(() => sibling.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(37, 99, 235)')
  await expect.poll(() => label.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(220, 38, 38)')

  await page.getByRole('button', { name: 'Reset raw color' }).click()
  await expect.poll(() => sibling.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(255, 255, 255)')

  const menu = page.locator('summary[aria-label="Export actions"]')
  await menu.click()
  const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export theme JSON' }).click()])
  const jsonStream = await jsonDownload.createReadStream()
  let json = ''
  for await (const chunk of jsonStream ?? []) json += chunk.toString()
  const rawOverrides = JSON.parse(json).rawOverrides as Array<{ selector: string; properties: Record<string, string> }>
  expect(rawOverrides).toEqual(expect.arrayContaining([
    expect.objectContaining({ selector: '.fi-sidebar-item-label', properties: expect.objectContaining({ color: '#ffffff' }) }),
    expect.objectContaining({ selector: '.fi-sidebar-item.fi-active .fi-sidebar-item-label', properties: expect.objectContaining({ color: '#dc2626' }) }),
    expect.objectContaining({ selector: '.fi-sidebar-item-btn:hover .fi-sidebar-item-label', properties: expect.objectContaining({ color: '#0f766e' }) }),
  ]))

  await menu.click()
  const [cssDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download vanilla CSS' }).click()])
  const cssStream = await cssDownload.createReadStream()
  let css = ''
  for await (const chunk of cssStream ?? []) css += chunk.toString()
  expect(css).toContain('.fi-sidebar-item.fi-active .fi-sidebar-item-label {')
  expect(css).toContain('.fi-sidebar-item-btn:hover .fi-sidebar-item-label {')
})
