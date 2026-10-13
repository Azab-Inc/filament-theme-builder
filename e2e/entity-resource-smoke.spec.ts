import { expect, test } from '@playwright/test'
import { demoBaseUrl } from './urls'

test('customers and products resource indexes and product detail load', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)

  await page.goto(`${demoBaseUrl}/demo/admin/customers`)
  await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible()
  await expect(page.getByText('Avery Demo', { exact: true })).toBeVisible()

  await page.goto(`${demoBaseUrl}/demo/admin/products`)
  await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
  await page.getByText('Demo Oak Chair', { exact: true }).click()
  await expect(page).toHaveURL(/\/demo\/admin\/products\/\d+$/)
  await expect(page.getByText('Demo Oak Chair', { exact: true })).toBeVisible()
  await expect(page.getByText('$129.00', { exact: true })).toBeVisible()
})
