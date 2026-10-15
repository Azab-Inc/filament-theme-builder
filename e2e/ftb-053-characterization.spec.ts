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

  test('keeps HoverInspectPrototype generic state selectors inside its root', async ({ page }) => {
    await page.goto(`${builderBaseUrl}/?inspect=1&variant=A`)
    const leakingSelectors = await page.evaluate(() => {
      const selectors: string[] = []
      const visit = (rules: CSSRuleList) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText.includes('.is-active')) {
            selectors.push(rule.selectorText)
          } else if ('cssRules' in rule) {
            visit(rule.cssRules)
          }
        }
      }
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          visit(sheet.cssRules)
        } catch {
          // Cross-origin stylesheets are not part of the builder stylesheet.
        }
      }
      return selectors.filter((selector) => !selector.includes('.inspect'))
    })

    expect(leakingSelectors).toEqual([])
  })

  for (const variant of ['a', 'b', 'c'] as const) {
    test(`keeps throwaway prototype ${variant.toUpperCase()} CSS scoped and visually intact`, async ({ page }) => {
      await page.goto(builderBaseUrl)
      const styles = await page.evaluate((activeVariant) => {
        const prototype = document.createElement('main')
        prototype.className = `prototype prototype--${activeVariant}`
        prototype.innerHTML = '<section class="prototype__editor"></section><section class="prototype__preview"><iframe></iframe></section>'
        document.body.append(prototype)
        const editor = prototype.querySelector('.prototype__editor')!
        const frame = prototype.querySelector('iframe')!
        const editorStyle = getComputedStyle(editor)
        const frameStyle = getComputedStyle(frame)
        const result = {
          display: getComputedStyle(prototype).display,
          editorWidth: editorStyle.width,
          iframeBorder: frameStyle.borderTopWidth,
          iframeRadius: frameStyle.borderRadius,
          iframeShadow: frameStyle.boxShadow,
          productionFrameRadius: getComputedStyle(document.querySelector('.preview-shell__frame')!).borderRadius,
          productionFrameShadow: getComputedStyle(document.querySelector('.preview-shell__frame')!).boxShadow,
        }
        prototype.remove()
        return result
      }, variant)

      expect(styles.display).toBe('flex')
      expect(styles.editorWidth).toBe(variant === 'a' ? '410px' : variant === 'b' ? '1280px' : '280px')
      expect(styles.iframeBorder).toBe('1px')
      expect(styles.iframeRadius).toBe('8px')
      expect(styles.iframeShadow).toBe('rgba(57, 56, 44, 0.07) 0px 8px 30px 0px')
      expect(styles.productionFrameRadius).toBe('0px')
      expect(styles.productionFrameShadow).toBe('none')
    })
  }
})
