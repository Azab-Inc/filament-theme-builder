import { getCurrentScope, onScopeDispose, readonly, ref } from 'vue'
import type { LocalThemeHistory, LocalThemeLoadResult, LocalThemePendingSave, LocalThemePersistenceOptions as PersistenceOptions, LocalThemeRecord, StorageOperationResult } from '@/models/local-theme.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import { initializeLocalThemeStorage, loadLocalThemeById, themeHistoryKey, themeStateKey, writeAndVerifyLocalTheme } from '@/utils/local-theme-storage'
import { migrateToCurrent } from '@/utils/theme-store-normalization'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { cloneLocalThemeHistory, createDefaultLocalTheme, localThemeStorageMessage } from '@/utils/local-theme-persistence-helpers'
import { type FreshThemeImport, type ImportCommitResult, importFreshLocalTheme, isFreshThemeImportValid, recoverLocalThemeImports } from '@/utils/local-theme-import'
const INDEX = 'ftb-themes'; const ACTIVE = 'ftb-theme-active'; const DELAY = 300
export function useLocalThemePersistence(options: PersistenceOptions) {
  const themes = ref<LocalThemeRecord[]>([]); const activeThemeId = ref('')
  const initialState = migrateToCurrent(options.initialState)
  const activeState = ref(cloneTheme(initialState)); const activeHistory = ref<LocalThemeHistory>({ snapshots: [cloneTheme(initialState)], cursor: 0 })
  const storageError = ref<string | null>(null); const pending = new Map<string, LocalThemePendingSave>()
  function initialize(preferInitialState = false): LocalThemeLoadResult {
    recoverLocalThemeImports(options.storage, options.now)
    const loaded = initializeLocalThemeStorage(options.storage, initialState, migrateToCurrent, preferInitialState)
    themes.value = loaded.collection.themes; activeThemeId.value = loaded.collection.activeId; activeState.value = loaded.state; activeHistory.value = loaded.history; storageError.value = loaded.error
    if (!activeThemeId.value) { const id = nextId(); activeThemeId.value = id; themes.value = [{ id, name: 'Untitled', updatedAt: options.now() }] }
    return loaded
  }
  function importFreshTheme(input: FreshThemeImport): ImportCommitResult {
    if (!isFreshThemeImportValid(input)) return { ok: false, error: 'Invalid import identity or state' }
    const flushed = flush(activeThemeId.value); if (!flushed.ok) return { ok: false, error: flushed.error }
    const result = importFreshLocalTheme(options.storage, input, options.now); if (!result.ok) { storageError.value = result.error; return result }
    const loaded = loadLocalThemeById(options.storage, result.record.id); if (loaded.error) return { ok: false, error: loaded.error }
    themes.value = [...themes.value.filter((theme) => theme.id !== result.record.id), result.record]; activeThemeId.value = result.record.id; activeState.value = loaded.state; activeHistory.value = loaded.history; storageError.value = null; return result
  }
  function scheduleSave(id: string, state: ThemeStateV5, history: LocalThemeHistory): void {
    const prior = pending.get(id); if (prior) options.cancel(prior.timer)
    const saved = { state: cloneTheme(state), history: cloneLocalThemeHistory(history) }; const timer = options.schedule(() => { flush(id) }, DELAY); pending.set(id, { ...saved, timer })
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
  function createTheme(): LocalThemeRecord { const record = { id: nextId(), name: 'Untitled', updatedAt: options.now() }; const { state, history } = createDefaultLocalTheme(); persistNewTheme(record, state, history); return record }
  function renameTheme(id: string, name: string): boolean {
    const theme = themes.value.find((entry) => entry.id === id); if (!theme || !name.trim()) return false
    const previous = { ...theme }; theme.name = name.trim(); theme.updatedAt = options.now(); if (writeIndex()) return true; Object.assign(theme, previous); return false
  }
  function duplicateTheme(id: string): LocalThemeRecord { const sourceResult: StorageOperationResult = id === activeThemeId.value ? flush(id) : { ok: true }; const source = loadLocalThemeById(options.storage, id); const record = { id: nextId(), name: `${themes.value.find((theme) => theme.id === id)?.name ?? 'Untitled'} copy`, updatedAt: options.now() }; if (!sourceResult.ok) { failure(sourceResult.error); return record }; if (source.error) { failure(source.error); return record }; const history = { snapshots: [cloneTheme(source.state)], cursor: 0 }; if (persistNewTheme(record, source.state, history)) switchTo(record.id); return record }
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
  if (getCurrentScope()) onScopeDispose(() => { for (const save of pending.values()) options.cancel(save.timer) }); return { themes, activeThemeId, activeState, activeHistory, storageError: readonly(storageError), initialize, scheduleSave, flush, importFreshTheme, switchTo, createTheme, renameTheme, duplicateTheme, deleteTheme }
  function writeIndex(records = themes.value): boolean { try { options.storage.setItem(INDEX, JSON.stringify(records)); return true } catch (error) { storageError.value = localThemeStorageMessage(error); return false } }
  function persistNewTheme(record: LocalThemeRecord, state: ThemeStateV5, history: LocalThemeHistory): boolean {
    const saved = writeAndVerifyLocalTheme(options.storage, record.id, state, history); if (!saved.ok) { storageError.value = saved.error; return false }
    themes.value.push(record); if (writeIndex()) { storageError.value = null; return true }; themes.value = themes.value.filter((theme) => theme.id !== record.id); removeRecords(record.id); return false
  }
  function recreateAfterDelete(id: string): StorageOperationResult {
    const { state, history: replacementHistory } = createDefaultLocalTheme(); const record = { id: nextId(), name: 'Untitled', updatedAt: options.now() }
    const previous = themes.value
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
    if (!setActive(next)) return failure(storageError.value ?? 'Theme pointer could not be saved')
    themes.value = remaining
    if (!writeIndex(remaining)) {
      const indexError = storageError.value ?? 'Theme index could not be published'
      themes.value = previous
      if (setActive(id)) { storageError.value = indexError; return failure(indexError) }
      themes.value = remaining
      activeThemeId.value = next
      activeState.value = loaded.state; activeHistory.value = loaded.history; return failure(`${indexError}; active pointer retained on indexed fallback`)
    }
    activeState.value = loaded.state; activeHistory.value = loaded.history
    removeRecords(id); return { ok: true }
  }
  function removeRecords(id: string): void { try { options.storage.removeItem(themeStateKey(id)); options.storage.removeItem(themeHistoryKey(id)) } catch (error) { storageError.value = localThemeStorageMessage(error) } }
  function touch(id: string): StorageOperationResult {
    const theme = themes.value.find((entry) => entry.id === id); if (!theme) return failure('Theme does not exist')
    const previous = theme.updatedAt; theme.updatedAt = options.now(); if (writeIndex()) return { ok: true }; theme.updatedAt = previous; return failure(storageError.value ?? 'Theme metadata could not be saved')
  }
  function failure(error: string): StorageOperationResult { storageError.value = error; return { ok: false, error } }; function nextId(): string { let id = `theme-${options.now()}`; let suffix = 1; while (themes.value.some((theme) => theme.id === id)) id = `theme-${options.now()}-${suffix++}`; return id }
  function newest(records: LocalThemeRecord[]): LocalThemeRecord { return records.reduce((best, theme) => theme.updatedAt > best.updatedAt ? theme : best, records[0]!) }
  function setActive(id: string): boolean { try { options.storage.setItem(ACTIVE, id); activeThemeId.value = id; return true } catch (error) { storageError.value = localThemeStorageMessage(error); return false } }
}
