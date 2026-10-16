import { describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import {
  createThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state persistence and recovery', () => {
  resetThemeStateTest()

  it('debounces persistence and restores saved state', () => {
    vi.useFakeTimers()
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    expect(localStorage.getItem('ftb-theme')).toBeNull()
    vi.advanceTimersByTime(300)
    const persisted = JSON.parse(localStorage.getItem('ftb-theme')!)
    expect(persisted.colors).toEqual(theme.theme.colors)
    expect(persisted.foundations.palettes.primary.shades).toBeUndefined()

    setActivePinia(createPinia())
    expect(createThemeState().theme.colors.primary).toBe('#0f766e')
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
    expect(localStorage.getItem('ftb-theme')).not.toBe('{invalid')
    expect(localStorage.getItem('ftb-theme-legacy-recovery')).toBe('{invalid')

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
