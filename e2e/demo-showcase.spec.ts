import { expect, test, type Page, type StorageState } from '@playwright/test'

const demoBaseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4174'

let authState: StorageState

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)

  authState = await context.storageState()
  await context.close()
})

async function useAuthenticatedSession(page: Page): Promise<void> {
  await page.context().addCookies(authState.cookies)
  await page.goto(`${demoBaseUrl}/demo/admin`)
  await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin`)
}

test.describe('demo showcase panel identity and navigation', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await useAuthenticatedSession(page)
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

test.describe('forms and schemas showcase', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await useAuthenticatedSession(page)
    await page.goto(`${demoBaseUrl}/demo/admin/forms-showcase`)
  })

  test('shows native form controls, filled and disabled states in light and dark modes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.getByRole('heading', { name: 'Forms & Schemas' })).toBeVisible()
    await expect(page.getByText('Campaign brief', { exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Wizard' })).toBeVisible()
    await expect(page.getByText('Repeater', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Content blocks' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editorial notes' })).toBeVisible()
    await expect(page.getByRole('tablist', { name: 'Tabs and sections' })).toBeVisible()
    await page.getByRole('tab', { name: 'Conditional' }).click()
    await expect(page.getByRole('textbox', { name: /Conditional details/ })).toBeVisible()
    await expect(page.getByLabel('Campaign name')).toHaveValue('Autumn studio launch')
    await expect(page.getByLabel('Prefilled fixture')).toHaveValue('Local deterministic value')
    await expect(page.getByLabel('Disabled fixture')).toBeDisabled()

    const lightControlStyle = await page.getByLabel('Campaign name').evaluate((control) => {
      const styles = getComputedStyle(control)
      return { backgroundColor: styles.backgroundColor, color: styles.color }
    })

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.getByRole('heading', { name: 'Forms & Schemas' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Campaign brief' })).toBeVisible()
    const darkControlStyle = await page.getByLabel('Campaign name').evaluate((control) => {
      const styles = getComputedStyle(control)
      return { backgroundColor: styles.backgroundColor, color: styles.color }
    })
    expect(darkControlStyle).not.toEqual(lightControlStyle)
  })

  test('interacts with wizard, repeater, content builder, and rich editor controls', async ({ page }) => {
    const wizard = page.getByRole('list', { name: 'Wizard' })
    await expect(wizard).toBeVisible()
    await page.getByLabel('Plan reference').fill('DEMO-CAMPAIGN-001')
    await page.getByRole('button', { name: /Next/ }).click()
    await expect(page.getByRole('group', { name: /Build/ })).toBeVisible()
    await page.getByRole('button', { name: /Next/ }).click()
    await expect(page.getByRole('group', { name: /Review/ })).toBeVisible()

    const repeater = page.getByRole('region', { name: 'Repeater' })
    await repeater.getByRole('button', { name: /Add/ }).click()
    await expect(repeater.getByRole('textbox', { name: /Channel/ })).toHaveCount(2)
    await repeater.getByRole('textbox', { name: /Channel/ }).nth(1).fill('Studio partners')
    await repeater.getByRole('spinbutton', { name: /Budget/ }).nth(1).fill('800')
    await expect(repeater.getByRole('textbox', { name: /Channel/ }).nth(1)).toHaveValue('Studio partners')

    const builder = page.getByRole('region', { name: 'Content blocks' })
    await builder.getByRole('button', { name: /Add/ }).click()
    await page.getByRole('button', { name: 'Quote block' }).click()
    await expect(builder.getByRole('textbox', { name: /Quote/ })).toHaveCount(1)
    await builder.getByRole('textbox', { name: /Quote/ }).fill('A considered local quote.')
    await expect(builder.getByRole('textbox', { name: /Quote/ })).toHaveValue('A considered local quote.')

    const editor = page.getByRole('region', { name: 'Editorial notes' })
    await expect(editor.getByRole('button', { name: 'Bold' })).toBeVisible()
    const editorBody = editor.locator('[contenteditable="true"]')
    await expect(editorBody).toBeVisible()
    await editorBody.click()
    await editorBody.pressSequentially('Updated editorial note')
    await expect(editorBody).toContainText('Updated editorial note')
  })

  test('reports required validation and preserves keyboard focus order', async ({ page }) => {
    const campaignName = page.getByLabel('Campaign name')
    await campaignName.fill('')
    await page.locator('form').filter({ has: page.getByRole('button', { name: /save fixture/i }) }).evaluate((form) => { (form as HTMLFormElement).noValidate = true })
    await page.getByRole('button', { name: /save fixture/i }).click()
    await expect(page.getByText('The campaign name field is required.')).toBeVisible()

    await campaignName.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Audience')).toBeFocused()
  })
})
