import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

async function openAuthenticatedBuilder(page: import('@playwright/test').Page) {
  await page.goto(`${baseUrl}/demo/admin/login`)
  await page.locator('#form\\.email').fill('user')
  await page.locator('#form\\.password').fill('password')
  await page.locator('#form').evaluate((form) => (form as HTMLFormElement).requestSubmit())
  await expect(page).toHaveURL(/\/demo\/admin$/)
  await page.goto(baseUrl)
  await expect(page.getByTitle('Filament preview')).toBeVisible()
}

async function navigatePreview(page: import('@playwright/test').Page, path: string) {
  const expectedUrl = `${new URL(baseUrl).origin}${path}`
  await page.getByTitle('Filament preview').evaluate((iframe, url) => {
    (iframe as HTMLIFrameElement).src = url
  }, expectedUrl)
  await expect.poll(() => page.frames().find((frame) => frame !== page.mainFrame())?.url()).toBe(expectedUrl)
}

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')
test.use({ viewport: { width: 1800, height: 1100 } })

test.describe('Inspector text inputs and global radius regressions', () => {
  test('keeps ordinary text inputs in the Raw Inspector instead of mapping them to Product name', async ({ page }) => {
    await openAuthenticatedBuilder(page)
    await navigatePreview(page, '/demo/admin/discounts/1/edit')
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    const nameInput = frame.locator('#form\\.name')
    await expect(nameInput).toBeVisible()

    await page.getByRole('button', { name: 'Inspector' }).click()
    await nameInput.click()

    await expect(page.getByRole('tab', { name: 'Inspector' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('status', { name: /inspector/i })).not.toContainText('Product name input')
    await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-input')
  })

  test('maps only the identified Product name input to its Components control', async ({ page }) => {
    await openAuthenticatedBuilder(page)
    await navigatePreview(page, '/demo/admin/forms-showcase')
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    const productName = frame.getByLabel('Product name')
    await expect(productName).toBeVisible()

    await page.getByRole('button', { name: 'Inspector' }).click()
    await productName.click()

    await expect(page.getByRole('tab', { name: 'Components' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('status', { name: /inspector/i })).toContainText('Product name input')
  })

  test('global radius none squares variable-based Filament corners', async ({ page }) => {
    await openAuthenticatedBuilder(page)
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await expect(frame.locator('.fi-sidebar-item-btn').first()).toBeVisible()

    await page.locator('#radius').selectOption('none')

    for (const selector of ['.fi-sidebar-item-btn', '.fi-badge', '.fi-input-wrp', '.fi-section']) {
      const corner = frame.locator(selector).first()
      await expect(corner).toBeVisible()
      await expect.poll(() => corner.evaluate((element) => getComputedStyle(element).borderRadius)).toBe('0px')
    }
  })
})
