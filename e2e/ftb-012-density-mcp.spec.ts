import { expect, test, type Frame, type Locator, type Page } from '@playwright/test'
import type { StdioMcpClient } from './support/stdio-mcp-client.model'
import type { DensitySnapshot } from './support/density-mcp.model'
import { builderBaseUrl } from './urls'
import { resetBuilderStorage } from './support/reset-builder-storage'
import { composeLocalThemeCommand, startStdioMcpClient } from './support/stdio-mcp-client'
import { confirmIntent, pairLocalClient, resultStatus, waitForOperation } from './support/density-mcp'

test.skip(process.env.COMPOSE_E2E !== '1', 'FTB-012 MCP density requires the isolated Compose gateway.')

async function densitySnapshot(page: Page): Promise<DensitySnapshot> {
  return page.evaluate((): DensitySnapshot => ({
    density: document.querySelector<HTMLInputElement>('#density')?.value ?? null,
    spacing2: document.querySelector<HTMLInputElement>('#spacing-2')?.value ?? null,
    spacing4: document.querySelector<HTMLInputElement>('#spacing-4')?.value ?? null,
    spacing6: document.querySelector<HTMLInputElement>('#spacing-6')?.value ?? null,
    radius: document.querySelector<HTMLSelectElement>('#radius')?.value ?? null,
    activeTheme: localStorage.getItem('ftb-theme-active'),
    themes: localStorage.getItem('ftb-themes'),
    themeState: localStorage.getItem(`ftb-theme:${localStorage.getItem('ftb-theme-active') ?? ''}`),
  }))
}

async function rejectInvalidIntent(page: Page, client: StdioMcpClient, args: Record<string, unknown>): Promise<void> {
  const operation: Record<string, unknown> = resultStatus(await client.call('local_theme_token_operation', args))
  const preview: Locator = page.getByRole('dialog', { name: 'Import preview' })
  await expect.poll(async (): Promise<unknown> => resultStatus(await client.call('local_theme_operation_status', { operation_id: operation.operation_id })).status, { timeout: 30_000 }).toBe('rejected')
  await expect(preview).toHaveCount(0)
}

test('MCP density is authenticated, shared, previewed, persisted, exported, and geometry-parity safe', async ({ page }: { page: Page }): Promise<void> => {
  test.setTimeout(240_000)
  const client: StdioMcpClient = await startStdioMcpClient(composeLocalThemeCommand)
  const composeBaseUrl: string = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
  try {
    await client.initialize()
    expect(resultStatus(await client.call('local_theme_token_operation', { pairing_id: 'unauthorized', action: 'discover' }))).toEqual({ error: 'pairing_required' })
    await page.goto(builderBaseUrl)
    await page.evaluate(resetBuilderStorage)
    await page.reload()
    let pairingId: string = await pairLocalClient(page, client)
    const discovery: Record<string, unknown> = resultStatus(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'discover' }))
    expect(discovery.foundation_targets).toEqual([{ path: 'density', scope: 'shared', values: ['compact', 'default', 'spacious'], actions: ['read', 'preview', 'set', 'reset'] }])
    expect(discovery.actions).toEqual(expect.arrayContaining(['read', 'preview', 'set', 'reset']))

    const unchangedBeforeInvalid: DensitySnapshot = await densitySnapshot(page)
    await rejectInvalidIntent(page, client, { pairing_id: pairingId, action: 'link', target: { kind: 'foundation', path: 'density' }, value: 'compact' })
    await rejectInvalidIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'foundation', path: 'density' }, value: 'invalid' })
    await rejectInvalidIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'foundation', path: 'density.light' }, value: 'compact' })
    expect(await densitySnapshot(page)).toEqual(unchangedBeforeInvalid)

    const canceled: Record<string, unknown> = await confirmIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'foundation', path: 'density' }, value: 'compact' }, false)
    expect(canceled.status).toBe('rejected')
    await expect(page.locator('#density')).toHaveValue('default')

    for (const value of ['compact', 'default', 'spacious'] as const) {
      await confirmIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'foundation', path: 'density' }, mode: 'dark', value }, true)
      await expect(page.locator('#density')).toHaveValue(value)
      await expect(page.locator('#spacing-2')).toHaveValue(value === 'compact' ? '6' : value === 'spacious' ? '12' : '8')
    }
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.locator('#density')).toHaveValue('default')
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(page.locator('#density')).toHaveValue('spacious')

    await page.locator('#spacing-6').fill('23')
    await page.locator('#radius').selectOption('lg')
    await confirmIntent(page, client, { pairing_id: pairingId, action: 'create-color', target: { kind: 'user-color', name: 'accent' }, value: '#123456' }, true)
    await confirmIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'semantic', targetId: 'form.product-name', controlId: 'background', scope: 'global' }, value: '#abcdef' }, true)
    await confirmIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'raw', selector: '.fi-sidebar', property: 'padding' }, value: '12px' }, true)
    await confirmIntent(page, client, { pairing_id: pairingId, action: 'set', target: { kind: 'palette-base', name: 'primary' }, value: '#0f766e' }, true)
    const beforeDensityPreview: DensitySnapshot = await densitySnapshot(page)
    const densityOperation: Record<string, unknown> = resultStatus(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target: { kind: 'foundation', path: 'density' }, value: 'compact' }))
    await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible({ timeout: 20_000 })
    expect(await densitySnapshot(page)).toEqual(beforeDensityPreview)
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect.poll(async (): Promise<unknown> => resultStatus(await client.call('local_theme_operation_status', { operation_id: densityOperation.operation_id })).status).toBe('approved')
    const afterDensitySet: DensitySnapshot = await densitySnapshot(page)
    expect(afterDensitySet.spacing6).toBe('23')
    expect(afterDensitySet.radius).toBe('lg')
    expect(afterDensitySet.themeState).toEqual(expect.stringContaining('accent'))
    expect(afterDensitySet.themeState).toEqual(expect.stringContaining('#abcdef'))
    expect(afterDensitySet.themeState).toEqual(expect.stringContaining('12px'))
    expect(afterDensitySet.themeState).toEqual(expect.stringContaining('#0f766e'))

    const activeThemeId: string = await page.evaluate((): string => localStorage.getItem('ftb-theme-active') ?? '')
    const exportOperation: Record<string, unknown> = resultStatus(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'read', target: { kind: 'foundation', path: 'density' }, theme_id: activeThemeId }))
    const exported: Record<string, unknown> = await waitForOperation(client, String(exportOperation.operation_id), 'approved')
    const exportResult: Record<string, unknown> = exported.result !== null && typeof exported.result === 'object' ? exported.result as Record<string, unknown> : {}
    expect(String(exportResult.json ?? JSON.stringify(exportResult))).toContain('"density":"compact"')
    await page.reload()
    await expect(page.locator('#density')).toHaveValue('compact')
    pairingId = await pairLocalClient(page, client)

    await page.locator('#density').selectOption('compact')
    const stale: Record<string, unknown> = resultStatus(await client.call('local_theme_token_operation', { pairing_id: pairingId, action: 'set', target: { kind: 'foundation', path: 'density' }, value: 'default' }))
    await expect(page.getByRole('dialog', { name: 'Import preview' })).toBeVisible({ timeout: 20_000 })
    await page.locator('#toolbar-primary-color').evaluate((element: HTMLInputElement): void => {
      const input: HTMLInputElement = element as HTMLInputElement
      input.value = '#0f766e'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Confirm import' }).click()
    await expect(page.getByRole('alert')).toContainText(/stale/i)
    expect((await waitForOperation(client, String(stale.operation_id), 'rejected')).status).toBe('rejected')
    await page.getByRole('button', { name: 'Cancel import' }).click()
    await expect(page.locator('#density')).toHaveValue('compact')

    await page.goto(`${composeBaseUrl}/demo/admin/login`)
    await page.locator('#form\\.email').fill('user')
    await page.locator('#form\\.password').fill('password')
    await page.locator('#form').evaluate((form: HTMLFormElement): void => form.requestSubmit())
    await expect(page).toHaveURL(`${composeBaseUrl}/demo/admin`)
    const nativePage: Page = await page.context().newPage()
    await nativePage.goto(`${composeBaseUrl}/demo/admin/tables-showcase`)
    await page.goto(builderBaseUrl)
    pairingId = await pairLocalClient(page, client)
    await page.evaluate((url: string): void => { document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = url }, `${composeBaseUrl}/demo/admin/tables-showcase`)
    await expect.poll((): string => page.frames().find((frame: Frame): boolean => /\/demo\/admin\/tables-showcase/.test(frame.url()))?.url() ?? '', { timeout: 20_000 }).toContain('/demo/admin/tables-showcase')
    const previewFrame: Frame | null = page.frame({ url: /\/demo\/admin\/tables-showcase/ })
    await expect(previewFrame!.locator('.fi-ta')).toHaveCount(3)
    const measure: (frame: Frame | Page) => Promise<number[]> = async (frame: Frame | Page): Promise<number[]> => frame.locator('.fi-ta').evaluateAll((tables: Element[]): number[] => tables.map((table: Element): number => table.querySelector('tbody tr:not(.fi-ta-group-header-row)')!.getBoundingClientRect().height))
    const nativeRows: number[] = await measure(nativePage)
    const compactRows: number[] = await measure(previewFrame!)
    expect(compactRows).toEqual(nativeRows.map((height: number): number => height - 8))
    await confirmIntent(page, client, { pairing_id: pairingId, action: 'reset', target: { kind: 'foundation', path: 'density' }, mode: 'dark' }, true)
    const resetRows: number[] = await measure(previewFrame!)
    expect(resetRows).toEqual(nativeRows)
    const afterDensityReset: DensitySnapshot = await densitySnapshot(page)
    expect(afterDensityReset.spacing6).toBe('23')
    expect(afterDensityReset.radius).toBe('lg')
    expect(afterDensityReset.themeState).toEqual(expect.stringContaining('accent'))
    expect(afterDensityReset.themeState).toEqual(expect.stringContaining('#abcdef'))
    expect(afterDensityReset.themeState).toEqual(expect.stringContaining('12px'))
    expect(afterDensityReset.themeState).toEqual(expect.stringContaining('#0f766e'))
    await nativePage.close()
  } finally {
    await client.close()
  }
})
