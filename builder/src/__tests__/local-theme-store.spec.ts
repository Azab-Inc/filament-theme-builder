import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
const setup = () => { localStorage.clear(); setActivePinia(createPinia()); return useThemeStore() }
describe('local theme store collection', () => {
  beforeEach(() => { vi.useFakeTimers({ now: 1000 }) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
  it('initializes one active default theme with public collection state', () => {
    const store = setup(); expect(store.themes).toHaveLength(1); expect(store.activeThemeId).toBe(store.themes[0]?.id)
    expect(store.activeThemeName).toBe('Untitled'); expect(store.storageError).toBeNull()
  })
  it('creates unique themes and renames using trimmed display names', () => {
    const store = setup(); const first = store.createTheme(); expect(store.activeThemeId).toBe(first.id)
    const second = store.createTheme()
    const secondState = JSON.stringify(store.theme)
    expect(second.id).not.toBe(first.id)
    expect(second.updatedAt).toBeGreaterThanOrEqual(first.updatedAt)
    expect(store.renameTheme(second.id, '  Marketing  ')).toBe(true)
    expect(store.themes.find(({ id }) => id === second.id)?.name).toBe('Marketing')
    expect(store.activeThemeId).toBe(second.id)
    expect(JSON.stringify(store.theme)).toBe(secondState)
    expect(store.renameTheme(second.id, '   ')).toBe(false)
    store.openTheme('missing'); expect(store.storageError).toContain('does not exist')
  })
  it('opens themes after flushing edits and preserves each state', () => {
    const store = setup(); const firstId = store.activeThemeId
    store.setPrimaryColor('#0f766e'); vi.advanceTimersByTime(300)
    const second = store.createTheme(); store.openTheme(second.id)
    expect(store.theme.colors.primary).toBe('#6366f1')
    store.openTheme(firstId)
    expect(store.theme.colors.primary).toBe('#0f766e')
  })
  it('duplicates current state with fresh history and selects the copy', () => {
    const store = setup(); store.setPrimaryColor('#0f766e'); vi.advanceTimersByTime(300)
    const copy = store.duplicateTheme(store.activeThemeId)
    expect(store.activeThemeId).toBe(copy.id)
    expect(store.activeThemeName).toBe('Untitled copy')
    expect(store.theme.colors.primary).toBe('#0f766e')
    expect(store.canUndo).toBe(false)
  })
  it('deletes safely and falls back to newest remaining theme or recreates one', () => {
    const store = setup(); const first = store.activeThemeId
    const second = store.createTheme(); store.renameTheme(second.id, 'Second')
    store.deleteTheme(first); expect(store.activeThemeId).toBe(second.id)
    store.deleteTheme(second.id); expect(store.themes).toHaveLength(1)
    expect(store.activeThemeId).toBe(store.themes[0]?.id)
    expect(store.activeThemeName).toBe('Untitled')
  })
  it('preserves list-order tie fallback and non-active deletion pointer', () => {
    const store = setup(); const first = store.activeThemeId; const second = store.createTheme(); const third = store.createTheme()
    store.deleteTheme(third.id); expect(store.activeThemeId).toBe(first)
    store.deleteTheme(first); expect(store.activeThemeId).toBe(second.id)
  })
  it('restores each theme redo history after reopening it', () => {
    const store = setup(); const first = store.activeThemeId
    store.setPrimaryColor('#0f766e'); vi.advanceTimersByTime(300); store.undo(); vi.advanceTimersByTime(300)
    const second = store.createTheme(); store.openTheme(second.id)
    expect(store.canRedo).toBe(false)
    store.openTheme(first)
    expect(store.canRedo).toBe(true); store.redo()
    expect(store.theme.colors.primary).toBe('#0f766e')
  })
  it('reports active-pointer failures without deleting the active record', () => {
    const store = setup(); const id = store.activeThemeId; const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key === 'ftb-theme-active') throw new Error('pointer denied'); return original.call(this, key, value) })
    store.deleteTheme(id)
    expect(store.activeThemeId).toBe(id); expect(store.themes.some((theme) => theme.id === id)).toBe(true); expect(store.storageError).toContain('pointer denied')
  })
  it('rejects invalid duplicate and delete IDs', () => {
    const store = setup(); const copy = store.duplicateTheme('missing')
    expect(store.deleteTheme('missing')).toBeUndefined(); expect(copy.id).not.toBe('missing'); expect(store.storageError).toContain('does not exist')
  })
  it('updates metadata after an edit is flushed', () => {
    const store = setup(); const before = store.themes[0]!.updatedAt
    vi.setSystemTime(2000); store.setPrimaryColor('#0f766e'); vi.advanceTimersByTime(300)
    expect(store.themes[0]!.updatedAt).toBeGreaterThan(before)
  })
  it('reports a metadata write failure from flush', () => {
    const store = setup(); const original = Storage.prototype.setItem
    store.setPrimaryColor('#0f766e')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key === 'ftb-themes') throw new Error('metadata denied'); return original.call(this, key, value) })
    vi.advanceTimersByTime(300)
    expect(store.storageError).toContain('metadata denied')
  })
  it('isolates preset edits to the active theme', () => {
    const store = setup(); const first = store.activeThemeId; const second = store.createTheme()
    expect(second.id).not.toBe(first); store.openTheme(first); store.setDensity('compact'); expect(store.canUndo).toBe(true)
    store.openTheme(second.id)
    expect(store.theme.foundations.density).toBe('default')
    expect(store.canUndo).toBe(false)
  })
  it('keeps memory and active pointer usable when storage rejects a mutation', () => {
    const store = setup(); const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key === 'ftb-themes') throw new Error('quota'); return original.call(this, key, value) })
    const created = store.createTheme()
    expect(store.storageError).toContain('quota')
    expect(store.themes.some(({ id }) => id === created.id)).toBe(false)
    expect(store.activeThemeId).toBe(store.themes[0]?.id)
  })
})
