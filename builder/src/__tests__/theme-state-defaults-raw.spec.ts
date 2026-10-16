import { describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import { PALETTE_NAMES } from '@/models/foundations.model'
import { generatePalette } from '@/utils/palette-generator'
import {
  createThemeState,
  readActiveThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state defaults and raw overrides', () => {
  resetThemeStateTest()

  it('creates a versioned default state and changes the primary color', () => {
    const theme = createThemeState()

    expect(theme.theme.schemaVersion).toBe(4)
    expect(theme.theme.colors.primary).toBe('#6366f1')
    expect(theme.theme.overrides).toEqual([])
    expect(theme.theme.rawOverrides).toEqual([])
    for (const name of PALETTE_NAMES) {
      expect(theme.theme.foundations.palettes[name].shades).toEqual(
        generatePalette(theme.theme.foundations.palettes[name].base),
      )
    }
    theme.setPrimaryColor('#0f766e')
    expect(theme.theme.colors.primary).toBe('#0f766e')
  })

  it('keeps raw overrides separate and supports property reset through history', () => {
    const store = createThemeState()

    store.setRawOverride('.fi-btn', 'color', '#0f766e')
    store.setRawOverride('.fi-btn', 'padding', '0.5rem 1rem')

    expect(store.theme.overrides).toEqual([])
    expect(store.theme.rawOverrides).toEqual([{
      selector: '.fi-btn',
      properties: { color: '#0f766e', padding: '0.5rem 1rem' },
    }])

    store.resetRawProperty('.fi-btn', 'color')
    expect(store.theme.rawOverrides[0]?.properties).toEqual({ padding: '0.5rem 1rem' })
    store.undo()
    expect(store.theme.rawOverrides[0]?.properties).toEqual({ color: '#0f766e', padding: '0.5rem 1rem' })
    store.redo()
    expect(store.theme.rawOverrides[0]?.properties).toEqual({ padding: '0.5rem 1rem' })
  })

  it('persists raw overrides in the canonical V4 document', () => {
    vi.useFakeTimers()
    const store = createThemeState()
    store.setRawOverride('.fi-input', 'border-radius', '0.75rem')

    vi.advanceTimersByTime(300)

    expect(readActiveThemeState()).toMatchObject({
      schemaVersion: 4,
      rawOverrides: [{ selector: '.fi-input', properties: { 'border-radius': '0.75rem' } }],
    })
  })

  it('restores raw overrides after a store reload', () => {
    vi.useFakeTimers()
    const store = createThemeState()
    store.setRawOverride('.fi-input', 'border-radius', '0.75rem')
    vi.advanceTimersByTime(300)

    setActivePinia(createPinia())
    expect(createThemeState().theme.rawOverrides).toEqual([{
      selector: '.fi-input',
      properties: { 'border-radius': '0.75rem' },
    }])
  })

  it('resets a complete raw override and removes its empty rule', () => {
    const store = createThemeState()
    store.setRawOverride('.fi-input', 'color', '#0f766e')
    store.setRawOverride('.fi-input', 'padding', '1rem')

    store.resetRawOverride('.fi-input')

    expect(store.theme.rawOverrides).toEqual([])
  })
})
