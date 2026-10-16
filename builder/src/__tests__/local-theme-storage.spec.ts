import { describe, expect, it } from 'vitest'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
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
})
