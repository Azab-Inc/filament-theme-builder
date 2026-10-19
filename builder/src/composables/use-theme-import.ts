import { shallowReactive } from 'vue'
import type { useThemeStore } from '@/stores/theme'
import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'
import type { ThemeImportUi } from '@/models/theme-import-ui.model'
import { MAX_THEME_IMPORT_BYTES, previewThemeImport } from '@/utils/theme-import-service'
import { createThemeRegistry } from '@/registry/theme-registry'
import { applyApprovedImport } from '@/utils/theme-relay-apply'

type ThemeStore = ReturnType<typeof useThemeStore>
type RemoteImport = { payload: BrowserPayload; relay: BrowserRelay; bytes: Uint8Array; revision: number; expiresAt: number; recordId?: string }

export function useThemeImport(store: ThemeStore): ThemeImportUi {
  const state = shallowReactive({ preview: null, filename: '', proposedName: '', error: null, open: false, applying: false, canCancel: true }) as ThemeImportUi['state']
  let remote: RemoteImport | null = null
  async function chooseFile(file: File): Promise<void> {
    remote = null; state.open = true; state.canCancel = true; state.preview = null; state.filename = file.name; state.error = null
    const fallback = file.name.split(/[\\/]/).pop()?.replace(/\.json$/i, '').trim() || 'Untitled'
    state.proposedName = fallback
    if (file.size > MAX_THEME_IMPORT_BYTES) { state.error = 'Theme import exceeds the 1 MiB limit'; return }
    try {
      const result = await previewThemeImport(new Uint8Array(await file.arrayBuffer()), file.name, fallback, createThemeRegistry())
      if (result.valid) state.preview = result.preview
      else state.error = result.message
    } catch { state.error = 'Unable to read or preview this theme file' }
  }
  async function receiveRelayPayload(payload: BrowserPayload, relay: BrowserRelay): Promise<void> {
    if (state.open) { await relay.reject(payload.operationId, 'operation_failed').catch(() => undefined); return }
    remote = { payload, relay, bytes: new TextEncoder().encode(payload.rawJson), revision: store.revision, expiresAt: Date.now() + 300_000 }
    state.open = true; state.preview = null; state.filename = payload.filename; state.proposedName = payload.proposedName; state.error = null
    state.canCancel = true
    let result
    try { result = await previewThemeImport(remote.bytes, payload.filename, payload.proposedName, createThemeRegistry()) }
    catch { await rejectRemote(remote, 'invalid_theme'); state.error = 'Unable to validate this relay theme'; remote = null; return }
    if (payload.version !== 1 || !result.valid || result.preview.payloadDigest !== payload.digest || result.preview.byteLength !== payload.byteLength
      || remote.bytes.byteLength > MAX_THEME_IMPORT_BYTES) {
      await rejectRemote(remote, 'invalid_theme'); state.error = result.valid ? 'Relay payload digest or size did not match' : result.message; remote = null; return
    }
    try {
      await relay.acknowledgePayload(payload.operationId, payload.digest)
      await relay.submitPreview(payload.operationId, previewDto(result.preview))
      state.preview = result.preview
    } catch {
      await rejectRemote(remote, 'operation_failed'); state.error = 'The browser relay could not prepare this import'; remote = null
    }
  }
  async function confirm() {
    if (!state.preview) return { ok: false as const, error: 'Choose a valid theme file first' }
    if (remote) return confirmRemote()
    const operationId = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    const result = store.importFreshTheme({ operationId, payloadDigest: state.preview.payloadDigest, state: state.preview.state, name: state.proposedName })
    if (result.ok) state.open = false
    else state.error = result.error
    return result
  }
  return { state, chooseFile, receiveRelayPayload, setName: (name) => { state.proposedName = name }, confirm,
    cancel: () => {
      if (remote?.recordId) { state.error = 'Import is saved locally; retry confirmation to finish relay acknowledgement.'; return }
      if (remote) void rejectRemote(remote, 'operation_failed')
      remote = null; state.open = false; state.preview = null; state.error = null; state.canCancel = true
    } }

  async function confirmRemote() {
    const current = remote!
    if (state.applying) return { ok: false as const, error: 'Import confirmation is already in progress' }
    if (store.revision !== current.revision && !current.recordId) return rejectStale(current)
    state.applying = true
    try {
      const revision = current.recordId ? store.revision : current.revision
      const grant = await current.relay.authorizeApply(current.payload.operationId, current.payload.digest, revision, state.proposedName)
      if (grant.status !== 'pending' || !grant.grantId || grant.grantExpiresAt <= Date.now() || grant.grantExpiresAt > Date.now() + 5_000) return rejectStale(current)
      const result = await applyApprovedImport(store, { operationId: current.payload.operationId, payloadDigest: current.payload.digest,
        rawBytes: current.bytes, filename: current.payload.filename, sourceProposedName: current.payload.proposedName, proposedName: state.proposedName,
        sourceVersion: state.preview!.sourceVersion, state: state.preview!.state, expectedRevision: revision,
        grant, operationExpiresAt: current.expiresAt })
      if (!result.ok) return rejectStale(current, result.error)
      current.recordId = result.record.id
      state.canCancel = false
      await current.relay.publishImportResult(current.payload.operationId, grant.grantId, result.record.id, current.payload.digest)
      remote = null; state.open = false
      return result
    } catch {
      state.error = current.recordId
        ? 'Import was saved locally but relay acknowledgement is pending; retry confirmation.'
        : 'Relay authorization failed; no theme was created.'
      return { ok: false as const, error: state.error }
    } finally { state.applying = false }
  }
  async function rejectStale(current: RemoteImport, error = 'Relay import confirmation is stale'): Promise<{ ok: false; error: string }> {
    const stale = /stale/i.test(error)
    await rejectRemote(current, stale ? 'stale_revision' : 'apply_failed')
    state.error = stale ? error : 'The imported theme could not be saved locally.'
    return { ok: false, error: state.error }
  }
}

function previewDto(preview: NonNullable<ThemeImportUi['state']['preview']>) {
  return { sourceVersion: preview.sourceVersion, targetVersion: preview.targetVersion, migrationPath: preview.migrationPath,
    displayName: preview.displayName, summary: preview.summary, payloadDigest: preview.payloadDigest, byteLength: preview.byteLength }
}
async function rejectRemote(remote: RemoteImport, category: string): Promise<void> { await remote.relay.reject(remote.payload.operationId, category).catch(() => undefined) }
