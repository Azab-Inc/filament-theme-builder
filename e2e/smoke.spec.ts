import { expect, test } from '@playwright/test'

test('Vue builder scaffold renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173')

  await expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'vuejs.org' })).toHaveAttribute(
    'href',
    'https://vuejs.org/',
  )
})

test('Filament admin login renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/demo/admin/login')

  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/email address/i)).toBeVisible()
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
  await expect(page.getByLabel(/email address/i)).toBeVisible()
})

test('compose gateway serves demo Vite client and proxied API on same origin', async ({ request }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'requires a running Compose stack')
  const demoAssetPath = composeBaseUrl.endsWith(':9080')
    ? '/build/manifest.json'
    : '/_demo-vite/@vite/client'
  const client = await request.get(`${composeBaseUrl}${demoAssetPath}`)
  expect(client.ok()).toBeTruthy()
  if (demoAssetPath.includes('vite')) {
    expect(client.headers()['content-type']).toContain('javascript')
    const clientSource = await client.text()
    expect(clientSource).toContain('/_demo-vite/')
    expect(clientSource).not.toContain('"/@vite/client"')
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
})
