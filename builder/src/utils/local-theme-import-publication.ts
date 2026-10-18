import type { ImportMarker } from '@/models/local-theme-import.model'
import type { LocalThemeRecord } from '@/models/local-theme.model'
import { writeVerified } from '@/utils/local-theme-storage-writes'
import {
  findImportedRecord,
  IMPORT_ACTIVE,
  IMPORT_INDEX,
  isImportMarker,
  markerKeyForOperation,
  readImportIndex,
  readImportValue,
  verifyImportedCoreReadback,
  verifyImportedReadback,
  writeImportMarker,
} from '@/utils/local-theme-import-storage'
import { themeHistoryKey, themeStateKey } from '@/utils/local-theme-storage'

const historyFor = (state: unknown) => ({ snapshots: [state], cursor: 0 })

export type ImportedThemePublishResult = { ok: true; record: LocalThemeRecord } | {
  ok: false
  error: string
  rollbackFailed: boolean
  unrestoredKeys: string[]
  committed: boolean
}

export function publishImportedTheme(storage: Storage, marker: ImportMarker, state: unknown, now: () => number): ImportedThemePublishResult {
  const records = readImportIndex(storage)
  if (!records) return failed('Theme index is malformed', false, false)
  const existing = records.find(({ id }) => id === marker.recordId)
  if (existing && existing.name !== marker.name) return failed('Import record name changed', false, false)
  const record = existing ?? { id: marker.recordId, name: marker.name, updatedAt: now() }
  const transaction = writeVerified(storage, [
    [themeStateKey(marker.recordId), JSON.stringify(state)],
    [themeHistoryKey(marker.recordId), JSON.stringify(historyFor(state))],
    [IMPORT_INDEX, JSON.stringify(existing ? records : [...records, record])],
  ], () => verifyImportedCoreReadback(storage, marker))
  if (!transaction.ok) return failed(transaction.error, !!transaction.rollbackFailed, false, transaction.unrestoredKeys)

  const pointer = writeVerified(storage, [[IMPORT_ACTIVE, marker.recordId]], () => storage.getItem(IMPORT_ACTIVE) === marker.recordId)
  if (!pointer.ok) return failed(pointer.error, !!pointer.rollbackFailed, true, pointer.unrestoredKeys)
  if (!verifyImportedReadback(storage, marker)) return failed('Imported data failed final validation', false, true)

  const markerWrite = writeImportMarker(storage, markerKeyForOperation(marker.operationId), { ...marker, status: 'complete' })
  if (!markerWrite.ok && !completeMarkerReadback(storage, marker)) {
    return failed(markerWrite.error, !!markerWrite.rollbackFailed, true, markerWrite.unrestoredKeys)
  }
  return { ok: true, record }
}

export function removePreparedMarker(storage: Storage, key: string): string | null {
  try {
    storage.removeItem(key)
    if (storage.getItem(key) === null) return null
  } catch {
    return `Import marker cleanup failed; recovery required for ${key}`
  }
  return `Import marker cleanup failed; recovery required for ${key}`
}

function completeMarkerReadback(storage: Storage, marker: ImportMarker): boolean {
  const value = readImportValue(storage, markerKeyForOperation(marker.operationId))
  return verifyImportedReadback(storage, marker) && isImportMarker(value) && value.status === 'complete' &&
    value.operationId === marker.operationId && value.digest === marker.digest &&
    value.recordId === marker.recordId && value.name === marker.name && value.stateFingerprint === marker.stateFingerprint
}

function failed(error: string, rollbackFailed: boolean, committed: boolean, unrestoredKeys: string[] = []): ImportedThemePublishResult {
  return { ok: false, error, rollbackFailed, committed, unrestoredKeys }
}
