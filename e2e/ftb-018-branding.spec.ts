import { expect, test } from '@playwright/test'

const builderBaseUrl = process.env.BUILDER_BASE_URL ?? 'http://127.0.0.1:4173'

test('branding controls preserve the draft while runtime preview refreshes', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await expect(page.getByRole('heading', { name: 'Panel branding and runtime' })).toBeVisible()

  await page.getByLabel('App name').fill('Acme Admin')
  await expect(page.locator('iframe')).toHaveAttribute('src', /ftb_branding=/)
  await expect(page.getByLabel('App name')).toHaveValue('Acme Admin')
  await page.waitForTimeout(350)
  await page.reload()
  await expect(page.getByLabel('App name')).toHaveValue('Acme Admin')

  await page.getByLabel('Dark mode').click()
  await expect(page.getByTitle('Filament preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export panel branding JSON' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export PanelProvider branding config' })).toBeVisible()
})
