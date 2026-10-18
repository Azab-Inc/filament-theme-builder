import type { ImportMarker } from '@/models/local-theme-import.model'
import { themeHistoryKey, themeStateKey, validateLocalThemeState } from '@/utils/local-theme-storage'
import { fingerprintImportedState, INVALID_JSON, readImportValue } from '@/utils/local-theme-import-storage'
import { parseLocalThemeHistory } from '@/utils/local-theme-validation'

const expectedHistory = (state: unknown) => JSON.stringify({ snapshots: [state], cursor: 0 })

export function hasConflictingImportedData(storage: Storage, marker: ImportMarker): boolean {
  const stateValue = readImportValue(storage, themeStateKey(marker.recordId))
  const historyValue = readImportValue(storage, themeHistoryKey(marker.recordId))
  if (stateValue === INVALID_JSON || historyValue === INVALID_JSON) return true
  if (stateValue !== null) {
    const state = validateLocalThemeState(stateValue)
    if (!state || fingerprintImportedState(state) !== marker.stateFingerprint) return true
  }
  if (historyValue !== null) {
    const state = validateLocalThemeState(stateValue)
    const history = parseLocalThemeHistory(historyValue, validateLocalThemeState)
    if (!state || !history || JSON.stringify(history) !== expectedHistory(state)) return true
  }
  return false
}
