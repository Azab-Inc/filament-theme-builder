import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

async function openAuthenticatedBuilder(page: import('@playwright/test').Page) {
  await page.goto(`${baseUrl}/demo/admin/login`)
  await page.locator('#form\\.email').fill('user')
  await page.locator('#form\\.password').fill('password')
  await page.locator('#form').evaluate((form) => (form as HTMLFormElement).requestSubmit())
  await expect(page).toHaveURL(/\/demo\/admin$/)
  await page.goto(baseUrl)
}

async function navigatePreview(page: import('@playwright/test').Page, path: string) {
  const expectedUrl = `${new URL(baseUrl).origin}${path}`
  await page.getByTitle('Filament preview').evaluate((iframe, url) => {
    (iframe as HTMLIFrameElement).src = url
  }, expectedUrl)
  await expect.poll(() => page.frames().find((frame) => frame !== page.mainFrame())?.url()).toBe(expectedUrl)
}

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')
test.use({ viewport: { width: 1600, height: 1000 } })

test.describe('FTB-007 semantic Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 2200, height: 1200 })
    await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
    await page.goto(baseUrl)
    await expect(page.getByTitle('Filament preview')).toBeVisible()
    await expect(page.frameLocator('iframe[title="Filament preview"]').getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('toggles without reloading the iframe and preserves normal navigation when off', async ({ page }) => {
    const iframe = page.getByTitle('Filament preview')
    const src = await iframe.getAttribute('src')

    await page.getByRole('button', { name: 'Inspector' }).click()
    await expect(page.getByRole('button', { name: 'Inspector' })).toHaveAttribute('aria-pressed', 'true')
    await expect(iframe).toHaveAttribute('src', src!)
    await page.getByRole('button', { name: 'Inspector' }).click()
    await expect(page.getByRole('button', { name: 'Inspector' })).toHaveAttribute('aria-pressed', 'false')
    await expect(iframe).toHaveAttribute('src', src!)

    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await frame.locator('a[href$="/demo/admin"]').first().dispatchEvent('click')
    await expect.poll(() => page.frames().find((candidate) => candidate !== page.mainFrame())?.url()).toContain('/demo/admin')
  })

  test('shows temporary and persistent outlines on real Filament elements', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    const target = frame.locator('.fi-section:visible').first()
    await target.dispatchEvent('mouseover')
    await expect(target).toHaveClass(/ftb-inspector-hover|ftb-inspector-selected/)
    await target.dispatchEvent('click')
    await page.getByLabel('Inspector target scope').evaluate((select) => {
      const option = [...(select as HTMLSelectElement).options].find((candidate) => candidate.textContent?.startsWith('Surface: .fi-section'))
      if (!option) throw new Error('section surface option missing')
      ;(select as HTMLSelectElement).value = option.value
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await expect(target).toHaveClass(/ftb-inspector-selected/)
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)
  })

  test('highlights a stats card instead of its containing section', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    const card = frame.locator('.fi-wi-stats-overview-stat').first()
    const section = frame.locator('.fi-section').first()
    await card.dispatchEvent('mouseover')
    await expect(card).toHaveClass(/ftb-inspector-hover/)
    await expect(section).not.toHaveClass(/ftb-inspector-hover/)
  })

  test('highlights table rows and sidebar links as individual targets', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()

    const sidebarLink = frame.locator('.fi-sidebar-item-btn').first()
    await sidebarLink.hover()
    await expect(sidebarLink.locator('.ftb-inspector-hover')).toHaveCount(1)
    await sidebarLink.click()
    await expect(sidebarLink.locator('.ftb-inspector-selected')).toHaveCount(1)

    const tableRow = frame.locator('.fi-ta-row').first()
    await tableRow.hover()
    await expect(frame.locator('.ftb-inspector-hover')).toHaveCount(1)
    await expect(tableRow).not.toHaveClass(/ftb-inspector-hover/)
    await expect(tableRow).not.toHaveClass(/ftb-inspector-selected/)
  })

  test('selector-only matches show a breadcrumb without navigating the editor', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section').filter({ hasText: 'Commerce overview' }).first().click()
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)
    await expect(page).toHaveURL(/\/$/)
  })

  test('mapped product input navigates to its existing control', async ({ page }) => {
    await openAuthenticatedBuilder(page)
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await navigatePreview(page, '/demo/admin/forms-showcase')
    const productName = frame.getByLabel('Product name')
    await expect(productName).toBeVisible()
    await page.evaluate(() => window.addEventListener('message', (event) => {
      if (event.data?.type === 'ftb:inspector:select') {
        ;(window as Window & { __ftbSelectedEvidence?: unknown }).__ftbSelectedEvidence = event.data.target
      }
    }))
    await page.getByRole('button', { name: 'Inspector' }).click()
    await productName.click()
    const selectedEvidence = await page.evaluate(() => (window as Window & { __ftbSelectedEvidence?: { candidateSelectors: string[] } }).__ftbSelectedEvidence)
    expect(selectedEvidence?.candidateSelectors).toContain('.fi-fo-text-input .fi-input')
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/product name/i)
    await expect(page.locator('[data-editor-target="form.product-name"]')).toBeInViewport()
    await expect(page.getByRole('tab', { name: 'Components' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-advanced-inspector]')).toHaveCount(0)
  })

  test('keeps global search input selection and raw selector local to that element', async ({ page }) => {
    await openAuthenticatedBuilder(page)
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await navigatePreview(page, '/demo/admin/tables-showcase')
    const search = frame.getByRole('searchbox', { name: 'Global search' })
    await expect(search).toBeVisible()
    await page.evaluate(() => window.addEventListener('message', (event) => {
      if (event.data?.type === 'ftb:inspector:select') {
        ;(window as Window & { __ftbSelectedEvidence?: unknown }).__ftbSelectedEvidence = event.data.target
      }
    }))

    await page.getByRole('button', { name: 'Inspector' }).click()
    await search.click()
    const selectedEvidence = await page.evaluate(() => (window as Window & { __ftbSelectedEvidence?: { targetSelector: string | null; candidateSelectors: string[] } }).__ftbSelectedEvidence)
    expect(selectedEvidence?.targetSelector).toContain('.fi-input')
    expect(selectedEvidence?.candidateSelectors).toContain('.fi-global-search .fi-input')
    expect(selectedEvidence?.candidateSelectors).not.toContain('.fi-fo-text-input .fi-input')
    await expect(page.getByRole('status', { name: /inspector/i })).not.toContainText(/product name/i)
    await page.getByRole('tab', { name: 'Inspector' }).click()
    await expect(page.getByLabel('Raw element selector')).toHaveValue(selectedEvidence!.targetSelector!)
    await expect(page.getByLabel('Raw element selector')).not.toHaveValue('.fi-fo-text-input .fi-input')
  })

  test('nested sidebar icon clicks preserve the explicit icon target', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    const button = frame.locator('.fi-sidebar-item-btn:visible').first()
    const icon = button.locator('.fi-sidebar-item-icon').first()
    await icon.hover()
    await icon.click()
    await expect(icon).toHaveClass(/ftb-inspector-selected/)
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/heroicon|sidebar|button/i)
  })

  test('selects dashboard breadcrumb, table titles, and exact classless targets', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()

    const breadcrumb = frame.locator('.fi-breadcrumbs').first()
    await breadcrumb.hover()
    await breadcrumb.click()
    await expect(breadcrumb.locator('.ftb-inspector-selected')).toHaveCount(1)

    const title = frame.locator('.fi-ta-header-heading').first()
    await title.hover()
    await title.click()
    await expect(title).toHaveClass(/ftb-inspector-selected/)
    await expect(frame.locator('.fi-ta').first()).not.toHaveClass(/ftb-inspector-selected/)

    const classlessAvailable = await frame.locator('main *').evaluateAll((elements) => {
      const target = elements.find((element) => {
        const rect = element.getBoundingClientRect()
        return !element.hasAttribute('class') && element.children.length === 0
          && !element.closest('button, a, [role="button"], svg')
          && Boolean(element.textContent?.trim()) && rect.width > 0 && rect.height > 0
      })
      target?.setAttribute('data-ftb-test-target', 'classless-selection')
      return Boolean(target)
    })
    expect(classlessAvailable).toBe(true)
    const classless = frame.locator('[data-ftb-test-target="classless-selection"]')
    await classless.hover()
    await classless.click()
    const selectedClassless = frame.locator('[data-ftb-test-target="classless-selection"]')
    await expect(selectedClassless).toHaveClass(/ftb-inspector-selected/)
    await expect(page.getByLabel('Raw element selector')).toHaveValue('')
    await expect(page.getByText('No safe selector was detected.')).toBeVisible()
  })

  test('inspects resource breadcrumbs, table titles, filter trigger, and open filter controls safely', async ({ page }) => {
    await openAuthenticatedBuilder(page)
    const iframe = page.getByTitle('Filament preview')
    const frame = page.frameLocator('iframe[title="Filament preview"]')

    await navigatePreview(page, '/demo/admin/products/2')
    const breadcrumb = frame.locator('.fi-breadcrumbs a').first()
    await expect(breadcrumb).toBeVisible()
    const recordUrl = await iframe.getAttribute('src')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await breadcrumb.hover()
    await breadcrumb.click()
    await expect(breadcrumb).toHaveClass(/ftb-inspector-selected/)
    await expect(iframe).toHaveAttribute('src', recordUrl!)
    await page.getByRole('button', { name: 'Inspector' }).click()
    await breadcrumb.click()
    await expect.poll(() => page.frames().find((candidate) => candidate !== page.mainFrame())?.url()).toContain('/demo/admin/products')

    await navigatePreview(page, '/demo/admin/tables-showcase')
    const title = frame.locator('.fi-ta-header-heading').first()
    await expect(title).toHaveText('Showcase products')
    const filterTrigger = frame.getByRole('button', { name: 'Filter' }).first()
    await expect(filterTrigger).toBeVisible()
    const rowCount = await frame.locator('.fi-ta-row').count()

    await page.getByRole('button', { name: 'Inspector' }).click()
    await title.hover()
    await title.click()
    await expect(title).toHaveClass(/ftb-inspector-selected/)
    await expect(frame.locator('.fi-ta').first()).not.toHaveClass(/ftb-inspector-selected/)
    await page.getByRole('button', { name: 'Inspector' }).click()

    await filterTrigger.click()
    await expect(filterTrigger).toHaveAttribute('aria-expanded', 'true')
    const panelId = await filterTrigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    const filterPanel = frame.locator(`#${panelId}`)
    await expect(filterPanel).toBeVisible()
    const filterControl = filterPanel.locator('select').first()
    await expect(filterControl).toBeVisible()
    const originalFilterValue = await filterControl.inputValue()

    await page.getByRole('button', { name: 'Inspector' }).click()
    await filterTrigger.click()
    await expect(filterTrigger).toHaveClass(/ftb-inspector-selected/)
    await expect(filterTrigger).toHaveAttribute('aria-expanded', 'true')
    await filterControl.click()
    await expect(filterControl).toHaveClass(/ftb-inspector-selected/)
    await expect(filterControl).toHaveValue(originalFilterValue)
    await frame.getByRole('button', { name: 'Apply filters' }).first().click()
    await expect(filterTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(frame.locator('.fi-ta-row')).toHaveCount(rowCount)
  })

  test('audits configured page families and representative resource routes without mutations', async ({ page }) => {
    test.setTimeout(120_000)
    await openAuthenticatedBuilder(page)
    const paths = [
      '/demo/admin', '/demo/admin/showcase', '/demo/admin/forms-showcase', '/demo/admin/tables-showcase',
      '/demo/admin/infolists-showcase', '/demo/admin/actions-showcase', '/demo/admin/notifications-showcase',
      '/demo/admin/states-showcase', '/demo/admin/anonymous-upload', '/demo/admin/profile',
      '/demo/admin/addresses', '/demo/admin/categories', '/demo/admin/customers', '/demo/admin/discounts',
      '/demo/admin/inventories', '/demo/admin/notes', '/demo/admin/order-status-histories', '/demo/admin/orders',
      '/demo/admin/payments', '/demo/admin/product-variants', '/demo/admin/products', '/demo/admin/refunds',
      '/demo/admin/reviews', '/demo/admin/shipments', '/demo/admin/suppliers', '/demo/admin/tags',
      '/demo/admin/products/create', '/demo/admin/products/2', '/demo/admin/products/2/edit',
      '/demo/admin/orders/create', '/demo/admin/orders/1', '/demo/admin/orders/1/edit',
      '/demo/admin/orders/1/order-items', '/demo/admin/orders/1/order-items/create',
    ]
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    const audit = []
    for (const path of paths) {
      await navigatePreview(page, path)
      audit.push(await frame.locator('body').evaluate((body) => ({
        route: body.ownerDocument.location.pathname,
        login: body.querySelector('h1')?.textContent?.trim() === 'Sign in',
        breadcrumbs: body.querySelectorAll('.fi-breadcrumbs').length,
        breadcrumbLinks: body.querySelectorAll('.fi-breadcrumbs a').length,
        tableTitles: body.querySelectorAll('.fi-ta-header-heading').length,
        filterButtons: body.querySelectorAll('button[aria-label="Filter"]').length,
        rows: body.querySelectorAll('.fi-ta-row').length,
        sections: body.querySelectorAll('.fi-section').length,
        controls: body.querySelectorAll('input, select, textarea').length,
      })))
    }
    console.log(`INSPECTOR_ROUTE_AUDIT ${JSON.stringify(audit)}`)
    expect(audit.filter((entry) => entry.login).map((entry) => entry.route)).toEqual([])
  })

  test('clears selection and breadcrumb on iframe navigation and reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Inspector' }).click()
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await frame.locator('.fi-section:visible').first().dispatchEvent('click')
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)

    await page.getByTitle('Filament preview').evaluate((element, url) => {
      (element as HTMLIFrameElement).src = `${url}/demo/admin`
    }, baseUrl)
    await expect(frame.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('status', { name: /inspector/i })).toHaveText('Inspector enabled')
    await expect(frame.locator('.ftb-inspector-selected')).toHaveCount(0)

    await frame.locator('.fi-section:visible').first().dispatchEvent('click')
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)
    await page.getByTitle('Filament preview').evaluate((element) => {
      (element as HTMLIFrameElement).contentWindow?.location.reload()
    })
    await expect(frame.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('status', { name: /inspector/i })).toHaveText('Inspector enabled')
    await expect(frame.locator('.ftb-inspector-selected')).toHaveCount(0)
  })
})
