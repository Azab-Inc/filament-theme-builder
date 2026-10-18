import type { FreshThemeImport, ImportCommitResult, ImportMarker } from '@/models/local-theme-import.model'
import type { LocalThemeRecord } from '@/models/local-theme.model'
import { loadLocalThemeById } from '@/utils/local-theme-storage'
import { parseLocalThemeCollection } from '@/utils/local-theme-validation'

const INDEX = 'ftb-themes'; const ACTIVE = 'ftb-theme-active'; const PREFIX = 'ftb-theme-import:'
const idFor = (operationId: string) => `import-${operationId}`
const markerKey = (operationId: string) => `${PREFIX}${operationId}`
const read = (storage: Storage, key: string): unknown => { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : null }
const marker = (value: unknown): value is ImportMarker => {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.digest === 'string' && typeof entry.recordId === 'string' && typeof entry.name === 'string' && ['prepared', 'complete', 'failed'].includes(String(entry.status))
}
const recordInIndex = (storage: Storage, recordId: string): LocalThemeRecord | null => {
  const records = parseLocalThemeCollection(read(storage, INDEX)); return records?.find((record) => record.id === recordId) ?? null
}
const verify = (storage: Storage, entry: ImportMarker): LocalThemeRecord | null => {
  const record = recordInIndex(storage, entry.recordId); if (!record || record.name !== entry.name) return null
  const loaded = loadLocalThemeById(storage, entry.recordId); return loaded.error ? null : record
}
const save = (storage: Storage, key: string, value: unknown): void => {
  storage.setItem(key, JSON.stringify(value)); if (JSON.stringify(read(storage, key)) !== JSON.stringify(value)) throw new Error('Storage read-back verification failed')
}
const finishPrepared = (storage: Storage, entry: ImportMarker, now: () => number): LocalThemeRecord | null => {
  const existing = verify(storage, entry); if (existing) { save(storage, markerKey(entry.recordId.replace('import-', '')), { ...entry, status: 'complete' }); return existing }
  const state = read(storage, `ftb-theme:${entry.recordId}`); if (!state) return null
  const history = read(storage, `ftb-theme-history:${entry.recordId}`) ?? { snapshots: [state], cursor: 0 }
  save(storage, `ftb-theme-history:${entry.recordId}`, history)
  const records = parseLocalThemeCollection(read(storage, INDEX)) ?? []
  if (records.some(({ id }) => id === entry.recordId)) return null
  const record = { id: entry.recordId, name: entry.name, updatedAt: now() }
  save(storage, INDEX, [...records, record])
  if (storage.getItem(ACTIVE) !== record.id) { storage.setItem(ACTIVE, record.id); if (storage.getItem(ACTIVE) !== record.id) throw new Error('Active theme pointer verification failed') }
  save(storage, markerKey(entry.recordId.replace('import-', '')), { ...entry, status: 'complete' }); return record
}
const continuePrepared = (storage: Storage, input: FreshThemeImport, entry: ImportMarker, now: () => number): ImportCommitResult => {
  const stateKey = `ftb-theme:${entry.recordId}`; const historyKey = `ftb-theme-history:${entry.recordId}`
  try {
    if (storage.getItem(stateKey) === null) save(storage, stateKey, input.state)
    if (JSON.stringify(read(storage, stateKey)) !== JSON.stringify(input.state)) return { ok: false, error: 'Import state does not match the prepared operation' }
    if (storage.getItem(historyKey) === null) save(storage, historyKey, { snapshots: [input.state], cursor: 0 })
    const records = parseLocalThemeCollection(read(storage, INDEX)) ?? []; const record = records.find(({ id }) => id === entry.recordId) ?? { id: entry.recordId, name: entry.name, updatedAt: now() }
    if (record.name !== entry.name) return { ok: false, error: 'Import record does not match the prepared operation' }
    if (!records.some(({ id }) => id === record.id)) save(storage, INDEX, [...records, record])
    storage.setItem(ACTIVE, record.id); if (storage.getItem(ACTIVE) !== record.id) throw new Error('Active theme pointer verification failed')
    save(storage, markerKey(input.operationId), { ...entry, status: 'complete' }); return { ok: true, record }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Theme import failed' }
  }
}
export function recoverLocalThemeImports(storage: Storage, now: () => number): void {
  for (let index = 0; index < storage.length; index++) { const key = storage.key(index); if (!key?.startsWith(PREFIX)) continue
    try { const entry = read(storage, key); if (marker(entry) && entry.status === 'prepared') finishPrepared(storage, entry, now) } catch { /* retry remains possible */ }
  }
}
export function importFreshLocalTheme(storage: Storage, input: FreshThemeImport, now: () => number): ImportCommitResult {
  if (!/^[a-f0-9]{64}$/.test(input.operationId) || !/^[a-f0-9]{64}$/.test(input.payloadDigest) || !input.name.trim()) return { ok: false, error: 'Invalid import identity' }
  const key = markerKey(input.operationId); const existing = read(storage, key)
  if (existing) { if (!marker(existing) || existing.digest !== input.payloadDigest) return { ok: false, error: 'Import digest does not match the prepared operation' }; const recovered = finishPrepared(storage, existing, now); return recovered ? { ok: true, record: recovered } : continuePrepared(storage, input, existing, now) }
  const recordId = idFor(input.operationId); if (recordInIndex(storage, recordId) || storage.getItem(`ftb-theme:${recordId}`)) return { ok: false, error: 'Import record ID collision' }
  const prepared: ImportMarker = { digest: input.payloadDigest, recordId, name: input.name.trim(), status: 'prepared' }
  try {
    save(storage, key, prepared); save(storage, `ftb-theme:${recordId}`, input.state); save(storage, `ftb-theme-history:${recordId}`, { snapshots: [input.state], cursor: 0 })
    const records = parseLocalThemeCollection(read(storage, INDEX)) ?? []; const record = { id: recordId, name: prepared.name, updatedAt: now() }
    save(storage, INDEX, [...records, record]); storage.setItem(ACTIVE, recordId); if (storage.getItem(ACTIVE) !== recordId) throw new Error('Active theme pointer verification failed')
    save(storage, key, { ...prepared, status: 'complete' }); return { ok: true, record }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Theme import failed' } }
}
