import { expect, test } from '@playwright/test'

const demoBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test('verified semantic selectors target accessible demo controls', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)

  const primaryButton = page.locator('.fi-btn.fi-color-primary')
  await expect(primaryButton).toHaveCount(1)
  await expect(primaryButton).toHaveRole('button')
  await expect(primaryButton).toHaveAccessibleName('Sign in')
  await expect(primaryButton.locator('..')).toHaveClass(/fi-width-full/)

  await page.setViewportSize({ width: 930, height: 700 })
  await page.goto(`${demoBaseUrl}/demo/admin`)

  const secondaryButton = page.locator('.fi-icon-btn.fi-topbar-open-sidebar-btn')
  await expect(secondaryButton).toHaveCount(1)
  await expect(secondaryButton).toHaveRole('button')
  await expect(secondaryButton).toHaveAccessibleName('Expand sidebar')
  await expect(secondaryButton.locator('..')).toHaveClass(/fi-topbar/)
})
