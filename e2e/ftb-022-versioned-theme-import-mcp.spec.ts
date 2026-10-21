import { test, expect } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'
import type { McpToolCallResult } from './support/stdio-mcp-client.model'

async function localThemeCollection(page: import('@playwright/test').Page) {
  return page.locator('[data-local-theme-row]').evaluateAll((rows) => rows.map((row) => ({
    id: row.getAttribute('data-local-theme-row'), name: row.querySelector('strong')?.textContent?.trim(),
  })))
}

async function browserStorage(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort(([left], [right]) => left.localeCompare(right))))
}

test('browser import previews before creating a fresh local theme', async ({ page }) => {
  await page.goto(builderBaseUrl)
  await expect(page.getByRole('button', { name: 'Import theme' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Pair local client/i })).toBeEnabled()
  const activeBefore = await page.locator('[data-active-theme-name]').textContent()
  const themesBeforeCancel = await localThemeCollection(page)
  const storageBeforeCancel = await browserStorage(page)
  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles('e2e/fixtures/theme-import/v1.json')
  const preview = page.getByRole('dialog', { name: 'Import preview' })
  await expect(preview).toBeVisible()
  await expect(preview).toContainText('v1.json')
  await expect(preview).toContainText('1 → 2 → 3 → 4')
  await expect(preview).toContainText('SHA-256')
  await expect(preview).toContainText('51 bytes')
  await expect(page.locator('[data-active-theme-name]')).toHaveText(activeBefore ?? '')
  await page.getByRole('textbox', { name: 'Theme name' }).fill('Imported example')
  await page.getByRole('button', { name: 'Cancel import' }).click()
  await expect(page.locator('[data-active-theme-name]')).not.toHaveText('Imported example')
  expect(await localThemeCollection(page)).toEqual(themesBeforeCancel)
  expect(await browserStorage(page)).toBe(storageBeforeCancel)

  const themesBeforeInvalidFile = await localThemeCollection(page)
  const storageBeforeInvalidFile = await browserStorage(page)
  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') })
  const importError = page.getByRole('alert')
  await expect(importError).toBeVisible()
  await expect(importError).toHaveText(/\S+/)
  expect(await localThemeCollection(page)).toEqual(themesBeforeInvalidFile)
  expect(await browserStorage(page)).toBe(storageBeforeInvalidFile)
  await page.getByRole('button', { name: 'Cancel import' }).click()

  await page.getByRole('button', { name: 'Import theme' }).click()
  await page.getByLabel('Theme JSON file').setInputFiles('e2e/fixtures/theme-import/v1.json')
  await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Theme name' }).fill('Imported confirmed')
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.locator('[data-active-theme-name]')).toHaveText('Imported confirmed')
})

test('real ftb:mcp import previews, cancels, rejects stale state, confirms once, and revokes', async ({ page }) => {
  test.skip(process.env.COMPOSE_E2E !== '1', 'Real MCP integration requires the Compose demo-php service.')
  test.setTimeout(150_000)
  const client = await startStdioMcpClient(composeLocalThemeCommand)
  const rawJson = readFileSync(resolve(process.cwd(), 'e2e/fixtures/theme-import/v1.json'), 'utf8')
  const status = (result: McpToolCallResult) => result.structuredContent
  try {
    expect((await client.initialize()).protocolVersion).toBe('2025-11-25')
    expect(await client.listTools()).toEqual(expect.arrayContaining(['local_theme_pair', 'local_theme_import_preview', 'local_theme_operation_status']))
    await page.goto(builderBaseUrl)
    const themesBefore = await localThemeCollection(page)
    const storageBefore = await browserStorage(page)
    await page.getByRole('button', { name: 'Pair local client' }).click()
    const pairingId = await page.getByTestId('pairing-id').textContent()
    expect(pairingId).toMatch(/^[A-Za-z0-9_-]{16,}$/)
    await client.call('local_theme_pair', { pairing_id: pairingId })
    await expect(page.getByRole('button', { name: 'Approve pairing' })).toBeVisible()
    const approvalResponse = page.waitForResponse((response) => response.url().endsWith(`/local-theme/relay/pairings/${pairingId}/approve`))
    await page.getByRole('button', { name: 'Approve pairing' }).click()
    expect((await approvalResponse).status()).toBe(200)
    await expect.poll(async () => (await client.call('local_theme_pair', { pairing_id: pairingId })).structuredContent.status)
      .toBe('approved')
    await expect(page.locator('section[aria-label="Local client pairing"]').getByRole('status')).toContainText('Local client connected')

    const invalid = status(await client.call('local_theme_import_preview', {
      pairing_id: pairingId, raw_json: '{', filename: 'filament-theme.json', proposed_name: 'Invalid live payload',
    }))
    expect(invalid.operation_id).toMatch(/^[a-f0-9]{64}$/)
    const preview = page.getByRole('dialog', { name: 'Import preview' })
    await expect(preview).toContainText(/Expected property name/, { timeout: 20_000 })
    await page.getByRole('button', { name: 'Cancel import' }).click()
    await expect.poll(async () => status(await client.call('local_theme_operation_status', { operation_id: invalid.operation_id })))
      .toMatchObject({ status: 'rejected', error_category: 'invalid_theme' })
    expect(await localThemeCollection(page)).toEqual(themesBefore)
    expect(await browserStorage(page)).toBe(storageBefore)

    const canceled = status(await client.call('local_theme_import_preview', {
      pairing_id: pairingId, raw_json: rawJson, filename: 'filament-theme.json', proposed_name: 'Canceled live import',
    }))
    await expect(preview).toBeVisible({ timeout: 20_000 })
    await expect(preview).toContainText('1 → 2 → 3 → 4')
    await page.getByRole('button', { name: 'Cancel import' }).click()
    await expect.poll(async () => status(await client.call('local_theme_operation_status', { operation_id: canceled.operation_id })))
      .toMatchObject({ status: 'rejected' })
    expect(await localThemeCollection(page)).toEqual(themesBefore)
    expect(await browserStorage(page)).toBe(storageBefore)

    const stale = status(await client.call('local_theme_import_preview', {
      pairing_id: pairingId, raw_json: rawJson, filename: 'filament-theme.json', proposed_name: 'Stale live import',
    }))
    await expect(preview).toBeVisible({ timeout: 20_000 })
    await page.locator('#toolbar-primary-color').fill('#0f766e')
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect(page.getByRole('alert')).toContainText(/stale/i)
    await expect.poll(async () => status(await client.call('local_theme_operation_status', { operation_id: stale.operation_id })))
      .toMatchObject({ status: 'rejected', error_category: 'stale_revision' })
    expect(await localThemeCollection(page)).toEqual(themesBefore)
    await page.getByRole('button', { name: 'Cancel import' }).click()

    const accepted = status(await client.call('local_theme_import_preview', {
      pairing_id: pairingId, raw_json: rawJson, filename: 'filament-theme.json', proposed_name: 'Task9 live import',
    }))
    await expect(preview).toBeVisible({ timeout: 20_000 })
    await page.getByRole('textbox', { name: 'Theme name' }).fill('Task9 live import confirmed')
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect(page.locator('[data-active-theme-name]')).toHaveText('Task9 live import confirmed')
    await expect.poll(async () => status(await client.call('local_theme_operation_status', { operation_id: accepted.operation_id })))
      .toMatchObject({ status: 'approved' })
    const approved = status(await client.call('local_theme_operation_status', { operation_id: accepted.operation_id }))
    expect(approved.record_id).toEqual(expect.any(String))
    const recordId = approved.record_id
    await expect.poll(async () => status(await client.call('local_theme_operation_status', { operation_id: accepted.operation_id })))
      .toMatchObject({ status: 'approved', record_id: recordId })
    expect(await localThemeCollection(page)).toHaveLength(themesBefore.length + 1)

    const listing = status(await client.call('local_theme_list', { pairing_id: pairingId }))
    const listResult = page.waitForResponse((response) => response.url().endsWith(`/local-theme/relay/operations/${listing.operation_id}/result`)
      && response.request().method() === 'POST', { timeout: 25_000 })
    expect((await listResult).status()).toBe(200)
    const delivered = status(await client.call('local_theme_operation_status', { operation_id: listing.operation_id }))
    expect(delivered.status).toBe('approved')
    expect(delivered.result).toHaveProperty('themes')
    expect(delivered.result).toMatchObject({ themes: expect.arrayContaining([expect.objectContaining({ name: 'Task9 live import confirmed' })]) })
    const consumed = status(await client.call('local_theme_operation_status', { operation_id: listing.operation_id }))
    expect(consumed.status).toBe('approved')
    expect(consumed.result).toBeUndefined()

    const disconnectResponse = page.waitForResponse((response) => response.url().endsWith('/local-theme/relay/sessions/disconnect'))
    await page.getByRole('button', { name: 'Disconnect local client' }).click()
    expect((await disconnectResponse).status()).toBe(200)
    await expect(page.locator('section[aria-label="Local client pairing"]').getByRole('status')).toContainText('Local client disconnected')
    const revoked = await client.call('local_theme_list', { pairing_id: pairingId })
    expect(revoked.structuredContent).toEqual({ error: 'pairing_required' })
    await page.reload()
    await expect(page.locator('[data-active-theme-name]')).toHaveText('Task9 live import confirmed')
    expect(await localThemeCollection(page)).toHaveLength(themesBefore.length + 1)
  } finally {
    await client.close()
  }
})
