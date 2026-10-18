import type { ThemePairing } from '@/models/theme-import-pairing.model'
import type { PairingCreatedDto, RelayBootstrapDto } from '@/dtos/theme-relay.dto'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type RandomBytes = (size: number) => Uint8Array

export function createThemePairingClient(
  fetcher: Fetcher = fetch,
  randomBytes: RandomBytes = secureRandomBytes,
  expectedOrigin: string = globalThis.location.origin,
) {
  async function start(): Promise<ThemePairing> {
    const bootstrapResponse = await fetcher('/local-theme/relay/bootstrap', { method: 'GET', credentials: 'same-origin' })
    const bootstrap = (await bootstrapResponse.json()) as RelayBootstrapDto
    if (!bootstrapResponse.ok || bootstrap.version !== 1 || !bootstrap.enabled || bootstrap.origin !== expectedOrigin
      || bootstrap.host !== globalThis.location.host || !bootstrap.csrfToken) throw new Error('relay_unavailable')
    const tabKey = randomBytes(32)
    const pairingId = toHex(randomBytes(32))
    const response = await fetcher('/local-theme/relay/pairings', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': bootstrap.csrfToken, 'X-FTB-Tab-Key': toHex(tabKey) },
      body: JSON.stringify({ version: 1, pairingId }),
    })
    const created = (await response.json()) as PairingCreatedDto
    if (!response.ok || created.version !== 1 || created.status !== 'pending' || created.pairingId !== pairingId
      || !Number.isSafeInteger(created.expiresAt)) throw new Error('pairing_unavailable')

    return { pairingId, tabKey, sessionId: null, expiresAt: created.expiresAt }
  }

  return { start }
}

function secureRandomBytes(size: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(size))
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
