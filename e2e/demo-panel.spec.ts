import { expect, test, type Page } from '@playwright/test'

const demoBaseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4174'

async function signIn(page: Page): Promise<void> {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)
}

test.describe('demo panel', () => {
  test('exposes coherent navigation and stable seeded resources', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin`)

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    for (const group of ['Catalog', 'Sales', 'Customers', 'Operations']) {
      await expect(page.locator('.fi-sidebar-group-label', { hasText: group })).toBeVisible()
    }
    for (const resource of ['Products', 'Categories', 'Orders', 'Customers', 'Suppliers', 'Notes']) {
      await expect(page.getByRole('link', { name: resource, exact: true })).toBeVisible()
    }
  })

  test('shows product and order records with detail presentation', async ({ page }) => {
    await signIn(page)
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
    await signIn(page)

    await page.getByRole('link', { name: 'Products', exact: true }).click()
    await page.getByText('Demo Oak Chair', { exact: true }).click()
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    for (const relation of ['Categories', 'Tags', 'Variants']) {
      await expect(page.getByRole('tab', { name: relation })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Categories' }).click()
    await expect(page.getByText('Demo Chairs', { exact: true })).toBeVisible()
    await page.getByRole('row', { name: /Demo Chairs/ }).getByRole('button', { name: 'Detach', exact: true }).click()
    const detachModal = page.locator('.fi-modal-open')
    await detachModal.getByRole('button', { name: 'Detach', exact: true }).click()
    await expect(page.getByText('Demo Chairs', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Attach', exact: true }).click()
    const categoryAttachModal = page.locator('.fi-modal-open')
    await categoryAttachModal.getByRole('combobox').click()
    await categoryAttachModal.getByRole('textbox', { name: 'Search' }).fill('Demo Chairs')
    await page.waitForTimeout(700)
    await categoryAttachModal.locator('[role="option"][data-value="2"]:visible').click()
    await categoryAttachModal.getByRole('button', { name: 'Attach', exact: true }).click()
    await expect(page.getByText('Demo Chairs', { exact: true })).toBeVisible()

    await page.getByRole('tab', { name: 'Tags' }).click()
    await expect(page.getByText('Demo bestseller', { exact: true })).toBeVisible()
    await page.getByRole('row', { name: /Demo bestseller/ }).getByRole('button', { name: 'Detach', exact: true }).click()
    await page.locator('.fi-modal-open').getByRole('button', { name: 'Detach', exact: true }).click()
    await expect(page.getByText('Demo bestseller', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Attach', exact: true }).click()
    const tagAttachModal = page.locator('.fi-modal-open')
    await tagAttachModal.getByRole('combobox').click()
    await tagAttachModal.getByRole('textbox', { name: 'Search' }).fill('Demo bestseller')
    await page.waitForTimeout(700)
    await tagAttachModal.locator('[role="option"][data-value="1"]:visible').click()
    await tagAttachModal.getByRole('button', { name: 'Attach', exact: true }).click()
    await expect(page.getByText('Demo bestseller', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Customers', exact: true }).click()
    await page.getByText('Avery Demo', { exact: true }).click()
    for (const relation of ['Addresses', 'Orders', 'Reviews']) {
      await expect(page.getByRole('tab', { name: relation })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Addresses' }).click()
    await expect(page.getByText('Avery home', { exact: true })).toBeVisible()
    await page.getByRole('tab', { name: 'Orders' }).click()
    await expect(page.getByText('DEMO-ORDER-1001', { exact: true })).toBeVisible()
    await page.getByRole('tab', { name: 'Reviews' }).click()
    await expect(page.getByText('Demo customer review', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Orders', exact: true }).click()
    await page.getByText('DEMO-ORDER-1001', { exact: true }).click()
    await expect(page.getByRole('link', { name: 'Items', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Items', exact: true }).click()
    await expect(page).toHaveURL(/\/orders\/[^/]+\/order-items/)
    await expect(page.getByRole('heading', { name: /order items/i })).toBeVisible()
    await page.getByRole('row', { name: /Demo Oak Chair/ }).getByRole('link', { name: 'View', exact: true }).click()
    await expect(page.getByRole('heading', { name: /view order item/i })).toBeVisible()
    await expect(page.getByText('Demo Oak Chair', { exact: true })).toBeVisible()
  })
})
