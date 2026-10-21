import { expect, test } from '@playwright/test'
import { builderBaseUrl, composeBaseUrl, demoBaseUrl, previewUrl } from './urls'

test('builder embeds the Filament preview', async ({ page }) => {
  await page.goto(builderBaseUrl)

  await expect(page.getByRole('heading', { name: 'Filament Theme Builder' })).toBeVisible()
  await expect.poll(async () => new URL(
    await page.getByTitle('Filament preview').getAttribute('src') ?? '',
    builderBaseUrl,
  ).href).toBe(previewUrl)
  await expect(
    page.frameLocator('iframe[title="Filament preview"]').getByRole('heading', { name: /dashboard/i }),
  ).toBeVisible()

  const frame = page.frameLocator('iframe[title="Filament preview"]')
  const iframeUrl = await page.getByTitle('Filament preview').getAttribute('src')
  await page.locator('#toolbar-primary-color').fill('#0f766e')
  await expect.poll(() => frame.locator('#ftb-managed-theme').count()).toBe(1)
  await expect.poll(() => frame.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--ftb-primary').trim(),
  )).toBe('#0f766e')
  await expect.poll(() => frame.locator('html').evaluate((element) =>
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].every((shade) => {
      const value = getComputedStyle(element).getPropertyValue(`--primary-${shade}`).trim()
      return CSS.supports('color', value)
    }),
  )).toBe(true)
  await frame.locator('html').evaluate((element) => element.classList.add('dark'))
  expect(await frame.locator('html').evaluate((element) => {
    const shade = getComputedStyle(element).getPropertyValue('--primary-500').trim()
    return CSS.supports('color', shade)
  })).toBe(true)
  await expect(page.getByTitle('Filament preview')).toHaveAttribute('src', iframeUrl!)
  await page.getByLabel('Undo').click()
  await expect.poll(() => frame.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--ftb-primary').trim(),
  )).toBe('')
  await page.keyboard.press('Control+Shift+Z')
  await expect.poll(() => frame.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--ftb-primary').trim(),
  )).toBe('#0f766e')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ftb-theme')))
    .toContain('"primary":"#0f766e"')
  await page.reload()
  await expect(page.locator('#toolbar-primary-color')).toHaveValue('#0f766e')
  await expect.poll(() => page.frameLocator('iframe[title="Filament preview"]')
    .locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--ftb-primary').trim(),
    )).toBe('#0f766e')
})

test('builder primary color updates a native Filament control in the iframe', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')

  await page.addInitScript(() => localStorage.removeItem('ftb-theme'))
  await page.goto(composeBaseUrl)
  const previewFrame = page.frame({ url: /\/demo\/admin/ })
  expect(previewFrame).toBeTruthy()
  await previewFrame!.goto(`${demoBaseUrl}/demo/admin/actions-showcase`)
  const nativePrimaryAction = previewFrame!.locator('.fi-btn.fi-color-primary').first()
  await expect(nativePrimaryAction).toBeVisible()
  const initialNativeColor = await nativePrimaryAction.evaluate((element) => getComputedStyle(element).backgroundColor)
  const initialColor = await previewFrame!.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--primary-400').trim(),
  )

  await page.locator('#toolbar-primary-color').fill('#0f766e')

  await expect.poll(() => previewFrame!.evaluate(() => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--primary-400').trim()
    return CSS.supports('color', value) ? value : ''
  })).not.toBe(initialColor)
  await expect.poll(() => nativePrimaryAction.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(initialNativeColor)
  expect(await previewFrame!.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--primary-400').trim(),
  )).not.toBe(initialColor)
})

test('Filament admin login renders', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)

  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/username/i)).toBeVisible()
  await expect(page.getByText('Username: user')).toBeVisible()
  await expect(page.getByText('Password: password')).toBeVisible()
})

test('Filament preview is public and embeddable', async ({ page }) => {
  const preview = await page.goto(previewUrl)
  expect(preview?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

  await page.goto(builderBaseUrl)
  await expect.poll(async () => new URL(
    await page.getByTitle('Filament preview').getAttribute('src') ?? '',
    builderBaseUrl,
  ).href).toBe(previewUrl)
})

test('preview bridge dispatches only for configured allowed origins', async ({ page }) => {
  const demoOrigin = demoBaseUrl
  const builderOrigin = builderBaseUrl
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))
  await page.goto(builderOrigin)
  await page.evaluate((origin) => {
    document.body.innerHTML = `
      <iframe name="preview-frame" src="${origin}/demo/admin"></iframe>
      <iframe name="same-origin-child" src="${origin}/demo/admin/login"></iframe>
    `
  }, demoOrigin)

  await expect(
    page.frameLocator('iframe[name="preview-frame"]').getByRole('heading', { name: /dashboard/i }),
  ).toBeVisible()
  const preview = page.frame({ name: 'preview-frame' })
  expect(preview).toBeTruthy()
  await expect(
    page.frameLocator('iframe[name="same-origin-child"]').getByRole('heading', { name: /sign in/i }),
  ).toBeVisible()
  await preview!.evaluate(() => {
    document.body.dataset.acceptedMessages = '0'
    window.addEventListener('ftb:preview-message-accepted', () => {
      document.body.dataset.acceptedMessages = String(Number(document.body.dataset.acceptedMessages) + 1)
    })
  })

  await page.evaluate((origin) => {
    const previewFrame = document.querySelector<HTMLIFrameElement>('iframe[name="preview-frame"]')!
    previewFrame.contentWindow!.postMessage({
      type: 'ftb:theme:update', schemaVersion: 1,
      theme: { schemaVersion: 1, colors: { primary: '#0f766e' } },
    }, origin)
  }, demoOrigin)
  const sameOriginChild = page.frame({ name: 'same-origin-child' })
  expect(sameOriginChild).toBeTruthy()
  await sameOriginChild!.evaluate((origin) => {
    window.parent.frames['preview-frame']!.postMessage({
      type: 'ftb:theme:update', schemaVersion: 1,
      theme: { schemaVersion: 1, colors: { primary: '#0f766e' } },
    }, origin)
  }, demoOrigin)
  await page.evaluate((origin) => {
    const previewFrame = document.querySelector<HTMLIFrameElement>('iframe[name="preview-frame"]')!
    previewFrame.contentWindow!.postMessage({
      type: 'ftb:theme:update', schemaVersion: 1,
      theme: { schemaVersion: 2, colors: { primary: '#0f766e' }, overrides: [] },
    }, origin)
  }, demoOrigin)
  await expect.poll(() => preview!.evaluate(() => Number(document.body.dataset.acceptedMessages)))
    .toBe(process.env.COMPOSE_E2E === '1' ? 0 : 2)
  await page.evaluate((origin) => {
    const previewFrame = document.querySelector<HTMLIFrameElement>('iframe[name="preview-frame"]')!
    const validOverride = {
      targetId: 'button.primary', controlId: 'background', scope: 'variant',
      componentId: 'button', variantId: 'primary', value: '#0f766e',
    }
    const malformedOverrides = [
      { ...validOverride, targetId: ['button.primary'] },
      { ...validOverride, targetId: null },
      { ...validOverride, targetId: 42 },
      { ...validOverride, controlId: ['background'] },
      { ...validOverride, controlId: null },
      { ...validOverride, controlId: 42 },
      { ...validOverride, componentId: ['button'] },
      { ...validOverride, componentId: null },
      { ...validOverride, componentId: 42 },
      { ...validOverride, variantId: ['primary'] },
      { ...validOverride, variantId: null },
      { ...validOverride, variantId: 42 },
      { ...validOverride, stateId: ['hover'] },
      { ...validOverride, stateId: null },
      { ...validOverride, stateId: 42 },
      { ...validOverride, scope: ['variant'] },
      { ...validOverride, scope: null },
      { ...validOverride, scope: 42 },
      { ...validOverride, value: NaN },
      { ...validOverride, value: Infinity },
      { ...validOverride, value: -Infinity },
    ]
    const payloads = [
      null,
      'not-an-object',
      { type: 'ftb:theme:update', schemaVersion: 2 },
      { type: 'ftb:theme:update', schemaVersion: 1,
        theme: { schemaVersion: 1, colors: { primary: ['#dc2626'] } } },
      { type: 'ftb:theme:update', schemaVersion: 1,
        theme: { schemaVersion: 1, colors: { primary: null } } },
      { type: 'ftb:theme:update', schemaVersion: 1,
        theme: { schemaVersion: 1, colors: { primary: 42 } } },
      ...malformedOverrides.map((overrides) => ({
        type: 'ftb:theme:update', schemaVersion: 1,
        theme: { schemaVersion: 2, colors: { primary: '#dc2626' }, overrides: [overrides] },
      })),
    ]
    for (const data of payloads) {
      previewFrame.contentWindow!.postMessage(data, origin)
    }
  }, demoOrigin)
  await page.waitForTimeout(100)
  const acceptedMessages = await preview!.evaluate(() => Number(document.body.dataset.acceptedMessages))
  if (process.env.COMPOSE_E2E === '1') {
    expect(acceptedMessages).toBe(0)
    expect(await preview!.locator('#ftb-managed-theme')).toHaveCount(0)
  } else {
    expect(acceptedMessages).toBe(2)
    expect(await preview!.locator('#ftb-managed-theme').evaluate((style) => style.textContent))
      .toContain('#0f766e')
  }
  expect(pageErrors).toEqual([])

  await page.evaluate((origin) => {
    const previewFrame = document.querySelector<HTMLIFrameElement>('iframe[name="preview-frame"]')!
    previewFrame.contentWindow!.postMessage({
      type: 'ftb:theme:update', schemaVersion: 1,
      theme: { schemaVersion: 2, colors: { primary: '#dc2626' }, overrides: [] },
    }, origin)
  }, demoOrigin)
  const finalAcceptedMessages = await preview!.evaluate(() => Number(document.body.dataset.acceptedMessages))
  if (process.env.COMPOSE_E2E === '1') {
    expect(finalAcceptedMessages).toBe(0)
    expect(await preview!.locator('#ftb-managed-theme')).toHaveCount(0)
  } else {
    expect(finalAcceptedMessages).toBe(3)
    expect(await preview!.locator('#ftb-managed-theme').evaluate((style) => style.textContent))
      .toContain('#dc2626')
  }

  await page.goto(builderOrigin.replace('127.0.0.1', 'localhost'))
  await page.setContent(`
    <iframe name="cross-origin-preview" src="${demoOrigin}/demo/admin"></iframe>
  `)
  const crossOriginPreview = page.frame({ name: 'cross-origin-preview' })
  expect(crossOriginPreview).toBeTruthy()
  await expect(
    page.frameLocator('iframe[name="cross-origin-preview"]').getByRole('heading', { name: /dashboard/i }),
  ).toBeVisible()
  await crossOriginPreview!.evaluate(() => {
    document.body.dataset.acceptedMessages = '0'
    document.body.dataset.receivedMessages = '0'
    window.addEventListener('message', () => {
      document.body.dataset.receivedMessages = String(Number(document.body.dataset.receivedMessages) + 1)
    })
    window.addEventListener('ftb:preview-message-accepted', () => {
      document.body.dataset.acceptedMessages = String(Number(document.body.dataset.acceptedMessages) + 1)
    })
  })
  await page.evaluate((origin) => {
    const previewFrame = document.querySelector<HTMLIFrameElement>('iframe[name="cross-origin-preview"]')!
    previewFrame.contentWindow!.postMessage({
      type: 'ftb:theme:update', schemaVersion: 1,
      theme: { schemaVersion: 1, colors: { primary: '#0f766e' } },
    }, origin)
  }, demoOrigin)
  await expect.poll(() => crossOriginPreview!.evaluate(() => Number(document.body.dataset.receivedMessages))).toBe(1)
  await page.waitForTimeout(100)
  expect(await crossOriginPreview!.evaluate(() => Number(document.body.dataset.acceptedMessages))).toBe(0)
})

test('configured preview allowlist does not implicitly allow the demo same-origin', async ({ page }) => {
  const demoOrigin = demoBaseUrl
  await page.goto(`${demoOrigin}/demo/admin`)
  await page.evaluate((origin) => {
    document.body.dataset.acceptedMessages = '0'
    window.addEventListener('ftb:preview-message-accepted', () => {
      document.body.dataset.acceptedMessages = String(Number(document.body.dataset.acceptedMessages) + 1)
    })
    window.postMessage({
      type: 'ftb:theme:update', schemaVersion: 1,
      theme: { schemaVersion: 1, colors: { primary: '#0f766e' } },
    }, origin)
  }, demoOrigin)

  await page.waitForTimeout(100)
  expect(await page.evaluate(() => Number(document.body.dataset.acceptedMessages))).toBe(0)
  expect(await page.locator('#ftb-managed-theme').count()).toBe(0)
})

test('demo credentials authenticate and logout returns to public preview', async ({ page }) => {
  await page.goto(`${demoBaseUrl}/demo/admin/login`)
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(previewUrl)
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

  const result = await page.evaluate(async () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return fetch('/demo/admin/logout', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrfToken ?? '' },
    }).then((response) => ({ status: response.status, url: response.url }))
  })

  expect(result.status).toBe(200)
  expect(result.url).toBe(previewUrl)
  await expect(page).toHaveURL(previewUrl)
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})

test('compose gateway serves builder and same-origin Filament', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const response = await page.goto(composeBaseUrl)
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).not.toContainText('Laravel')

  const admin = await page.request.get(`${composeBaseUrl}/demo/admin/login`)
  expect(admin.ok()).toBeTruthy()
  const adminHtml = await admin.text()
  const gatewayOrigin = new URL(composeBaseUrl).origin
  const generatedUrls = [
    ...adminHtml.matchAll(/(href|src|data-module-url|data-update-uri)="([^"]+)"/g),
  ].map(([, attribute, value]) => ({ attribute, url: new URL(value, composeBaseUrl) }))
  const filamentAssets = generatedUrls.filter(({ attribute, url }) =>
    ['href', 'src'].includes(attribute) && /^\/(?:css|js|fonts)\/filament\//.test(url.pathname),
  )
  const livewireUrls = generatedUrls.filter(({ url }) => /^\/livewire[^/]*(?:\/|$)/.test(url.pathname))

  expect(filamentAssets.some(({ url }) => url.pathname.startsWith('/css/filament/'))).toBeTruthy()
  expect(filamentAssets.some(({ url }) => url.pathname.startsWith('/js/filament/'))).toBeTruthy()
  expect(filamentAssets.some(({ url }) => url.pathname.startsWith('/fonts/filament/'))).toBeTruthy()
  expect(livewireUrls.length).toBeGreaterThan(0)
  for (const { url } of livewireUrls) {
    expect(url.origin).toBe(gatewayOrigin)
  }
  for (const { url } of [...filamentAssets, ...livewireUrls.filter(({ attribute }) => ['href', 'src'].includes(attribute))]) {
    expect(url.origin).toBe(gatewayOrigin)

    const asset = await page.request.get(url.href)
    expect(asset.ok(), `${url.pathname} should resolve on the gateway`).toBeTruthy()
  }
  await page.goto(`${composeBaseUrl}/demo/admin/login`)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/username/i)).toBeVisible()
  await expect(page.getByText('Username: user')).toBeVisible()
  await expect(page.getByText('Password: password')).toBeVisible()

  const updateUrl = livewireUrls.find(({ attribute }) => attribute === 'data-update-uri')?.url
  expect(updateUrl).toBeDefined()
  expect(updateUrl?.origin).toBe(gatewayOrigin)
  const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content')
  const component = page.locator('[wire\\:snapshot]').first()
  const snapshot = await component.getAttribute('wire:snapshot')
  expect(csrfToken).toBeTruthy()
  expect(snapshot).toBeTruthy()

  const update = await page.request.post(updateUrl!.href, {
    headers: { 'X-CSRF-TOKEN': csrfToken!, 'X-Livewire': 'true' },
    data: { components: [{ snapshot, updates: {}, calls: [] }] },
  })
  expect(update.status(), 'Livewire update should process this session-bound snapshot').toBe(200)
})

test('compose gateway serves demo Vite client and proxied API on same origin', async ({ request }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const isProduction = process.env.COMPOSE_PROD_E2E === '1'
  const demoAssetUrl = new URL(
    isProduction ? '/build/manifest.json' : '/_demo-vite/@vite/client',
    composeBaseUrl,
  )
  expect(demoAssetUrl.origin).toBe(new URL(composeBaseUrl).origin)
  if (!isProduction) {
    expect(demoAssetUrl.pathname).toBe('/_demo-vite/@vite/client')
    expect(demoAssetUrl.pathname).toMatch(/^\/_demo-vite\//)
  }
  const client = await request.get(demoAssetUrl.href)
  expect(client.ok()).toBeTruthy()
  if (!isProduction) {
    expect(new URL(client.url()).pathname).toBe('/_demo-vite/@vite/client')
    expect(new URL(client.url()).pathname).toMatch(/^\/_demo-vite\//)
    expect(client.headers()['content-type']).toContain('javascript')
  } else {
    expect(client.headers()['content-type']).toContain('json')
  }
  const api = await request.get(`${composeBaseUrl}/api/health`)
  expect(api.ok()).toBeTruthy()
  expect(new URL(api.url()).origin).toBe(new URL(composeBaseUrl).origin)
})

test('production gateway serves compiled assets without exposing Vite hot reload', async ({ request }) => {
  test.skip(process.env.COMPOSE_PROD_E2E !== '1', 'requires a running production Compose stack')

  const hotFile = await request.get(`${composeBaseUrl}/hot`)
  expect(hotFile.ok()).toBeFalsy()

  const manifest = await request.get(`${composeBaseUrl}/build/manifest.json`)
  expect(manifest.ok()).toBeTruthy()
  const manifestEntries = await manifest.json()
  const entry = Object.values(manifestEntries).find((value) => typeof value === 'object' && value !== null)
  expect(entry).toBeTruthy()
  const asset = await request.get(`${composeBaseUrl}/build/${(entry as { file: string }).file}`)
  expect(asset.ok()).toBeTruthy()

  const builder = await request.get(composeBaseUrl)
  expect(builder.ok()).toBeTruthy()
  const builderHtml = await builder.text()
  const builderAssetPath = builderHtml.match(/(?:src|href)="(\/assets\/[^"]+)"/)?.[1]
  expect(builderAssetPath).toBeDefined()
  expect(builderAssetPath).toMatch(/^\/assets\/.+\.(?:js|css)$/)
  const builderAsset = await request.get(new URL(builderAssetPath!, composeBaseUrl).href)
  expect(builderAsset.ok()).toBeTruthy()
})
