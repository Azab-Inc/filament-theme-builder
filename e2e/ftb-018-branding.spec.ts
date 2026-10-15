import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

test('branding controls preserve the draft while runtime preview refreshes', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.getByRole('tab', { name: 'Branding', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Panel branding and runtime' })).toBeVisible()

  await page.getByLabel('App name').fill('Acme Admin')
  await expect(page.locator('iframe')).toHaveAttribute('src', /ftb_branding=/)
  await expect(page.getByLabel('App name')).toHaveValue('Acme Admin')
  await page.waitForTimeout(350)
  await page.reload()
  await page.getByRole('tab', { name: 'Branding', exact: true }).click()
  await expect(page.getByLabel('App name')).toHaveValue('Acme Admin')

  await page.getByRole('tab', { name: 'Foundations', exact: true }).click()
  await page.getByLabel('Dark mode').click()
  await expect(page.getByTitle('Filament preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export panel branding JSON' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export PanelProvider branding config' })).toBeVisible()

  await page.getByRole('tab', { name: 'Branding', exact: true }).click()
  await page.getByLabel('Custom Google Font family').fill('Source Sans 3')
  await page.getByLabel('Custom Google Font family').press('Tab')
  await expect(page.locator('iframe')).toHaveAttribute('src', /ftb_branding=/)
  const preview = page.frames().find((frame) => frame.url().includes('/demo/admin'))
  await expect(preview?.locator('#ftb-brand-google-font')).toHaveAttribute('href', /Source\+Sans\+3/)
  await page.getByLabel('Content width').selectOption('5xl')
  await page.getByLabel('Sidebar behavior').selectOption('top-navigation')
  await expect(page.getByLabel('App name')).toHaveValue('Acme Admin')
  await page.getByRole('button', { name: 'Reset panel branding' }).click()
  await expect(page.getByLabel('App name')).toHaveValue('Filament Theme Builder')
})
