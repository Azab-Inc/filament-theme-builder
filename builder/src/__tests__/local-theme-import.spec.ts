import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useThemeStore } from '@/stores/theme'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { importFreshLocalTheme } from '@/utils/local-theme-import'
import { themeStateKey } from '@/utils/local-theme-storage'

const input = (operationId = 'a'.repeat(64), payloadDigest = 'b'.repeat(64)) => ({
  operationId, payloadDigest, name: 'Imported', state: createDefaultThemeState(),
})
const setup = () => { localStorage.clear(); setActivePinia(createPinia()); return useThemeStore() }
beforeEach(() => { localStorage.clear(); localStorage.setItem('ftb-themes', '[]') })
afterEach(() => vi.restoreAllMocks())

describe('fresh local theme import', () => {
  it('uses a deterministic record and retains one result on retry', () => {
    const first = importFreshLocalTheme(localStorage, input(), () => 10)
    expect(first.ok).toBe(true)
    expect(importFreshLocalTheme(localStorage, input(), () => 20)).toEqual(first)
    expect(JSON.parse(localStorage.getItem('ftb-themes')!)).toHaveLength(1)
  })

  it('rejects a retry with a changed digest', () => {
    const first = importFreshLocalTheme(localStorage, input(), () => 10)
    expect(first.ok).toBe(true)
    expect(importFreshLocalTheme(localStorage, input('a'.repeat(64), 'c'.repeat(64)), () => 20)).toMatchObject({ ok: false })
  })

  it('rejects a deterministic record collision without a marker', () => {
    localStorage.clear()
    localStorage.setItem(`ftb-theme:import-${input().operationId}`, '{}')
    expect(importFreshLocalTheme(localStorage, input(), () => 10)).toMatchObject({ ok: false, error: 'Import record ID collision' })
  })

  it('flushes pending active work before preparing a marker', () => {
    const store = setup(); const original = Storage.prototype.setItem
    store.setPrimaryColor('#0f766e')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.startsWith('ftb-theme:')) throw new Error('quota')
      return original.call(this, key, value)
    })
    expect(store.importFreshTheme(input()).ok).toBe(false)
    expect(localStorage.getItem(`ftb-theme-import:${input().operationId}`)).toBeNull()
  })

  it('validates import identity and state before flushing pending active work', () => {
    const store = setup()
    const activeId = store.activeThemeId
    const persisted = localStorage.getItem(themeStateKey(activeId))
    store.setPrimaryColor('#0f766e')
    const invalid = { ...input(), operationId: 'invalid', state: createDefaultThemeState() }
    expect(store.importFreshTheme(invalid as never)).toMatchObject({ ok: false })
    expect(localStorage.getItem(themeStateKey(activeId))).toBe(persisted)
    expect(localStorage.getItem(`ftb-theme-import:${input().operationId}`)).toBeNull()
  })

  it('recovers a prepared operation after a state-write crash', () => {
    const store = setup(); const original = Storage.prototype.setItem; let crashed = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      original.call(this, key, value)
      if (!crashed && key === themeStateKey(`import-${input().operationId}`)) { crashed = true; throw new Error('crash') }
    })
    expect(store.importFreshTheme(input()).ok).toBe(false)
    vi.restoreAllMocks(); setActivePinia(createPinia()); const restored = useThemeStore()
    expect(restored.importFreshTheme(input())).toMatchObject({ ok: true, record: { id: `import-${input().operationId}` } })
    expect(restored.themes.filter((theme) => theme.id === `import-${input().operationId}`)).toHaveLength(1)
  })

  it('keeps the old pointer and indexed records when publication fails', () => {
    const store = setup(); const oldId = store.activeThemeId; const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-themes') throw new Error('index denied')
      return original.call(this, key, value)
    })
    expect(store.importFreshTheme(input()).ok).toBe(false)
    expect(localStorage.getItem('ftb-theme-active')).toBe(oldId)
    expect(JSON.parse(localStorage.getItem('ftb-themes')!)).toHaveLength(1)
    expect(localStorage.getItem(themeStateKey(oldId))).not.toBeNull()
  })

  it.each(['ftb-theme-import:', 'ftb-theme:', 'ftb-theme-history:', 'ftb-themes', 'ftb-theme-active'])('recovers after a crash at %s', (prefix) => {
    const store = setup(); const operation = input('d'.repeat(64)); const original = Storage.prototype.setItem; let crashed = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      original.call(this, key, value)
      if (!crashed && (key === prefix || key.startsWith(prefix))) { crashed = true; throw new Error('crash') }
    })
    expect(store.importFreshTheme(operation).ok).toBe(false); vi.restoreAllMocks()
    expect(store.importFreshTheme(operation)).toMatchObject({ ok: true, record: { id: `import-${operation.operationId}` } })
  })
})
