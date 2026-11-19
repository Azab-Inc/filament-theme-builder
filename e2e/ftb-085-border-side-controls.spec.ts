import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { resetBuilderStorage } from './support/reset-builder-storage'

test.skip(process.env.COMPOSE_E2E !== '1', 'FTB-085 requires the Compose gateway.')

test('semantic Border controls expose physical side selection without mutating on selection', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()

  const border = page.getByRole('group', { name: 'Border', exact: true })
  await expect(border).toBeVisible()
  await expect(border.getByRole('button', { name: 'All sides' })).toBeVisible()
  await expect(border.getByRole('button', { name: 'Top' })).toBeVisible()
  await expect(border.getByRole('button', { name: 'Right' })).toBeVisible()
  await expect(border.getByRole('button', { name: 'Bottom' })).toBeVisible()
  await expect(border.getByRole('button', { name: 'Left' })).toBeVisible()
  const before = await page.evaluate(() => localStorage.getItem('ftb-theme'))
  await border.getByRole('button', { name: 'Top' }).click()
  expect(await page.evaluate(() => localStorage.getItem('ftb-theme'))).toBe(before)
})

test('ring-backed semantic borders reach the real preview without removing elevation', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  const border = page.getByRole('group', { name: 'Border', exact: true })
  await border.getByLabel('Border target').selectOption('table.container')
  await border.getByRole('button', { name: 'bottom', exact: true }).click()
  await border.getByLabel('Border width').fill('3')
  await border.getByLabel('Border width').press('Tab')
  await expect.poll(() => page.evaluate(() => {
    const doc = (document.querySelector('iframe') as HTMLIFrameElement)?.contentDocument
    const element = doc?.querySelector('.fi-ta-ctn')
    if (!element) return null
    const style = getComputedStyle(element)
    return { top: style.borderTopWidth, bottom: style.borderBottomWidth, ring: style.getPropertyValue('--tw-ring-shadow'), shadow: style.boxShadow }
  })).toMatchObject({ top: '1px', bottom: '3px', ring: '0 0 #0000' })
})

test('physical edges isolate light and dark values through reset, undo, and reload', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  const border = page.getByRole('group', { name: 'Border', exact: true })
  await border.getByLabel('Border target').selectOption('table.container')
  await border.getByRole('button', { name: 'bottom', exact: true }).click()
  await border.getByLabel('Border width').fill('3')
  await border.getByLabel('Border width').press('Tab')
  await page.locator('button[aria-label="Dark mode"]:visible').first().click()
  await border.getByLabel('Border width').fill('0')
  await border.getByLabel('Border width').dispatchEvent('change')
  await page.locator('button[aria-label="Light mode"]:visible').first().click()
  await expect.poll(() => page.evaluate(() => getComputedStyle((document.querySelector('iframe') as HTMLIFrameElement).contentDocument!.querySelector('.fi-ta-ctn')!).borderBottomWidth)).toBe('3px')
  await page.locator('button[aria-label="Dark mode"]:visible').first().click()
  await expect(border.getByLabel('Border width')).toHaveValue('0')
  await expect.poll(() => page.evaluate(() => getComputedStyle((document.querySelector('iframe') as HTMLIFrameElement).contentDocument!.querySelector('.fi-ta-ctn')!).borderBottomWidth)).toBe('0px')
  await border.getByRole('button', { name: 'Reset border', exact: true }).click()
  await expect.poll(() => page.evaluate(() => getComputedStyle((document.querySelector('iframe') as HTMLIFrameElement).contentDocument!.querySelector('.fi-ta-ctn')!).borderBottomWidth)).toBe('3px')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect.poll(() => page.evaluate(() => getComputedStyle((document.querySelector('iframe') as HTMLIFrameElement).contentDocument!.querySelector('.fi-ta-ctn')!).borderBottomWidth)).toBe('0px')
  await page.waitForTimeout(500)
  await page.reload()
  await page.locator('button[aria-label="Dark mode"]:visible').first().click()
  await expect.poll(() => page.evaluate(() => getComputedStyle((document.querySelector('iframe') as HTMLIFrameElement).contentDocument!.querySelector('.fi-ta-ctn')!).borderBottomWidth)).toBe('0px')
})

test('semantic component contexts expose global, component, variant and state border controls', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  await page.getByRole('tab', { name: 'Components' }).click()
  for (const label of ['Semantic global border', 'Semantic component border', 'Semantic state (focus) border']) {
    await expect(page.getByRole('group', { name: label, exact: true })).toBeVisible()
  }
  await expect(page.getByText('Variant border overrides are unavailable because the preview does not expose a verified variant selector for this input.')).toBeVisible()
  const stateBorder = page.getByRole('group', { name: 'Semantic state (focus) border', exact: true })
  await stateBorder.getByRole('button', { name: 'bottom', exact: true }).click()
  await stateBorder.getByLabel('Border width').fill('2')
  await stateBorder.getByLabel('Border width').dispatchEvent('change')
  await expect.poll(() => page.evaluate(() => {
    const document = window.document.querySelector('iframe')?.contentDocument
    const input = document?.querySelector('.fi-input-wrp input') as HTMLInputElement | null
    const wrapper = input?.closest('.fi-input-wrp') as HTMLElement | null
    if (!input || !wrapper) return null
    input.focus()
    const style = getComputedStyle(wrapper)
    return { width: style.borderBottomWidth, shadow: style.boxShadow }
  })).toMatchObject({ width: '2px' })
})

test('semantic component border edits remain on the real input wrapper while focused', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  await page.getByRole('tab', { name: 'Components' }).click()
  const componentBorder = page.getByRole('group', { name: 'Semantic component border', exact: true })
  await componentBorder.getByRole('button', { name: 'bottom', exact: true }).click()
  await componentBorder.getByLabel('Border width').fill('4')
  await componentBorder.getByLabel('Border width').press('Tab')
  await expect.poll(() => page.evaluate(() => {
    const input = document.querySelector('iframe')?.contentDocument?.querySelector('.fi-input-wrp input')
    const wrapper = input?.closest('.fi-input-wrp')
    if (!input || !wrapper) return null
    input.focus()
    const wrapperStyle = getComputedStyle(wrapper)
    const inputStyle = getComputedStyle(input)
    return { wrapperBottom: wrapperStyle.borderBottomWidth, inputBottom: inputStyle.borderBottomWidth, inputShadow: inputStyle.boxShadow }
  })).toMatchObject({ wrapperBottom: '4px' })
})

test('border controls preserve mixed, none, color, keyboard, narrow and RTL behavior', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl'
    const frameDocument = document.querySelector('iframe')?.contentDocument
    if (frameDocument) frameDocument.documentElement.dir = 'rtl'
  })
  const border = page.getByRole('group', { name: 'Border', exact: true })
  await border.getByLabel('Border target').selectOption('table.container')
  const all = border.getByRole('button', { name: 'All sides' })
  await all.focus(); await page.keyboard.press('Enter')
  await border.getByLabel('Border width').fill('2'); await border.getByLabel('Border width').dispatchEvent('change')
  await border.getByRole('button', { name: 'top', exact: true }).click()
  await border.getByLabel('Border property').selectOption('color')
  await border.getByRole('button', { name: /Choose Border color from Tailwind palette/ }).click()
  await page.getByRole('tab', { name: 'Tailwind' }).click()
  await page.getByRole('button', { name: /Red 500/i }).click()
  await border.getByRole('button', { name: 'right', exact: true }).click()
  await border.getByLabel('Border property').selectOption('style')
  await page.waitForTimeout(50)
  await expect(border.getByLabel('Border property')).toHaveValue('style')
  await expect(border.getByRole('button', { name: 'right', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await border.getByLabel('Border style').selectOption('dashed')
  await border.getByLabel('Border style').dispatchEvent('change')
  await border.getByRole('button', { name: 'bottom', exact: true }).click()
  await border.getByLabel('Border property').selectOption('style')
  await page.waitForTimeout(50)
  await expect(border.getByLabel('Border property')).toHaveValue('style')
  await expect(border.getByRole('button', { name: 'bottom', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await border.getByLabel('Border style').selectOption('none')
  await border.getByLabel('Border style').dispatchEvent('change')
  await page.waitForTimeout(500)
  await expect.poll(() => page.evaluate(() => {
    const element = (document.querySelector('iframe') as HTMLIFrameElement).contentDocument?.querySelector('.fi-ta-ctn')
    if (!element) return null
    const style = getComputedStyle(element)
    return { top: style.borderTopWidth, right: style.borderRightWidth, bottom: style.borderBottomWidth, left: style.borderLeftWidth, topColor: style.borderTopColor, rightStyle: style.borderRightStyle, bottomStyle: style.borderBottomStyle, overflow: document.documentElement.scrollWidth <= window.innerWidth, dir: element.ownerDocument.documentElement.dir }
  })).toMatchObject({ top: '2px', right: '2px', bottom: '0px', left: '2px', rightStyle: 'dashed', bottomStyle: 'none', overflow: true, dir: 'rtl' })
  await border.getByRole('button', { name: 'Reset border', exact: true }).click()
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('iframe')?.contentDocument?.querySelector('.fi-ta-ctn') as Element).borderBottomWidth)).toBe('2px')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('iframe')?.contentDocument?.querySelector('.fi-ta-ctn') as Element).borderBottomWidth)).toBe('0px')
})

test('verified semantic Inspector selections expose the semantic border context', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await page.evaluate(resetBuilderStorage)
  await page.reload()
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await page.getByRole('button', { name: 'Inspector' }).click()
  await frame.locator('.fi-section').first().click()
  await page.getByRole('tab', { name: 'Inspector' }).click()
  await page.getByLabel('Inspector target scope').selectOption({ label: 'Surface: .fi-section-content-ctn' })
  await expect(page.getByRole('group', { name: 'Semantic Inspector border', exact: true })).toBeVisible()
})
