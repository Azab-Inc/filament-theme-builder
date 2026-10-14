import { describe, expect, it } from 'vitest'

import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState, createDefaultThemeState, densityPreset } from '@/services/foundation-defaults'
import { generatePalette } from '@/services/palette-generator'

describe('foundation defaults', () => {
  it('exposes the six supported palettes and eleven shade keys', () => {
    expect(PALETTE_NAMES).toEqual(['primary', 'success', 'warning', 'danger', 'info', 'gray'])
    expect(PALETTE_SHADES).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
    expect(Object.keys(createDefaultFoundationState().palettes)).toEqual(PALETTE_NAMES)
    expect(Object.keys(createDefaultFoundationState().surfaces)).toEqual(['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'])
    expect(Object.keys(createDefaultFoundationState().borders)).toEqual(['default', 'strong'])
    expect(Object.keys(createDefaultFoundationState().text)).toEqual(['primary', 'muted', 'disabled'])
  })

  it('provides independent mode values and stock foundation defaults', () => {
    const state = createDefaultFoundationState()

    expect(state.density).toBe('default')
    expect(state.radius).toBe('md')
    expect(state.borderWidth).toBe(1)
    expect(state.shadow).toBe('sm')
    expect(state.palettes.primary.base).toBe('#6366f1')
    expect(state.palettes.success.base).toBe('#22c55e')
    expect(state.palettes.warning.base).toBe('#f59e0b')
    expect(state.palettes.danger.base).toBe('#ef4444')
    expect(state.palettes.info.base).toBe('#3b82f6')
    expect(state.palettes.gray.base).toBe('#6b7280')
    for (const palette of Object.values(state.palettes)) {
      expect(Object.keys(palette.shades).map(Number)).toEqual(PALETTE_SHADES)
      expect(palette.shades).toEqual(generatePalette(palette.base))
    }
    expect(state.typography.body).toEqual({ kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' })
    expect(state.typography.heading).toEqual(state.typography.body)
    expect(state.typography.mono).toEqual({ kind: 'system', name: 'System Mono', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' })
    expect(state.typography.body).not.toBe(state.typography.heading)
    expect(state.typography.body).not.toBe(state.typography.mono)
    expect(state.typography.heading).not.toBe(state.typography.mono)
    expect(state.surfaces.page).toEqual({ light: 'var(--gray-50)', dark: 'var(--gray-900)' })
    expect(state.surfaces.sidebar).toEqual({ light: '#ffffff', dark: 'var(--gray-800)' })
    expect(state.surfaces.topbar).toEqual({ light: '#ffffff', dark: 'var(--gray-800)' })
    expect(state.surfaces.card).toEqual({ light: '#ffffff', dark: 'var(--gray-800)' })
    expect(state.surfaces.elevated).toEqual({ light: '#ffffff', dark: 'var(--gray-700)' })
    expect(state.surfaces.input).toEqual({ light: '#ffffff', dark: 'var(--gray-800)' })
    expect(state.borders.default).toEqual({ light: 'var(--gray-200)', dark: 'var(--gray-700)' })
    expect(state.text.primary).toEqual({ light: 'var(--gray-950)', dark: 'var(--gray-50)' })
    expect(state.text.muted).toEqual({ light: 'var(--gray-500)', dark: 'var(--gray-400)' })
    expect(state.spacing).toEqual({ '0': 0, px: 1, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '3': 12, '4': 16, '6': 24, '8': 32 })

    const anotherState = createDefaultFoundationState()
    state.surfaces.page.light = '#123456'
    expect(state.surfaces.page.dark).toBe('var(--gray-900)')
    expect(anotherState.surfaces.page.light).toBe('var(--gray-50)')
    expect(anotherState.surfaces.page.dark).toBe('var(--gray-900)')
  })

  it('keeps disabled text and strong borders in the live foundation model', () => {
    const state = createDefaultFoundationState()

    expect(state.text.disabled).toEqual({ light: 'var(--gray-400)', dark: 'var(--gray-500)' })
    expect(state.borders.strong).toEqual({ light: 'var(--gray-300)', dark: 'var(--gray-600)' })
  })

  it('resolves distinct named density spacing presets', () => {
    const compact = densityPreset('compact')
    expect(compact).toEqual({ controlHeight: 32, spacing: { '1': 4, '2': 6, '3': 8, '4': 12 } })
    expect(densityPreset('default')).toEqual({ controlHeight: 40, spacing: { '1': 4, '2': 8, '3': 12, '4': 16 } })
    expect(densityPreset('spacious')).toEqual({ controlHeight: 48, spacing: { '1': 6, '2': 12, '3': 16, '4': 24 } })
    compact.spacing['1'] = 100
    expect(densityPreset('compact').spacing['1']).toBe(4)
  })

  it('returns fresh defaults and keeps the canonical V2-compatible fields', () => {
    const first = createDefaultThemeState()
    const second = createDefaultThemeState()
    first.foundations.palettes.primary.base = '#123456'
    first.foundations.surfaces.page.dark = '#abcdef'
    first.foundations.typography.body.name = 'Changed'

    expect(second.schemaVersion).toBe(4)
    expect(second.colors).toEqual({ primary: '#6366f1' })
    expect(second.overrides).toEqual([])
    expect(second.customCss).toBe('')
    expect(second.foundations.palettes.primary.base).toBe('#6366f1')
    expect(second.foundations.surfaces.page.dark).toBe('var(--gray-900)')
    expect(second.foundations.typography.body.name).toBe('System')
    expect(createDefaultFoundationState().palettes.primary.base).toBe('#6366f1')
  })

  it('keeps font choices independently mutable within a default foundation state', () => {
    const state = createDefaultFoundationState()

    state.typography.body.name = 'Body override'

    expect(state.typography.heading.name).toBe('System')
    expect(state.typography.mono.name).toBe('System Mono')
  })
})
