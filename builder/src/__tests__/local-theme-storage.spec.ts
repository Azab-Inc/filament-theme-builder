import { describe, expect, it } from 'vitest'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { migrateToCurrent } from '@/utils/theme-store-normalization'
import { initializeLocalThemeStorage, loadLocalThemeCollection, themeHistoryKey, themeStateKey, writeAndVerifyLocalTheme } from '@/utils/local-theme-storage'

const state = createDefaultThemeState()
const history = { snapshots: [state], cursor: 0 }
const id = 'theme_1'

describe('local theme storage', () => {
  it('uses the specified safe key contracts', () => {
    expect(themeStateKey(id)).toBe('ftb-theme:theme_1')
    expect(themeHistoryKey(id)).toBe('ftb-theme-history:theme_1')
    expect(() => themeStateKey('../bad')).toThrow()
  })
  it('writes JSON state and history then reads the exact state back', () => {
    const storage = window.localStorage
    storage.clear()
    expect(writeAndVerifyLocalTheme(storage, id, state, history)).toEqual({ ok: true })
    expect(JSON.parse(storage.getItem(themeStateKey(id))!)).toEqual(state)
    expect(JSON.parse(storage.getItem(themeHistoryKey(id))!)).toEqual(history)
  })
  it('initializes empty storage and migrates legacy state idempotently', () => {
    const storage = window.localStorage
    storage.clear()
    storage.setItem('ftb-theme', JSON.stringify(state))
    const first = initializeLocalThemeStorage(storage, state, () => state)
    const second = initializeLocalThemeStorage(storage, state, () => state)
    expect(first.collection.themes).toHaveLength(1)
    expect(second.collection).toEqual(first.collection)
    expect(storage.getItem('ftb-theme')).toBeNull()
    expect(second.state).toEqual(state)
  })
  it('does not discard malformed legacy bytes or overwrite existing format', () => {
    const storage = window.localStorage
    storage.clear()
    storage.setItem('ftb-theme', '{bad')
    expect(initializeLocalThemeStorage(storage, state, () => state).error).toBeTruthy()
    expect(storage.getItem('ftb-theme')).toBe('{bad')
  })
  it('loads a valid existing collection and reports malformed collection data', () => {
    const storage = window.localStorage
    storage.clear()
    storage.setItem('ftb-themes', JSON.stringify([{ id, name: 'Existing', updatedAt: 1 }]))
    storage.setItem('ftb-theme-active', id)
    storage.setItem(themeStateKey(id), JSON.stringify(state))
    storage.setItem(themeHistoryKey(id), JSON.stringify(history))
    expect(loadLocalThemeCollection(storage).state).toEqual(state)
    storage.setItem('ftb-themes', '{bad')
    expect(loadLocalThemeCollection(storage).error).toBeTruthy()
  })
  it('does not replace existing new-format records when legacy bytes remain', () => {
    const storage = window.localStorage
    storage.clear()
    initializeLocalThemeStorage(storage, state, () => state)
    const before = storage.getItem('ftb-themes')
    storage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 1, colors: { primary: '#123456' } }))
    expect(initializeLocalThemeStorage(storage, state, () => state).collection.themes).toEqual(JSON.parse(before!))
    expect(storage.getItem('ftb-theme')).not.toBeNull()
  })
  it('rolls back earlier keys after a partial write', () => {
    const base = window.localStorage
    base.clear()
    base.setItem(themeStateKey(id), 'old-state')
    let calls = 0
    const storage = new Proxy(base, { get(target, key) {
      if (key === 'setItem') return (name: string, value: string) => { calls++; if (calls === 2) throw new Error('quota'); target.setItem(name, value) }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    } })
    expect(writeAndVerifyLocalTheme(storage, id, state, history)).toMatchObject({ ok: false, error: 'quota' })
    expect(base.getItem(themeStateKey(id))).toBe('old-state')
    expect(base.getItem(themeHistoryKey(id))).toBeNull()
  })
  it('returns recoverable errors when storage access throws', () => {
    const storage = new Proxy(window.localStorage, { get(_target, key) {
      if (key === 'getItem') return () => { throw new Error('denied') }
      return Reflect.get(window.localStorage, key, window.localStorage)
    } })
    expect(loadLocalThemeCollection(storage).error).toContain('denied')
    expect(writeAndVerifyLocalTheme(storage, id, state, history)).toMatchObject({ ok: false })
  })
  it('does not initialize over orphaned active or theme keys', () => {
    const base = window.localStorage
    base.clear()
    base.setItem('ftb-theme-active', 'orphan')
    base.setItem('ftb-theme:orphan', 'untouched-state')
    base.setItem('ftb-theme-history:orphan', 'untouched-history')
    const result = initializeLocalThemeStorage(base, state, () => state)
    expect(result.error).toBeTruthy()
    expect(base.getItem('ftb-themes')).toBeNull()
    expect(base.getItem('ftb-theme:orphan')).toBe('untouched-state')
    expect(base.getItem('ftb-theme-history:orphan')).toBe('untouched-history')
  })
  it('rejects unsafe index IDs and invalid active state or history', () => {
    const storage = window.localStorage
    storage.clear()
    storage.setItem('ftb-themes', JSON.stringify([{ id: '../bad', name: 'x', updatedAt: 1 }]))
    expect(loadLocalThemeCollection(storage).error).toBeTruthy()
    storage.setItem('ftb-themes', JSON.stringify([{ id, name: 'ok', updatedAt: 1 }]))
    storage.setItem('ftb-theme-active', id)
    storage.setItem(themeStateKey(id), JSON.stringify({ schemaVersion: 4 }))
    storage.setItem(themeHistoryKey(id), JSON.stringify({ snapshots: [{ schemaVersion: 4 }], cursor: 0 }))
    expect(loadLocalThemeCollection(storage).error).toBeTruthy()
    storage.setItem(themeStateKey(id), JSON.stringify(state))
    storage.setItem(themeHistoryKey(id), JSON.stringify({ snapshots: [], cursor: 0 }))
    expect(loadLocalThemeCollection(storage).error).toBeTruthy()
  })
  it('migrates supported older state with the provided sequential migration', () => {
    const storage = window.localStorage
    storage.clear()
    const old = { schemaVersion: 1 as const, colors: { primary: '#123456' } }
    storage.setItem('ftb-theme', JSON.stringify(old))
    const result = initializeLocalThemeStorage(storage, state, (legacy) => migrateToCurrent(legacy))
    expect(result.error).toBeNull()
    expect(result.state.schemaVersion).toBe(4)
    expect(result.state.colors.primary).toBe('#123456')
  })
  it('returns a failure and preserves prior bytes when writes fail or read-back is ignored', () => {
    const base = window.localStorage
    base.clear()
    base.setItem(themeStateKey(id), 'prior')
    const storage = new Proxy(base, { get(target, key) {
      if (key === 'setItem') return (name: string, value: string) => { if (name === themeHistoryKey(id)) return; target.setItem(name, value) }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    } })
    expect(writeAndVerifyLocalTheme(storage, id, state, history).ok).toBe(false)
    expect(base.getItem(themeStateKey(id))).toBe('prior')
    const denied = new Proxy(base, { get(target, key) {
      if (key === 'setItem') return () => { throw new Error('set denied') }
      if (key === 'removeItem') return () => { throw new Error('remove denied') }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    } })
    expect(writeAndVerifyLocalTheme(denied, id, state, history)).toMatchObject({ ok: false, error: 'set denied' })
    expect(initializeLocalThemeStorage(denied, state, () => state).error).toContain('Partial local theme storage')
  })
  it('retains valid migration bytes when legacy removal throws', () => {
    const base = window.localStorage
    base.clear()
    base.setItem('ftb-theme', JSON.stringify(state))
    const storage = new Proxy(base, { get(target, key) {
      if (key === 'removeItem') return () => { throw new Error('remove denied') }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    } })
    expect(initializeLocalThemeStorage(storage, state, () => state).error).toContain('remove denied')
    expect(base.getItem('ftb-theme')).not.toBeNull()
  })

  it('recovers valid individual records and durably publishes a fallback', () => {
    const storage = window.localStorage
    storage.clear()
    const validId = 'theme_valid'
    storage.setItem('ftb-themes', JSON.stringify([
      { id: validId, name: 'Valid', updatedAt: 2 },
      { id: 'theme_broken', name: 'Broken', updatedAt: 1 },
    ]))
    storage.setItem('ftb-theme-active', 'theme_broken')
    storage.setItem(themeStateKey(validId), JSON.stringify(state))
    storage.setItem(themeHistoryKey(validId), JSON.stringify(history))
    storage.setItem(themeStateKey('theme_broken'), '{bad')
    storage.setItem(themeHistoryKey('theme_broken'), '{bad')

    const loaded = loadLocalThemeCollection(storage)

    expect(loaded.error).toBeTruthy()
    expect(loaded.collection).toEqual({
      themes: [{ id: validId, name: 'Valid', updatedAt: 2 }],
      activeId: validId,
    })
    expect(storage.getItem('ftb-theme-active')).toBe(validId)
    expect(JSON.parse(storage.getItem('ftb-themes')!)).toEqual(loaded.collection.themes)
    expect(loadLocalThemeCollection(storage).collection.activeId).toBe(validId)
  })

  it('recovers valid records when the index itself is malformed', () => {
    const storage = window.localStorage
    storage.clear()
    storage.setItem('ftb-themes', '{bad')
    storage.setItem('ftb-theme:theme_valid', JSON.stringify(state))
    storage.setItem('ftb-theme-history:theme_valid', JSON.stringify(history))

    const loaded = loadLocalThemeCollection(storage)

    expect(loaded.collection.themes).toHaveLength(1)
    expect(loaded.collection.activeId).toBe(loaded.collection.themes[0]?.id)
    expect(loaded.error).toBeTruthy()
  })
})
