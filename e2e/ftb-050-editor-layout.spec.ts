import { expect, test } from '@playwright/test'

import { builderBaseUrl, previewUrl } from './urls'

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'intermediate', width: 900, height: 900 },
  { name: 'narrow', width: 640, height: 900 },
] as const

test.describe('FTB-050 promoted editor navigation', () => {
  for (const viewport of viewports) {
    test(`keeps the editor panel and live demo usable at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(builderBaseUrl)

      const iframe = page.getByTitle('Filament preview')
      const initialFrame = await iframe.boundingBox()
      expect(initialFrame).not.toBeNull()
      await expect(page.getByRole('radio', { name: 'Sidebar' })).toBeChecked()
      await expect(page.locator('[data-editor-nav-rail]')).toBeVisible()
      await expect(page.locator('[data-editor-header-controls]')).toBeVisible()

      const panel = await page.locator('[data-editor-panel]').boundingBox()
      const frame = await iframe.boundingBox()
      expect(panel).not.toBeNull()
      expect(frame).not.toBeNull()
      expect(frame!.x).toBeGreaterThanOrEqual(panel!.x + panel!.width - 1)
      expect(frame!.width).toBeGreaterThan(0)

      await page.getByRole('radio', { name: 'Top navigation' }).check()
      await expect(page.locator('[data-editor-tabs]')).toBeVisible()
      await expect(page.locator('[data-editor-nav-rail]')).toHaveCount(0)
      await expect(page.locator('[data-editor-header-controls]')).toBeVisible()

      await page.getByLabel('Primary color').fill('#0f766e')
      await expect.poll(() => page.frameLocator('iframe[title="Filament preview"]')
        .locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--ftb-primary').trim()))
        .toBe('#0f766e')

      await page.getByRole('tab', { name: 'Components' }).click()
      await expect(page.locator('[data-editor-section="components"]')).toBeVisible()

      const src = await iframe.getAttribute('src')
      await page.getByRole('radio', { name: 'Sidebar' }).check()
      await page.getByRole('tab', { name: 'Foundations' }).click()
      await expect(page.locator('[data-editor-nav-rail]')).toBeVisible()
      await expect(page.locator('[data-editor-section="foundations"]')).toBeVisible()
      await expect(iframe).toHaveAttribute('src', src!)
      const finalFrame = await iframe.boundingBox()
      expect(finalFrame).toEqual(initialFrame)
    })
  }

  test('ordinary and former prototype routes expose only production A/B navigation', async ({ page }) => {
    for (const path of ['/', '/?prototype=1&variant=A', '/?prototype=1&variant=B', '/?prototype=1&variant=C', '/?prototype=1&variant=unknown']) {
      await page.goto(`${builderBaseUrl}${path}`)
      await expect(page.getByRole('heading', { name: 'Filament Theme Builder' })).toBeVisible()
      await expect(page.locator('[data-prototype]')).toHaveCount(0)
      await expect(page.getByRole('radio', { name: 'Sidebar' })).toBeVisible()
      await expect(page.getByRole('radio', { name: 'Top navigation' })).toBeVisible()
      await expect.poll(async () => new URL(
        await page.getByTitle('Filament preview').getAttribute('src') ?? '',
        builderBaseUrl,
      ).href).toBe(previewUrl)
    }
  })

  test('keeps navigation keyboard reachable with visible focus in both modes', async ({ page }) => {
    await page.goto(builderBaseUrl)

    const sidebarFoundations = page.getByRole('tab', { name: 'Foundations' })
    await sidebarFoundations.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('tab', { name: 'Components' })).toBeFocused()

    const sidebar = page.getByRole('radio', { name: 'Sidebar' })
    const top = page.getByRole('radio', { name: 'Top navigation' })
    await sidebar.focus()
    await expect(sidebar).toBeFocused()
    await expect(sidebar).toHaveCSS('outline-style', 'solid')

    await page.keyboard.press('ArrowDown')
    await expect(top).toBeChecked()
    await expect(top).toBeFocused()

    const foundations = page.getByRole('tab', { name: 'Foundations' })
    await foundations.focus()
    await expect(foundations).toBeFocused()
    await expect(foundations).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('End')
    const icons = page.getByRole('tab', { name: 'Icons' })
    await expect(icons).toBeFocused()
    await expect.poll(() => icons.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  })

  test('exposes complete tab and tabpanel relationships', async ({ page }) => {
    await page.goto(builderBaseUrl)
    for (const mode of ['Sidebar', 'Top navigation']) {
      await page.getByRole('radio', { name: mode }).check()
      await expect(page.locator('[role="tablist"]')).toBeVisible()
      await expect(page.getByRole('tab')).toHaveCount(4)

      const audit = await page.locator('body').evaluate((body) => {
        const elements = Array.from(body.querySelectorAll<HTMLElement>('*'))
        const ids = elements.flatMap((element) => element.id ? [element.id] : [])
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
        const references = [
          'aria-activedescendant', 'aria-controls', 'aria-describedby', 'aria-details',
          'aria-errormessage', 'aria-flowto', 'aria-labelledby', 'aria-owns',
        ]
          .flatMap((attribute) => elements.flatMap((element) => (element.getAttribute(attribute) ?? '')
            .split(/\s+/).filter(Boolean).map((id) => ({ attribute, id }))))
        const danglingReferences = references.filter(({ id }) => !document.getElementById(id))
        const tablists = elements.filter((element) => element.getAttribute('role') === 'tablist')
        const tabs = elements.filter((element) => element.getAttribute('role') === 'tab')
        const panels = elements.filter((element) => element.getAttribute('role') === 'tabpanel')
        return {
          duplicateIds,
          danglingReferences,
          tablistCount: tablists.length,
          tabCount: tabs.length,
          panelCount: panels.length,
          selectedTabCount: tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true').length,
          visiblePanelCount: panels.filter((panel) => !panel.hidden && getComputedStyle(panel).display !== 'none').length,
          invalidTabParents: tabs.filter((tab) => tab.parentElement?.getAttribute('role') !== 'tablist').length,
          invalidTabSelections: tabs.filter((tab) => !['true', 'false'].includes(tab.getAttribute('aria-selected') ?? '')).length,
          invalidPanelLabels: panels.filter((panel) => !panel.getAttribute('aria-labelledby')
            || !document.getElementById(panel.getAttribute('aria-labelledby')!)?.matches('[role="tab"]')).length,
          invalidTabControls: tabs.filter((tab) => !document.getElementById(tab.getAttribute('aria-controls') ?? '')
            ?.matches('[role="tabpanel"]')).length,
        }
      })
      expect(audit).toEqual({
        duplicateIds: [], danglingReferences: [], tablistCount: 1, tabCount: 4,
        panelCount: 4, selectedTabCount: 1, visiblePanelCount: 1,
        invalidTabParents: 0, invalidTabSelections: 0,
        invalidPanelLabels: 0, invalidTabControls: 0,
      })

      for (const tab of await page.getByRole('tab').all()) {
        const panelId = await tab.getAttribute('aria-controls')
        expect(panelId).toBeTruthy()
        await tab.click()
        const panel = page.locator(`#${panelId}`)
        await expect(panel).toBeVisible()
        await expect(panel).toHaveAttribute('aria-labelledby', await tab.getAttribute('id') ?? '')
        await expect(panel).toHaveAttribute('role', 'tabpanel')
      }
    }

    await page.getByRole('tab', { name: 'Components' }).click()
    await expect(page.getByRole('tabpanel', { name: 'Components' })).toBeVisible()
  })

  test('preserves iframe URL, document, and contentWindow across navigation mode switches', async ({ page }) => {
    await page.goto(builderBaseUrl)
    const iframe = page.locator('[data-editor-iframe]')
    const initial = await iframe.evaluate((element) => {
      const frame = element as HTMLIFrameElement
      ;(window as Window & { __ftbInitialFrameWindow?: Window | null }).__ftbInitialFrameWindow = frame.contentWindow
      return {
        src: frame.src,
        hasContentWindow: frame.contentWindow !== null,
        documentUrl: frame.contentDocument?.URL,
      }
    })

    expect(initial.hasContentWindow).toBe(true)
    expect(initial.documentUrl).toContain('/demo/admin')
    await page.getByRole('radio', { name: 'Top navigation' }).check()
    await page.getByRole('tab', { name: 'Components' }).click()
    await page.getByRole('radio', { name: 'Sidebar' }).check()

    const final = await iframe.evaluate((element) => {
      const frame = element as HTMLIFrameElement
      return {
        src: frame.src,
        documentUrl: frame.contentDocument?.URL,
        sameContentWindow: frame.contentWindow === (window as Window & { __ftbInitialFrameWindow?: Window | null }).__ftbInitialFrameWindow,
      }
    })
    expect(final.src).toBe(initial.src)
    expect(final.documentUrl).toBe(initial.documentUrl)
    expect(final.sameContentWindow).toBe(true)
  })

  test('reflows at 200 percent zoom and keeps every header and editor action reachable', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 })
    await page.goto(builderBaseUrl)
    await page.evaluate(() => { document.documentElement.style.zoom = '2' })
    await page.getByLabel('Primary color').fill('#0f766e')

    for (const action of [page.getByRole('button', { name: 'Undo' }), page.getByRole('button', { name: 'Inspector' })]) {
      await action.focus()
      await expect(action).toBeFocused()
      await expect(action).toBeInViewport()
    }
    await page.getByRole('button', { name: 'Undo' }).click()
    await page.getByRole('button', { name: 'Redo' }).focus()
    await expect(page.getByRole('button', { name: 'Redo' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Redo' })).toBeInViewport()

    const actions = [
      page.getByRole('button', { name: 'Export theme JSON' }),
      page.getByRole('button', { name: 'Copy vanilla CSS' }),
      page.getByRole('button', { name: 'Download vanilla CSS' }),
      page.getByRole('button', { name: 'Export PanelProvider icon config' }),
      page.getByRole('button', { name: 'Export panel branding JSON' }),
      page.getByRole('button', { name: 'Export PanelProvider branding config' }),
      page.getByRole('button', { name: 'Inspector' }),
    ]

    for (const action of actions) {
      await action.focus()
      await expect(action).toBeFocused()
      await expect(action).toBeInViewport()
    }

    await page.getByRole('radio', { name: 'Top navigation' }).check()
    for (const tabName of ['Foundations', 'Components', 'Branding', 'Icons']) {
      const tab = page.getByRole('tab', { name: tabName })
      await tab.focus()
      await expect(tab).toBeFocused()
      await expect(tab).toBeInViewport()
    }

    await page.getByRole('tab', { name: 'Branding' }).click()
    await expect(page.locator('fieldset').filter({ hasText: 'PanelBrandingSettings' })).toBeVisible()
    await page.getByRole('tab', { name: 'Icons' }).click()
    await expect(page.getByLabel('Icon pack')).toBeVisible()
  })

  test('keeps editor and preview side by side at the intermediate breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await page.goto(builderBaseUrl)

    const panel = await page.locator('[data-editor-panel]').boundingBox()
    const frame = await page.locator('[data-editor-iframe]').boundingBox()
    expect(panel).not.toBeNull()
    expect(frame).not.toBeNull()
    expect(frame!.x).toBeGreaterThanOrEqual(panel!.x + panel!.width - 1)
    expect(frame!.width).toBeGreaterThan(0)
    expect(frame!.height).toBeGreaterThan(0)
  })

  test('reaches branding, icon, raw, and Inspector controls from navigation', async ({ page }) => {
    await page.goto(builderBaseUrl)
    await page.getByRole('button', { name: 'Inspector' }).click()
    await page.frameLocator('[data-editor-iframe]').locator('.fi-section:visible').first().click()
    await expect(page.getByLabel('Raw element selector')).toBeVisible()

    await page.getByRole('radio', { name: 'Top navigation' }).check()
    await page.getByRole('tab', { name: 'Branding' }).click()
    await expect(page.locator('fieldset').filter({ hasText: 'PanelBrandingSettings' })).toBeVisible()
    await page.getByRole('tab', { name: 'Icons' }).click()
    await expect(page.getByLabel('Icon pack')).toBeVisible()
    await page.getByRole('tab', { name: 'Components' }).click()
    await expect(page.getByRole('textbox', { name: 'Product name global background' })).toBeVisible()
  })
})
