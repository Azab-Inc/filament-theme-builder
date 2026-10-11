import { expect, test as base, type BrowserContext, type Page } from '@playwright/test'

const demoBaseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4174'

type Fixtures = {
  authenticatedPage: Page
}

type WorkerFixtures = {
  authenticatedContext: BrowserContext
}

async function signIn(page: Page): Promise<void> {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)
}

const test = base.extend<Fixtures, WorkerFixtures>({
  authenticatedContext: [async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await signIn(page)
    await page.close()
    await use(context)
    await context.close()
  }, { scope: 'worker' }],
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage()

    await page.goto(`${demoBaseUrl}/demo/admin`)
    await use(page)
    await page.close()
  },
})

test.describe('demo panel', () => {
  test.describe.configure({ mode: 'serial' })

  test('exposes coherent navigation and stable seeded resources', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin`)

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    for (const group of ['Catalog', 'Sales', 'Customers', 'Operations']) {
      await expect(page.locator('.fi-sidebar-group-label', { hasText: group })).toBeVisible()
    }
    for (const resource of ['Products', 'Categories', 'Orders', 'Customers', 'Suppliers', 'Notes']) {
      await expect(page.getByRole('link', { name: new RegExp(`^${resource}(?: \\d+)?$`) })).toBeVisible()
    }
  })

  test('shows product and order records with detail presentation', async ({ authenticatedPage: page }) => {
    await page.getByRole('link', { name: /^Products(?: \d+)?$/ }).click()
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
    await expect(page.getByText('Demo Oak Chair', { exact: true })).toBeVisible()
    await expect(page.getByText('$129.00', { exact: true })).toBeVisible()
    await expect(page.locator('.fi-badge', { hasText: 'Active' }).first()).toBeVisible()
    await page.getByText('Demo Oak Chair', { exact: true }).click()
    await expect(page.getByText('Demo Oak Chair', { exact: true })).toBeVisible()
    await expect(page.getByText('$129.00', { exact: true })).toBeVisible()
    await expect(page.locator('.fi-badge', { hasText: 'Active' }).first()).toBeVisible()
    await expect(page.locator('img[src*="/demo-images/demo-oak-chair.svg"]')).toBeVisible()

    await page.getByRole('link', { name: /^Orders(?: \d+)?$/ }).click()
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible()
    await expect(page.getByText('DEMO-ORDER-1001', { exact: true })).toBeVisible()
  })

  test('product categories preserve strict attach and detach behavior', async ({ authenticatedPage: page }) => {

    await page.getByRole('link', { name: /^Products(?: \d+)?$/ }).click()
    await page.getByText('Demo Oak Chair', { exact: true }).click()
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    for (const relation of ['Categories', 'Tags', 'Variants']) {
      await expect(page.getByRole('tab', { name: relation })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Categories' }).click()
    await expect(page.getByRole('table', { name: 'Categories' }).getByText('Demo Chairs', { exact: true })).toBeVisible()
    await page.getByRole('row', { name: /Demo Chairs/ }).getByRole('button', { name: 'Detach', exact: true }).click()
    const detachModal = page.locator('.fi-modal-open')
    await detachModal.getByRole('button', { name: 'Detach', exact: true }).click()
    await expect(page.getByText('Demo Chairs', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Attach', exact: true }).click()
    const categoryAttachModal = page.locator('.fi-modal-open')
    await categoryAttachModal.getByRole('combobox').click()
    await categoryAttachModal.getByRole('textbox', { name: 'Search' }).fill('Demo Chairs')
    const categoryOption = categoryAttachModal.getByRole('option', { name: 'Demo Chairs', exact: true })
    await expect(categoryOption).toBeVisible()
    await categoryOption.click()
    await categoryAttachModal.getByRole('button', { name: 'Attach', exact: true }).click()
    await expect(page.getByRole('table', { name: 'Categories' }).getByText('Demo Chairs', { exact: true })).toBeVisible()
  })

  test('product tags preserve strict attach and detach behavior', async ({ authenticatedPage: page }) => {
    await page.getByRole('link', { name: /^Products(?: \d+)?$/ }).click()
    await page.getByText('Demo Oak Chair', { exact: true }).click()
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await expect(page.getByRole('tab', { name: 'Tags' })).toBeVisible()
    await page.getByRole('tab', { name: 'Tags' }).click()
    await expect(page.getByRole('table', { name: 'Tags' }).getByText('Demo bestseller', { exact: true })).toBeVisible()
    await page.getByRole('row', { name: /Demo bestseller/ }).getByRole('button', { name: 'Detach', exact: true }).click()
    await page.locator('.fi-modal-open').getByRole('button', { name: 'Detach', exact: true }).click()
    await expect(page.getByText('Demo bestseller', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Attach', exact: true }).click()
    const tagAttachModal = page.locator('.fi-modal-open')
    await tagAttachModal.getByRole('combobox').click()
    await tagAttachModal.getByRole('textbox', { name: 'Search' }).fill('Demo bestseller')
    const tagOption = tagAttachModal.getByRole('option', { name: 'Demo bestseller', exact: true })
    await expect(tagOption).toBeVisible()
    await tagOption.click()
    await tagAttachModal.getByRole('button', { name: 'Attach', exact: true }).click()
    await expect(page.getByRole('table', { name: 'Tags' }).getByText('Demo bestseller', { exact: true })).toBeVisible()
  })

  test('customer relationship managers render strict seeded records', async ({ authenticatedPage: page }) => {
    await page.getByRole('link', { name: /^Customers(?: \d+)?$/ }).click()
    await page.getByText('Avery Demo', { exact: true }).click()
    for (const relation of ['Addresses', 'Orders', 'Reviews']) {
      await expect(page.getByRole('tab', { name: relation })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Addresses' }).click()
    await expect(page.getByRole('row', { name: /Avery home/ })).toBeVisible()
    await page.getByRole('tab', { name: 'Orders' }).click()
    await expect(page.getByRole('row', { name: /DEMO-ORDER-1001/ })).toBeVisible()
    await page.getByRole('tab', { name: 'Reviews' }).click()
    await expect(page.getByRole('row', { name: /Demo customer review/ })).toBeVisible()
  })

  test('nested order items preserve strict parent-scoped rendered records', async ({ authenticatedPage: page }) => {
    await page.getByRole('link', { name: /^Orders(?: \d+)?$/ }).click()
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
