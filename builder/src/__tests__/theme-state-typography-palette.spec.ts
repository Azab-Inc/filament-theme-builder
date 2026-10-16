import { describe, expect, it, vi } from 'vitest'

import {
  createThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state typography and palette', () => {
  resetThemeStateTest()

  it('resets a custom typography foundation value to its system choice', () => {
    const store = createThemeState()

    store.setFoundation('typography.body', { kind: 'custom', name: 'Editorial Sans', family: 'Editorial Sans' })
    store.resetFoundation('typography.body')

    expect(store.theme.foundations.typography.body.name).toBe('System')
  })

  it('resets typography after other foundation mutations', () => {
    const store = createThemeState()

    store.setFoundation('typography.body', { kind: 'custom', name: 'Editorial Sans', family: 'Editorial Sans' })
    store.setDensity('spacious')
    store.setFoundation('radius', 'lg')
    store.setFoundation('borderWidth', '2')
    store.setFoundation('shadow', 'lg')
    store.setFoundation('typography.body', { kind: 'custom', name: 'Editorial Sans', family: 'Editorial Sans' })
    store.resetFoundation('typography.body')

    expect(store.theme.foundations.typography.body.name).toBe('System')
  })

  it('retains a palette shade override when the base changes and resets only that shade', () => {
    const store = createThemeState()
    const generated = store.theme.foundations.palettes.primary.shades[50]

    store.setPaletteShadeOverride('primary', 50, '#ffffff')
    store.setPaletteBase('primary', '#0f766e')

    expect(store.theme.foundations.palettes.primary.overrides[50]).toBe('#ffffff')
    expect(store.theme.foundations.palettes.primary.shades[100]).not.toBe(generated)

    store.resetPaletteShade('primary', 50)
    expect(store.theme.foundations.palettes.primary.overrides).not.toHaveProperty('50')
    expect(store.theme.foundations.palettes.primary.shades[50]).not.toBe('#ffffff')
  })

  it('rejects direct writes to generated palette shades', () => {
    const store = createThemeState()
    const original = store.theme.foundations.palettes.primary.shades[500]

    store.setFoundation('palettes.primary.shades.500', '#ffffff')

    expect(store.theme.foundations.palettes.primary.shades[500]).toBe(original)
  })

  it('prevents callers from mutating exposed canonical state directly', () => {
    const store = createThemeState()
    const original = store.theme.foundations.palettes.primary.shades[500]

    const changed = Reflect.set(store.theme.foundations.palettes.primary.shades, 500, '#ffffff')

    expect(changed).toBe(true)
    expect(store.theme.foundations.palettes.primary.shades[500]).toBe(original)
    expect(store.canUndo).toBe(false)
  })

  it('keeps palette derivation consistent when a base is changed through setFoundation', () => {
    const store = createThemeState()

    store.setFoundation('palettes.primary.base', '#0f766e')

    expect(store.theme.colors.primary).toBe('#0f766e')
    expect(store.theme.foundations.palettes.primary.shades[500]).toBe('#0f766e')
  })
})
