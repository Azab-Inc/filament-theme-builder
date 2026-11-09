import { expect, test } from '@playwright/test'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')

test('inspector selects dashboard status badge text', async ({ page }) => {
  await page.goto(process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175')
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  const badge = frame.locator('.fi-ta-cell-status .fi-badge').first()
  await expect(badge).toBeVisible()
  await page.getByRole('button', { name: 'Inspector' }).click()
  await badge.hover()
  await expect(badge).toHaveClass(/ftb-inspector-hover/)
  await badge.click()
  await expect(badge).toHaveClass(/ftb-inspector-selected/)
  await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/badge/i)
  await page.getByRole('tab', { name: 'Inspector' }).click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue(/\.fi-badge/)

  const cell = frame.locator('.fi-ta-cell-status').first()
  await cell.click({ position: { x: 2, y: 2 } })
  await expect(cell).toHaveClass(/ftb-inspector-selected/)
})
