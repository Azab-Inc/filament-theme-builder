import { expect, test, type Page } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'
import type { McpToolCallResult, StdioMcpClient } from './support/stdio-mcp-client.model'

test.skip(process.env.COMPOSE_E2E !== '1', 'FTB-058 requires the isolated Compose gateway.')
test.use({ viewport: { width: 2000, height: 1100 } })

const status = (result: McpToolCallResult): Record<string, unknown> => result.structuredContent

async function waitForStatus(client: StdioMcpClient, operationId: string, expected: string): Promise<Record<string, unknown>> {
  let result: Record<string, unknown> = {}
  await expect.poll(async () => {
    result = status(await client.call('local_theme_operation_status', { operation_id: operationId }))
    return result.status
  }, { timeout: 30_000 }).toBe(expected)
  return result
}

async function pair(page: Page, client: StdioMcpClient): Promise<string> {
  await page.goto(builderBaseUrl)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel('Theme tools').click()
  await page.getByRole('button', { name: 'Pair local client' }).click()
  const pairingId = await page.getByTestId('pairing-id').textContent()
  expect(pairingId).toMatch(/^[A-Za-z0-9_-]{16,}$/)
  await client.call('local_theme_pair', { pairing_id: pairingId })
  const approvalResponse = page.waitForResponse((response) => response.url().endsWith(`/local-theme/relay/pairings/${pairingId}/approve`))
  await page.getByRole('button', { name: 'Approve pairing' }).click()
  expect((await approvalResponse).status()).toBe(200)
  await expect.poll(async () => status(await client.call('local_theme_pair', { pairing_id: pairingId })).status).toBe('approved')
  await expect(page.locator('section[aria-label="Local client pairing"]').getByRole('status')).toContainText('Local client connected')
  return pairingId!
}

async function intent(page: Page, client: StdioMcpClient, args: Record<string, unknown>, confirm = true): Promise<Record<string, unknown>> {
  const operation = status(await client.call('local_theme_token_operation', args))
  expect(operation.operation_id).toMatch(/^[a-f0-9]{64}$/)
  const preview = page.getByRole('dialog', { name: 'Import preview' })
  await expect(preview).toBeVisible({ timeout: 20_000 })
  if (await preview.getByRole('alert').count()) throw new Error(`Relay preview failed: ${await preview.getByRole('alert').innerText()}`)
  if (confirm) {
    await page.getByRole('button', { name: 'Confirm import' }).click()
    return waitForStatus(client, String(operation.operation_id), 'approved')
  }
  await page.getByRole('button', { name: 'Cancel import' }).click()
  return waitForStatus(client, String(operation.operation_id), 'rejected')
}

test('MCP token operations use browser consent, domain actions, export, persistence, stale state, cancellation, and revoke', async ({ page }) => {
  test.setTimeout(180_000)
  const client = await startStdioMcpClient(composeLocalThemeCommand)
  try {
    expect((await client.initialize()).protocolVersion).toBe('2025-11-25')
    expect(await client.listTools()).toEqual(expect.arrayContaining(['local_theme_pair', 'local_theme_token_operation', 'local_theme_export', 'local_theme_operation_status']))
    const pairingId = await pair(page, client)
    expect(status(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'discover' }))).toMatchObject({
      read_boundary: 'local_theme_export', mutation_boundary: 'browser_theme_intent_preview_revision_grant',
    })

    await page.getByRole('button', { name: 'Light mode' }).click()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByLabel('Theme tools').click()
    await expect(page.getByRole('button', { name: 'Pair local client' })).toBeHidden()
    await page.screenshot({ path: 'docs/verification/ftb-058/mcp-before.png', fullPage: false })
    await page.getByLabel('Theme tools').click()
    await intent(page, client, { pairing_id: pairingId, action: 'create-color', target: { kind: 'user-color', name: 'brandaccent' }, value: '#123456' })

    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await intent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: '.fi-sidebar', property: 'background-color' }, value: 'user.color.brandaccent' })
    await expect(frame.locator('.fi-sidebar')).toHaveCSS('background-color', 'rgb(18, 52, 86)')

    await intent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: '.fi-sidebar', property: 'padding' }, value: '12px' })
    await expect(frame.locator('.fi-sidebar')).toHaveCSS('padding-top', '12px')

    const columnSelector = '.fi-ta :is(.fi-ta-header-cell, .fi-ta-cell):nth-child(2)'
    await intent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: columnSelector, property: 'background-color' }, value: '#123456' })
    await expect(frame.locator('.fi-ta-header-cell').nth(1)).toHaveCSS('background-color', 'rgb(18, 52, 86)')
    await expect(frame.locator('.fi-ta-cell').nth(1)).toHaveCSS('background-color', 'rgb(18, 52, 86)')
    await expect(frame.locator('.fi-sidebar')).toHaveCSS('background-color', 'rgb(18, 52, 86)')
    await expect(frame.locator('.fi-sidebar')).toHaveCSS('padding-top', '12px')
    await page.getByRole('button', { name: 'Light mode' }).click()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByLabel('Theme tools').click()
    await expect(page.getByRole('button', { name: 'Pair local client' })).toBeHidden()
    await page.screenshot({ path: 'docs/verification/ftb-058/mcp-after.png', fullPage: false })
    await page.getByLabel('Theme tools').click()

    await intent(page, client, { pairing_id: pairingId, action: 'link', target: { kind: 'raw', selector: '.fi-sidebar', property: 'background-color' }, value: '#abcdef' })
    await page.getByRole('button', { name: 'Dark mode' }).click()
    await expect(frame.locator('.fi-sidebar')).toHaveCSS('background-color', 'rgb(171, 205, 239)')
    await intent(page, client, { pairing_id: pairingId, action: 'unlink', target: { kind: 'raw', selector: '.fi-sidebar', property: 'background-color' }, mode: 'dark' })
    await intent(page, client, { pairing_id: pairingId, action: 'reset', target: { kind: 'raw', selector: '.fi-sidebar', property: 'background-color' }, mode: 'dark' })

    await intent(page, client, { pairing_id: pairingId, action: 'create-palette', target: { kind: 'user-palette', name: 'brandpalette' }, value: '#0f766e' })
    const activeThemeId = await page.evaluate(() => {
      const active = localStorage.getItem('ftb-theme-active')
      if (active) return active
      const records = JSON.parse(localStorage.getItem('ftb-themes') ?? '[]') as Array<{ id?: string }>
      return records[0]?.id ?? null
    })
    expect(activeThemeId).toMatch(/^[a-z0-9-]+$/)
    const exportOperation = status(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'read', theme_id: activeThemeId }))
    const exported = await waitForStatus(client, String(exportOperation.operation_id), 'approved')
    expect(exported.result).toBeDefined()

    const canceled = await intent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: '.fi-sidebar', property: 'opacity' }, value: '0.5' }, false)
    expect(canceled.status).toBe('rejected')

    const stale = status(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: '.fi-sidebar', property: 'opacity' }, value: '0.75' }))
    await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible({ timeout: 20_000 })
    await page.locator('#toolbar-primary-color').fill('#0f766e')
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect(page.getByRole('alert')).toContainText(/stale/i)
    await expect.poll(async () => status(await client.call('local_theme_operation_status', { operation_id: stale.operation_id })).status).toBe('rejected')
    await page.getByRole('button', { name: 'Cancel import' }).click()

    await page.getByRole('button', { name: 'Save theme', exact: true }).click()
    await page.getByRole('button', { name: 'Disconnect local client' }).click()
    await expect(page.locator('section[aria-label="Local client pairing"]').getByRole('status')).toContainText('disconnected')
    expect(status(await client.call('local_theme_list', { pairing_id: pairingId }))).toEqual({ error: 'pairing_required' })
    await page.goto(builderBaseUrl)
    await expect(page.getByRole('heading', { name: 'Filament Theme Builder' })).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-active-theme-name]')).toHaveText('Untitled', { timeout: 20_000 })
    await expect.poll(() => page.evaluate(() => Object.values(localStorage).some((value) => value.includes('brandpalette')))).toBe(true)
  } finally {
    await client.close()
  }
})
