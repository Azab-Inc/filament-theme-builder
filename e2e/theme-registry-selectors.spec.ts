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
