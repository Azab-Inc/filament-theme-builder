import { expect, test } from '@playwright/test'

async function downloadText(page: import('@playwright/test').Page, label: string): Promise<string> {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: label }).click()
  const stream = await (await downloadPromise).createReadStream()
  let content = ''
  if (stream) for await (const chunk of stream) content += chunk.toString()
  return content
}

test('shows the ordered first-run tour, persists skip, and replays from Tools', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('tour-test-reset')) {
      localStorage.clear()
      sessionStorage.setItem('tour-test-reset', '1')
    }
  })
  await page.goto('/')

  const popover = page.locator('.driver-popover:visible')
  await expect(popover).toBeVisible()
  await expect(popover.getByText(/step 1 of 7/i)).toBeVisible()
  await expect(popover.getByRole('button', { name: 'Skip tour' })).toBeVisible()
  await popover.getByRole('button', { name: 'Skip tour' }).click()
  await expect(popover).toBeHidden()

  await page.reload()
  await expect(popover).toBeHidden()

  await page.locator('[data-tour="exports"]').click()
  const baselineJson = await downloadText(page, 'Export theme JSON')
  await page.locator('[data-tour="exports"]').click()
  const baselineCss = await downloadText(page, 'Download vanilla CSS')

  await page.locator('[data-tour="tools"]').click()
  await page.getByRole('button', { name: 'Take a tour' }).click()
  await expect(popover).toBeVisible()
  await expect(popover.getByText(/step 1 of 7/i)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(popover).toBeHidden()
  await page.reload()
  await expect(popover).toBeHidden()
  await page.locator('[data-tour="exports"]').click()
  expect(await downloadText(page, 'Export theme JSON')).toBe(baselineJson)
  await page.locator('[data-tour="exports"]').click()
  expect(await downloadText(page, 'Download vanilla CSS')).toBe(baselineCss)
})

test('traverses all seven anchors and closes with Escape without changing theme storage', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  const popover = page.locator('.driver-popover:visible')
  const titles = ['Welcome to the Theme Builder', 'Find your way around', 'Start with foundations', 'See the live preview', 'Inspect preview elements', 'Manage and export themes', 'You are ready to build']
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key !== 'ftb-onboarding-tour').map((key) => [key, localStorage.getItem(key)])))
  for (let index = 0; index < titles.length; index += 1) {
    await expect(popover).toContainText(titles[index])
    await expect(popover).toContainText(`Step ${index + 1} of 7`)
    await expect(popover.getByRole('button', { name: 'Skip tour' })).toBeVisible()
    if (index < titles.length - 1) await popover.getByRole('button', { name: 'Next' }).click()
  }
  await popover.getByRole('button', { name: 'Done' }).click()
  await expect(popover).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('ftb-onboarding-tour'))).toContain('schemaVersion')
  await page.locator('[data-tour="exports"]').click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export theme JSON' }).click()
  expect((await downloadPromise).suggestedFilename()).toBe('filament-theme.json')
  await page.locator('[data-tour="exports"]').click()
  const cssDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download vanilla CSS' }).click()
  expect((await cssDownloadPromise).suggestedFilename()).toBe('theme.css')
  expect(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key !== 'ftb-onboarding-tour').map((key) => [key, localStorage.getItem(key)])))).toEqual(before)
})

test('covers narrow anchors, keyboard controls, focus return, alternate layout, and actual theme modes', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await page.route('**/live.js**', (route) => route.abort())
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  const popover = page.locator('.driver-popover:visible')
  await expect(popover).toBeVisible()
  await expect.poll(() => popover.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('ArrowRight')
  await expect(popover).toContainText('Step 2 of 7')
  await page.keyboard.press('ArrowLeft')
  await expect(popover).toContainText('Step 1 of 7')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await expect(popover).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('ftb-onboarding-tour'))).toContain('schemaVersion')

  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await page.getByRole('button', { name: 'Dark mode' }).click()
  await expect(frame.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Light mode' }).click()
  await expect(frame.locator('html')).not.toHaveClass(/dark/)
  const beforeTour = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key !== 'ftb-onboarding-tour').map((key) => [key, localStorage.getItem(key)])))
  const inspectorState = await page.getByRole('button', { name: 'Inspector' }).getAttribute('aria-pressed')

  await page.getByLabel('Top navigation').check()
  await page.locator('[data-tour="tools"]').click()
  await page.getByRole('button', { name: 'Take a tour' }).click()
  const selectors = ['welcome', 'editor-navigation', 'foundations', 'live-preview', 'inspector', 'tools', 'finish']
  await popover.getByRole('button', { name: 'Next' }).focus()
  await page.keyboard.press('Enter')
  await expect(popover).toContainText('Step 2 of 7')
  await popover.getByRole('button', { name: 'Back' }).focus()
  await page.keyboard.press('Enter')
  await expect(popover).toContainText('Step 1 of 7')
  for (let index = 0; index < selectors.length; index += 1) {
    await expect(popover).toContainText(`Step ${index + 1} of 7`)
    const geometry = await page.evaluate((name) => {
      const popover = document.querySelector<HTMLElement>('.driver-popover')?.getBoundingClientRect()
      const anchor = document.querySelector<HTMLElement>(`[data-tour="${name}"]`)?.getBoundingClientRect()
      if (!popover || !anchor) return null
      const overlap = Math.max(0, Math.min(popover.right, anchor.right) - Math.max(popover.left, anchor.left)) * Math.max(0, Math.min(popover.bottom, anchor.bottom) - Math.max(popover.top, anchor.top))
      return { popover, anchor, overlap }
    }, selectors[index])
    expect(geometry).not.toBeNull()
    expect(geometry!.popover.x).toBeGreaterThanOrEqual(0)
    expect(geometry!.popover.right).toBeLessThanOrEqual(420)
    expect(geometry!.popover.bottom).toBeLessThanOrEqual(800)
    expect(geometry!.overlap).toBeLessThan(geometry!.anchor.width * geometry!.anchor.height)
    if (index < selectors.length - 1) await popover.getByRole('button', { name: 'Next' }).click()
  }
  await page.keyboard.press('Escape')
  await expect(popover).toBeHidden()
  await expect(page.locator('[data-tour="tools"]')).toBeFocused()
  expect(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key !== 'ftb-onboarding-tour').map((key) => [key, localStorage.getItem(key)])))).toEqual(beforeTour)
  await expect(page.getByRole('button', { name: 'Inspector' })).toHaveAttribute('aria-pressed', inspectorState ?? 'false')
})

test('does not start when the iframe returns HTTP 404 or 500 without the bridge handshake', async ({ page }) => {
  for (const status of [404, 500]) {
    await page.route('**/demo/admin**', (route) => route.fulfill({ status, contentType: 'text/html', body: `<h1>${status}</h1>` }))
    await page.addInitScript(() => localStorage.clear())
    await page.goto(`/?preview-error=${status}`)
    await expect(page.locator('.driver-popover')).toBeHidden()
    await page.unroute('**/demo/admin**')
  }
})

test('waits for a delayed bridge handshake instead of starting during iframe loading', async ({ page }) => {
  await page.route('**/demo/admin**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await route.continue()
  })
  await page.addInitScript(() => localStorage.clear())
  const navigation = page.goto('/')
  await page.waitForTimeout(400)
  await expect(page.locator('.driver-popover')).toBeHidden()
  await navigation
  await expect(page.locator('.driver-popover:visible')).toBeVisible()
})

const tourMatrix = [
  ...(['sidebar', 'top'] as const).flatMap((layout) => (['Light', 'Dark'] as const).flatMap((mode) => [
    { layout, mode, width: 1280 },
    { layout, mode, width: 420 },
  ])),
]

for (const scenario of tourMatrix) {
  test(`replays every step once in ${scenario.layout}/${scenario.mode}/${scenario.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: 800 })
    await page.route('**/live.js**', (route) => route.abort())
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')
    const popover = page.locator('.driver-popover:visible')
    await expect(popover).toBeVisible()
    await expect(popover.locator('.driver-popover-title')).toBeVisible()
    await expect(popover.locator('.driver-popover-description')).toBeVisible()
    await expect(popover).toContainText('Step 1 of 7')
    await popover.getByRole('button', { name: 'Skip tour' }).click()
    await expect(page.locator('.driver-popover:visible')).toHaveCount(0)

    await page.getByRole('radio', { name: scenario.layout === 'top' ? 'Top navigation' : 'Sidebar' }).check()
    await page.getByRole('button', { name: `${scenario.mode} mode` }).click()
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    if (scenario.mode === 'Dark') await expect(frame.locator('html')).toHaveClass(/dark/)
    else await expect(frame.locator('html')).not.toHaveClass(/dark/)

    await page.locator('[data-tour="tools"]').click()
    await page.getByRole('button', { name: 'Take a tour' }).click()
    await expect(popover).toHaveCount(1)
    for (let step = 1; step <= 7; step += 1) {
      await expect(popover).toContainText(`Step ${step} of 7`)
      await expect(popover.locator('.driver-popover-title')).toBeVisible()
      await expect(popover.locator('.driver-popover-description')).toBeVisible()
      await expect.poll(() => popover.evaluate((element) => element.contains(document.activeElement))).toBe(true)
      if (step < 7) await popover.getByRole('button', { name: 'Next' }).click()
    }
    await popover.getByRole('button', { name: 'Done' }).click()
    await expect(page.locator('.driver-popover:visible')).toHaveCount(0)
    await expect(page.locator('.driver-overlay')).toHaveCount(0)

    for (let replay = 0; replay < 2; replay += 1) {
      await page.locator('[data-tour="tools"]').click()
      await page.getByRole('button', { name: 'Take a tour' }).click()
      await expect(popover).toHaveCount(1)
      await expect(popover).toContainText('Step 1 of 7')
      await popover.getByRole('button', { name: 'Skip tour' }).click()
      await expect(page.locator('.driver-popover:visible')).toHaveCount(0)
    }
  })
}

test('preserves editor history and Inspector selection, and does not mark completion on interrupted reload', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  const initialTour = page.locator('.driver-popover:visible')
  await initialTour.getByRole('button', { name: 'Skip tour' }).click()

  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await page.getByRole('button', { name: 'Inspector' }).click()
  await frame.locator('.fi-section:visible').first().dispatchEvent('click')
  await expect(page.getByRole('tab', { name: 'Inspector' })).toHaveAttribute('aria-selected', 'true')
  const selection = await page.getByLabel('Raw element selector').inputValue()
  await page.locator('#raw-background-color').fill('#0f766e')
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
  const historyBefore = {
    undo: await page.getByRole('button', { name: 'Undo' }).isEnabled(),
    redo: await page.getByRole('button', { name: 'Redo' }).isEnabled(),
  }

  await page.locator('[data-tour="tools"]').click()
  await page.getByRole('button', { name: 'Take a tour' }).click()
  await expect(page.locator('.driver-popover:visible')).toHaveCount(1)
  await page.locator('.driver-popover:visible').getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByLabel('Raw element selector')).toHaveValue(selection)
  expect({
    undo: await page.getByRole('button', { name: 'Undo' }).isEnabled(),
    redo: await page.getByRole('button', { name: 'Redo' }).isEnabled(),
  }).toEqual(historyBefore)
})

test('does not mark an interrupted first-run tour complete after reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('interrupted-tour-initialized')) {
      localStorage.removeItem('ftb-onboarding-tour')
      sessionStorage.setItem('interrupted-tour-initialized', '1')
    }
  })
  await page.goto('/')
  await expect(page.locator('.driver-popover:visible')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('ftb-onboarding-tour'))).toBeNull()
  await page.reload()
  await expect(page.locator('.driver-popover:visible')).toBeVisible()
  await page.locator('.driver-popover:visible').getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.locator('.driver-popover:visible')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('ftb-onboarding-tour'))).toContain('schemaVersion')
})

test('continues safely when an optional target is unavailable', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-tour="foundations"]').evaluate((element) => element.remove())
  await page.locator('[data-tour="tools"]').click()
  await page.getByRole('button', { name: 'Take a tour' }).click()
  const popover = page.locator('.driver-popover:visible')
  await expect(popover).toContainText('Step 1 of 6')
  await popover.getByRole('button', { name: 'Next' }).click()
  await popover.getByRole('button', { name: 'Next' }).click()
  await expect(popover).toContainText('Step 3 of 6')
  await expect(popover.locator('.driver-popover-title')).toHaveText('See the live preview')
  await expect(popover).toHaveCount(1)
  await popover.getByRole('button', { name: 'Skip tour' }).click()
})
