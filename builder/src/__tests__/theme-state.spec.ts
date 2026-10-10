import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

const createThemeState = useThemeStore

describe('theme state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    setActivePinia(createPinia())
  })

  it('creates a versioned default state and changes the primary color', () => {
    const theme = createThemeState()

    expect(theme.theme).toEqual({ schemaVersion: 1, colors: { primary: '#6366f1' } })
    theme.setPrimaryColor('#0f766e')
    expect(theme.theme.colors.primary).toBe('#0f766e')
  })

  it('undoes and redoes color changes', () => {
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    theme.undo()
    expect(theme.theme.colors.primary).toBe('#6366f1')
    theme.redo()
    expect(theme.theme.colors.primary).toBe('#0f766e')
  })

  it('debounces persistence and restores saved state', () => {
    vi.useFakeTimers()
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    expect(localStorage.getItem('ftb-theme')).toBeNull()
    vi.advanceTimersByTime(300)
    expect(JSON.parse(localStorage.getItem('ftb-theme')!)).toEqual(theme.theme)

    setActivePinia(createPinia())
    expect(createThemeState().theme.colors.primary).toBe('#0f766e')
  })

  it('uses the default theme when persisted JSON is malformed or invalid', () => {
    localStorage.setItem('ftb-theme', '{invalid')
    expect(createThemeState().theme.colors.primary).toBe('#6366f1')

    setActivePinia(createPinia())
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 1, colors: { primary: 'red' } }))
    expect(createThemeState().theme.colors.primary).toBe('#6366f1')
  })

  it('clears the redo branch when a new edit follows undo', () => {
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    theme.undo()
    theme.setPrimaryColor('#dc2626')

    expect(theme.canRedo).toBe(false)
    theme.redo()
    expect(theme.theme.colors.primary).toBe('#dc2626')
  })

  it('clears its pending persistence timer when the store is disposed', () => {
    vi.useFakeTimers()
    const store = useThemeStore()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    store.setPrimaryColor('#0f766e')
    store.$dispose()
    vi.advanceTimersByTime(1000)

    expect(setItem).not.toHaveBeenCalled()
  })
})
