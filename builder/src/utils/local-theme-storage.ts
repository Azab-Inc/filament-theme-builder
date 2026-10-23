import type { LocalThemeHistory, LocalThemeHistoryInput, LocalThemeLoadResult, LocalThemeRecord, StorageOperationResult } from '@/models/local-theme.model'
import type { ThemeState, ThemeStateInput, ThemeStateV5 } from '@/models/theme.model'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { parseLocalThemeCollection, parseLocalThemeHistory } from '@/utils/local-theme-validation'
import { migrateToCurrent, normalizeTheme } from '@/utils/theme-store-normalization'
import { validateFoundationState } from '@/utils/foundation-validation'
import { parseIndex, recoverLocalThemeRecords } from '@/utils/local-theme-recovery'
import { failedLocalThemeLoad, hasNewFormatRemnants, isThemeValue, parseStorageJson, storageErrorMessage } from '@/utils/local-theme-storage-helpers'
import { createThemeRegistry } from '@/registry/theme-registry'
import { deserializeTheme } from '@/utils/theme-serialization'
import { assertLocalThemeId, writeVerified } from '@/utils/local-theme-storage-writes'
import { recoverLegacyState } from '@/utils/theme-store-recovery'
const INDEX = 'ftb-themes'
const ACTIVE = 'ftb-theme-active'; const LEGACY = 'ftb-theme'
const validateState = (value: unknown): ThemeStateV5 | null => {
  if (!isThemeValue(value)) return null
  try { const state = normalizeTheme(migrateToCurrent(value)); return validateFoundationState(state.foundations).valid ? state : null } catch { return recoverLegacyState(value) }
}
export function validateLocalThemeState(value: unknown): ThemeStateV5 | null {
  return validateState(value)
}
export function themeStateKey(id: string): string { assertLocalThemeId(id); return `ftb-theme:${id}` }
export function themeHistoryKey(id: string): string { assertLocalThemeId(id); return `ftb-theme-history:${id}` }
export function loadLocalThemeCollection(storage: Storage): LocalThemeLoadResult {
  try {
    const rawIndex = storage.getItem(INDEX)
    const indexed = parseIndex(rawIndex)
    const indexError = rawIndex !== null && indexed === null ? 'Theme index was repaired' : null
    const activeId = storage.getItem(ACTIVE)
    const recovered = recoverLocalThemeRecords(storage, indexed ?? [], validateState, (id, state, history) => writeAndVerifyLocalTheme(storage, id, state, history))
    if (!recovered.records.length) return failedLocalThemeLoad(createDefaultCurrentThemeState(), indexed ? 'Theme records are invalid' : 'Theme index is missing or invalid')
    const nextActiveId = activeId && recovered.records.some((theme) => theme.id === activeId) ? activeId : recovered.records[0]!.id
    const active = recovered.values.get(nextActiveId)!
    const collection = { themes: recovered.records, activeId: nextActiveId }
    const needsPublication = !indexed || indexed.length !== collection.themes.length || indexed.some((theme) => !collection.themes.some((entry) => JSON.stringify(entry) === JSON.stringify(theme))) || activeId !== nextActiveId || recovered.repaired
    if (needsPublication) {
      const published = writeVerified(storage, [[INDEX, JSON.stringify(collection.themes)], [ACTIVE, nextActiveId]], () => storage.getItem(ACTIVE) === nextActiveId && parseLocalThemeCollection(parseStorageJson(storage.getItem(INDEX))) !== null)
      if (!published.ok) return { collection, state: active.state, history: active.history, error: published.error }
    }
    return { collection, state: active.state, history: active.history, error: indexError ?? recovered.repairError ?? (recovered.repaired ? 'Invalid theme records were repaired or quarantined' : null) }
  } catch (error) { return failedLocalThemeLoad(createDefaultCurrentThemeState(), storageErrorMessage(error)) }
}

export function loadLocalThemeById(storage: Storage, id: string): { state: ThemeStateV5; history: LocalThemeHistory; error: string | null } {
  try {
    const state = validateState(parseStorageJson(storage.getItem(themeStateKey(id))))
    const history = parseLocalThemeHistory(parseStorageJson(storage.getItem(themeHistoryKey(id))), validateState)
    if (!state || !history) return { state: createDefaultCurrentThemeState(), history: { snapshots: [createDefaultCurrentThemeState()], cursor: 0 }, error: 'Theme state or history is invalid' }
    return { state, history, error: null }
  } catch (error) { return { state: createDefaultCurrentThemeState(), history: { snapshots: [createDefaultCurrentThemeState()], cursor: 0 }, error: storageErrorMessage(error) } }
}

export function writeAndVerifyLocalTheme(storage: Storage, id: string, state: ThemeStateInput, history: LocalThemeHistoryInput): StorageOperationResult {
  assertLocalThemeId(id)
  const valid = validateState(state)
  const parsedHistory = parseLocalThemeHistory(history, validateState)
  if (!valid || !parsedHistory) return { ok: false, error: 'Invalid theme state or history' }
  return writeVerified(storage, [[themeStateKey(id), JSON.stringify(valid)], [themeHistoryKey(id), JSON.stringify(parsedHistory)]], () =>
    JSON.stringify(validateState(parseStorageJson(storage.getItem(themeStateKey(id))))) === JSON.stringify(valid) &&
    JSON.stringify(parseLocalThemeHistory(parseStorageJson(storage.getItem(themeHistoryKey(id))), validateState)) === JSON.stringify(parsedHistory))
}

export function initializeLocalThemeStorage(storage: Storage, defaultState: ThemeStateInput, migrateState: (state: ThemeState) => ThemeStateInput, preferDefaultState = false): LocalThemeLoadResult {
  try {
    if (storage.getItem(INDEX) !== null) return loadLocalThemeCollection(storage)
    if (hasNewFormatRemnants(storage)) {
      const recovered = loadLocalThemeCollection(storage)
      if (recovered.error === null) return recovered
      return failedLocalThemeLoad(migrateToCurrent(defaultState), 'Partial local theme storage detected; existing records were preserved')
    }
    const bytes = storage.getItem(LEGACY)
    let state: ThemeStateV5 = defaultState.schemaVersion === 5 ? defaultState : migrateToCurrent(defaultState)
    let legacyError: string | null = null
    let migratedLegacy = false
    if (bytes !== null && !preferDefaultState) {
      const parsed = parseStorageJson(bytes)
      if (!isThemeValue(parsed)) legacyError = 'Legacy theme is invalid'
      else {
        const legacyValidation = parsed.schemaVersion <= 2 ? deserializeTheme(parsed, createThemeRegistry()) : { valid: true }
        if (!legacyValidation.valid) legacyError = 'Legacy theme is invalid'
        try { if (!legacyError) { const migrated = migrateState(parsed); state = migrated.schemaVersion === 5 ? migrated : migrateToCurrent(migrated) } } catch {
          const recovered = recoverLegacyState(parsed)
          if (recovered) state = recovered
          else legacyError = 'Legacy theme migration failed'
        }
        if (!legacyError && !validateState(state)) legacyError = 'Migrated theme is invalid'
        if (!legacyError) migratedLegacy = true
      }
    }
    const id = `theme-${Date.now()}`
    const record: LocalThemeRecord = { id, name: 'Untitled', updatedAt: Date.now() }
    const history = { snapshots: [state], cursor: 0 }
    const payload = JSON.stringify([record])
    const result = writeVerified(storage, [[themeStateKey(id), JSON.stringify(state)], [themeHistoryKey(id), JSON.stringify(history)], [INDEX, payload], [ACTIVE, id]], () => loadLocalThemeCollection(storage).error === null && storage.getItem(ACTIVE) === id)
    if (!result.ok) return failedLocalThemeLoad(state, result.error)
    if (migratedLegacy) storage.removeItem(LEGACY)
    const loaded = loadLocalThemeCollection(storage)
    return legacyError ? { ...loaded, error: legacyError } : loaded
  } catch (error) { return failedLocalThemeLoad(migrateToCurrent(defaultState), storageErrorMessage(error)) }
}
