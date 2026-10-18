import { test, expect } from '@playwright/test'
import { builderBaseUrl } from './urls'

test('same-origin browser pairing sends its tab key only in the header', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'Pairing requires the same-origin Compose gateway.')
  await page.goto(builderBaseUrl)
  const post = page.waitForRequest((request) => request.url().endsWith('/local-theme/relay/pairings') && request.method() === 'POST')
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/local-theme/relay/pairings') && candidate.request().method() === 'POST')
  await page.getByRole('button', { name: 'Pair local client' }).click()
  const request = await post
  const result = await response
  await expect(page.getByRole('status').filter({ hasText: 'Pairing request created' })).toBeVisible()
  expect(result.status()).toBe(200)
  const body = request.postDataJSON() as Record<string, unknown>
  const headers = request.headers()
  expect(Object.keys(body).sort()).toEqual(['pairingId', 'version'])
  expect(body.version).toBe(1)
  expect(headers['x-ftb-tab-key']).toMatch(/^[a-f0-9]{64}$/)
  expect(headers['x-csrf-token']).toBeTruthy()
  expect(JSON.stringify(body)).not.toContain(headers['x-ftb-tab-key'])
  expect(await result.text()).not.toContain(headers['x-ftb-tab-key'])
})
