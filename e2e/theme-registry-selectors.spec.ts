import { expect, test } from '@playwright/test'

const demoBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(!process.env.COMPOSE_E2E, 'Requires the seeded authenticated Compose demo')

test('verified semantic selectors target accessible demo controls', async ({ page }) => {
  await page.setViewportSize({ width: 930, height: 700 })
  await page.goto(`${demoBaseUrl}/demo/admin/login`)

  const primaryButton = page.locator('.fi-btn.fi-color-primary')
  await expect(primaryButton).toHaveCount(1)
  await expect(primaryButton).toHaveRole('button')
  await expect(primaryButton).toHaveAccessibleName('Sign in')
  await expect(primaryButton.locator('..')).toHaveClass(/fi-width-full/)

  await page.locator('#form\\.email').fill('user')
  await page.locator('#form\\.password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(`${demoBaseUrl}/demo/admin`)
  await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)

  const secondaryButton = page.locator('.fi-btn.fi-outlined')
  await expect(secondaryButton).toHaveCount(1)
  await expect(secondaryButton).toHaveRole('button')
  await expect(secondaryButton).toHaveAccessibleName('Outline action')
  await expect(secondaryButton.locator('..')).toHaveClass(/fi-ac/)
})

test('verified FTB-014 selectors target native action, modal, and notification surfaces', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.locator('#form\\.email').fill('user')
  await page.locator('#form\\.password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(`${demoBaseUrl}/demo/admin`)
  await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)
  await expect(page.locator('.fi-btn')).not.toHaveCount(0)
  await expect(page.locator('.fi-ac')).not.toHaveCount(0)

  await page.getByRole('button', { name: 'Order status modal' }).click()
  const modal = page.locator('.fi-modal.fi-modal-open')
  await expect(modal.locator('.fi-modal-window')).toBeVisible()
  await expect(modal.locator('.fi-modal-heading')).toBeVisible()
  await expect(modal.locator('.fi-modal-content')).toBeVisible()
  await expect(modal.locator('.fi-modal-footer')).toBeVisible()
  await modal.getByRole('button', { name: 'Cancel' }).click()

  await page.goto(`${demoBaseUrl}/demo/admin/notifications-showcase`)
  await page.getByRole('button', { name: 'Show success notification' }).click()
  await expect(page.locator('.fi-no')).toBeVisible()
  await expect(page.locator('.fi-no-notification')).toHaveCount(1)
  await expect(page.locator('.fi-no-notification.fi-status-success')).toBeVisible()
})

test('verified FTB-015 selectors target dashboard and navigation surfaces', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await expect(page.locator('.fi-simple-page')).toHaveCount(1)
  await page.locator('#form\\.email').fill('user')
  await page.locator('#form\\.password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(`${demoBaseUrl}/demo/admin`)

  await expect(page.locator('.fi-wi-stats-overview')).toHaveCount(1)
  await expect(page.locator('.fi-wi-chart')).toHaveCount(1)
  await expect(page.locator('.fi-wi-table')).toHaveCount(2)
  await expect(page.locator('.fi-sidebar')).toHaveCount(1)
  await expect(page.locator('.fi-sidebar-item-badge-ctn')).not.toHaveCount(0)
  await expect(page.locator('.fi-topbar')).toHaveCount(1)

  await page.goto(`${demoBaseUrl}/demo/admin/showcase`)
  await expect(page.locator('.fi-ftb-tenant-switcher')).toHaveCount(1)
  await page.keyboard.press('Control+K')
  await expect(page.locator('.fi-global-search')).toHaveCount(1)
})
