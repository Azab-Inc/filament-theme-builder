import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')
test.use({ acceptDownloads: true })

test.describe('FTB-008 raw Inspector and FTB-004 CSS export', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
    await page.goto(`${baseUrl}/`)
    await expect(page.getByTitle('Filament preview')).toBeVisible()
    await expect(page.frameLocator('iframe[title="Filament preview"]').getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('edits a typed raw property live without reload or non-GET traffic', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.method() !== 'GET') requests.push(request.method())
    })
    const target = frame.locator('.fi-section:visible').first()
    const beforeUrl = await page.getByTitle('Filament preview').getAttribute('src')

    await page.getByRole('button', { name: 'Inspector' }).click()
    await target.click()
    await expect(page.locator('[data-advanced-inspector]')).toBeVisible()
    await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-section')

    await page.locator('#raw-background-color').fill('#0f766e')
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/15, 118, 110|rgb\(15, 118, 110\)/)
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toMatch(/15, 118, 110|rgb\(15, 118, 110\)/)
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).backgroundColor)).toMatch(/15, 118, 110|rgb\(15, 118, 110\)/)
    expect(await page.getByTitle('Filament preview').getAttribute('src')).toBe(beforeUrl)
    expect(requests).toEqual([])

  })

  test('shows a fragile warning for an editable compound selector and exports raw CSS', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section:visible').first().click()
    await expect(page.getByLabel('Raw element selector')).toHaveValue('.fi-section')

    await page.getByLabel('Raw element selector').fill('.fi-section .fi-btn')
    await expect(page.locator('[data-selector-warning]')).toContainText(/fragile|multiple classes/i)
    await page.locator('#raw-border-radius').fill('0.75rem')

    await page.getByRole('button', { name: 'Download vanilla CSS' }).click()
    await expect(page.getByRole('status', { name: /export/i })).toContainText(/download started/i)
  })

  test('downloads deterministic CSS bytes containing the edited raw rule', async ({ page }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section:visible').first().click()
    await page.locator('#raw-background-color').fill('#0f766e')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download vanilla CSS' }).click(),
    ])
    const stream = await download.createReadStream()
    let css = ''
    for await (const chunk of stream ?? []) css += chunk.toString()

    expect(download.suggestedFilename()).toBe('theme.css')
    expect(css).toContain('/* Generated with Filament Theme Builder */')
    expect(css).toContain('.fi-section {')
    expect(css).toContain('background-color: #0f766e;')
    expect(css.indexOf('/* Foundations */')).toBeLessThan(css.indexOf('/* Semantic overrides */'))
    expect(css.indexOf('/* Semantic overrides */')).toBeLessThan(css.indexOf('/* Advanced raw-element overrides */'))
  })

  test('copies the exact CSS export content to the clipboard', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: (value: string) => { (window as Window & { __ftbCopied?: string }).__ftbCopied = value } },
      })
    })

    await page.getByRole('button', { name: 'Copy vanilla CSS' }).click()

    await expect.poll(() => page.evaluate(() => (window as Window & { __ftbCopied?: string }).__ftbCopied ?? '')).toContain('/* Generated with Filament Theme Builder */')
    await expect(page.getByRole('status', { name: /export/i })).toContainText(/copied to clipboard/i)
  })

  test('applies exported CSS to a clean Filament fixture with the same visual effects', async ({ page, context }) => {
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.locator('input[aria-label="Primary color"]').fill('#0f766e')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section:visible').first().click()
    await page.locator('#raw-background-color').fill('#fef3c7')

    const previewValues = await frame.locator('.fi-section:visible').first().evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      primary: getComputedStyle(element.ownerDocument.querySelector('.fi-color-primary')!).color,
    }))
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download vanilla CSS' }).click(),
    ])
    const stream = await download.createReadStream()
    let css = ''
    for await (const chunk of stream ?? []) css += chunk.toString()

    const clean = await context.newPage()
    await clean.goto(`${baseUrl}/demo/admin`)
    await clean.addStyleTag({ content: css })
    const cleanValues = await clean.locator('.fi-section').first().evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      primary: getComputedStyle(element.ownerDocument.querySelector('.fi-color-primary')!).color,
    }))

    expect(cleanValues).toEqual(previewValues)
    await clean.close()
  })

  test('bridge rejects unsafe values and duplicate raw selectors without changing applied CSS', async ({ page }) => {
    const payload = await page.evaluate(async () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
      const frameWindow = iframe.contentWindow!
      let captured: any
      frameWindow.addEventListener('message', (event) => { captured = event.data }, { once: false })
      document.querySelector<HTMLInputElement>('input[aria-label="Primary color"]')!.value = '#0f766e'
      document.querySelector<HTMLInputElement>('input[aria-label="Primary color"]')!.dispatchEvent(new Event('input', { bubbles: true }))
      for (let attempt = 0; attempt < 20 && !captured; attempt++) await new Promise((resolve) => setTimeout(resolve, 25))
      return captured
    })
    expect(payload?.type).toBe('ftb:theme:update')

    const unchanged = await page.evaluate(async (basePayload) => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
      const frameWindow = iframe.contentWindow!
      const before = await frameWindow.eval('document.getElementById("ftb-managed-theme").textContent')
      for (const rawOverrides of [
        [{ selector: '.fi-btn, .fi-input', properties: { color: '#0f766e' } }],
        [{ selector: '.fi-btn:active', properties: { color: '#0f766e' } }],
        [{ selector: '.fi-btn', properties: { color: 'red; background: blue' } }],
        [{ selector: '.fi-btn', properties: { color: '#0f766e' } }, { selector: '.fi-btn', properties: { color: '#dc2626' } }],
      ]) {
        const invalid = structuredClone(basePayload)
        invalid.theme.rawOverrides = rawOverrides
        frameWindow.postMessage(invalid, location.origin)
        await new Promise((resolve) => setTimeout(resolve, 25))
        const after = await frameWindow.eval('document.getElementById("ftb-managed-theme").textContent')
        if (after !== before) return false
      }
      const valid = structuredClone(basePayload)
      valid.theme.rawOverrides = [
        { selector: '.fi-input', properties: { padding: '1rem', color: '#0f766e' } },
        { selector: '.fi-btn', properties: { color: '#dc2626' } },
      ]
      frameWindow.postMessage(valid, location.origin)
      await new Promise((resolve) => setTimeout(resolve, 25))
      const ordered = await frameWindow.eval('document.getElementById("ftb-managed-theme").textContent')
      return ordered.indexOf('.fi-btn {') < ordered.indexOf('.fi-input {')
    }, payload)

    expect(unchanged).toBe(true)
  })
})
