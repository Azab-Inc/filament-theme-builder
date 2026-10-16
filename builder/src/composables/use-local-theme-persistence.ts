import { getCurrentScope, onScopeDispose, readonly, ref } from 'vue'
import type { LocalThemeHistory, LocalThemeRecord, LocalThemePersistenceOptions as PersistenceOptions } from '@/models/local-theme.model'
import type { ThemeStateV4 } from '@/models/theme.model'
import { initializeLocalThemeStorage, loadLocalThemeById, themeHistoryKey, themeStateKey, writeAndVerifyLocalTheme, type LocalThemeLoadResult, type StorageOperationResult } from '@/utils/local-theme-storage'
import { migrateToCurrent } from '@/utils/theme-store-normalization'
import { cloneTheme } from '@/utils/theme-store-helpers'

const INDEX = 'ftb-themes'; const ACTIVE = 'ftb-theme-active'; const DELAY = 300
type PendingSave = { state: ThemeStateV4; history: LocalThemeHistory; timer: ReturnType<typeof setTimeout> }

export function useLocalThemePersistence(options: PersistenceOptions) {
  const themes = ref<LocalThemeRecord[]>([]); const activeThemeId = ref('')
  const activeState = ref(cloneTheme(options.initialState)); const activeHistory = ref<LocalThemeHistory>({ snapshots: [cloneTheme(options.initialState)], cursor: 0 })
  const storageError = ref<string | null>(null); const pending = new Map<string, PendingSave>()
  function initialize(preferInitialState = false): LocalThemeLoadResult {
    const loaded = initializeLocalThemeStorage(options.storage, options.initialState, migrateToCurrent, preferInitialState)
    themes.value = loaded.collection.themes; activeThemeId.value = loaded.collection.activeId; activeState.value = loaded.state; activeHistory.value = loaded.history; storageError.value = loaded.error
    if (!activeThemeId.value) { const id = nextId(); activeThemeId.value = id; themes.value = [{ id, name: 'Untitled', updatedAt: options.now() }] }
    return loaded
  }
  function scheduleSave(id: string, state: ThemeStateV4, history: LocalThemeHistory): void {
    const prior = pending.get(id); if (prior) options.cancel(prior.timer)
    const saved = { state: cloneTheme(state), history: cloneHistory(history) }; const timer = options.schedule(() => { flush(id) }, DELAY); pending.set(id, { ...saved, timer })
  }
  function flush(id: string): StorageOperationResult {
    const saved = pending.get(id); if (!saved) return { ok: true }; const result = writeAndVerifyLocalTheme(options.storage, id, saved.state, saved.history)
    if (!result.ok) { storageError.value = result.error; return result }; options.cancel(saved.timer); pending.delete(id); storageError.value = null; return touch(id)
  }
  function switchTo(id: string): StorageOperationResult {
    if (!themes.value.some((theme) => theme.id === id)) return failure('Theme does not exist')
    const current = flush(activeThemeId.value); if (!current.ok) return current; const loaded = loadLocalThemeById(options.storage, id)
    if (loaded.error) return failure(loaded.error); if (!setActive(id)) return failure(storageError.value ?? 'Theme could not be opened')
    activeState.value = loaded.state; activeHistory.value = loaded.history; return { ok: true }
  }
  function createTheme(): LocalThemeRecord {
    const record = { id: nextId(), name: 'Untitled', updatedAt: options.now() }; const state = cloneTheme(options.initialState)
    persistNewTheme(record, state, { snapshots: [state], cursor: 0 }); return record
  }
  function renameTheme(id: string, name: string): boolean {
    const theme = themes.value.find((entry) => entry.id === id); if (!theme || !name.trim()) return false
    const previous = { ...theme }; theme.name = name.trim(); theme.updatedAt = options.now(); if (writeIndex()) return true; Object.assign(theme, previous); return false
  }
  function duplicateTheme(id: string): LocalThemeRecord {
    const sourceResult: StorageOperationResult = id === activeThemeId.value ? flush(id) : { ok: true }; const source = loadLocalThemeById(options.storage, id); const record = { id: nextId(), name: `${themes.value.find((theme) => theme.id === id)?.name ?? 'Untitled'} copy`, updatedAt: options.now() }
    if (!sourceResult.ok) { failure(sourceResult.error); return record }
    if (source.error) { failure(source.error); return record }; const history = { snapshots: [cloneTheme(source.state)], cursor: 0 }; if (persistNewTheme(record, source.state, history)) switchTo(record.id); return record
  }
  function deleteTheme(id: string): StorageOperationResult {
    if (!themes.value.some((theme) => theme.id === id)) return failure('Theme does not exist'); const wasActive = id === activeThemeId.value; const result = flush(id)
    const timer = pending.get(id); if (timer) options.cancel(timer.timer); pending.delete(id); if (!result.ok) return result
    const remaining = themes.value.filter((theme) => theme.id !== id)
    if (!remaining.length) return recreateAfterDelete(id)
    const next = wasActive ? newest(remaining).id : activeThemeId.value; const previous = themes.value
    if (wasActive) return publishActiveDeletion(id, next, previous, remaining)
    themes.value = remaining
    if (!writeIndex()) { themes.value = previous; return failure('Theme index could not be saved') }
    removeRecords(id); return { ok: true }
  }
  if (getCurrentScope()) onScopeDispose(() => { for (const save of pending.values()) options.cancel(save.timer) })
  return { themes, activeThemeId, activeState, activeHistory, storageError: readonly(storageError), initialize, scheduleSave, flush, switchTo, createTheme, renameTheme, duplicateTheme, deleteTheme }
  function writeIndex(): boolean { try { options.storage.setItem(INDEX, JSON.stringify(themes.value)); return true } catch (error) { storageError.value = message(error); return false } }
  function persistNewTheme(record: LocalThemeRecord, state: ThemeStateV4, history: LocalThemeHistory): boolean {
    const saved = writeAndVerifyLocalTheme(options.storage, record.id, state, history); if (!saved.ok) { storageError.value = saved.error; return false }
    themes.value.push(record); if (writeIndex()) { storageError.value = null; return true }; themes.value = themes.value.filter((theme) => theme.id !== record.id); removeRecords(record.id); return false
  }
  function recreateAfterDelete(id: string): StorageOperationResult {
    const state = cloneTheme(options.initialState); const record = { id: nextId(), name: 'Untitled', updatedAt: options.now() }
    const previous = themes.value; const replacementHistory = { snapshots: [cloneTheme(state)], cursor: 0 }
    const saved = writeAndVerifyLocalTheme(options.storage, record.id, state, replacementHistory)
    if (!saved.ok) { storageError.value = saved.error; return saved }
    themes.value = [...previous, record]
    if (!writeIndex()) { themes.value = previous; removeRecords(record.id); return failure(storageError.value ?? 'Theme index could not be saved') }
    if (!setActive(record.id)) { return failure(storageError.value ?? 'Theme pointer could not be saved') }
    themes.value = [record]
    if (!writeIndex()) { themes.value = [...previous, record]; return failure(storageError.value ?? 'Theme index could not be finalized') }
    activeState.value = state; activeHistory.value = replacementHistory; removeRecords(id); return { ok: true }
  }
  function publishActiveDeletion(id: string, next: string, previous: LocalThemeRecord[], remaining: LocalThemeRecord[]): StorageOperationResult {
    const loaded = loadLocalThemeById(options.storage, next); if (loaded.error) return failure(loaded.error)
    themes.value = previous
    if (!writeIndex()) return failure(storageError.value ?? 'Theme index could not be published')
    if (!setActive(next)) return failure(storageError.value ?? 'Theme pointer could not be saved')
    activeState.value = loaded.state; activeHistory.value = loaded.history; themes.value = remaining
    if (!writeIndex()) { themes.value = previous; return failure(storageError.value ?? 'Theme index could not be finalized') }
    removeRecords(id); return { ok: true }
  }
  function removeRecords(id: string): void { try { options.storage.removeItem(themeStateKey(id)); options.storage.removeItem(themeHistoryKey(id)) } catch (error) { storageError.value = message(error) } }
  function touch(id: string): StorageOperationResult {
    const theme = themes.value.find((entry) => entry.id === id); if (!theme) return failure('Theme does not exist')
    const previous = theme.updatedAt; theme.updatedAt = options.now(); if (writeIndex()) return { ok: true }; theme.updatedAt = previous; return failure(storageError.value ?? 'Theme metadata could not be saved')
  }
  function failure(error: string): StorageOperationResult { storageError.value = error; return { ok: false, error } }
  function nextId(): string { let id = `theme-${options.now()}`; let suffix = 1; while (themes.value.some((theme) => theme.id === id)) id = `theme-${options.now()}-${suffix++}`; return id }
  function newest(records: LocalThemeRecord[]): LocalThemeRecord { return records.reduce((best, theme) => theme.updatedAt > best.updatedAt ? theme : best, records[0]!) }
  function setActive(id: string): boolean { try { options.storage.setItem(ACTIVE, id); activeThemeId.value = id; return true } catch (error) { storageError.value = message(error); return false } }
}
function cloneHistory(history: LocalThemeHistory): LocalThemeHistory { return { snapshots: history.snapshots.map(cloneTheme), cursor: history.cursor } }
function message(error: unknown): string { return error instanceof Error ? error.message : 'Local theme storage failed' }
