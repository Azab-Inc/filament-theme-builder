import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
const dashboardUrl = `${baseUrl}/demo/admin`

test('untouched builder preview preserves native dashboard layout and table styles', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  try {
    const standalone = await context.newPage()
    await standalone.goto(dashboardUrl)
    await expect(standalone.locator('.fi-page')).toBeVisible()
    await expect(standalone.locator('.fi-ta')).toHaveCount(2)

    const builder = await context.newPage()
    await builder.goto(baseUrl)
    await builder.evaluate(() => localStorage.clear())
    await builder.reload()
    await builder.locator('iframe[title="Filament preview"]').evaluate((frame) => {
      frame.style.width = '100vw'
      frame.style.height = '100vh'
    })
    const preview = builder.frameLocator('iframe[title="Filament preview"]')
    await expect(preview.locator('.fi-page')).toBeVisible()
    await expect(preview.locator('.fi-ta')).toHaveCount(2)

    const measure = (page: import('@playwright/test').Page | import('@playwright/test').FrameLocator) =>
      page.locator('.fi-page').evaluate((pageRoot) => {
        const styles = (element: Element | null) => {
          if (!element) return null
          const css = getComputedStyle(element)
          return Object.fromEntries([
            'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'outlineWidth', 'outlineStyle',
            'boxShadow', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'borderRadius', 'fontFamily', 'fontSize', 'lineHeight', 'marginTop', 'marginBottom',
            'gap', 'rowGap', 'columnGap',
          ].map((property) => [property, css.getPropertyValue(property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)).trim()]))
        }
        const selectorGroups = [
          ['dashboard-section', '.fi-section'],
          ['commerce-overview', '.fi-wi-stats-overview-stat'],
          ['table-container', '.fi-ta-ctn'],
          ['table-header', '.fi-ta-header'],
          ['table-heading-cell', '.fi-ta-header-cell'],
          ['table-row', '.fi-ta tbody tr:not(.fi-ta-group-header-row)'],
        ] as const
        return Object.fromEntries(selectorGroups.map(([key, selector]) => {
          const nodes = Array.from(pageRoot.querySelectorAll(selector)).slice(0, 5)
          return [key, nodes.map((element) => ({
            styles: styles(element),
          }))]
        }))
      })

    const nativeStyles = await measure(standalone)
    const previewStyles = await measure(preview)
    expect(previewStyles, `style difference from native dashboard:\n${JSON.stringify({ nativeStyles, previewStyles }, null, 2)}`).toEqual(nativeStyles)
  } finally {
    await context.close()
  }
})

test('legacy foundation storage is migrated back to the native baseline', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  try {
    const builder = await context.newPage()
    await builder.goto(baseUrl)
    await builder.getByRole('spinbutton', { name: 'Border width' }).fill('4')
    await builder.waitForTimeout(350)
    await builder.evaluate(() => {
      const legacy = JSON.parse(localStorage.getItem('ftb-theme')!)
      legacy.foundations.borderWidth = 4
      delete legacy.foundations.explicitPaths
      delete legacy.foundations.provenanceVersion
      localStorage.setItem('ftb-theme', JSON.stringify(legacy))
    })
    await builder.reload()

    const preview = builder.frameLocator('iframe[title="Filament preview"]')
    await expect(preview.locator('.fi-page')).toBeVisible()
    await expect(builder.getByRole('spinbutton', { name: 'Border width' })).toHaveValue('1')
    await expect
      .poll(() => builder.locator('iframe').contentFrame().locator('#ftb-managed-theme').evaluate((style) => style.textContent))
      .toBe(':root { color-scheme: light; }')

    const migrated = await builder.evaluate(() => JSON.parse(localStorage.getItem('ftb-theme')!))
    expect(migrated.foundations.provenanceVersion).toBe(1)
    expect(migrated.foundations.borderWidth).toBe(1)
    expect(migrated.foundations.explicitPaths).toEqual([])
  } finally {
    await context.close()
  }
})
