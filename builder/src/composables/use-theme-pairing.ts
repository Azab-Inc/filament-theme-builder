import type { PairingCreatedDto, PairingStatusDto, RelayBootstrapDto } from '@/dtos/theme-relay.dto'
import type { ThemePairing } from '@/models/theme-import-pairing.model'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type RandomBytes = (size: number) => Uint8Array

export function createThemePairingClient(fetcher: Fetcher = fetch, randomBytes: RandomBytes = secureRandomBytes, expectedOrigin = location.origin) {
  async function bootstrap(): Promise<RelayBootstrapDto> {
    const response = await fetcher('/local-theme/relay/bootstrap', { method: 'GET', credentials: 'same-origin' })
    const result = await response.json() as RelayBootstrapDto
    if (!response.ok || result.version !== 1 || !result.enabled || result.origin !== expectedOrigin || result.host !== new URL(expectedOrigin).host || !result.csrfToken) throw new Error('relay_unavailable')
    return result
  }
  async function call<T>(pairing: ThemePairing, path: string, body?: object): Promise<T> {
    const boot = await bootstrap()
    const headers = new Headers({ 'X-CSRF-TOKEN': boot.csrfToken, 'X-FTB-Tab-Key': toHex(pairing.tabKey) })
    const init: RequestInit = { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers }
    if (body) { headers.set('Content-Type', 'application/json'); init.body = JSON.stringify({ version: 1, ...body }) }
    const response = await fetcher(path, init)
    const result = await response.json() as T & { error?: string }
    if (!response.ok) throw new Error(result.error ?? 'pairing_unavailable')
    return result
  }
  async function start(): Promise<ThemePairing> {
    const boot = await bootstrap(); const tabKey = randomBytes(32); const pairingId = toHex(randomBytes(32))
    if (tabKey.byteLength !== 32 || pairingId.length !== 64) throw new Error('pairing_unavailable')
    const response = await fetcher('/local-theme/relay/pairings', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': boot.csrfToken, 'X-FTB-Tab-Key': toHex(tabKey) },
      body: JSON.stringify({ version: 1, pairingId }) })
    const created = await response.json() as PairingCreatedDto
    if (!response.ok || created.version !== 1 || created.status !== 'pending' || created.pairingId !== pairingId || !Number.isSafeInteger(created.expiresAt)) throw new Error('pairing_unavailable')
    return { pairingId, tabKey, sessionId: null, expiresAt: created.expiresAt * 1_000 }
  }
  async function status(pairing: ThemePairing): Promise<PairingStatusDto> {
    const result = await call<PairingStatusDto>(pairing, `/local-theme/relay/pairings/${encodeURIComponent(pairing.pairingId)}`)
    if (result.version !== 1 || result.pairingId !== pairing.pairingId
      || !['pending', 'approved', 'expired', 'disconnected'].includes(result.status)
      || !Number.isSafeInteger(result.expiresAt) || (result.claimId !== undefined && !/^[a-f0-9]{64}$/.test(result.claimId))) throw new Error('pairing_unavailable')
    return result
  }
  async function approve(pairing: ThemePairing, claimId: string): Promise<PairingStatusDto> {
    if (!/^[a-f0-9]{64}$/.test(claimId)) throw new Error('pairing_unavailable')
    const approved = await call<PairingStatusDto>(pairing, `/local-theme/relay/pairings/${encodeURIComponent(pairing.pairingId)}/approve`, { claimId })
    if (approved.version !== 1 || approved.status !== 'approved' || !approved.sessionId || !Number.isSafeInteger(approved.sessionExpiresAt)) throw new Error('pairing_unavailable')
    pairing.sessionId = approved.sessionId; pairing.expiresAt = approved.sessionExpiresAt! * 1_000
    return approved
  }
  return { start, status, approve }
}

function secureRandomBytes(size: number): Uint8Array { return globalThis.crypto.getRandomValues(new Uint8Array(size)) }
function toHex(bytes: Uint8Array): string { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('') }
