import { describe, expect, it, vi } from 'vitest'
import { createThemePairingClient } from '@/composables/use-theme-pairing'

describe('theme pairing client', () => {
  it('sends the tab key only in its header after same-origin bootstrap', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ version: 1, origin: 'http://localhost:3000', host: 'localhost:3000', csrfToken: 'csrf', enabled: true })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ version: 1, pairingId: '01'.repeat(32), status: 'pending', expiresAt: 42 })))
    const client = createThemePairingClient(fetcher, (size) => new Uint8Array(size).fill(1), 'http://localhost:3000')
    const pairing = await client.start()
    const [bootstrap, create] = fetcher.mock.calls
    expect(bootstrap?.[0]).toBe('/local-theme/relay/bootstrap')
    expect(bootstrap?.[1]).toMatchObject({ credentials: 'same-origin', method: 'GET' })
    expect(create?.[0]).toBe('/local-theme/relay/pairings')
    expect(create?.[1]).toMatchObject({ credentials: 'same-origin', method: 'POST' })
    const init = create?.[1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('X-FTB-Tab-Key')).toBe('01'.repeat(32))
    expect(headers.get('X-CSRF-TOKEN')).toBe('csrf')
    expect(JSON.parse(String(init.body))).toEqual({ version: 1, pairingId: '01'.repeat(32) })
    expect(JSON.stringify(pairing)).not.toContain('X-FTB-Tab-Key')
    expect(pairing.tabKey).toHaveLength(32)
  })
})
