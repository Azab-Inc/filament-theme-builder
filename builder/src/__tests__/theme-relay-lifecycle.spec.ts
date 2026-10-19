import { afterEach, describe, expect, it, vi } from 'vitest'
import { createThemeRelayClient } from '@/composables/use-theme-relay'
import type { ThemePairing } from '@/models/theme-import-pairing.model'

const pairing = (): ThemePairing => ({ pairingId: 'p-1', tabKey: new Uint8Array(32).fill(7), sessionId: 's-1', expiresAt: Date.now() + 60_000 })
const bootstrap = { version: 1, origin: location.origin, host: location.host, csrfToken: 'csrf', enabled: true }
const fetchReply = async (input: RequestInfo | URL) => {
  const url = String(input)
  if (url.includes('/bootstrap')) return Response.json(bootstrap)
  if (url.endsWith('/disconnect')) return Response.json({ version: 1, status: 'disconnected' })
  if (url.endsWith('/heartbeat')) return Response.json({ version: 1, status: 'alive' })
  return Response.json({ version: 1, operations: [] })
}
afterEach(() => vi.useRealTimers())

describe('browser relay lifecycle', () => {
  it('stops polling and heartbeat when disconnected', async () => {
    vi.useFakeTimers(); const fetcher = vi.fn(fetchReply); const relay = createThemeRelayClient(pairing(), fetcher)
    const stop = relay.start(() => undefined); await relay.disconnect(); const count = fetcher.mock.calls.length
    await vi.advanceTimersByTimeAsync(30_000); stop()
    expect(fetcher).toHaveBeenCalledTimes(count)
  })

  it('polls and heartbeats every fifteen seconds, not before', async () => {
    vi.useFakeTimers(); const calls: string[] = []
    const fetcher = vi.fn(async (input: RequestInfo | URL) => { calls.push(String(input)); return fetchReply(input) })
    const relay = createThemeRelayClient(pairing(), fetcher); const stop = relay.start(() => undefined)
    for (let index = 0; index < 20; index += 1) await Promise.resolve()
    expect(calls).toHaveLength(4)
    const initial = calls.length; await vi.advanceTimersByTimeAsync(14_999); expect(calls).toHaveLength(initial)
    await vi.advanceTimersByTimeAsync(1); expect(calls).toHaveLength(initial + 4); stop()
  })

  it('best-effort disconnects on pagehide', async () => {
    const calls: string[] = []; const fetcher = vi.fn(async (input: RequestInfo | URL) => { calls.push(String(input)); return fetchReply(input) })
    const relay = createThemeRelayClient(pairing(), fetcher); relay.start(() => undefined); window.dispatchEvent(new Event('pagehide'))
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(calls).toContain('/local-theme/relay/sessions/disconnect')
    await relay.disconnect().catch(() => undefined)
  })
})
