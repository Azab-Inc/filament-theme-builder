import type { RelayBootstrapDto } from '@/dtos/theme-relay.dto'
import type { ThemePairing } from '@/models/theme-import-pairing.model'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type RelayRequestOptions = { requireSession?: boolean; includeSessionId?: boolean }

export function createRelayRequest(pairing: ThemePairing, fetcher: Fetcher, now: () => number) {
  return async function request<T>(path: string, body?: object, options: RelayRequestOptions = {}): Promise<T> {
    const requireSession = options.requireSession ?? true
    if (requireSession && (!pairing.sessionId || pairing.expiresAt === null || pairing.expiresAt <= now())) throw new Error('session_disconnected')
    const bootResponse = await fetcher('/local-theme/relay/bootstrap', { credentials: 'same-origin' })
    const boot = await bootResponse.json() as RelayBootstrapDto
    if (!bootResponse.ok || boot.version !== 1 || !boot.enabled || boot.origin !== location.origin || boot.host !== location.host) throw new Error('relay_unavailable')
    const headers = new Headers({ 'X-FTB-Tab-Key': toHex(pairing.tabKey), 'X-CSRF-TOKEN': boot.csrfToken })
    const init: RequestInit = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers }
    if (body !== undefined) {
      headers.set('Content-Type', 'application/json')
      init.body = JSON.stringify({ ...body, version: 1, ...(options.includeSessionId ? { sessionId: pairing.sessionId } : {}) })
    }
    const response = await fetcher(path, init)
    const result = await response.json() as T & { error?: string }
    if (!response.ok) throw new Error(result.error ?? 'relay_unavailable')
    return result
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
