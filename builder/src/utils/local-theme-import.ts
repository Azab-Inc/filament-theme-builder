import type { FreshThemeImport, ImportCommitResult, ImportMarker } from '@/models/local-theme-import.model'
export type { FreshThemeImport, ImportCommitResult } from '@/models/local-theme-import.model'
import {
  findImportedRecord,
  fingerprintImportedState,
  hasImportRecordCollision,
  IMPORT_PREFIX,
  INVALID_JSON,
  isImportMarker,
  markerKeyForOperation,
  prepareImport,
  readImportIndex,
  readImportValue,
  verifyImportedReadback,
  writeImportMarker,
} from '@/utils/local-theme-import-storage'
import { hasConflictingImportedData } from '@/utils/local-theme-import-integrity'
import { publishImportedTheme, removePreparedMarker } from '@/utils/local-theme-import-publication'
import { themeStateKey, validateLocalThemeState } from '@/utils/local-theme-storage'
export function isFreshThemeImportValid(input: FreshThemeImport): boolean {
  return prepareImport(input) !== null
}

function matches(existing: unknown, expected: ImportMarker): existing is ImportMarker {
  return isImportMarker(existing) &&
    existing.operationId === expected.operationId && existing.digest === expected.digest &&
    existing.name === expected.name && existing.stateFingerprint === expected.stateFingerprint && existing.recordId === expected.recordId
}

function resume(storage: Storage, key: string, marker: ImportMarker, state: unknown, now: () => number): ImportCommitResult {
  if (hasConflictingImportedData(storage, marker)) {
    return { ok: false, error: 'Import state does not match the prepared operation' }
  }
  const published = publishImportedTheme(storage, marker, state, now)
  if (published.ok) return { ok: true, record: published.record }
  if (published.rollbackFailed) {
    const keys = published.unrestoredKeys.join(', ')
    return { ok: false, error: `Import rollback incomplete; recovery required for ${keys}; marker retained: ${key}; ${published.error}` }
  }
  if (published.committed) {
    return { ok: false, error: `Import publication pending recovery; marker retained: ${key}; ${published.error}` }
  }
  const cleanupError = removePreparedMarker(storage, key)
  return { ok: false, error: cleanupError ? `${published.error}; ${cleanupError}` : published.error }
}

export function recoverLocalThemeImports(storage: Storage, now: () => number): void {
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key?.startsWith(IMPORT_PREFIX)) continue
    try {
      const marker = readImportValue(storage, key)
      if (!isImportMarker(marker) || marker.status !== 'prepared' || key !== markerKeyForOperation(marker.operationId)) {
        continue
      }
      const state = validateLocalThemeState(readImportValue(storage, themeStateKey(marker.recordId)))
      if (state && fingerprintImportedState(state) === marker.stateFingerprint) {
        resume(storage, key, marker, state, now)
      }
    } catch {
      // The prepared marker remains available for a matching retry.
    }
  }
}

export function importFreshLocalTheme(storage: Storage, input: FreshThemeImport, now: () => number): ImportCommitResult {
  try {
    const validated = prepareImport(input)
    if (!validated) return { ok: false, error: 'Invalid import identity or state' }
    const { marker, state } = validated
    const key = markerKeyForOperation(marker.operationId)
    const current = readImportValue(storage, key)
    if (current === INVALID_JSON) return { ok: false, error: 'Import marker is malformed' }
    if (current !== null) {
      if (!matches(current, marker)) return { ok: false, error: 'Import does not match its prepared operation' }
      if (current.status === 'complete' && verifyImportedReadback(storage, current)) {
        const record = findImportedRecord(storage, current)
        return record ? { ok: true, record } : { ok: false, error: 'Imported record is unavailable' }
      }
      if (current.status === 'complete') return { ok: false, error: 'Completed import read-back does not match its marker' }
      return resume(storage, key, current, state, now)
    }
    if (hasImportRecordCollision(storage, marker)) {
      return { ok: false, error: 'Import record ID collision' }
    }
    const records = readImportIndex(storage)
    if (!records) return { ok: false, error: 'Theme index is missing or malformed' }
    if (records.some(({ id }) => id === marker.recordId)) return { ok: false, error: 'Import record ID collision' }
    const prepared = writeImportMarker(storage, key, marker)
    if (!prepared.ok) {
      if (prepared.rollbackFailed) {
        return { ok: false, error: `Import rollback incomplete; recovery required for ${prepared.unrestoredKeys?.join(', ')}; ${prepared.error}` }
      }
      return { ok: false, error: `Import marker could not be prepared: ${prepared.error}` }
    }
    return resume(storage, key, marker, state, now)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Theme import failed' }
  }
}
