import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

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
    const store = setup(); const oldId = store.activeThemeId; const next = store.createTheme(); const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key === 'ftb-theme-active') throw new Error('pointer denied'); return original.call(this, key, value) })
    store.deleteTheme(oldId)
    const index = JSON.parse(localStorage.getItem('ftb-themes')!) as { id: string }[]
    expect(localStorage.getItem('ftb-theme-active')).toBe(oldId); expect(index.map(({ id }) => id)).toEqual(expect.arrayContaining([oldId, next.id]))
    const reloaded = reload(); expect(reloaded.activeThemeId).toBe(oldId); expect(reloaded.themes).toHaveLength(2)
  })
})
