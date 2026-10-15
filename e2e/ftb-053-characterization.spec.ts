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
})
