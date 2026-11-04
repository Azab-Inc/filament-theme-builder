import { expect, test, type Page } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'
import type { McpToolCallResult, StdioMcpClient } from './support/stdio-mcp-client.model'

test.skip(process.env.COMPOSE_E2E !== '1', 'Transparent MCP coverage requires the isolated Compose gateway.')

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
  return pairingId!
}

async function applyIntent(page: Page, client: StdioMcpClient, args: Record<string, unknown>): Promise<void> {
  const operation = status(await client.call('local_theme_token_operation', args))
  const preview = page.getByRole('dialog', { name: 'Import preview' })
  await expect(preview).toBeVisible({ timeout: 20_000 })
  await expect(preview.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await waitForStatus(client, String(operation.operation_id), 'approved')
}

test('MCP can preview, apply, preview, and reset a transparent raw color', async ({ page }) => {
  test.setTimeout(120_000)
  const client = await startStdioMcpClient(composeLocalThemeCommand)
  try {
    expect((await client.initialize()).protocolVersion).toBe('2025-11-25')
    expect(await client.listTools()).toEqual(expect.arrayContaining(['local_theme_token_operation', 'local_theme_operation_status']))
    const pairingId = await pair(page, client)
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.screenshot({ path: 'docs/verification/ftb-061/mcp-before.png', fullPage: false })

    await applyIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: '.fi-section', property: 'background-color' }, value: 'transparent' })
    await expect(frame.locator('.fi-section').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await page.screenshot({ path: 'docs/verification/ftb-061/mcp-after.png', fullPage: false })

    await applyIntent(page, client, { pairing_id: pairingId, action: 'reset', target: { kind: 'raw', selector: '.fi-section', property: 'background-color' }, mode: 'light' })
    await expect.poll(() => page.evaluate(() => {
      const id = localStorage.getItem('ftb-theme-active')
      const state = id ? JSON.parse(localStorage.getItem(`ftb-theme:${id}`) ?? '{}') : {}
      return state.rawOverrides?.some((override: { selector?: string; properties?: Record<string, string> }) => override.selector === '.fi-section' && override.properties?.['background-color'] === 'transparent') ?? false
    })).toBe(false)
  } finally {
    await client.close()
  }
})
