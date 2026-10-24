import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')

test.describe('FTB-007 semantic Inspector', () => {
  test.beforeEach(async ({ page }) => {
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
    await frame.locator('a[href="http://127.0.0.1:4175/demo/admin"], a[href="/demo/admin"]').first().dispatchEvent('click')
    await expect.poll(() => page.frames().find((candidate) => candidate !== page.mainFrame())?.url()).toContain('/demo/admin')
  })

  test('shows temporary and persistent outlines on real Filament elements', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    const target = frame.locator('.fi-section:visible').first()
    await target.hover()
    await expect(target).toHaveClass(/ftb-inspector-hover|ftb-inspector-selected/)
    await target.click()
    await expect(target).toHaveClass(/ftb-inspector-selected/)
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)
  })

  test('highlights a stats card instead of its containing section', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    const card = frame.locator('.fi-wi-stats-overview-stat').first()
    const section = frame.locator('.fi-section').first()
    await card.hover()
    await expect(card).toHaveClass(/ftb-inspector-hover/)
    await expect(section).not.toHaveClass(/ftb-inspector-hover/)
  })

  test('selector-only matches show a breadcrumb without navigating the editor', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section').filter({ hasText: 'Commerce overview' }).first().dispatchEvent('click')
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)
    await expect(page).toHaveURL(/\/$/)
  })

  test('mapped product input navigates to its existing control', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByTitle('Filament preview').evaluate((iframe, url) => {
      (iframe as HTMLIFrameElement).src = `${url}/demo/admin/forms-showcase`
    }, baseUrl)
    await expect(frame.locator('.fi-fo-text-input .fi-input').first()).toBeVisible()
    await page.getByRole('button', { name: 'Inspector' }).click()
    await page.getByTitle('Filament preview').evaluate(async (element) => {
      await (element as HTMLIFrameElement).contentWindow?.eval(`window.parent.postMessage({
        type: 'ftb:inspector:select',
        protocolVersion: 1,
        target: { candidateSelectors: ['.fi-fo-text-input .fi-input'], classNames: ['fi-input'] },
      }, location.origin)`)
    })
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/product name/i)
    await expect(page.locator('[data-editor-target="form.product-name"]')).toBeInViewport()
  })

  test('nested clicks resolve to the semantic button ancestor', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByTitle('Filament preview').evaluate((iframe, url) => {
      (iframe as HTMLIFrameElement).src = `${url}/demo/admin/actions-showcase`
    }, baseUrl)
    await page.getByRole('button', { name: 'Inspector' }).click()
    const button = frame.locator('.fi-btn.fi-color-primary').first()
    await button.locator('svg').first().dispatchEvent('click', { bubbles: true, cancelable: true })
    await expect(button).toHaveClass(/ftb-inspector-selected/)
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/fi-btn|button/i)
  })

  test('clears selection and breadcrumb on iframe navigation and reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Inspector' }).click()
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await frame.locator('.fi-section:visible').first().click()
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)

    await page.getByTitle('Filament preview').evaluate((element, url) => {
      (element as HTMLIFrameElement).src = `${url}/demo/admin`
    }, baseUrl)
    await expect(frame.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('status', { name: /inspector/i })).toHaveText('Inspector enabled')
    await expect(frame.locator('.ftb-inspector-selected')).toHaveCount(0)

    await frame.locator('.fi-section:visible').first().click()
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText(/section/i)
    await page.getByTitle('Filament preview').evaluate((element) => {
      (element as HTMLIFrameElement).contentWindow?.location.reload()
    })
    await expect(frame.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('status', { name: /inspector/i })).toHaveText('Inspector enabled')
    await expect(frame.locator('.ftb-inspector-selected')).toHaveCount(0)
  })
})
