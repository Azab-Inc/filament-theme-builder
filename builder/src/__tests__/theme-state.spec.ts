import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import type { ResolveRequest, ThemeOverride } from '@/models/theme.model'
import { useThemeStore } from '@/stores/theme'

const createThemeState = useThemeStore
const primaryButtonVariantRequest: ResolveRequest = { targetId: 'global.primary', controlId: 'primary' }
const primaryButtonVariantOverride: ThemeOverride = {
  targetId: 'global.primary',
  controlId: 'primary',
  scope: 'global',
  value: '#4f46e5',
}
const invalidExternalOverride = {
  targetId: 'button.primary',
  controlId: 'background',
  scope: 'state',
  componentId: 'button',
  variantId: 'primary',
  stateId: 'hover',
  value: 'not-a-color',
}

describe('theme state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    setActivePinia(createPinia())
  })

  it('creates a versioned default state and changes the primary color', () => {
    const theme = createThemeState()

    expect(theme.theme).toEqual({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [] })
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

  it('migrates version-1 colors.primary into the current state without losing the color', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 1, colors: { primary: '#0f766e' } }))
    const store = useThemeStore()
    expect(store.theme.schemaVersion).toBe(2)
    expect(store.theme.colors.primary).toBe('#0f766e')
  })

  it('stores Inherit as absence and reset removes only the selected override', () => {
    const store = useThemeStore()
    store.setOverride(primaryButtonVariantOverride)
    store.resetOverride(primaryButtonVariantRequest)
    expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
    expect(store.resolve(primaryButtonVariantRequest)).toMatchObject({ source: 'legacy-global' })
  })

  it('records one sparse edit/reset as one undoable state change and restores exact absence', () => {
    const store = useThemeStore()
    store.setOverride(primaryButtonVariantOverride)
    store.resetOverride(primaryButtonVariantRequest)
    store.undo()
    expect(store.theme.overrides).toContainEqual(primaryButtonVariantOverride)
    store.redo()
    expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
  })

  it('persists sparse overrides but never persists resolved inherited copies', () => {
    vi.useFakeTimers()
    const store = useThemeStore()
    store.setOverride({
      targetId: 'button.primary',
      controlId: 'background',
      scope: 'variant',
      componentId: 'button',
      variantId: 'primary',
      value: '#4f46e5',
    })
    vi.advanceTimersByTime(300)
    expect(JSON.parse(localStorage.getItem('ftb-theme')!)).toEqual(store.theme)
    expect(JSON.parse(localStorage.getItem('ftb-theme')!).overrides).not.toContainEqual(expect.objectContaining({ scope: 'state', value: '#4f46e5' }))
  })

  it('ignores invalid persisted overrides and leaves editing usable', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [invalidExternalOverride] }))
    const store = useThemeStore()
    expect(store.theme.overrides).toEqual([])
    expect(() => store.setPrimaryColor('#0f766e')).not.toThrow()
  })
})
