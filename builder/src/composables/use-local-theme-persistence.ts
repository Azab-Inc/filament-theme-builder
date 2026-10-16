import { getCurrentScope, readonly, ref, onScopeDispose } from 'vue'

import type { LocalThemeHistory, LocalThemeRecord } from '@/models/local-theme.model'
import type { ThemeStateV4 } from '@/models/theme.model'
import { initializeLocalThemeStorage, loadLocalThemeById, themeHistoryKey, themeStateKey, writeAndVerifyLocalTheme, type LocalThemeLoadResult, type StorageOperationResult } from '@/utils/local-theme-storage'
import { migrateToCurrent } from '@/utils/theme-store-normalization'
import { cloneTheme } from '@/utils/theme-store-helpers'

const INDEX = 'ftb-themes'
const ACTIVE = 'ftb-theme-active'
const DELAY = 300

type PendingSave = { state: ThemeStateV4; history: LocalThemeHistory; timer: ReturnType<typeof setTimeout> }
type PersistenceOptions = { storage: Storage; initialState: ThemeStateV4; now: () => number; schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>; cancel: (handle: ReturnType<typeof setTimeout>) => void }

export function useLocalThemePersistence(options: PersistenceOptions) {
  const themes = ref<LocalThemeRecord[]>([])
  const activeThemeId = ref('')
  const activeState = ref(cloneTheme(options.initialState))
  const activeHistory = ref<LocalThemeHistory>({ snapshots: [cloneTheme(options.initialState)], cursor: 0 })
  const storageError = ref<string | null>(null)
  const pending = new Map<string, PendingSave>()

  function initialize(): LocalThemeLoadResult {
    const loaded = initializeLocalThemeStorage(options.storage, options.initialState, migrateToCurrent)
    themes.value = loaded.collection.themes; activeThemeId.value = loaded.collection.activeId
    activeState.value = loaded.state; activeHistory.value = loaded.history; storageError.value = loaded.error
    if (!activeThemeId.value) {
      const id = `theme-${options.now()}`
      activeThemeId.value = id; themes.value = [{ id, name: 'Untitled', updatedAt: options.now() }]
    }
    return loaded
  }

  function scheduleSave(id: string, state: ThemeStateV4, history: LocalThemeHistory): void {
    const prior = pending.get(id); if (prior) options.cancel(prior.timer)
    const saved = { state: cloneTheme(state), history: cloneHistory(history) }
    const timer = options.schedule(() => { flush(id) }, DELAY)
    pending.set(id, { ...saved, timer })
  }

  function flush(id: string): StorageOperationResult {
    const saved = pending.get(id); if (!saved) return { ok: true }
    const result = writeAndVerifyLocalTheme(options.storage, id, saved.state, saved.history)
    if (!result.ok) { storageError.value = result.error; return result }
    options.cancel(saved.timer); pending.delete(id); storageError.value = null; touch(id)
    return result
  }

  function switchTo(id: string): StorageOperationResult {
    if (!themes.value.some((theme) => theme.id === id)) return failure('Theme does not exist')
    const current = flush(activeThemeId.value); if (!current.ok) return current
    const loaded = loadLocalThemeById(options.storage, id)
    if (loaded.error) return failure(loaded.error)
    try { options.storage.setItem(ACTIVE, id) } catch (error) { return failure(message(error)) }
    activeThemeId.value = id; activeState.value = loaded.state; activeHistory.value = loaded.history
    return { ok: true }
  }

  function createTheme(): LocalThemeRecord {
    const record = { id: `theme-${options.now()}`, name: 'Untitled', updatedAt: options.now() }; const state = cloneTheme(options.initialState)
    persistNewTheme(record, state, { snapshots: [state], cursor: 0 })
    return record
  }

  function renameTheme(id: string, name: string): boolean {
    const theme = themes.value.find((entry) => entry.id === id); if (!theme || !name.trim()) return false
    theme.name = name; theme.updatedAt = options.now(); return writeIndex()
  }

  function duplicateTheme(id: string): LocalThemeRecord {
    const source = loadLocalThemeById(options.storage, id); const record = { id: `theme-${options.now()}`, name: `${themes.value.find((theme) => theme.id === id)?.name ?? 'Untitled'} copy`, updatedAt: options.now() }
    if (source.error) { failure(source.error); return record }
    persistNewTheme(record, source.state, source.history)
    return record
  }

  function deleteTheme(id: string): StorageOperationResult {
    const result = flush(id); const timer = pending.get(id); if (timer) options.cancel(timer.timer); pending.delete(id)
    if (!result.ok) return result
    themes.value = themes.value.filter((theme) => theme.id !== id)
    try { options.storage.removeItem(themeStateKey(id)); options.storage.removeItem(themeHistoryKey(id)); return writeIndex() ? { ok: true } : failure('Theme index could not be saved') } catch (error) { return failure(message(error)) }
  }

  if (getCurrentScope()) onScopeDispose(() => { for (const save of pending.values()) options.cancel(save.timer) })
  return { themes, activeThemeId, activeState, activeHistory, storageError: readonly(storageError), initialize, scheduleSave, flush, switchTo, createTheme, renameTheme, duplicateTheme, deleteTheme }

  function writeIndex(): boolean { try { options.storage.setItem(INDEX, JSON.stringify(themes.value)); return true } catch (error) { storageError.value = message(error); return false } }
  function persistNewTheme(record: LocalThemeRecord, state: ThemeStateV4, history: LocalThemeHistory): void {
    const saved = writeAndVerifyLocalTheme(options.storage, record.id, state, history)
    if (!saved.ok) { storageError.value = saved.error; return }
    themes.value.push(record); if (writeIndex()) { storageError.value = null; return }
    themes.value = themes.value.filter((theme) => theme.id !== record.id); try { options.storage.removeItem(themeStateKey(record.id)); options.storage.removeItem(themeHistoryKey(record.id)) } catch { /* report the index failure */ }
  }
  function touch(id: string): void { const theme = themes.value.find((entry) => entry.id === id); if (theme) { theme.updatedAt = options.now(); writeIndex() } }
  function failure(error: string): StorageOperationResult { storageError.value = error; return { ok: false, error } }
}

function cloneHistory(history: LocalThemeHistory): LocalThemeHistory { return { snapshots: history.snapshots.map(cloneTheme), cursor: history.cursor } }
function message(error: unknown): string { return error instanceof Error ? error.message : 'Local theme storage failed' }
