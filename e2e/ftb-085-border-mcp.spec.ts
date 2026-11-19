import { expect, test } from '@playwright/test'
import { builderBaseUrl } from './urls'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'
import { resetBuilderStorage } from './support/reset-builder-storage'

test.skip(process.env.COMPOSE_E2E !== '1', 'FTB-085 requires the isolated Compose gateway.')
test.use({ acceptDownloads: true })

test('stdio MCP discovers, previews, confirms, applies, and rejects unauthorized border intents', async ({ page }) => {
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
    const approval = page.waitForResponse((response) => response.url().endsWith(`/local-theme/relay/pairings/${pairingId}/approve`))
    await page.getByRole('button', { name: 'Approve pairing' }).click()
    expect((await approval).status()).toBe(200)
    await expect.poll(async () => (await client.call('local_theme_pair', { pairing_id: pairingId })).structuredContent.status).toBe('approved')
    await expect(page.locator('section[aria-label="Local client pairing"]').getByRole('status')).toContainText('Local client connected')
    const dialog = page.getByRole('dialog', { name: 'Import preview' })
    const discovered = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'discover' })).structuredContent
    expect(discovered.target_kinds).toContain('semantic-border')
    expect(discovered.border_targets.find((target: { id: string }) => target.id === 'form.product-name')).toMatchObject({ sides: ['top', 'right', 'bottom', 'left'], properties: ['width', 'color', 'style'], ring_backed: true })
    expect(discovered.border_read_fields).toEqual(expect.arrayContaining(['effectiveValues', 'provenance', 'explicit']))
    const activeThemeId = await page.evaluate(() => localStorage.getItem('ftb-theme-active'))
    expect(activeThemeId).toMatch(/^[a-z0-9-]+$/)
    const readOperation = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'read', theme_id: activeThemeId })).structuredContent
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: readOperation.operation_id })).structuredContent, { timeout: 20_000 }).toMatchObject({ status: 'approved' })
    const colorOperation = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'create-color', target: { kind: 'user-color', name: 'borderaccent' }, value: '#123456' })).structuredContent
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('button', { name: 'Confirm import' }).or(dialog.getByRole('alert'))).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: colorOperation.operation_id })).structuredContent.status).toBe('approved')
    await page.getByRole('button', { name: 'Light mode' }).click()
    await page.getByLabel('Theme tools').click()
    await expect(page.getByRole('button', { name: 'Pair local client' })).toBeHidden()
    await page.getByLabel('Theme tools').click()
    await expect(page.getByRole('button', { name: 'Import theme' })).toBeVisible()

    const target = { kind: 'semantic-border', targetId: 'table.container', edge: 'bottom', property: 'width', scope: 'global' }
    const unauthorized = await client.call('local_theme_token_operation', { pairing_id: 'not-authorized', action: 'set', target, value: '2' })
    expect(unauthorized.structuredContent.error).toBe('pairing_required')
    const operation = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target, value: '2' })).structuredContent
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('button', { name: 'Confirm import' }).or(dialog.getByRole('alert'))).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: operation.operation_id })).structuredContent.status).toBe('approved')
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await expect(frame.locator('.fi-ta-ctn').first()).toHaveCSS('border-bottom-width', '2px')

    const rawTarget = { kind: 'raw', selector: '.fi-section-has-header', property: 'border-top-width' }
    const rawUnauthorized = await client.call('local_theme_token_operation', { pairing_id: 'not-authorized', action: 'set', target: rawTarget, value: '0' })
    expect(rawUnauthorized.structuredContent.error).toBe('pairing_required')
    const unsafeRaw = await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target: rawTarget, value: '0; color:red' })
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('alert')).toContainText(/unable to validate|invalid|unsafe|reject/i)
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: unsafeRaw.structuredContent.operation_id })).structuredContent.status).toBe('rejected')
    await dialog.getByRole('button', { name: 'Cancel import' }).click()
    const rawOperation = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target: rawTarget, value: '0' })).structuredContent
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('button', { name: 'Confirm import' }).or(dialog.getByRole('alert'))).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: rawOperation.operation_id })).structuredContent.status).toBe('approved')
    await expect(frame.locator('.fi-section-has-header').first()).toHaveCSS('border-top-width', '0px')
    const rawColorTarget = { kind: 'raw', selector: '.fi-section-has-header', property: 'border-top-color' }
    const rawColorOperation = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target: rawColorTarget, value: 'user.color.borderaccent' })).structuredContent
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('button', { name: 'Confirm import' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: rawColorOperation.operation_id })).structuredContent.status).toBe('approved')
    await expect(frame.locator('.fi-section-has-header').first()).toHaveCSS('border-top-color', 'rgb(18, 52, 86)')
    await page.locator('summary[aria-label="Export actions"]').click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download vanilla CSS' }).click(),
    ])
    const stream = await download.createReadStream()
    let css = ''
    for await (const chunk of stream ?? []) css += chunk.toString()
    expect(css).toContain('border-top-color: var(--ftb-user-color-borderaccent);')
    expect(css).toContain(':where(html:not(.dark)) { --ftb-user-color-borderaccent: #123456; }')
    const borderReadOperation = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'read', theme_id: activeThemeId })).structuredContent
    let borderRead: Record<string, unknown> = {}
    await expect.poll(async () => { borderRead = (await client.call('local_theme_operation_status', { operation_id: borderReadOperation.operation_id })).structuredContent; return borderRead }, { timeout: 20_000 }).toMatchObject({ status: 'approved' })
    expect(borderRead).toMatchObject({ result: expect.objectContaining({ border_read: expect.arrayContaining([expect.objectContaining({ targetId: '.fi-section-has-header', edge: 'top', property: 'color', effectiveValues: expect.objectContaining({ light: 'user.color.borderaccent' }), provenance: 'raw' })]) }) })

    const stale = (await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target, value: '4' })).structuredContent
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('button', { name: 'Confirm import' }).or(dialog.getByRole('alert'))).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await page.getByLabel('Primary color').first().fill('#0f766e', { force: true })
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect(page.getByRole('alert')).toContainText(/stale/i)
    await expect.poll(async () => (await client.call('local_theme_operation_status', { operation_id: stale.operation_id })).structuredContent.status).toBe('rejected')

  } finally {
    await client.close()
  }
})
