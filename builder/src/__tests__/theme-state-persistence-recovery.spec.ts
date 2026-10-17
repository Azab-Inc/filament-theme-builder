import { describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import {
  createThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'
import { themeStateKey } from '@/utils/local-theme-storage'
import { useThemePersistence } from '@/composables/use-theme-persistence'
import { createDefaultThemeState } from '@/utils/foundation-defaults'

describe('theme state persistence and recovery', () => {
  resetThemeStateTest()

  it('debounces persistence and restores saved state', () => {
    vi.useFakeTimers()
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    expect(localStorage.getItem('ftb-theme')).toBeNull()
    vi.advanceTimersByTime(300)
    const persistedId = localStorage.getItem('ftb-theme-active')!
    const persisted = JSON.parse(localStorage.getItem(themeStateKey(persistedId))!)
    expect(persisted.colors).toEqual(theme.theme.colors)
    expect(persisted.foundations.palettes.primary.shades).toEqual(theme.theme.foundations.palettes.primary.shades)

    setActivePinia(createPinia())
    expect(createThemeState().theme.colors.primary).toBe('#0f766e')
  })

  it('does not write normalized legacy bytes before local-theme migration', () => {
    localStorage.clear()
    const legacy = createDefaultThemeState() as Record<string, unknown>
    const foundations = { ...(legacy.foundations as Record<string, unknown>) }
    delete foundations.provenanceVersion
    legacy.foundations = foundations
    localStorage.setItem('ftb-theme', JSON.stringify(legacy))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    useThemePersistence('ftb-theme', 'ftb-theme-legacy-recovery').restore()

    expect(setItem.mock.calls.some(([key]) => key === 'ftb-theme')).toBe(false)
    expect(localStorage.getItem('ftb-theme')).toBe(JSON.stringify(legacy))
    setItem.mockRestore()
  })

  it('uses the default theme when persisted JSON is malformed or invalid', () => {
    vi.useFakeTimers()
    localStorage.setItem('ftb-theme', '{invalid')
    const store = createThemeState()
    expect(store.theme.colors.primary).toBe('#6366f1')
    expect(localStorage.getItem('ftb-theme-legacy-recovery')).toBe('{invalid')
    expect(store.legacyRecoveryAvailable).toBe(true)
    expect(store.getLegacyRecoveryJson()).toBe('{invalid')
    expect(store.restoreLegacyRecovery()).toBe(false)
    expect(store.legacyRecoveryError).toMatch(/valid JSON/i)
    store.setPrimaryColor('#0f766e')
    vi.advanceTimersByTime(300)
    const persistedId = localStorage.getItem('ftb-theme-active')!
    expect(localStorage.getItem(themeStateKey(persistedId))).not.toBeNull()
    expect(localStorage.getItem('ftb-theme-legacy-recovery')).toBe('{invalid')

    for (const key of Object.keys(localStorage)) if (key.startsWith('ftb-themes') || key.startsWith('ftb-theme-active') || key.startsWith('ftb-theme:')) localStorage.removeItem(key)
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 1, colors: { primary: 'red' } }))
    setActivePinia(createPinia())
    expect(createThemeState().theme.colors.primary).toBe('#6366f1')
  })

  it('does not replace an existing raw recovery archive with malformed persisted JSON', () => {
    localStorage.setItem('ftb-theme', '{invalid')
    localStorage.setItem('ftb-theme-legacy-recovery', 'original archive')

    const store = createThemeState()

    expect(store.getLegacyRecoveryJson()).toBe('original archive')
    expect(store.restoreLegacyRecovery()).toBe(false)
    expect(store.theme.colors.primary).toBe('#6366f1')
  })

  it('clears its pending persistence timer when the store is disposed', () => {
    vi.useFakeTimers()
    const store = createThemeState()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    store.setPrimaryColor('#0f766e')
    store.$dispose()
    vi.advanceTimersByTime(1000)

    expect(setItem).not.toHaveBeenCalled()
  })
})
