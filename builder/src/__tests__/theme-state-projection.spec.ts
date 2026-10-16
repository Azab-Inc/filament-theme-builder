import { describe, expect, it, vi } from 'vitest'

import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { generatePalette } from '@/utils/palette-generator'
import {
  createThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state projection and density', () => {
  resetThemeStateTest()

  it('resolves the selected light or dark value without copying it into canonical state', () => {
    const store = createThemeState()
    store.setFoundation('surfaces.page.light', '#fff7ed')
    store.setFoundation('surfaces.page.dark', '#431407')

    expect(store.resolveFoundation('light').surfaces.page).toBe('#fff7ed')
    expect(store.resolveFoundation('dark').surfaces.page).toBe('#431407')
    expect(store.theme.foundations.surfaces.page).toEqual({ light: '#fff7ed', dark: '#431407' })
  })

  it.each(['compact', 'default', 'spacious'] as const)('sets the %s density value', (density) => {
    const store = createThemeState()
    store.setDensity(density)
    expect(store.theme.foundations.density).toBe(density)
  })

  it('derives a validated preview without storing projection data', () => {
    const store = createThemeState()
    const projection = store.previewFoundation('dark')

    expect(projection.schemaVersion).toBe(1)
    expect(projection.mode).toBe('dark')
    expect(store.theme).not.toHaveProperty('projection')
    expect(PALETTE_SHADES).toHaveLength(11)
  })

  it('persists the canonical version-3 state after one debounce', () => {
    vi.useFakeTimers()
    const store = createThemeState()
    store.setDensity('compact')
    store.setFoundation('surfaces.card.dark', '#111827')

    expect(localStorage.getItem('ftb-theme')).toBeNull()
    vi.advanceTimersByTime(299)
    expect(localStorage.getItem('ftb-theme')).toBeNull()
    vi.advanceTimersByTime(1)
    const persisted = JSON.parse(localStorage.getItem('ftb-theme')!)
    for (const name of PALETTE_NAMES) {
      expect(persisted.foundations.palettes[name].shades).toBeUndefined()
      expect(persisted.foundations.palettes[name].base).toBe(store.theme.foundations.palettes[name].base)
    }
  })

  it('normalizes forged persisted shades from canonical palette inputs', () => {
    const forged = createDefaultThemeState()
    forged.foundations.palettes.primary.base = '#0f766e'
    forged.foundations.palettes.primary.shades[500] = '#ffffff'
    localStorage.setItem('ftb-theme', JSON.stringify(forged))

    const store = createThemeState()

    expect(store.theme.foundations.palettes.primary.shades).toEqual(generatePalette('#0f766e'))
  })
})
