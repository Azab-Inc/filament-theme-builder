import { expect, type Page, type Response } from '@playwright/test'
import type { McpToolCallResult, StdioMcpClient } from './stdio-mcp-client.model'

export const resultStatus = (result: McpToolCallResult): Record<string, unknown> => result.structuredContent

export async function waitForOperation(client: StdioMcpClient, operationId: string, expected: string): Promise<Record<string, unknown>> {
  let result: Record<string, unknown> = {}
  await expect.poll(async (): Promise<unknown> => {
    result = resultStatus(await client.call('local_theme_operation_status', { operation_id: operationId }))
    return result.status
  }, { timeout: 30_000 }).toBe(expected)
  return result
}

export async function pairLocalClient(page: Page, client: StdioMcpClient): Promise<string> {
  await page.getByLabel('Theme tools').click()
  await page.getByRole('button', { name: 'Pair local client' }).click()
  const pairingId: string = (await page.getByTestId('pairing-id').textContent()) ?? ''
  expect(pairingId).toMatch(/^[A-Za-z0-9_-]{16,}$/)
  await client.call('local_theme_pair', { pairing_id: pairingId })
  const approvalResponse: Promise<Response> = page.waitForResponse((response: Response): boolean => response.url().endsWith(`/local-theme/relay/pairings/${pairingId}/approve`))
  await page.getByRole('button', { name: 'Approve pairing' }).click()
  expect((await approvalResponse).status()).toBe(200)
  await expect.poll(async (): Promise<unknown> => resultStatus(await client.call('local_theme_pair', { pairing_id: pairingId })).status).toBe('approved')
  return pairingId
}

export async function confirmIntent(page: Page, client: StdioMcpClient, args: Record<string, unknown>, confirm: boolean): Promise<Record<string, unknown>> {
  const operation: Record<string, unknown> = resultStatus(await client.call('local_theme_token_operation', args))
  const preview = page.getByRole('dialog', { name: 'Import preview' })
  await expect(preview).toBeVisible({ timeout: 20_000 })
  if (confirm) {
    await page.getByRole('button', { name: 'Confirm import' }).click()
    return waitForOperation(client, String(operation.operation_id), 'approved')
  }
  await page.getByRole('button', { name: 'Cancel import' }).click()
  return waitForOperation(client, String(operation.operation_id), 'rejected')
}
