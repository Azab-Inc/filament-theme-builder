import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { loadLocalThemeCollection } from '@/utils/local-theme-storage'

const setup = () => { localStorage.clear(); setActivePinia(createPinia()); return useThemeStore() }
const reload = () => { setActivePinia(createPinia()); return useThemeStore() }

describe('local theme deletion publication order', () => {
  beforeEach(() => vi.useFakeTimers({ now: 1000 }))
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('keeps the old pointer and records after repeated index failures', () => {
    const store = setup(); const oldId = store.activeThemeId; const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-themes') throw new Error('index denied')
      return original.call(this, key, value)
    })
    store.deleteTheme(oldId)
    expect(localStorage.getItem('ftb-theme-active')).toBe(oldId)
    expect(localStorage.getItem(`ftb-theme:${oldId}`)).not.toBeNull()
    const reloaded = reload()
    expect(reloaded.activeThemeId).toBe(oldId); expect(reloaded.themes).toHaveLength(1)
  })

  it('keeps both indexed records when the final index write fails after pointer publication', () => {
    const store = setup(); const oldId = store.activeThemeId; let indexWrites = 0
    const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-themes' && ++indexWrites === 2) throw new Error('final index denied')
      return original.call(this, key, value)
    })

    store.deleteTheme(oldId)

    expect(indexWrites).toBe(2)
    const persistedIndex = JSON.parse(localStorage.getItem('ftb-themes')!) as { id: string }[]
    const persistedActiveId = localStorage.getItem('ftb-theme-active')!
    expect(persistedIndex).toHaveLength(2)
    expect(persistedIndex.map(({ id }) => id)).toEqual(expect.arrayContaining([oldId, persistedActiveId]))
    for (const theme of persistedIndex) {
      expect(localStorage.getItem(`ftb-theme:${theme.id}`)).not.toBeNull()
      expect(localStorage.getItem(`ftb-theme-history:${theme.id}`)).not.toBeNull()
    }
    expect(loadLocalThemeCollection(localStorage)).toMatchObject({
      collection: { activeId: persistedActiveId, themes: persistedIndex },
      error: null,
    })

    const reloaded = reload()
    expect(reloaded.activeThemeId).toBe(persistedActiveId)
    expect(reloaded.themes.map(({ id }) => id)).toEqual(expect.arrayContaining([oldId, persistedActiveId]))
    expect(reloaded.themes).toHaveLength(2)
  })

  it('keeps both records when pointer publication fails after index success', () => {
    const store = setup(); const oldId = store.activeThemeId; const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-theme-active') throw new Error('pointer denied')
      return original.call(this, key, value)
    })
    store.deleteTheme(oldId)
    const index = JSON.parse(localStorage.getItem('ftb-themes')!) as { id: string }[]; const activeId = localStorage.getItem('ftb-theme-active')!
    expect(activeId).toBe(oldId); expect(index).toHaveLength(2)
    for (const theme of index) expect(localStorage.getItem(`ftb-theme:${theme.id}`)).not.toBeNull()
    const reloaded = reload()
    expect(reloaded.activeThemeId).toBe(oldId); expect(reloaded.themes).toHaveLength(2); expect(reloaded.storageError).toBeNull()
  })

  it('keeps the old active pointer during non-last active deletion failure', () => {
    const store = setup(); const oldId = store.activeThemeId; const next = store.createTheme(); store.openTheme(oldId); const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key === 'ftb-theme-active') throw new Error('pointer denied'); return original.call(this, key, value) })
    store.deleteTheme(oldId)
    const index = JSON.parse(localStorage.getItem('ftb-themes')!) as { id: string }[]
    expect(localStorage.getItem('ftb-theme-active')).toBe(oldId); expect(index.map(({ id }) => id)).toEqual(expect.arrayContaining([oldId, next.id]))
    const reloaded = reload(); expect(reloaded.activeThemeId).toBe(oldId); expect(reloaded.themes).toHaveLength(2)
  })

  it('never leaves the pointer on an unindexed record when pointer and rollback writes fail', () => {
    const store = setup(); const oldId = store.activeThemeId; const next = store.createTheme(); store.openTheme(oldId)
    store.setPrimaryColor('#dc2626'); vi.advanceTimersByTime(300)
    const original = Storage.prototype.setItem
    let pointerWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-theme-active' && ++pointerWrites > 1) throw new Error('pointer rollback denied')
      if (key === 'ftb-themes' && JSON.parse(value).length === 1) throw new Error('index rollback denied')
      return original.call(this, key, value)
    })

    store.deleteTheme(oldId)

    const persistedIndex = JSON.parse(localStorage.getItem('ftb-themes')!) as { id: string }[]
    const persistedActiveId = localStorage.getItem('ftb-theme-active')!
    expect(persistedIndex.map(({ id }) => id)).toContain(persistedActiveId)
    expect(persistedIndex.map(({ id }) => id)).toContain(oldId)
    expect(localStorage.getItem(`ftb-theme:${persistedActiveId}`)).not.toBeNull()
    expect(store.activeThemeId).toBe(persistedActiveId)
    expect(store.theme.colors.primary).toBe('#6366f1')
    const reloaded = reload()
    expect(reloaded.activeThemeId).toBe(persistedActiveId)
    expect(reloaded.theme.colors.primary).toBe('#6366f1')
    expect(next.id).toBe(persistedActiveId)
  })
})
