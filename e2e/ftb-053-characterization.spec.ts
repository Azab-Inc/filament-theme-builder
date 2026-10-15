import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'

test.describe('FTB-053 phase 1 builder characterization', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
    await page.goto(builderBaseUrl)
    await page.getByRole('tab', { name: 'Branding', exact: true }).click()
  })

  test('uploads a branding asset as multipart data and stores the returned reference', async ({ page }) => {
    let uploadedFile = false
    await page.route('**/api/branding-assets', async (route) => {
      const request = route.request()
      uploadedFile = request.method() === 'POST'
        && request.headers()['content-type']?.includes('multipart/form-data') === true
        && request.postData()?.includes('name="asset"') === true
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ reference: `${'a'.repeat(64)}/${'b'.repeat(40)}.png` }),
      })
    })

    await page.getByLabel('Upload light logo').setInputFiles({
      name: 'acme.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fixture-image-content'),
    })

    await expect(page.getByLabel('Light logo upload reference')).toHaveValue(`${'a'.repeat(64)}/${'b'.repeat(40)}.png`)
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(uploadedFile).toBe(true)
  })

  test('retains branding state and reports an upload rejection', async ({ page }) => {
    await page.route('**/api/branding-assets', (route) => route.fulfill({ status: 413 }))
    const initialReference = await page.getByLabel('Light logo upload reference').inputValue()

    await page.getByLabel('Upload light logo').setInputFiles({
      name: 'too-large.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fixture-image-content'),
    })

    await expect(page.getByRole('alert')).toHaveText(
      'Upload rejected. Use a JPEG, PNG, or WebP image within the temporary quota.',
    )
    await expect(page.getByLabel('Light logo upload reference')).toHaveValue(initialReference)
  })

  test('loads the shared builder stylesheet without Vue style tags', async ({ page }) => {
    await page.goto(builderBaseUrl)

    const stylesheet = await page.evaluate(() => Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from(sheet.cssRules).some((rule) => rule.cssText.includes('.editor-workspace'))
      } catch {
        return false
      }
    }))
    expect(stylesheet).toBe(true)

    const layout = await page.locator('[data-editor-workspace]').evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        paddingInlineStart: style.paddingInlineStart,
      }
    })

    expect(layout.display).toBe('grid')
    expect(layout.paddingInlineStart).toBe('16px')
  })

  for (const variant of ['A', 'B', 'C'] as const) {
    test(`preserves inspection prototype ${variant} layout styling at desktop and mobile widths`, async ({ page }) => {
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${builderBaseUrl}/?inspect=1&variant=${variant}`)

        const prototype = page.locator(`[data-hover-inspect-prototype="${variant}"]`)
        await expect(prototype).toBeVisible()
        const layout = await prototype.evaluate((element) => {
          const root = getComputedStyle(element)
          const workspace = element.querySelector('.inspect__workspace')
          return {
            background: root.backgroundColor,
            display: root.display,
            workspaceDisplay: workspace ? getComputedStyle(workspace).display : '',
          }
        })

        expect(layout).toEqual({
          background: 'rgb(245, 247, 251)',
          display: 'block',
          workspaceDisplay: 'grid',
        })
      }
    })
  }
})
