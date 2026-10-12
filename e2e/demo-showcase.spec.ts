import { expect, test, type Page, type StorageState } from '@playwright/test'

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
const demoBaseUrl = process.env.DEMO_BASE_URL ?? (process.env.COMPOSE_E2E === '1' ? composeBaseUrl : 'http://127.0.0.1:4174')
const uploadBoundaryTestsEnabled = process.env.DEMO_UPLOAD_TEST_LIMITS === '1'

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

  test('public showcase index groups real pages and exposes native presentation surfaces', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${demoBaseUrl}/demo/admin/showcase`)
    await expect(page.getByRole('heading', { name: 'Showcase', exact: true })).toBeVisible()

    for (const [label, href] of [
      ['Dashboard', '/demo/admin'],
      ['Forms & Schemas', '/demo/admin/forms-showcase'],
      ['Tables', '/demo/admin/tables-showcase'],
      ['Infolists', '/demo/admin/infolists-showcase'],
      ['Actions & Modals', '/demo/admin/actions-showcase'],
      ['Notifications', '/demo/admin/notifications-showcase'],
    ] as const) {
      await expect(page.getByRole('link', { name: label, exact: true }).first()).toHaveAttribute('href', new RegExp(`${href.replaceAll('/', '\\/')}$`))
    }

    await expect(page.getByRole('region', { name: 'Controlled tenant presentation' })).toContainText('No tenant is persisted')
    const showcaseTabs = page.getByRole('navigation', { name: 'Tabs' })
    await expect(showcaseTabs).toBeVisible()
    await expect(showcaseTabs.getByRole('link', { name: 'Forms & Schemas', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Showcase')
    await expect(page.getByRole('link', { name: 'Showcase', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('region', { name: 'Demo reset notice' })).toContainText('Demo data resets every 10 minutes')

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Showcase', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Controlled tenant presentation' })).toBeVisible()
    const mobileSubNavigation = page.locator('.fi-page-sub-navigation-dropdown button')
    await expect(mobileSubNavigation).toBeVisible()
    await mobileSubNavigation.click()
    await expect(page.getByRole('link', { name: 'Forms & Schemas', exact: true }).last()).toBeVisible()
  })

  test('native search keyboard shortcut opens an accessible search surface and profile controls remain available', async ({ page }) => {
    await page.keyboard.press('Control+K')
    const search = page.getByRole('searchbox', { name: 'Global search' })
    await expect(search).toBeFocused()
    await search.fill('DEMO-ORDER-1001')
    const searchResults = page.getByRole('list').filter({ hasText: 'DEMO-ORDER-1001' }).last()
    await expect(searchResults).toBeVisible()
    await expect(searchResults).toContainText('DEMO-ORDER-1001')
    await page.keyboard.press('Escape')
    await expect(searchResults).toBeHidden()

    await page.getByRole('button', { name: /user menu|demo user|user/i }).first().click()
    await expect(page.getByRole('link', { name: 'Profile', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Topbar' }).getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.keyboard.press('Control+K')
    await expect(page.getByRole('searchbox', { name: 'Global search' })).toBeFocused()
  })

  test('sidebar is collapsible while active navigation and deterministic badges remain discoverable', async ({ page }) => {
    const collapse = page.getByRole('button', { name: /collapse sidebar/i })
    await expect(collapse).toBeVisible()
    await collapse.click()
    await expect(page.getByRole('button', { name: /expand sidebar/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Products', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page')
  })

  test('anonymous visitors reach the public index, focused pages redirect to login, and credentials authenticate', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${demoBaseUrl}/demo/admin/showcase`)
    await expect(page.getByRole('heading', { name: 'Showcase', exact: true })).toBeVisible()

    await page.goto(`${demoBaseUrl}/demo/admin/forms-showcase`)
    await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin/login`)
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByText('Username: user')).toBeVisible()
    await expect(page.getByText('Password: password')).toBeVisible()

    await page.getByLabel(/username/i).fill('user')
    await page.getByRole('textbox', { name: /password/i }).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin/forms-showcase`)
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByRole('link', { name: 'Profile', exact: true }).click()
    await expect(page).toHaveURL(`${demoBaseUrl}/demo/admin/profile`)
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

  test('does not expose destructive deletion for seeded showcase fixtures', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/products/1/edit`)
    const deleteAction = page.getByRole('button', { name: /^Delete$/i })
    await expect(deleteAction).toBeVisible()
    await expect(deleteAction).toBeDisabled()
  })
})

test.describe('forms and schemas showcase', () => {
  test.describe.configure({ mode: 'serial' })

  async function uploadFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    const uploadResponse = page.waitForResponse((response) => response.url().includes('/livewire-') && !response.url().endsWith('/update'))
    await page.locator('input[type="file"]').setInputFiles(file)
    expect((await uploadResponse).status()).toBe(200)
  }

  test.beforeEach(async ({ page }) => {
    await useAuthenticatedSession(page)
    await page.goto(`${demoBaseUrl}/demo/admin/forms-showcase`)
  })

  test('shows native product, customer, and order controls in light and dark modes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.getByRole('heading', { name: 'Forms & Schemas' })).toBeVisible()
    await expect(page.getByText('ProductEditorForm', { exact: true })).toBeVisible()
    await expect(page.getByText('CustomerContactForm', { exact: true })).toBeVisible()
    await expect(page.getByText('OrderStatusForm', { exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Product wizard' })).toBeVisible()
    await expect(page.getByRole('tablist', { name: 'Product tabs' })).toBeVisible()
    await expect(page.getByLabel('Product name')).toHaveValue('Considered Field Notebook')
    await expect(page.getByLabel('Product category')).toHaveValue('stationery')
    await expect(page.getByLabel('Product availability')).toBeChecked()
    await expect(page.getByLabel('Product launch date')).toHaveValue('2026-10-10')
    await expect(page.getByLabel('Product reference')).toBeDisabled()
    await expect(page.getByText('JPEG, PNG, WebP, or PDF up to 5 MB', { exact: true })).toBeVisible()
    await expect(page.locator('input[type="file"]')).toHaveCount(1)
    await expect(page.locator('input[type="file"]')).toHaveAttribute('accept', /image\/jpeg/)
    await expect(page.getByLabel('Street address')).toHaveValue('14 Market Street')
    await expect(page.getByLabel('Contact email')).toHaveValue('hello@example.test')
    await expect(page.getByLabel('Order status')).toHaveValue('pending')

    const lightControlStyle = await page.getByLabel('Product name').evaluate((control) => {
      const styles = getComputedStyle(control)
      return { backgroundColor: styles.backgroundColor, color: styles.color }
    })

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.getByRole('heading', { name: 'Forms & Schemas' })).toBeVisible()
    await expect(page.getByText('ProductEditorForm', { exact: true })).toBeVisible()
    const darkControlStyle = await page.getByLabel('Product name').evaluate((control) => {
      const styles = getComputedStyle(control)
      return { backgroundColor: styles.backgroundColor, color: styles.color }
    })
    expect(darkControlStyle).not.toEqual(lightControlStyle)
  })

  test('accepts safe document uploads and explains rejected files', async ({ page }) => {
    const upload = page.locator('input[type="file"]')
    await uploadFile(page, { name: 'fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fixture') })
    await expect(page.getByRole('group', { name: 'fixture.pdf' })).toBeVisible()

    await upload.setInputFiles({ name: 'payload.php', mimeType: 'application/x-php', buffer: Buffer.from('<?php echo "no";') })
    await expect(page.getByText('File of invalid type', { exact: true })).toBeVisible()
    await expect(page.getByText('Expects image/jpeg, image/png, image/webp or application/pdf', { exact: true })).toBeVisible()
  })

  test('reports the temporary quota after a valid upload is submitted', async ({ page }) => {
    test.skip(!uploadBoundaryTestsEnabled, 'Run with the explicit Compose test-safe upload limits.')

    await page.context().clearCookies()
    await page.goto(`${demoBaseUrl}/demo/admin/anonymous-upload`)
    await expect(page.getByRole('heading', { name: 'Anonymous demo uploads' })).toBeVisible()

    const upload = page.locator('input[type="file"]')
    const save = page.getByRole('button', { name: 'Save anonymous upload', exact: true })
    const pdf = (name: string) => ({
      name,
      mimeType: 'application/pdf',
      buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(8192 - 9, 120)]),
    })

    await uploadFile(page, pdf('first.pdf'))
    await expect(page.getByRole('group', { name: 'first.pdf' })).toBeVisible()
    const firstSave = page.waitForResponse((response) => response.url().includes('/livewire-') && response.url().endsWith('/update'))
    await save.click()
    expect((await firstSave).status()).toBe(200)

    await page.reload()
    await uploadFile(page, pdf('second.pdf'))
    await expect(page.getByRole('group', { name: 'second.pdf' })).toBeVisible()
    await save.click()
    await expect(page.getByText('Your temporary upload space is full. Remove a file before uploading another.', { exact: true })).toBeVisible()
  })

  test('reports the five megabyte limit for oversized uploads', async ({ page }) => {
    test.skip(!uploadBoundaryTestsEnabled, 'Run with the explicit Compose test-safe upload limits.')

    await page.context().clearCookies()
    await page.goto(`${demoBaseUrl}/demo/admin/anonymous-upload`)
    await expect(page.getByRole('heading', { name: 'Anonymous demo uploads' })).toBeVisible()

    const upload = page.locator('input[type="file"]')
    await upload.setInputFiles({
      name: 'oversized.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(32768 - 9, 120)]),
    })
    await expect(page.getByText('File is too large', { exact: true })).toBeVisible()
    await expect(page.getByText('Maximum file size is 16 KB', { exact: true })).toBeVisible()
  })

  test('shows named product, customer, and order fixtures with distinct native layouts', async ({ page }) => {
    await expect(page.getByText('ProductEditorForm', { exact: true })).toBeVisible()
    await expect(page.getByText('CustomerContactForm', { exact: true })).toBeVisible()
    await expect(page.getByText('OrderStatusForm', { exact: true })).toBeVisible()
    await expect(page.getByText('Section / grid layout', { exact: true })).toBeVisible()
    await expect(page.getByText('Wizard steps layout', { exact: true })).toBeVisible()
    await expect(page.getByText('Tabbed form layout', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Product name')).toHaveValue('Considered Field Notebook')
    await expect(page.getByLabel('Product price')).toHaveValue('24')
    await expect(page.getByText('JPEG, PNG, WebP, or PDF up to 5 MB', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Street address')).toHaveValue('14 Market Street')
    await expect(page.getByLabel('Contact email')).toHaveValue('hello@example.test')
    await expect(page.getByLabel('Order status')).toHaveValue('pending')
  })

  test('exposes the registered shared form selectors in the real Filament markup', async ({ page }) => {
    const productSection = page.locator('.fi-section').filter({ hasText: 'ProductEditorForm' }).first()
    await expect(productSection).toBeVisible()
    await expect(productSection.getByRole('heading', { name: 'ProductEditorForm', exact: true })).toBeVisible()

    const productNameField = page.locator('.fi-fo-field').filter({ has: page.getByLabel('Product name') }).first()
    await expect(productNameField).toContainText('Product name')
    await expect(productNameField.getByRole('textbox', { name: 'Product name' })).toHaveValue('Considered Field Notebook')

    const productNameTextInput = page.locator('.fi-fo-text-input').filter({ has: page.getByLabel('Product name') }).first()
    await expect(productNameTextInput.getByLabel('Product name')).toHaveValue('Considered Field Notebook')
    await expect(productNameTextInput.locator('.fi-input').first()).toBeVisible()

    const productSelectField = page.locator('.fi-fo-select').filter({ has: page.getByLabel('Product category') }).first()
    await expect(productSelectField.getByRole('combobox', { name: 'Product category' })).toHaveValue('stationery')
    await expect(productSelectField.locator('.fi-select-input').first()).toHaveValue('stationery')

    await expect(page.getByLabel('Product availability')).toHaveRole('switch')
    await expect(page.locator('.fi-fo-toggle').first()).toHaveRole('switch')
    await expect(page.locator('.fi-fo-date-time-picker').filter({ has: page.getByLabel('Product launch date') }).first().getByLabel('Product launch date')).toHaveValue('2026-10-10')
    await expect(page.locator('.fi-fo-textarea').filter({ has: page.getByLabel('Long text fixture') }).first().getByLabel('Long text fixture')).toBeVisible()
    const productUpload = page.locator('.fi-fo-file-upload').filter({ hasText: 'Drag & Drop your files' }).first()
    await expect(productUpload).toHaveRole('group')
    await expect(productUpload).toContainText('Browse Files')
    await expect(page.getByLabel('Product image')).toHaveCount(1)

    const productWizard = page.locator('.fi-sc-wizard').filter({ has: page.getByRole('list', { name: 'Product wizard' }) }).first()
    await expect(productWizard.getByRole('list', { name: 'Product wizard' })).toBeVisible()
    await expect(productWizard.locator('.fi-sc-wizard-header-step-btn').filter({ hasText: 'Details' })).toBeDisabled()
    await expect(productWizard.locator('.fi-sc-wizard-step').filter({ has: page.getByLabel('Product SKU') })).toBeVisible()

    const productTabs = page.getByRole('tablist', { name: 'Product tabs' })
    await expect(productTabs).toHaveClass(/fi-tabs/)
    await expect(productTabs.locator('.fi-tabs-item').filter({ hasText: 'Pricing' })).toHaveAttribute('aria-selected', 'true')

    await expect(page.getByText('ProductEditorForm', { exact: true })).toBeVisible()
    await expect(page.getByText('CustomerContactForm', { exact: true })).toBeVisible()
    await expect(page.getByText('OrderStatusForm', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Product reference')).toBeDisabled()
    await page.getByLabel('Product name').focus()
    await expect(page.getByLabel('Product name')).toBeFocused()
  })

  test('projects the Product name inheritance controls onto the real focused input', async ({ page }) => {
    test.skip(process.env.COMPOSE_E2E !== '1', 'This acceptance test targets the Compose gateway.')
    await page.goto(composeBaseUrl)
    const frame = page.frame({ url: /\/demo\/admin/ })
    expect(frame).toBeTruthy()
    await frame!.goto(`${composeBaseUrl}/demo/admin/forms-showcase`)
    const productName = frame!.getByLabel('Product name')
    await expect(productName).toHaveValue('Considered Field Notebook')

    await page.locator('input[aria-label="Product name global background"]').fill('#111827')
    await expect(page.getByRole('status').filter({ hasText: 'Explicit' }).first()).toBeVisible()
    await expect.poll(() => productName.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/17, 24, 39/)

    await page.locator('input[aria-label="Product name component background"]').fill('#1f2937')
    await page.locator('input[aria-label="Product name variant background"]').fill('#374151')
    await expect.poll(() => productName.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/55, 65, 81/)

    await page.locator('input[aria-label="Product name state background"]').fill('#4b5563')
    await productName.focus()
    await expect.poll(() => productName.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/75, 85, 99/)

    await page.getByRole('button', { name: 'Reset Product name state background' }).click()
    await expect.poll(() => productName.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/55, 65, 81/)

    await frame!.evaluate(() => {
      const capture = window as Window & { __ftbMessage?: Record<string, any>; __ftbAccepted?: number }
      capture.__ftbAccepted = 0
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'ftb:theme:update') capture.__ftbMessage = event.data
      })
      window.addEventListener('ftb:preview-message-accepted', () => { capture.__ftbAccepted! += 1 })
    })
    await page.getByLabel('Primary color').fill('#0f766e')
    await expect.poll(() => frame!.locator('#ftb-managed-theme').textContent()).toContain('#0f766e')
    await expect.poll(() => frame!.evaluate(() => (window as Window & { __ftbAccepted: number }).__ftbAccepted)).toBeGreaterThan(0)

    const acceptedMessage = await frame!.evaluate(() => (window as Window & { __ftbMessage: Record<string, any> }).__ftbMessage)
    const acceptedCount = await frame!.evaluate(() => (window as Window & { __ftbAccepted: number }).__ftbAccepted)
    const productNameBackgroundBeforeForgedMessage = await productName.evaluate((element) => getComputedStyle(element).backgroundColor)
    acceptedMessage.theme.overrides = [{
      targetId: 'form.product-name',
      controlId: 'background',
      scope: 'component',
      componentId: 'attacker',
      value: '#dc2626',
    }]
    await page.evaluate((payload) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.contentWindow!.postMessage(payload, location.origin)
    }, acceptedMessage)
    await page.waitForTimeout(100)
    expect(await frame!.evaluate(() => (window as Window & { __ftbAccepted: number }).__ftbAccepted)).toBe(acceptedCount)
    await expect.poll(() => frame!.locator('#ftb-managed-theme').textContent()).toContain('#0f766e')
    expect(await productName.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(productNameBackgroundBeforeForgedMessage)
  })

  test('interacts with wizard and tabbed product layouts', async ({ page }) => {
    const wizard = page.getByRole('list', { name: 'Product wizard' })
    await expect(wizard).toBeVisible()
    await page.getByRole('button', { name: /Next/ }).click()
    await expect(page.getByLabel('Long text fixture')).toHaveValue(/A long deterministic fixture paragraph/)
    await expect(page.getByLabel('Product description')).toBeVisible()
    await page.getByRole('tab', { name: 'Notes' }).click()
    const productNotes = page.getByRole('textbox', { name: 'Product notes' })
    await expect(productNotes).toBeVisible()
    await productNotes.fill('A note for the showcase fixture.')
    await expect(productNotes).toHaveValue('A note for the showcase fixture.')
  })

  test('reports required validation and preserves keyboard focus order', async ({ page }) => {
    const orderStatus = page.getByLabel('Order status')
    await orderStatus.selectOption('')
    await page.locator('form').filter({ has: page.getByRole('button', { name: /save fixture/i }) }).evaluate((form) => { (form as HTMLFormElement).noValidate = true })
    await page.getByRole('button', { name: /save fixture/i }).click()
    await expect(page.getByText('The order status field is required.')).toBeVisible()
    await expect(page.locator('.fi-fo-field').filter({ has: page.getByLabel('Order status') }).locator('.fi-fo-select.fi-invalid')).toHaveCount(1)

    await page.getByLabel('Product name').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Product price')).toBeFocused()
  })

  test('shows distinct native fieldset, repeater, radio, and toggle button surfaces', async ({ page }) => {
    const metadata = page.locator('.fi-fieldset').filter({ hasText: 'Product metadata' }).first()
    await expect(metadata).toBeVisible()
    await expect(metadata.locator('.fi-grid')).toHaveCount(2)
    await expect(metadata.getByLabel('Material')).toHaveValue('paper')

    const contacts = page.locator('.fi-fo-repeater').filter({ hasText: 'Additional contact methods' }).first()
    await expect(contacts).toBeVisible()
    await expect(contacts.getByLabel('Contact method')).toHaveValue('Studio')
    await expect(contacts.getByLabel('Contact value')).toHaveValue('studio@example.test')

    const preferred = page.locator('.fi-fo-field').filter({ hasText: 'Preferred contact method' }).locator('.fi-fo-radio').first()
    await expect(preferred).toBeVisible()
    await expect(preferred.getByLabel('Email')).toBeChecked()

    const status = page.locator('.fi-fo-field').filter({ hasText: 'Status presentation' }).locator('.fi-fo-toggle-buttons').first()
    await expect(status).toBeVisible()
    await expect(status.getByLabel('Pending', { exact: true })).toBeChecked()
  })
})

test.describe('tables showcase', () => {
  test.beforeEach(async ({ page }) => {
    await useAuthenticatedSession(page)
    await page.goto(`${demoBaseUrl}/demo/admin/tables-showcase`)
  })

  test('shows accessible responsive table controls and seeded product data', async ({ page }) => {
    const table = page.getByRole('table', { name: /Showcase products/i })
    const productFixture = page.locator('.fi-ta').filter({ has: table })
    const orders = page.getByRole('table', { name: /Orders table fixture/i })
    const inventory = page.getByRole('table', { name: /Inventory table fixture/i })
    await expect(page.getByRole('heading', { name: 'Tables' })).toBeVisible()
    await expect(table).toBeVisible()
    await expect(orders).toBeVisible()
    await expect(inventory).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Product', exact: true })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Status/i })).toBeVisible()
    expect(await table.getByRole('row').count()).toBeGreaterThanOrEqual(3)
    await expect(table).toContainText('Demo Oak Chair')
    await expect(table).toContainText('Demo Brass Lamp')
    await expect(orders).toContainText('DEMO-ORDER-1001')
    await expect(inventory).toContainText('Demo Oak Chair')
    await expect(productFixture.getByRole('button', { name: 'Filter' })).toBeVisible()
    await expect(productFixture.getByRole('button', { name: 'Column manager' })).toBeVisible()
    await expect(table.getByRole('checkbox', { name: /select\/deselect all items/i })).toBeVisible()

    await productFixture.getByRole('combobox', { name: 'Group by' }).selectOption({ label: 'Status' })
    await expect(table.getByRole('heading', { name: /Status: active/i })).toBeVisible()

    await table.getByRole('button', { name: 'Product', exact: true }).click()
    await expect(table.getByRole('columnheader', { name: 'Product', exact: true })).toHaveAttribute('aria-sort', 'ascending')

    await productFixture.getByRole('button', { name: 'Column manager' }).click()
    await expect(page.getByRole('checkbox', { name: 'Supplier' })).toBeVisible()

    const supplierToggle = page.getByRole('checkbox', { name: 'Supplier' })
    await expect(supplierToggle).not.toBeChecked()
    await supplierToggle.check()
    await expect(supplierToggle).toBeChecked()

    await productFixture.getByRole('searchbox', { name: 'Search', exact: true }).fill('Brass Lamp')
    expect(await table.getByRole('row').count()).toBeGreaterThanOrEqual(2)

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(table).toBeVisible()
    await expect(page.getByRole('button', { name: /inspect/i }).first()).toBeVisible()
  })

  test('requires confirmation for the read-only row action and exposes empty state', async ({ page }) => {
    const productFixture = page.locator('.fi-ta').filter({ has: page.getByRole('table', { name: /Showcase products/i }) })
    await page.getByRole('button', { name: /inspect/i }).first().click()
    await expect(page.getByRole('heading', { name: /Inspect product/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /confirm/i })).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()

    await productFixture.getByRole('searchbox', { name: 'Search', exact: true }).fill('no such product')
    await expect(page.getByText('No products found', { exact: true })).toBeVisible()
  })

  test('confirms a selection action, exposes reorder controls, and keeps loading status accessible', async ({ page }) => {
    const table = page.getByRole('table', { name: /Showcase products/i })
    await expect(page.getByRole('status', { name: '' }).first()).toBeAttached()
    await table.getByRole('checkbox', { name: /select\/deselect item/i }).first().check()
    await expect(page.getByRole('button', { name: /review selection/i })).toBeVisible()
    await page.getByRole('button', { name: /review selection/i }).click()
    await expect(page.getByRole('heading', { name: /Review selected products/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /confirm/i })).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()

    await expect(page.getByRole('button', { name: 'Reorder records' })).toBeVisible()
    await page.getByRole('button', { name: 'Reorder records' }).click()
    await expect(page.getByRole('button', { name: 'Finish reordering' })).toBeVisible()
    const reorderRows = table.locator('tr[x-sortable-item]')
    await expect(reorderRows).toHaveCount(2)
    await reorderRows.nth(1).dragTo(reorderRows.nth(0))
    await expect(table.locator('tr[x-sortable-item]')).toHaveCount(2)
  })
})

test.describe('infolists showcase', () => {
  test.beforeEach(async ({ page }) => {
    await useAuthenticatedSession(page)
    await page.goto(`${demoBaseUrl}/demo/admin/infolists-showcase`)
  })

  test('renders accessible native entries, safe rich text, media, badges, icons, and repeatable rows', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.getByRole('heading', { name: 'Infolists' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Product overview' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Product details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Related order' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Order items' })).toBeVisible()
    await expect(page.getByText('DEMO-CHAIR-001', { exact: true })).toBeVisible()
    await expect(page.getByText('DEMO-ORDER-1001', { exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Customer profile details' }).getByText('Avery Demo', { exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Demo Oak Chair' })).toBeVisible()
    await expect(page.locator('.fi-in-icon')).toHaveCount(2)
    await expect(page.getByText('Demo bestseller', { exact: true })).toBeVisible()
    await expect(page.getByText('Featured fixture', { exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Product details showcase' }).getByText('Natural finish', { exact: true })).toBeVisible()
    await expect(page.getByText('Demo Brass Lamp', { exact: true })).toBeVisible()
    await expect(page.locator('script:has-text("alert(\\\"xss\\\")")')).toHaveCount(0)

    const lightSection = await page.getByRole('region', { name: 'Product overview' }).evaluate((element) => getComputedStyle(element).color)
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.getByRole('heading', { name: 'Infolists' })).toBeVisible()
    const darkSection = await page.getByRole('region', { name: 'Product overview' }).evaluate((element) => getComputedStyle(element).color)
    expect(darkSection).not.toBe(lightSection)
  })

  test('keeps seeded detail fixtures read-only with no mutation controls', async ({ page }) => {
    const showcase = page.locator('.fi-page')
    await expect(showcase.getByRole('heading', { name: 'Infolists' })).toBeVisible()
    await expect(showcase.getByText('DEMO-ORDER-1001', { exact: true })).toBeVisible()
    await expect(showcase.getByRole('button')).toHaveCount(0)
    await expect(showcase.getByRole('textbox')).toHaveCount(0)
  })

  test('shows distinct native infolist layouts and remains readable at narrow widths', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Customer profile' })).toBeVisible()
    await expect(page.getByText(/Order details: facts grouped/)).toBeVisible()
    await expect(page.getByText('Product attributes', { exact: true })).toBeVisible()
    await expect(page.locator('.fi-in-color')).toBeVisible()
    await expect(page.locator('.fi-in-key-value')).toHaveCount(2)
    await expect(page.locator('.fi-tabs')).toBeVisible()
    await expect(page.locator('.fi-fieldset')).toHaveCount(2)
    await expect(page.locator('.fi-sc-flex')).toHaveCount(2)
    await expect(page.locator('.fi-in-text').first()).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Customer profile' })).toBeVisible()
    await expect(page.getByText('DEMO-ORDER-1001', { exact: true })).toBeVisible()
  })
})

test.describe('actions and notifications showcase', () => {
  test.beforeEach(async ({ page }) => {
    await useAuthenticatedSession(page)
  })

  test('shows native action variants, grouped actions, tooltips, and disabled/loading semantics', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)
    await expect(page.getByRole('heading', { name: 'Actions & Modals' })).toBeVisible()
    for (const label of ['Primary action', 'Danger action', 'Success action', 'Warning action', 'Info action', 'Gray action', 'Outline action', 'Disabled action', 'Loading action', 'Tooltip action']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Disabled action' })).toBeDisabled()
    const loadingAction = page.getByRole('button', { name: 'Loading action' })
    await expect(loadingAction).toHaveAttribute('wire:loading.attr', 'disabled')
    await expect(loadingAction).toHaveAttribute('wire:click', "mountAction('loading')")
    await expect(loadingAction.locator('[wire\\:target="mountAction(\'loading\')"]')).toBeAttached()
    await expect(page.getByRole('button', { name: 'Icon-only action' })).toHaveAttribute('aria-label', 'Icon-only action')
    await expect(page.getByRole('button', { name: 'Tooltip action' })).toHaveAttribute('x-tooltip', /Explains this fixture action/)
    await expect(page.getByRole('button', { name: 'Action group' })).toBeVisible()
  })

  test('opens confirmation, form, slide-over, and read-only infolist modals accessibly', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)

    await page.getByRole('button', { name: 'Confirmation modal' }).click()
    const confirmation = page.locator('.fi-modal.fi-modal-open')
    await expect(confirmation).toContainText('This fixture is read-only.')
    expect(await confirmation.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await expect(page.getByRole('button', { name: /Cancel/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.fi-modal.fi-modal-open')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Confirmation modal' })).toBeFocused()

    await page.getByRole('button', { name: 'Form modal' }).click()
    const formDialog = page.locator('.fi-modal.fi-modal-open')
    await expect(formDialog.locator('.fi-modal-window')).toHaveClass(/fi-width-lg/)
    await expect(formDialog).toContainText('Form modal')
    await expect(formDialog.getByLabel('Fixture note')).toBeVisible()
    await formDialog.locator('form').evaluate((form) => { (form as HTMLFormElement).noValidate = true })
    await formDialog.getByRole('button', { name: /Submit fixture/ }).click()
    await expect(formDialog).toContainText('The fixture note field is required.')
    await expect(formDialog.getByRole('button', { name: /Save and review/ })).toBeVisible()
    await formDialog.getByRole('button', { name: /Cancel/ }).click()
    await expect(page.getByRole('button', { name: 'Form modal' })).toBeFocused()

    await page.getByRole('button', { name: 'Slide-over form' }).click()
    await expect(page.locator('.fi-modal.fi-modal-open')).toHaveClass(/fi-modal-slide-over/)
    await page.getByRole('button', { name: /Cancel/ }).click()

    await page.getByRole('button', { name: 'Read-only details' }).click()
    const details = page.locator('.fi-modal.fi-modal-open')
    await expect(details.locator('.fi-modal-window')).toHaveClass(/fi-width-md/)
    await expect(details).toContainText('DEMO-ACTION-001')
    await expect(details).not.toContainText('Submit')
    await expect(details.getByRole('button')).toHaveCount(2)
    await details.getByRole('button', { name: /Close/ }).last().click()
    await expect(page.getByRole('button', { name: 'Read-only details' })).toBeFocused()
  })

  test('keeps keyboard focus trapped inside the form modal and wraps in both directions', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)
    await page.getByRole('button', { name: 'Form modal' }).click()

    const formDialog = page.locator('.fi-modal.fi-modal-open')
    const focusable = formDialog.locator('input:visible, button:not([tabindex="-1"]):visible')
    await expect(focusable).not.toHaveCount(0)

    await focusable.first().focus()
    await page.keyboard.press('Shift+Tab')
    await expect(focusable.last()).toBeFocused()
    expect(await formDialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Tab')
    await expect(focusable.first()).toBeFocused()
    expect(await formDialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Tab')
    await expect(focusable.nth(1)).toBeFocused()
    expect(await formDialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Shift+Tab')
    await expect(focusable.first()).toBeFocused()
    await formDialog.getByRole('button', { name: /Cancel/ }).click()
    await expect(page.getByRole('button', { name: 'Form modal' })).toBeFocused()
  })

  test('shows native loading indicator during a pending Livewire action request', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)

    let releaseRequest!: () => void
    let requestIntercepted!: () => void
    const requestReachedBrowserBoundary = new Promise<void>((resolve) => { requestIntercepted = resolve })
    const requestReleased = new Promise<void>((resolve) => { releaseRequest = resolve })

    await page.route('**/livewire-*/update', async (route) => {
      requestIntercepted()
      await requestReleased
      await route.continue()
    })

    const loadingAction = page.getByRole('button', { name: 'Loading action' })
    const click = loadingAction.click()
    await requestReachedBrowserBoundary

    const loadingIndicator = loadingAction.locator('.fi-loading-indicator').last()
    await expect(loadingIndicator).toBeVisible()
    await expect(loadingAction).toBeDisabled()

    const response = page.waitForResponse((candidate) => candidate.url().includes('/livewire-') && candidate.url().endsWith('/update'))
    releaseRequest()
    await response
    await click
    await expect(loadingIndicator).toBeHidden()
    await expect(loadingAction).toBeEnabled()
  })

  test('shows deterministic notification statuses and content without relying on toast timing', async ({ page }) => {
    await page.goto(`${demoBaseUrl}/demo/admin/notifications-showcase`)
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    for (const [button, status, title, body] of [
      ['Show success notification', 'success', 'Success notification', 'A successful local fixture event.'],
      ['Show danger notification', 'danger', 'Danger notification', 'A dangerous local fixture event.'],
      ['Show warning notification', 'warning', 'Warning notification', 'A warning local fixture event.'],
      ['Show info notification', 'info', 'Info notification', 'An informational local fixture event.'],
    ] as const) {
      await page.getByRole('button', { name: button }).click()
      await expect(page.locator('.fi-no.fi-align-right.fi-vertical-align-start')).toBeVisible()
      const notification = page.locator(`.fi-no-notification.fi-status-${status}`).last()
      await expect(notification).toContainText(title)
      await expect(notification).toContainText(body)
      await notification.getByRole('button', { name: /close/i }).click()
    }

    await page.getByRole('button', { name: 'Show persistent notification' }).click()
    const persistent = page.locator('.fi-no-notification').filter({ hasText: 'Persistent fixture notification' })
    await expect(persistent).toHaveAttribute('x-data', /duration.*persistent/)
    await expect(persistent).toBeVisible()
    await persistent.getByRole('button', { name: /close/i }).click()

    await page.getByRole('button', { name: 'Show transient notification' }).click()
    const transient = page.locator('.fi-no-notification').filter({ hasText: 'Transient fixture notification' })
    await expect(transient).toHaveAttribute('x-data', /duration.*5000/)
    await expect(transient).toBeVisible()
  })
})
