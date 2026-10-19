import type { ImportCommitResult } from '@/models/local-theme-import.model'
import type { ApprovedImport, ThemeStoreImportBoundary } from '@/models/theme-relay-apply.model'
import { MAX_THEME_IMPORT_BYTES } from '@/models/theme-import.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { previewThemeImport } from '@/utils/theme-import-service'

export async function applyApprovedImport(store: ThemeStoreImportBoundary, input: ApprovedImport, now = Date.now): Promise<ImportCommitResult> {
  const invalid = validateEnvelope(store, input, now())
  if (invalid) return { ok: false, error: invalid }
  const parsed = await previewThemeImport(input.rawBytes, input.filename, input.sourceProposedName, createThemeRegistry())
  if (!parsed.valid) return { ok: false, error: 'Relay import payload validation failed' }
  if (parsed.preview.payloadDigest !== input.payloadDigest) return { ok: false, error: 'Relay import digest mismatch' }
  if (parsed.preview.sourceVersion !== input.sourceVersion) return { ok: false, error: 'Relay import version mismatch' }
  if (parsed.preview.displayName !== input.sourceProposedName || input.proposedName !== input.grant.displayName) return { ok: false, error: 'Relay import name mismatch' }
  if (JSON.stringify(parsed.preview.state) !== JSON.stringify(input.state)) return { ok: false, error: 'Relay import state mismatch' }
  const changed = validateEnvelope(store, input, now())
  if (changed) return { ok: false, error: changed }
  return store.importFreshTheme({ operationId: input.operationId, payloadDigest: input.payloadDigest, state: parsed.preview.state, name: input.proposedName.trim() })
}

function validateEnvelope(store: ThemeStoreImportBoundary, input: ApprovedImport, now: number): string | null {
  if (!/^[a-f0-9]{64}$/.test(input.operationId)) return 'Invalid relay operation ID'
  if (!/^[a-f0-9]{64}$/.test(input.payloadDigest)) return 'Invalid relay digest'
  if (!isUint8Array(input.rawBytes) || input.rawBytes.byteLength > MAX_THEME_IMPORT_BYTES) return 'Invalid relay import payload'
  if (!input.filename.trim() || !input.proposedName.trim() || input.proposedName !== input.proposedName.trim()) return 'Invalid relay import name'
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision !== store.revision) return 'Relay import confirmation is stale'
  if (input.grant?.operationId !== input.operationId || input.grant.digest !== input.payloadDigest
    || input.grant.revision !== input.expectedRevision || input.grant.displayName !== input.proposedName) return 'Relay import confirmation is stale'
  if (input.grant.version !== 1 || input.grant.status !== 'pending' || !/^[a-f0-9]{64}$/.test(input.grant.grantId)
    || !Number.isSafeInteger(input.grant.grantExpiresAt) || input.grant.grantExpiresAt <= now
    || input.grant.grantExpiresAt > now + 5_000 || !Number.isSafeInteger(input.operationExpiresAt) || input.operationExpiresAt <= now) return 'Relay import confirmation is expired'
  return null
}

function isUint8Array(value: unknown): value is Uint8Array {
  return ArrayBuffer.isView(value) && Object.prototype.toString.call(value) === '[object Uint8Array]'
}
