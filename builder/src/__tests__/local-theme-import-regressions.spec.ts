import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { importFreshLocalTheme } from '@/utils/local-theme-import'

const base = () => ({ operationId: 'a'.repeat(64), payloadDigest: 'b'.repeat(64), name: 'Imported', state: createDefaultThemeState() })
beforeEach(() => { localStorage.clear(); localStorage.setItem('ftb-themes', '[]') })
afterEach(() => vi.restoreAllMocks())

function seedOldTheme(): void {
  const state = createDefaultThemeState()
  localStorage.setItem('ftb-theme:old-theme', JSON.stringify(state))
  localStorage.setItem('ftb-theme-history:old-theme', JSON.stringify({ snapshots: [state], cursor: 0 }))
  localStorage.setItem('ftb-themes', JSON.stringify([{ id: 'old-theme', name: 'Existing', updatedAt: 5 }]))
  localStorage.setItem('ftb-theme-active', 'old-theme')
}

describe('local theme import integrity', () => {
  it.each([
    ['state', { ...base(), state: { ...createDefaultThemeState(), customCss: '.changed {}' } }],
    ['name', { ...base(), name: 'Renamed' }],
  ])('rejects a retry with a changed %s when the raw digest is unchanged', (_field, changed) => {
    expect(importFreshLocalTheme(localStorage, base(), () => 10).ok).toBe(true)
    expect(importFreshLocalTheme(localStorage, changed, () => 20)).toMatchObject({ ok: false })
  })

  it('does not repair or accept state that diverged after completion', () => {
    expect(importFreshLocalTheme(localStorage, base(), () => 10).ok).toBe(true)
    const key = `ftb-theme:import-${base().operationId}`
    localStorage.setItem(key, JSON.stringify({ ...base().state, customCss: '.tampered {}' }))
    expect(importFreshLocalTheme(localStorage, base(), () => 20)).toMatchObject({ ok: false })
    expect(JSON.parse(localStorage.getItem(key)!)).toHaveProperty('customCss', '.tampered {}')
  })

  it('preserves malformed marker and index bytes instead of replacing them', () => {
    const markerKey = `ftb-theme-import:${base().operationId}`
    localStorage.setItem(markerKey, '{broken')
    expect(importFreshLocalTheme(localStorage, base(), () => 10)).toMatchObject({ ok: false })
    expect(localStorage.getItem(markerKey)).toBe('{broken')
    localStorage.setItem(markerKey, JSON.stringify({ operationId: 'wrong', status: 'prepared' }))
    const malformedMarker = localStorage.getItem(markerKey)
    expect(importFreshLocalTheme(localStorage, base(), () => 10)).toMatchObject({ ok: false })
    expect(localStorage.getItem(markerKey)).toBe(malformedMarker)
    localStorage.removeItem(markerKey)
    localStorage.setItem('ftb-themes', '{broken')
    expect(importFreshLocalTheme(localStorage, base(), () => 10)).toMatchObject({ ok: false })
    expect(localStorage.getItem('ftb-themes')).toBe('{broken')
  })

  it('rejects invalid canonical state before any import write', () => {
    const invalid = { ...base(), state: { ...createDefaultThemeState(), schemaVersion: 999 } }
    expect(importFreshLocalTheme(localStorage, invalid as never, () => 10)).toMatchObject({ ok: false })
    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('ftb-themes')).toBe('[]')
  })

  it.each([
    ['ftb-theme-import:', 1], ['ftb-theme:', 1], ['ftb-theme-history:', 1],
    ['ftb-themes', 1], ['ftb-theme-active', 1], ['ftb-theme-import:', 2],
  ])('rolls back all import writes when %s write %i fails', (prefix, occurrence) => {
    seedOldTheme()
    const original = Storage.prototype.setItem
    let writes = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.startsWith(prefix) && ++writes === occurrence) {
        original.call(this, key, value)
        throw new Error('write failed after persisting')
      }
      return original.call(this, key, value)
    })
    expect(importFreshLocalTheme(localStorage, base(), () => 10)).toMatchObject({ ok: false })
    expect(JSON.parse(localStorage.getItem('ftb-themes')!)).toEqual([{ id: 'old-theme', name: 'Existing', updatedAt: 5 }])
    expect(localStorage.getItem('ftb-theme-active')).toBe('old-theme')
    expect(localStorage.getItem('ftb-theme:old-theme')).toBe(JSON.stringify(createDefaultThemeState()))
    expect(localStorage.getItem('ftb-theme-history:old-theme')).toBe(
      JSON.stringify({ snapshots: [createDefaultThemeState()], cursor: 0 }),
    )
    expect(localStorage.getItem(`ftb-theme:import-${base().operationId}`)).toBeNull()
    expect(localStorage.getItem(`ftb-theme-history:import-${base().operationId}`)).toBeNull()
    expect(localStorage.getItem(`ftb-theme-import:${base().operationId}`)).toBeNull()
  })

  it('rolls back publication when state read-back is corrupted', () => {
    seedOldTheme()
    const original = Storage.prototype.getItem
    let activeReads = 0
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
      if (key === 'ftb-theme-active' && ++activeReads === 2) return 'wrong-active'
      return original.call(this, key)
    })
    expect(importFreshLocalTheme(localStorage, base(), () => 10)).toMatchObject({ ok: false })
    expect(localStorage.getItem('ftb-themes')).toBe(JSON.stringify([{ id: 'old-theme', name: 'Existing', updatedAt: 5 }]))
    expect(localStorage.getItem('ftb-theme-active')).toBe('old-theme')
    expect(localStorage.getItem(`ftb-theme:import-${base().operationId}`)).toBeNull()
    expect(localStorage.getItem(`ftb-theme-import:${base().operationId}`)).toBeNull()
  })
})
