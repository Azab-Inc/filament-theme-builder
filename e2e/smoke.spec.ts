import { expect, test } from '@playwright/test'

test('builder embeds the Filament preview', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173')

  await expect(page.getByRole('heading', { name: 'Filament Theme Builder' })).toBeVisible()
  await expect(page.getByTitle('Filament preview')).toHaveAttribute(
    'src',
    'http://127.0.0.1:4174/demo/admin',
  )
  await expect(
    page.frameLocator('iframe[title="Filament preview"]').getByRole('heading', { name: /dashboard/i }),
  ).toBeVisible()
})

test('Filament admin login renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/demo/admin/login')

  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/username/i)).toBeVisible()
  await expect(page.getByText('Username: user')).toBeVisible()
  await expect(page.getByText('Password: password')).toBeVisible()
})

test('Filament preview is public and the builder embeds it', async ({ page }) => {
  const preview = await page.goto('http://127.0.0.1:4174/demo/admin')
  expect(preview?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  await expect(page.locator('#ftb-preview-bridge')).toHaveCount(1)

  await page.goto('http://127.0.0.1:4173')
  await expect(page.getByTitle('Filament preview')).toHaveAttribute(
    'src',
    'http://127.0.0.1:4174/demo/admin',
  )
})

test('demo credentials authenticate and logout returns to public preview', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/demo/admin/login')
  await page.getByLabel(/username/i).fill('user')
  await page.getByRole('textbox', { name: /password/i }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('http://127.0.0.1:4174/demo/admin')
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

  const result = await page.evaluate(async () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return fetch('/demo/admin/logout', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrfToken ?? '' },
    }).then((response) => ({ status: response.status, url: response.url }))
  })

  expect(result.status).toBe(200)
  expect(result.url).toBe('http://127.0.0.1:4174/demo/admin')
  await expect(page).toHaveURL('http://127.0.0.1:4174/demo/admin')
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

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
