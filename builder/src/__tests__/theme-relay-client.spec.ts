import { afterEach, describe, expect, it, vi } from 'vitest'
import { createThemeRelayClient } from '@/composables/use-theme-relay'
import type { ThemePairing } from '@/models/theme-import-pairing.model'
import { digestBytes } from '@/utils/theme-import-bytes'

const pairing = (overrides: Partial<ThemePairing> = {}): ThemePairing => ({ pairingId: 'p-1', tabKey: new Uint8Array(32).fill(7), sessionId: 's-1', expiresAt: Date.now() + 60_000, ...overrides })
const bootstrap = { version: 1, origin: location.origin, host: location.host, csrfToken: 'csrf', enabled: true }
const ok = (body: unknown) => Response.json(body)

afterEach(() => { vi.useRealTimers() })

describe('browser relay client', () => {
  it('sends the tab credential only in X-FTB-Tab-Key', async () => {
    const seen: Request[] = []
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Request(new URL(input.toString(), location.origin), init))
      return seen.length % 2 ? ok(bootstrap) : ok({ version: 1, status: 'alive', leaseExpiresAt: Date.now() + 45_000 })
    })
    await createThemeRelayClient(pairing(), fetcher).heartbeat()
    const heartbeat = seen[1]!
    expect(heartbeat.headers.get('X-FTB-Tab-Key')).toMatch(/^[a-f0-9]{64}$/)
    expect(heartbeat.headers.get('X-CSRF-TOKEN')).toBe('csrf')
    const body = await heartbeat.clone().text()
    expect(JSON.parse(body)).toEqual({ version: 1, sessionId: 's-1' })
    expect(body).not.toContain('7,7,7'); expect(body).not.toContain('070707')
  })

  it('refuses polling after the session expires', async () => {
    const relay = createThemeRelayClient(pairing({ expiresAt: 10 }), vi.fn(), () => 10)
    await expect(relay.poll()).rejects.toThrow('session_disconnected')
  })

  it('polls notices and acknowledges payload receipt with the verified digest', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/bootstrap')
      ? ok(bootstrap)
      : ok({ version: 1, operations: [{ operationId: 'a'.repeat(64), kind: 'import', status: 'pending' }] }))
    const relay = createThemeRelayClient(pairing(), fetcher)
    await expect(relay.poll()).resolves.toEqual([{ operationId: 'a'.repeat(64), kind: 'import', status: 'pending' }])
  })

  it('verifies raw payload bytes before acknowledging their deletion', async () => {
    const rawJson = '{"schemaVersion":1,"colors":{"primary":"#123456"}}'
    const bytes = new TextEncoder().encode(rawJson); const digest = await digestBytes(bytes); const requests: Request[] = []
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(new URL(input.toString(), location.origin), init))
      return String(input).includes('/bootstrap') ? ok(bootstrap) : String(input).endsWith('/payload')
        ? ok({ version: 1, operationId: 'a'.repeat(64), payload: rawJson, filename: 'relay.json', proposedName: 'Relay', digest, byteLength: bytes.length })
        : ok({ version: 1, status: 'received' })
    })
    const relay = createThemeRelayClient(pairing(), fetcher)
    const payload = await relay.receivePayload('a'.repeat(64))
    await relay.acknowledgePayload(payload.operationId, payload.digest)
    expect(payload.bytes).toEqual(bytes)
    const receipt = requests[requests.length - 1]!
    const receiptBody = await receipt.clone().text()
    expect(JSON.parse(receiptBody)).toEqual({ version: 1, digest, received: true })
    expect(receiptBody).not.toContain('070707')
    expect(receipt.headers.get('X-FTB-Tab-Key')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('rejects a payload digest mismatch before sending a receipt', async () => {
    const rawJson = '{"schemaVersion":1,"colors":{"primary":"#123456"}}'
    const fetcher = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/bootstrap')
      ? ok(bootstrap) : ok({ version: 1, operationId: 'a'.repeat(64), payload: rawJson, filename: 'relay.json', proposedName: 'Relay', digest: 'f'.repeat(64), byteLength: rawJson.length }))
    const relay = createThemeRelayClient(pairing(), fetcher)
    await expect(relay.receivePayload('a'.repeat(64)).then((payload) => relay.acknowledgePayload(payload.operationId, payload.digest))).rejects.toThrow('payload_digest_mismatch')
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/receipt'))).toBe(false)
  })

  it('normalizes server apply-grant seconds to the browser millisecond clock', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/bootstrap')
      ? ok(bootstrap) : ok({ version: 1, status: 'pending', grantId: 'f'.repeat(64), grantExpiresAt: 1_005 }))
    const relay = createThemeRelayClient(pairing({ expiresAt: 2_000_000 }), fetcher, () => 1_000_000)
    await expect(relay.authorizeApply('a'.repeat(64), 'd'.repeat(64), 7, 'Relay')).resolves.toMatchObject({
      grantExpiresAt: 1_005_000, operationId: 'a'.repeat(64), digest: 'd'.repeat(64), revision: 7, displayName: 'Relay',
    })
  })

})
