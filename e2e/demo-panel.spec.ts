import { expect, test } from '@playwright/test'

test.describe('demo panel', () => {
  test('exposes coherent navigation and stable seeded resources', async ({ page }) => {
    await page.goto('http://127.0.0.1:4174/demo/admin')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    for (const group of ['Catalog', 'Sales', 'Customers', 'Operations']) {
      await expect(page.locator('.fi-sidebar-group-label', { hasText: group })).toBeVisible()
    }
    for (const resource of ['Products', 'Categories', 'Orders', 'Customers', 'Suppliers', 'Notes']) {
      await expect(page.getByRole('link', { name: resource, exact: true })).toBeVisible()
    }
  })

  test('shows product and order records with detail presentation', async ({ page }) => {
    await page.goto('http://127.0.0.1:4174/demo/admin/login')
    await page.getByLabel(/username/i).fill('user')
    await page.getByRole('textbox', { name: /password/i }).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('http://127.0.0.1:4174/demo/admin')
    await page.getByRole('link', { name: 'Products', exact: true }).click()
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
    await expect(page.getByText('Demo Oak Chair', { exact: true })).toBeVisible()
    await expect(page.getByText('$129.00', { exact: true })).toBeVisible()
    await expect(page.locator('.fi-badge', { hasText: 'Active' }).first()).toBeVisible()
    await page.getByText('Demo Oak Chair', { exact: true }).click()
    await expect(page.getByText('Demo Oak Chair', { exact: true })).toBeVisible()
    await expect(page.getByText('$129.00', { exact: true })).toBeVisible()
    await expect(page.locator('.fi-badge', { hasText: 'Active' }).first()).toBeVisible()
    await expect(page.locator('img[src*="/demo-images/demo-oak-chair.svg"]')).toBeVisible()

    await page.getByRole('link', { name: 'Orders', exact: true }).click()
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible()
    await expect(page.getByText('DEMO-ORDER-1001', { exact: true })).toBeVisible()
  })

  test('relationship workflows expose manager tabs and nested order items', async ({ page }) => {
    await page.goto('http://127.0.0.1:4174/demo/admin/login')
    await page.getByLabel(/username/i).fill('user')
    await page.getByRole('textbox', { name: /password/i }).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.getByRole('link', { name: 'Products', exact: true }).click()
    await page.getByText('Demo Oak Chair', { exact: true }).click()
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    for (const relation of ['Categories', 'Tags', 'Variants']) {
      await expect(page.getByRole('tab', { name: relation })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Categories' }).click()
    await expect(page.getByText('Demo Chairs', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Attach', exact: true }).click()
    const modal = page.locator('[role="dialog"].fi-modal-open')
    await expect(modal).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Detach', exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Customers', exact: true }).click()
    await page.getByText('Avery Demo', { exact: true }).click()
    for (const relation of ['Addresses', 'Orders', 'Reviews']) {
      await expect(page.getByRole('tab', { name: relation })).toBeVisible()
    }

    await page.getByRole('link', { name: 'Orders', exact: true }).click()
    await page.getByText('DEMO-ORDER-1001', { exact: true }).click()
    await expect(page.getByRole('link', { name: 'Items', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Items', exact: true }).click()
    await expect(page).toHaveURL(/\/orders\/[^/]+\/order-items/)
    await expect(page.getByRole('heading', { name: /order items/i })).toBeVisible()
  })
})
