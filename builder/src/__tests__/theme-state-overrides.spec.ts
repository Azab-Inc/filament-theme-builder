import { describe, expect, it, vi } from 'vitest'

import {
  createThemeState,
  invalidExternalOverride,
  primaryButtonVariantOverride,
  primaryButtonVariantRequest,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state overrides', () => {
  resetThemeStateTest()

  it('uses the canonical primary color for component, variant, and state resolution without overrides', () => {
    const store = createThemeState()
    store.setPrimaryColor('#0f766e')

    for (const request of [
      { targetId: 'button.primary', controlId: 'background', componentId: 'button' },
      { targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'primary' },
      { targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'primary', stateId: 'hover' },
    ]) {
      expect(store.resolve(request)).toEqual({ status: 'resolved', value: '#0f766e', source: 'global' })
    }
  })

  it('rejects duplicate persisted override identities instead of applying either value', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({
      schemaVersion: 2,
      colors: { primary: '#6366f1' },
      overrides: [primaryButtonVariantOverride, { ...primaryButtonVariantOverride, value: '#dc2626' }],
    }))

    expect(createThemeState().theme.schemaVersion).toBe(4)
    expect(createThemeState().theme.colors.primary).toBe('#6366f1')
    expect(createThemeState().theme.overrides).toEqual([])
  })

  it('stores Inherit as absence and reset removes only the selected override', () => {
    const store = createThemeState()
    store.setOverride(primaryButtonVariantOverride)
    store.resetOverride(primaryButtonVariantRequest)
    expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
    expect(store.resolve(primaryButtonVariantRequest)).toMatchObject({ source: 'global' })
  })

  it('records one sparse edit/reset as one undoable state change and restores exact absence', () => {
    const store = createThemeState()
    store.setOverride(primaryButtonVariantOverride)
    store.resetOverride(primaryButtonVariantRequest)
    store.undo()
    expect(store.theme.overrides).toContainEqual(primaryButtonVariantOverride)
    store.redo()
    expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
  })

  it('persists sparse overrides but never persists resolved inherited copies', () => {
    vi.useFakeTimers()
    const store = createThemeState()
    store.setOverride({
      targetId: 'button.primary',
      controlId: 'background',
      scope: 'variant',
      componentId: 'button',
      variantId: 'primary',
      value: '#4f46e5',
    })
    vi.advanceTimersByTime(300)
    const persisted = JSON.parse(localStorage.getItem('ftb-theme')!)
    expect(persisted.overrides).toEqual(store.theme.overrides)
    expect(persisted.foundations.palettes.primary.shades).toBeUndefined()
    expect(persisted.overrides).not.toContainEqual(expect.objectContaining({ scope: 'state', value: '#4f46e5' }))
  })

  it('ignores invalid persisted overrides and leaves editing usable', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [invalidExternalOverride] }))
    const store = createThemeState()
    expect(store.theme.overrides).toEqual([])
    expect(() => store.setPrimaryColor('#0f766e')).not.toThrow()
  })
})
