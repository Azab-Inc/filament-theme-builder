import type { LocalThemeCollection, LocalThemeHistory, LocalThemeRecord } from '@/models/local-theme.model'
import type { ThemeState, ThemeStateV4 } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { isSafeLocalThemeId, parseLocalThemeCollection, parseLocalThemeHistory } from '@/utils/local-theme-validation'
import { migrateToCurrent } from '@/utils/theme-store-normalization'

export type StorageOperationResult = { ok: true } | { ok: false; error: string }
export type LocalThemeLoadResult = { collection: LocalThemeCollection; state: ThemeStateV4; history: LocalThemeHistory; error: string | null }
const INDEX = 'ftb-themes'
const ACTIVE = 'ftb-theme-active'
const LEGACY = 'ftb-theme'
const validateState = (value: unknown): ThemeStateV4 | null => {
  if (!isTheme(value)) return null
  try { return migrateToCurrent(value) } catch { return null }
}

export function themeStateKey(id: string): string { assertId(id); return `ftb-theme:${id}` }
export function themeHistoryKey(id: string): string { assertId(id); return `ftb-theme-history:${id}` }

export function loadLocalThemeCollection(storage: Storage): LocalThemeLoadResult {
  try {
    const themes = parseLocalThemeCollection(parse(storage.getItem(INDEX)))
    if (!themes) return failed(createDefaultThemeState(), 'Theme index is missing or invalid')
    const activeId = storage.getItem(ACTIVE)
    if (!activeId || !themes.some((theme) => theme.id === activeId)) return failed(createDefaultThemeState(), 'Active theme is invalid')
    const state = validateState(parse(storage.getItem(themeStateKey(activeId))))
    const history = parseLocalThemeHistory(parse(storage.getItem(themeHistoryKey(activeId))), validateState)
    if (!state || !history) return failed(createDefaultThemeState(), 'Active theme state or history is invalid')
    return { collection: { themes, activeId }, state, history, error: null }
  } catch (error) { return failed(createDefaultThemeState(), message(error)) }
}

export function writeAndVerifyLocalTheme(storage: Storage, id: string, state: ThemeStateV4, history: LocalThemeHistory): StorageOperationResult {
  assertId(id)
  const valid = validateState(state)
  const parsedHistory = parseLocalThemeHistory(history, validateState)
  if (!valid || !parsedHistory) return { ok: false, error: 'Invalid theme state or history' }
  return writeVerified(storage, [[themeStateKey(id), JSON.stringify(valid)], [themeHistoryKey(id), JSON.stringify(parsedHistory)]], () =>
    JSON.stringify(validateState(parse(storage.getItem(themeStateKey(id))))) === JSON.stringify(valid) &&
    JSON.stringify(parseLocalThemeHistory(parse(storage.getItem(themeHistoryKey(id))), validateState)) === JSON.stringify(parsedHistory))
}

export function initializeLocalThemeStorage(storage: Storage, defaultState: ThemeStateV4, migrateState: (state: ThemeState) => ThemeStateV4): LocalThemeLoadResult {
  try {
    if (storage.getItem(INDEX) !== null) return loadLocalThemeCollection(storage)
    const bytes = storage.getItem(LEGACY)
    let state = defaultState
    if (bytes !== null) {
      const parsed = parse(bytes)
      if (!isTheme(parsed)) return failed(defaultState, 'Legacy theme is invalid')
      state = migrateState(parsed)
      if (!validateState(state)) return failed(defaultState, 'Migrated theme is invalid')
    }
    const id = `theme-${Date.now()}`
    const record: LocalThemeRecord = { id, name: 'Untitled', updatedAt: Date.now() }
    const history = { snapshots: [state], cursor: 0 }
    const payload = JSON.stringify([record])
    const result = writeVerified(storage, [[themeStateKey(id), JSON.stringify(state)], [themeHistoryKey(id), JSON.stringify(history)], [INDEX, payload], [ACTIVE, id]], () => loadLocalThemeCollection(storage).error === null && storage.getItem(ACTIVE) === id)
    if (!result.ok) return failed(defaultState, result.error)
    if (bytes !== null) storage.removeItem(LEGACY)
    return loadLocalThemeCollection(storage)
  } catch (error) { return failed(defaultState, message(error)) }
}

function writeVerified(storage: Storage, writes: [string, string][], verify: () => boolean): StorageOperationResult {
  let previous: readonly (readonly [string, string | null])[] = []
  try {
    previous = writes.map(([key]) => [key, storage.getItem(key)] as const)
    for (const [key, value] of writes) storage.setItem(key, value)
    if (!verify()) throw new Error('Storage read-back verification failed')
    return { ok: true }
  } catch (error) {
    for (const [key, value] of [...previous].reverse()) { try { value === null ? storage.removeItem(key) : storage.setItem(key, value) } catch { /* report partial failure */ } }
    return { ok: false, error: message(error) }
  }
}
function assertId(id: string): void { if (!isSafeLocalThemeId(id)) throw new Error('Unsafe local theme ID') }
function parse(value: string | null): unknown { return value === null ? null : JSON.parse(value) as unknown }
function isTheme(value: unknown): value is ThemeState { return typeof value === 'object' && value !== null && 'schemaVersion' in value }
function message(error: unknown): string { return error instanceof Error ? error.message : 'Local theme storage failed' }
function failed(state: ThemeStateV4, error: string): LocalThemeLoadResult { return { collection: { themes: [], activeId: '' }, state, history: { snapshots: [state], cursor: 0 }, error } }
