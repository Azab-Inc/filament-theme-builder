import type { FreshThemeImport, ImportMarker } from '@/models/local-theme-import.model'
import type { LocalThemeRecord } from '@/models/local-theme.model'
import { themeHistoryKey, themeStateKey, validateLocalThemeState } from '@/utils/local-theme-storage'
import { parseLocalThemeCollection, parseLocalThemeHistory } from '@/utils/local-theme-validation'
import { writeVerified } from '@/utils/local-theme-storage-writes'

export const IMPORT_INDEX = 'ftb-themes'
export const IMPORT_ACTIVE = 'ftb-theme-active'
export const IMPORT_PREFIX = 'ftb-theme-import:'
export const INVALID_JSON = Symbol('invalid storage JSON')
export const idForOperation = (id: string) => `import-${id}`
export const markerKeyForOperation = (id: string) => `${IMPORT_PREFIX}${id}`
const historyFor = (state: unknown) => ({ snapshots: [state], cursor: 0 })

export function readImportValue(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return INVALID_JSON
  }
}

export function isImportMarker(value: unknown): value is ImportMarker {
  if (typeof value !== 'object' || value === null) return false
  const marker = value as Partial<ImportMarker>
  return typeof marker.operationId === 'string' && /^[a-f0-9]{64}$/.test(marker.operationId) &&
    typeof marker.digest === 'string' && /^[a-f0-9]{64}$/.test(marker.digest) &&
    typeof marker.stateFingerprint === 'string' && typeof marker.name === 'string' &&
    marker.recordId === idForOperation(marker.operationId) && ['prepared', 'complete'].includes(String(marker.status))
}

export function fingerprintImportedState(state: unknown): string {
  return JSON.stringify({ state, history: historyFor(state) })
}

export function prepareImport(input: FreshThemeImport): { marker: ImportMarker; state: unknown } | null {
  if (!/^[a-f0-9]{64}$/.test(input.operationId) || !/^[a-f0-9]{64}$/.test(input.payloadDigest)) return null
  const state = validateLocalThemeState(input.state)
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (!state || !name) return null
  return { state, marker: { operationId: input.operationId, digest: input.payloadDigest, stateFingerprint: fingerprintImportedState(state), recordId: idForOperation(input.operationId), name, status: 'prepared' } }
}

export function readImportIndex(storage: Storage): LocalThemeRecord[] | null {
  const value = readImportValue(storage, IMPORT_INDEX)
  return value === INVALID_JSON || value === null ? null : parseLocalThemeCollection(value)
}

export function readImportedState(storage: Storage, marker: ImportMarker): unknown {
  const state = validateLocalThemeState(readImportValue(storage, themeStateKey(marker.recordId)))
  const history = parseLocalThemeHistory(readImportValue(storage, themeHistoryKey(marker.recordId)), validateLocalThemeState)
  return state && history && JSON.stringify(history) === JSON.stringify(historyFor(state)) ? state : null
}

export function findImportedRecord(storage: Storage, marker: ImportMarker): LocalThemeRecord | null {
  const record = readImportIndex(storage)?.find(({ id }) => id === marker.recordId)
  return record?.name === marker.name ? record : null
}

export function verifyImportedReadback(storage: Storage, marker: ImportMarker): boolean {
  const state = readImportedState(storage, marker)
  return !!state && fingerprintImportedState(state) === marker.stateFingerprint && !!findImportedRecord(storage, marker) && storage.getItem(IMPORT_ACTIVE) === marker.recordId
}

export function writeImportMarker(storage: Storage, key: string, marker: ImportMarker): boolean {
  return writeVerified(storage, [[key, JSON.stringify(marker)]], () => {
    const result = readImportValue(storage, key)
    return isImportMarker(result) && JSON.stringify(result) === JSON.stringify(marker)
  }).ok
}

export function publishImportedTheme(storage: Storage, key: string, marker: ImportMarker, state: unknown, now: () => number): LocalThemeRecord | null {
  const records = readImportIndex(storage)
  if (!records) return null
  const existing = records.find(({ id }) => id === marker.recordId)
  if (existing && existing.name !== marker.name) return null
  const record = existing ?? { id: marker.recordId, name: marker.name, updatedAt: now() }
  const nextRecords = existing ? records : [...records, record]
  const completedMarker = { ...marker, status: 'complete' as const }
  const result = writeVerified(storage, [
    [themeStateKey(marker.recordId), JSON.stringify(state)],
    [themeHistoryKey(marker.recordId), JSON.stringify(historyFor(state))],
    [IMPORT_INDEX, JSON.stringify(nextRecords)],
    [IMPORT_ACTIVE, marker.recordId],
  ], () => verifyImportedReadback(storage, marker), [[key, JSON.stringify(completedMarker)]], () => {
    const readback = readImportValue(storage, key)
    return verifyImportedReadback(storage, marker) && isImportMarker(readback) &&
      JSON.stringify(readback) === JSON.stringify(completedMarker)
  })
  return result.ok ? record : null
}
