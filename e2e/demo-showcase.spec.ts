import { expect, test } from '@playwright/test'

const demoBaseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4174'

test.describe('demo showcase panel identity and navigation', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/login`)
    await page.getByLabel(/username/i).fill('user')
    await page.getByRole('textbox', { name: /password/i }).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)
  })

  test('branding uses the independent local identity in light and dark modes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.reload()
    await expect(page.getByRole('img', { name: 'Filament Theme Builder' }).first()).toBeVisible()
    await expect(page.getByText('Filament Demo', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('img', { name: 'Filament', exact: true })).toHaveCount(0)
    await expect(page.locator('.fi-logo-light').first()).toBeVisible()
    await expect(page.locator('.fi-logo-dark').first()).toBeHidden()
    await expect(page.locator('link[rel="icon"][href^="data:image/svg+xml;base64,"]')).toHaveCount(1)

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    await expect(page.locator('.fi-logo-dark').first()).toBeVisible()
    await expect(page.locator('.fi-logo-light').first()).toBeHidden()
    await expect(page.getByRole('img', { name: 'Filament Theme Builder' }).last()).toBeVisible()
  })

  test('navigation keeps its groups with distinct semantic icons and seeded accessible badges', async ({ page }) => {
    for (const group of ['Catalog', 'Sales', 'Customers', 'Operations']) {
      await expect(page.locator('.fi-sidebar-group-label', { hasText: group })).toBeVisible()
    }
    for (const [label, tooltip] of [
      ['Products 2', 'Showcase product fixtures'],
      ['Orders 2', 'Showcase order fixtures'],
      ['Customers 2', 'Showcase customer fixtures'],
      ['Suppliers', null],
      ['Notes', null],
    ] as const) {
      const link = page.getByRole('link', { name: label, exact: true })
      await expect(link).toBeVisible()
      await expect(link.locator('.fi-sidebar-item-icon')).toBeAttached()

      if (tooltip !== null) {
        await expect(link.locator('.fi-sidebar-item-badge-ctn .fi-badge')).toHaveText('2')
        await expect(link.locator('.fi-sidebar-item-badge-ctn [x-tooltip]')).toHaveAttribute('x-tooltip', new RegExp(tooltip))
      }
    }
  })

  test('dashboard exposes deterministic commerce metrics, links, and responsive sections', async ({ page }) => {
    const overview = page.getByRole('region', { name: 'Commerce overview' })
    await expect(overview).toBeVisible()
    await expect(overview.getByText('Total revenue', { exact: true })).toBeVisible()
    await expect(overview.getByText('$406.00', { exact: true })).toBeVisible()
    await expect(overview.getByText('Orders', { exact: true })).toBeVisible()
    await expect(overview.getByText('Customers', { exact: true })).toBeVisible()
    await expect(overview.getByText('Products', { exact: true })).toBeVisible()
    await expect(overview.locator('.fi-wi-stats-overview-stat')).toHaveCount(4)
    await expect(overview.locator('.fi-wi-stats-overview-stat').nth(1)).toContainText('2')
    await expect(overview.locator('.fi-wi-stats-overview-stat').nth(2)).toContainText('2')
    await expect(overview.locator('.fi-wi-stats-overview-stat').nth(3)).toContainText('2')
    await expect(page.getByRole('heading', { name: 'Revenue and orders' })).toBeVisible()
    await expect(page.getByRole('img', { name: /Revenue and orders.*October 4–10, 2026/ })).toBeVisible()
    const recentOrders = page.getByRole('table', { name: 'Recent orders' })
    const lowStock = page.getByRole('table', { name: 'Low-stock products' })
    await expect(recentOrders).toBeVisible()
    await expect(recentOrders.getByRole('row').nth(1)).toContainText('DEMO-ORDER-1002')
    await expect(recentOrders.getByRole('row').nth(1)).toContainText('Oct 8, 2026')
    await expect(recentOrders.getByRole('row').nth(1)).toContainText('shipped')
    await expect(lowStock).toBeVisible()
    await expect(lowStock.getByRole('row').nth(1)).toContainText('DEMO-LAMP-001')
    await expect(lowStock.getByRole('row').nth(1)).toContainText('8')
    await expect(lowStock.getByRole('row').nth(1)).toContainText('Low stock')

    const orderLink = page.getByRole('link', { name: 'DEMO-ORDER-1002' })
    await expect(orderLink).toHaveAttribute('href', /\/demo\/admin\/orders\//)
    await orderLink.focus()
    await expect(orderLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/demo\/admin\/orders\/2$/)
    await page.goBack()
    await expect(page.getByRole('region', { name: 'Commerce overview' })).toBeVisible()

    const recentWidget = page.locator('.fi-wi-widget').filter({ has: page.getByRole('heading', { name: 'Recent orders' }) })
    const lowStockWidget = page.locator('.fi-wi-widget').filter({ has: page.getByRole('heading', { name: 'Low-stock products' }) })
    const desktopRecentBox = await recentWidget.boundingBox()
    const desktopLowStockBox = await lowStockWidget.boundingBox()
    expect(desktopRecentBox).not.toBeNull()
    expect(desktopLowStockBox).not.toBeNull()
    expect(desktopRecentBox!.x).not.toBe(desktopLowStockBox!.x)

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Recent orders' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Low-stock products' })).toBeVisible()
    const mobileRecentBox = await recentWidget.boundingBox()
    const mobileLowStockBox = await lowStockWidget.boundingBox()
    expect(mobileRecentBox).not.toBeNull()
    expect(mobileLowStockBox).not.toBeNull()
    expect(mobileRecentBox!.x).toBe(mobileLowStockBox!.x)
    expect(mobileRecentBox!.y).not.toBe(mobileLowStockBox!.y)
  })

  test('order fulfillment action requires confirmation and reports the safe result', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/orders/1/edit`)
    await page.getByLabel('Status').selectOption('paid')
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()
    await page.getByRole('link', { name: 'View', exact: true }).click()
    await expect(page).toHaveURL(/\/demo\/admin\/orders\/1$/)

    const status = page.locator('.fi-in-text-item.fi-in-text-has-badges').filter({ hasText: 'Paid' })
    const history = page.locator('.fi-in-entry').filter({ hasText: 'Status history' })
    await expect(status).toBeVisible()
    await expect(history).toContainText('Refunded')
    const historyBeforeCancel = await history.textContent()

    const action = page.getByRole('button', { name: /mark fulfilled/i })
    await expect(action).toBeVisible()
    await action.click()

    await expect(page.getByRole('heading', { name: 'Mark order as fulfilled' })).toBeVisible()
    await expect(page.getByLabel('Fulfillment')).toHaveValue('shipped')
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /confirm fulfillment/i })).toBeVisible()

    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('heading', { name: 'Mark order as fulfilled' })).toHaveCount(0)
    await expect(status).toBeVisible()
    await expect(history).toHaveText(historyBeforeCancel ?? '')

    await action.click()
    await page.getByRole('button', { name: /confirm fulfillment/i }).click()
    await expect(page.getByText('Order marked as fulfilled', { exact: true })).toBeVisible()
    await expect(page.locator('.fi-in-text-item.fi-in-text-has-badges').filter({ hasText: 'Shipped' })).toBeVisible()
    await expect(history).toContainText('Shipped')
    await expect(history).not.toHaveText(historyBeforeCancel ?? '')
  })
})
