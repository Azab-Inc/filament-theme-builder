import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { importFreshLocalTheme } from '@/utils/local-theme-import'

const id = 'a'.repeat(64)
const operation = () => ({ operationId: id, payloadDigest: 'b'.repeat(64), name: 'Imported', state: createDefaultThemeState() })
const importStateKey = `ftb-theme:import-${id}`
const importHistoryKey = `ftb-theme-history:import-${id}`
const markerKey = `ftb-theme-import:${id}`
const oldState = createDefaultThemeState()
const oldIndex = JSON.stringify([{ id: 'old-theme', name: 'Existing', updatedAt: 5 }])
const oldHistory = JSON.stringify({ snapshots: [oldState], cursor: 0 })

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('ftb-theme:old-theme', JSON.stringify(oldState))
  localStorage.setItem('ftb-theme-history:old-theme', oldHistory)
  localStorage.setItem('ftb-themes', oldIndex)
  localStorage.setItem('ftb-theme-active', 'old-theme')
})
afterEach(() => vi.restoreAllMocks())

function failIndexReadback(): void {
  const original = Storage.prototype.getItem
  let reads = 0
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
    if (key === 'ftb-themes' && ++reads === 4) return '{invalid read-back'
    return original.call(this, key)
  })
}

describe('local theme import rollback failures', () => {
  it.each([
    ['ftb-theme:import-', 'removeItem'],
    ['ftb-theme-history:import-', 'removeItem'],
    ['ftb-themes', 'setItem'],
  ])('reports failed restoration of %s and keeps the operation recoverable', (prefix, method) => {
    failIndexReadback()
    const original = Storage.prototype[method as 'removeItem' | 'setItem']
    let restores = 0
    vi.spyOn(Storage.prototype, method as 'removeItem' | 'setItem').mockImplementation(function (this: Storage, key: string, value?: string) {
      const target = key.startsWith(prefix)
      if (target && ++restores === (method === 'setItem' ? 2 : 1)) throw new Error('restore denied')
      return method === 'setItem'
        ? (original as typeof Storage.prototype.setItem).call(this, key, value!)
        : (original as typeof Storage.prototype.removeItem).call(this, key)
    } as never)
    const result = importFreshLocalTheme(localStorage, operation(), () => 10)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('rollback incomplete') })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining(prefix) })
    expect(localStorage.getItem('ftb-theme:old-theme')).toBe(JSON.stringify(oldState))
    expect(localStorage.getItem('ftb-theme-history:old-theme')).toBe(oldHistory)
    expect(localStorage.getItem('ftb-theme-active')).toBe('old-theme')
    expect(localStorage.getItem(markerKey)).toContain('prepared')
  })

  it('keeps an imported target indexed if active-pointer restoration fails', () => {
    const original = Storage.prototype.setItem
    let activeWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-theme-active' && ++activeWrites === 1) {
        original.call(this, key, value)
        throw new Error('active read-back failure')
      }
      if (key === 'ftb-theme-active' && activeWrites === 2) throw new Error('restore denied')
      return original.call(this, key, value)
    })
    const result = importFreshLocalTheme(localStorage, operation(), () => 10)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('ftb-theme-active') })
    expect(localStorage.getItem('ftb-theme-active')).toBe(`import-${id}`)
    expect(JSON.parse(localStorage.getItem('ftb-themes')!).map(({ id: recordId }: { id: string }) => recordId)).toContain(`import-${id}`)
    expect(localStorage.getItem(importStateKey)).not.toBeNull()
    expect(localStorage.getItem(importHistoryKey)).not.toBeNull()
    expect(JSON.parse(localStorage.getItem(markerKey)!).status).toBe('prepared')
    expect(JSON.parse(localStorage.getItem('ftb-theme:old-theme')!)).toEqual(oldState)
    expect(localStorage.getItem('ftb-theme-history:old-theme')).toBe(oldHistory)
  })

  it('reports marker cleanup failure after a fully restored publication failure', () => {
    const originalSet = Storage.prototype.setItem
    const originalRemove = Storage.prototype.removeItem
    let indexWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'ftb-themes' && ++indexWrites === 1) throw new Error('index denied')
      return originalSet.call(this, key, value)
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
      if (key === markerKey) throw new Error('cleanup denied')
      return originalRemove.call(this, key)
    })
    const result = importFreshLocalTheme(localStorage, operation(), () => 10)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('marker cleanup failed') })
    expect(localStorage.getItem(markerKey)).toContain('prepared')
    expect(localStorage.getItem('ftb-themes')).toBe(oldIndex)
    expect(localStorage.getItem('ftb-theme-active')).toBe('old-theme')
    expect(localStorage.getItem('ftb-theme-history:old-theme')).toBe(oldHistory)
  })
})
