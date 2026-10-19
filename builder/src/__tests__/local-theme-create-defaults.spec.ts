import { afterEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { themeHistoryKey, themeStateKey } from '@/utils/local-theme-storage'
import { createDirtyThemeState, expectValidDirtyTheme } from './fixtures/theme-create-defaults'

const startStore = () => { setActivePinia(createPinia()); return useThemeStore() }
const savedState = (id: string) => JSON.parse(localStorage.getItem(themeStateKey(id))!)
const savedHistory = (id: string) => JSON.parse(localStorage.getItem(themeHistoryKey(id))!)
const expectCanonical = (state: unknown) => {
  expect(state).toEqual(createDefaultThemeState())
  expect(state).toMatchObject({ customCss: '', foundations: { provenanceVersion: 1 } })
}

afterEach(() => localStorage.clear())

describe('new local themes use canonical defaults', () => {
  it('migrates an edited legacy theme, creates defaults, and recreates defaults after last deletion', () => {
    const original = createDirtyThemeState()
    expectValidDirtyTheme(original)
    localStorage.setItem('ftb-theme', JSON.stringify(original))
    const store = startStore()
    const originalId = store.activeThemeId
    expect(store.theme).toEqual(original)
    const created = store.createTheme()
    expectCanonical(store.theme)
    expect(savedState(created.id)).toEqual(createDefaultThemeState())
    expect(savedHistory(created.id)).toEqual({ snapshots: [createDefaultThemeState()], cursor: 0 })
    expect(savedState(originalId)).toEqual(original)
    store.openTheme(originalId)
    expect(store.theme).toEqual(original)
    store.deleteTheme(originalId)
    store.deleteTheme(created.id)
    const replacementId = store.activeThemeId
    expectCanonical(store.theme)
    expect(savedHistory(replacementId)).toEqual({ snapshots: [createDefaultThemeState()], cursor: 0 })
    expect(savedState(replacementId)).toEqual(createDefaultThemeState())
    expect(localStorage.getItem('ftb-theme-active')).toBe(replacementId)
    expect(JSON.parse(localStorage.getItem('ftb-themes')!).map(({ id }: { id: string }) => id)).toEqual([replacementId])
    for (const deletedId of [originalId, created.id]) {
      expect(localStorage.getItem(themeStateKey(deletedId))).toBeNull()
      expect(localStorage.getItem(themeHistoryKey(deletedId))).toBeNull()
    }
  })

  it('ignores stale legacy state after a real store reload with a valid collection', () => {
    const firstStore = startStore()
    const originalId = firstStore.activeThemeId
    const original = createDirtyThemeState()
    expectValidDirtyTheme(original)
    localStorage.setItem(themeStateKey(originalId), JSON.stringify(original))
    localStorage.setItem(themeHistoryKey(originalId), JSON.stringify({ snapshots: [original], cursor: 0 }))
    localStorage.setItem('ftb-theme', JSON.stringify(original))
    firstStore.$dispose()
    const store = startStore()
    expect(store.activeThemeId).toBe(originalId)
    expect(store.theme).toEqual(original)
    const created = store.createTheme()
    expectCanonical(store.theme)
    expect(savedState(created.id)).toEqual(createDefaultThemeState())
    expect(savedHistory(created.id)).toEqual({ snapshots: [createDefaultThemeState()], cursor: 0 })
    expect(savedState(originalId)).toEqual(original)
    store.openTheme(originalId)
    expect(store.theme).toEqual(original)
  })

  it('last-theme deletion writes only a canonical replacement and removes prior records', () => {
    const original = createDirtyThemeState()
    expectValidDirtyTheme(original)
    localStorage.setItem('ftb-theme', JSON.stringify(original))
    const store = startStore()
    const deletedId = store.activeThemeId
    store.deleteTheme(deletedId)
    const replacementId = store.activeThemeId
    expectCanonical(savedState(replacementId))
    expect(savedHistory(replacementId)).toEqual({ snapshots: [createDefaultThemeState()], cursor: 0 })
    expect(localStorage.getItem('ftb-theme-active')).toBe(replacementId)
    expect(JSON.parse(localStorage.getItem('ftb-themes')!).map(({ id }: { id: string }) => id)).toEqual([replacementId])
    expect(localStorage.getItem(themeStateKey(deletedId))).toBeNull()
    expect(localStorage.getItem(themeHistoryKey(deletedId))).toBeNull()
  })
})
