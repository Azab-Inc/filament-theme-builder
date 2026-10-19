import type { ApplyGrantDto, ImportPreviewDto, OperationNoticeDto, RelayPayloadDto } from '@/dtos/theme-relay.dto'
import type { ThemePairing } from '@/models/theme-import-pairing.model'
import { createRelayRequest } from '@/composables/use-theme-relay-request'
import { MAX_THEME_IMPORT_BYTES } from '@/models/theme-import.model'
import { digestBytes } from '@/utils/theme-import-bytes'
import { isRelayOperationNotice } from '@/utils/theme-relay-validation'
import type { VerifiedApplyGrant } from '@/models/theme-relay-apply.model'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export type BrowserPayload = Omit<RelayPayloadDto, 'payload'> & { rawJson: string; bytes: Uint8Array }
export type BrowserRelay = ReturnType<typeof createThemeRelayClient>

export function createThemeRelayClient(pairing: ThemePairing, fetcher: Fetcher = fetch, now = Date.now) {
  const request = createRelayRequest(pairing, fetcher, now)
  let stopLoop: (() => void) | null = null
  async function poll(): Promise<OperationNoticeDto[]> {
    const result = await request<{ version: 1; operations: OperationNoticeDto[] }>('/local-theme/relay/sessions/poll', {}, { includeSessionId: true })
    if (result.version !== 1 || !Array.isArray(result.operations) || result.operations.some((notice) => !isRelayOperationNotice(notice))) throw new Error('invalid_request')
    return result.operations
  }
  async function heartbeat(): Promise<void> {
    const result = await request<{ version: 1; status: string }>('/local-theme/relay/sessions/heartbeat', {}, { includeSessionId: true })
    if (result.version !== 1 || result.status !== 'alive') throw new Error('session_disconnected')
  }
  async function receivePayload(id: string): Promise<BrowserPayload> {
    const payload = await request<RelayPayloadDto>(`/local-theme/relay/operations/${id}/payload`)
    if (typeof payload.payload !== 'string' || typeof payload.filename !== 'string' || !payload.filename.trim()
      || typeof payload.proposedName !== 'string' || !payload.proposedName.trim() || !Number.isSafeInteger(payload.byteLength)) throw new Error('invalid_payload')
    const bytes = new TextEncoder().encode(payload.payload)
    if (payload.version !== 1 || payload.operationId !== id || payload.byteLength !== bytes.byteLength || bytes.byteLength > MAX_THEME_IMPORT_BYTES
      || !/^[a-f0-9]{64}$/.test(payload.digest) || await digestBytes(bytes) !== payload.digest) throw new Error('payload_digest_mismatch')
    return { ...payload, rawJson: payload.payload, bytes }
  }
  async function acknowledgePayload(id: string, digest: string): Promise<void> {
    const result = await request<{ version: 1; status: string }>(`/local-theme/relay/operations/${id}/receipt`, { digest, received: true })
    if (result.version !== 1 || result.status !== 'received') throw new Error('payload_receipt_failed')
  }
  async function submitPreview(id: string, preview: ImportPreviewDto): Promise<void> {
    const result = await request<{ version: 1; status: string }>(`/local-theme/relay/operations/${id}/preview`, { preview })
    if (result.version !== 1 || result.status !== 'pending') throw new Error('preview_rejected')
  }
  async function authorizeApply(id: string, digest: string, revision: number, displayName: string): Promise<VerifiedApplyGrant> {
    const grant = await request<ApplyGrantDto>(`/local-theme/relay/operations/${encodeURIComponent(id)}/authorize-apply`, { digest, revision, displayName })
    const nowSeconds = Math.floor(now() / 1_000)
    if (grant.version !== 1 || grant.status !== 'pending' || !/^[a-f0-9]{64}$/.test(grant.grantId)
      || !Number.isSafeInteger(grant.grantExpiresAt) || grant.grantExpiresAt <= nowSeconds || grant.grantExpiresAt > nowSeconds + 5) {
      throw new Error('confirmation_expired')
    }
    return { ...grant, grantExpiresAt: grant.grantExpiresAt * 1_000, operationId: id, digest, revision, displayName }
  }
  async function publishImportResult(id: string, grantId: string, recordId: string, digest: string): Promise<void> {
    const result = await request<{ version: 1; status: string }>(`/local-theme/relay/operations/${id}/result`, { grantId, recordId, digest })
    if (result.version !== 1 || result.status !== 'approved') throw new Error('import_result_unacknowledged')
  }
  async function reject(id: string, errorCategory: string): Promise<void> {
    const result = await request<{ version: 1; status: string }>(`/local-theme/relay/operations/${id}/result`, { errorCategory })
    if (result.version !== 1 || result.status !== 'rejected') throw new Error('operation_rejection_failed')
  }
  async function publishListResult(id: string, themes: { id: string; name: string; updatedAt: number; active: boolean }[]): Promise<void> {
    const result = await request<{ version: 1; status: string }>(`/local-theme/relay/operations/${id}/result`, { themes })
    if (result.version !== 1 || result.status !== 'approved') throw new Error('operation_result_unacknowledged')
  }
  async function publishExportResult(id: string, json: string): Promise<void> {
    const result = await request<{ version: 1; status: string }>(`/local-theme/relay/operations/${id}/result`, { filename: 'filament-theme.json', schemaVersion: 4, json })
    if (result.version !== 1 || result.status !== 'approved') throw new Error('operation_result_unacknowledged')
  }
  function start(onNotice: (notices: OperationNoticeDto[]) => void, onError: (error: Error) => void = () => undefined): () => void {
    stopLoop?.()
    stopLoop = startRelayLoop(poll, heartbeat, onNotice, onError, () => request('/local-theme/relay/sessions/disconnect', {}, { includeSessionId: true }))
    return stopLoop
  }
  async function disconnect(): Promise<void> {
    stopLoop?.(); stopLoop = null
    const result = await request<{ version: 1; status: string }>('/local-theme/relay/sessions/disconnect', {}, { includeSessionId: true })
    if (result.version !== 1 || result.status !== 'disconnected') throw new Error('session_disconnect_failed')
    pairing.sessionId = null
  }
  return { poll, heartbeat, receivePayload, acknowledgePayload, submitPreview, authorizeApply, publishImportResult, reject,
    publishListResult, publishExportResult, start, disconnect }
}

function startRelayLoop(poll: () => Promise<OperationNoticeDto[]>, heartbeat: () => Promise<void>, onNotice: (notices: OperationNoticeDto[]) => void, onError: (error: Error) => void, disconnect: () => Promise<unknown>): () => void {
  let stopped = false
  const run = async () => {
    try { const [notices] = await Promise.all([poll(), heartbeat()]); if (!stopped) onNotice(notices) }
    catch (error) {
      if (stopped) return
      const failure = error instanceof Error ? error : new Error('relay_unavailable')
      onError(failure)
      if (['session_disconnected', 'pairing_required', 'pairing_expired'].includes(failure.message)) stop()
    }
  }
  const timer = window.setInterval(() => { void run() }, 15_000)
  const pagehide = () => { stop(); void disconnect().catch(() => undefined) }
  const stop = () => { if (!stopped) { stopped = true; window.clearInterval(timer); window.removeEventListener('pagehide', pagehide) } }
  window.addEventListener('pagehide', pagehide)
  void run()
  return stop
}
