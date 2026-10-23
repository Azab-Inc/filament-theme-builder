import { describe, expect, it } from 'vitest'

import { PALETTE_NAMES } from '@/models/foundations.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { generatePalette } from '@/utils/palette-generator'
import {
  createThemeState,
  primaryButtonVariantOverride,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state migrations', () => {
  resetThemeStateTest()

  it('migrates version-1 colors.primary into the current state without losing the color', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 1, colors: { primary: '#0f766e' } }))
    const store = createThemeState()
    expect(store.theme.schemaVersion).toBe(5)
    expect(store.theme.padding).toEqual([])
    expect(store.theme.colors.primary).toBe('#0f766e')
    expect(store.theme.overrides).toEqual([])
    expect(store.theme.customCss).toBe('')
    expect(store.theme.foundations.palettes.primary.base).toBe('#0f766e')
    for (const name of PALETTE_NAMES) {
      expect(store.theme.foundations.palettes[name].shades).toEqual(
        generatePalette(store.theme.foundations.palettes[name].base),
      )
    }
  })

  it('migrates version-2 primary and overrides without losing either', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({
      schemaVersion: 2,
      colors: { primary: '#0f766e' },
      overrides: [primaryButtonVariantOverride],
    }))

    const store = createThemeState()

    expect(store.theme.schemaVersion).toBe(5)
    expect(store.theme.colors.primary).toBe('#0f766e')
    expect(store.theme.foundations.palettes.primary.base).toBe('#0f766e')
    expect(store.theme.overrides).toEqual([primaryButtonVariantOverride])
    for (const name of PALETTE_NAMES) {
      expect(store.theme.foundations.palettes[name].shades).toEqual(
        generatePalette(store.theme.foundations.palettes[name].base),
      )
    }
  })

  it('restores the native baseline when old V3 state has no provenance marker', () => {
    const state = createDefaultThemeState()
    state.foundations.borders.default.light = '#123456'
    delete (state.foundations as unknown as { explicitPaths?: string[] }).explicitPaths
    delete (state.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    localStorage.setItem('ftb-theme', JSON.stringify(state))

    const store = createThemeState()

    expect(store.theme.foundations.borders.default.light).toBe('var(--gray-200)')
    expect(store.theme.foundations.explicitPaths).toEqual([])
  })

  it('restores the native baseline from transitional V3 state with an empty path list', () => {
    const state = createDefaultThemeState()
    state.foundations.radius = 'lg'
    delete (state.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    localStorage.setItem('ftb-theme', JSON.stringify(state))

    const store = createThemeState()

    expect(store.theme.foundations.radius).toBe('md')
    expect(store.theme.foundations.explicitPaths).toEqual([])
  })

  it('falls back to an editable default when persisted V3 state is invalid', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({
      schemaVersion: 3,
      colors: { primary: '#6366f1' },
      foundations: { density: 'invalid' },
      overrides: [],
      customCss: '',
    }))

    const store = createThemeState()
    expect(store.theme.schemaVersion).toBe(5)
    expect(store.theme.foundations.density).toBe('default')
    expect(() => store.setDensity('spacious')).not.toThrow()
  })
})
