import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'
import { resetBuilderStorage } from './support/reset-builder-storage'

test.skip(process.env.COMPOSE_E2E !== '1', 'FTB-054 requires the isolated Compose gateway.')

test('stdio MCP discovers and confirms typed padding without accepting selectors', async ({ page }) => {
  test.setTimeout(180_000)
  const client = await startStdioMcpClient(composeLocalThemeCommand)
  try {
    await client.initialize()
    await page.goto(builderBaseUrl)
    await page.evaluate(resetBuilderStorage)
    await page.reload()
    await page.getByLabel('Theme tools').click()
    await page.getByRole('button', { name: 'Pair local client' }).click()
    const pairingId = (await page.getByTestId('pairing-id').textContent())!
    await client.call('local_theme_pair', { pairing_id: pairingId })
    await page.getByRole('button', { name: 'Approve pairing' }).click()
    await expect.poll(async () => (await client.call('local_theme_pair', { pairing_id: pairingId })).structuredContent.status).toBe('approved')

    const discovered = (await client.call('local_padding_discover', { pairing_id: pairingId })).structuredContent
    expect(discovered.catalog.targets).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'forms.input', status: 'supported' })]))
    expect((await client.call('local_padding_set', { pairing_id: 'not-authorized', context: { scope: 'component', targetId: 'forms.input' }, edges: { top: '12px' } })).structuredContent.error).toBe('pairing_required')
    const invalid = await client.call('local_padding_set', { pairing_id: pairingId, context: { scope: 'component', targetId: 'forms.multiselect' }, edges: { top: '12px' } })
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: invalid.structuredContent.operation_id })).structuredContent.status).toBe('rejected')
    const dialog = page.getByRole('dialog', { name: 'Import preview' })
    const preview = await client.call('local_padding_preview', { pairing_id: pairingId, operation: 'set', context: { scope: 'component', targetId: 'forms.input' }, edges: { top: '12px' } })
    expect(preview.structuredContent).toMatchObject({ kind: 'padding_set', status: 'pending' })
    await expect(dialog.getByRole('button', { name: 'Confirm import' })).toBeVisible({ timeout: 20_000 })
    await dialog.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: preview.structuredContent.operation_id })).structuredContent.status).toBe('approved')
    const read = await client.call('local_padding_read', { pairing_id: pairingId, target_id: 'forms.input', context: { scope: 'component', targetId: 'forms.input' } })
    let readStatus: Record<string, unknown> = {}
    await expect.poll(async () => { readStatus = (await client.call('local_theme_operation_status', { operation_id: read.structuredContent.operation_id })).structuredContent; return readStatus.status === 'approved' && readStatus.result ? 'ready' : 'pending' }, { timeout: 20_000 }).toBe('ready')
    expect(readStatus).toMatchObject({ status: 'approved', result: expect.objectContaining({ paddingRead: expect.objectContaining({ resolved: expect.objectContaining({ targetId: 'forms.input' }) }) }) })
    const reset = await client.call('local_padding_reset', { pairing_id: pairingId, context: { scope: 'component', targetId: 'forms.input' }, reset_edges: ['top'] })
    await expect(dialog.getByRole('button', { name: 'Confirm import' })).toBeVisible({ timeout: 20_000 })
    await dialog.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: reset.structuredContent.operation_id })).structuredContent.status).toBe('approved')
  } finally {
    await client.close()
  }
})
