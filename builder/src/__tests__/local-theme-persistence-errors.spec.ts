import { describe, expect, it, vi } from 'vitest'

import { useLocalThemePersistence } from '@/composables/use-local-theme-persistence'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { themeHistoryKey, themeStateKey } from '@/utils/local-theme-storage'
import { cloneTheme } from '@/utils/theme-store-helpers'
import type { LocalThemeHistory } from '@/models/local-theme.model'

const makePersistence = (storage: Storage) => {
  let now = 300
  const persistence = useLocalThemePersistence({ storage, initialState: createDefaultThemeState(), now: () => now++, schedule: setTimeout, cancel: clearTimeout })
  persistence.initialize()
  return persistence
}

const denyWritesTo = (base: Storage, keyToDeny: string) => {
  let denied = false
  const storage = new Proxy(base, { get(target, key) {
    if (key === 'setItem') return (name: string, value: string) => denied && (keyToDeny === '*' || name === keyToDeny) ? (() => { throw new Error('quota') })() : target.setItem(name, value)
    const value = Reflect.get(target, key, target)
    return typeof value === 'function' ? value.bind(target) : value
  } })
  return { storage, deny: () => { denied = true } }
}

describe('local theme persistence errors', () => {
  it('keeps an edit in active state usable after its save fails', () => {
    vi.useFakeTimers(); localStorage.clear()
    const { storage, deny } = denyWritesTo(localStorage, '*')
    const persistence = makePersistence(storage)
    const id = persistence.activeThemeId.value
    const edited = cloneTheme(persistence.activeState.value)
    edited.colors.primary = '#dc2626'
    edited.foundations.palettes.primary.base = '#dc2626'
    persistence.activeState.value = edited
    const history: LocalThemeHistory = { snapshots: [cloneTheme(edited)], cursor: 0 }
    deny()
    persistence.scheduleSave(id, persistence.activeState.value, history)
    vi.advanceTimersByTime(300)

    expect(persistence.storageError.value).toContain('quota')
    expect(persistence.activeState.value.colors.primary).toBe('#dc2626')
    persistence.activeState.value.colors.primary = '#16a34a'
    expect(persistence.activeState.value.colors.primary).toBe('#16a34a')
  })

  it('does not list a created theme when its index write fails', () => {
    vi.useFakeTimers(); localStorage.clear()
    const { storage, deny } = denyWritesTo(localStorage, 'ftb-themes')
    const persistence = makePersistence(storage)
    deny()
    const record = persistence.createTheme()

    expect(persistence.storageError.value).toContain('quota')
    expect(persistence.themes.value.some((theme) => theme.id === record.id)).toBe(false)
    expect(localStorage.getItem(themeStateKey(record.id))).toBeNull()
    expect(localStorage.getItem(themeHistoryKey(record.id))).toBeNull()
  })

  it('does not list a duplicate when its index write fails', () => {
    vi.useFakeTimers(); localStorage.clear()
    const { storage, deny } = denyWritesTo(localStorage, 'ftb-themes')
    const persistence = makePersistence(storage)
    const sourceId = persistence.activeThemeId.value
    deny()
    const copy = persistence.duplicateTheme(sourceId)

    expect(persistence.storageError.value).toContain('quota')
    expect(persistence.themes.value.some((theme) => theme.id === copy.id)).toBe(false)
    expect(localStorage.getItem(themeStateKey(copy.id))).toBeNull()
    expect(localStorage.getItem(themeHistoryKey(copy.id))).toBeNull()
  })

  it('does not list a theme when its state write fails', () => {
    vi.useFakeTimers(); localStorage.clear()
    const { storage, deny } = denyWritesTo(localStorage, '*')
    const persistence = makePersistence(storage)
    deny()
    const record = persistence.createTheme()

    expect(persistence.storageError.value).toContain('quota')
    expect(persistence.themes.value.some((theme) => theme.id === record.id)).toBe(false)
  })

  it('does not list a duplicate when its state write fails', () => {
    vi.useFakeTimers(); localStorage.clear()
    const { storage, deny } = denyWritesTo(localStorage, '*')
    const persistence = makePersistence(storage)
    const sourceId = persistence.activeThemeId.value
    deny()
    const copy = persistence.duplicateTheme(sourceId)

    expect(persistence.storageError.value).toContain('quota')
    expect(persistence.themes.value.some((theme) => theme.id === copy.id)).toBe(false)
  })
})
