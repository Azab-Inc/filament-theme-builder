import { describe, expect, it, vi } from 'vitest'

import { createThemeState, readActiveThemeState, resetThemeStateTest } from './theme-state-test-helpers'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'

const densityCases = [
  { value: 'compact', spacing: { '1': 4, '2': 6, '3': 8, '4': 12 } },
  { value: 'default', spacing: { '1': 4, '2': 8, '3': 12, '4': 16 } },
  { value: 'spacious', spacing: { '1': 6, '2': 12, '3': 16, '4': 24 } },
] as const

describe('theme state density', () => {
  resetThemeStateTest()

  it('overwrites spacing.2, clears its provenance, and records one atomic history entry', () => {
    const store = createThemeState()
    store.setFoundation('spacing.2', 99)
    store.setDensity('compact')

    expect(store.theme.foundations.spacing['2']).toBe(6)
    expect(store.theme.foundations.explicitPaths).not.toContain('spacing.2')
    expect(store.theme.foundations.density).toBe('compact')
    store.undo()
    expect(store.theme.foundations.spacing['2']).toBe(99)
    expect(store.theme.foundations.density).toBe('default')
    store.redo()
    expect(store.theme.foundations.spacing['2']).toBe(6)
  })

  it.each(densityCases)('applies the $value preset across canonical projections', ({ value, spacing }) => {
    vi.useFakeTimers()
    const store = createThemeState()
    store.setFoundation('spacing.8', 77)
    store.setFoundation('radius', 'lg')

    store.setDensity(value)

    expect(store.theme.foundations.spacing).toMatchObject(spacing)
    expect(store.theme.foundations.spacing['8']).toBe(77)
    expect(store.previewFoundation('light').mappings.find(({ id }) => id === 'density')?.value).toBe(value)
    expect(serializeCanonicalTheme(store.theme).foundations.spacing['2']).toBe(spacing['2'])
    vi.advanceTimersByTime(300)
    expect((readActiveThemeState() as { foundations: { spacing: Record<string, number> } }).foundations.spacing['2']).toBe(spacing['2'])
    vi.useRealTimers()
  })

  it.each(densityCases.filter(({ value }) => value !== 'default'))('resets $value to default atomically', ({ value, spacing }) => {
    const store = createThemeState()
    store.setFoundation('spacing.8', 77)
    store.setFoundation('radius', 'lg')
    store.setDensity(value)

    store.resetFoundation('density')

    expect(store.theme.foundations.density).toBe('default')
    expect(store.theme.foundations.spacing).toMatchObject({ '1': 4, '2': 8, '3': 12, '4': 16 })
    expect(store.theme.foundations.spacing['8']).toBe(77)
    expect(store.theme.foundations.radius).toBe('lg')
    expect(store.theme.foundations.explicitPaths).not.toContain('density')
    store.undo()
    expect(store.theme.foundations.density).toBe(value)
    expect(store.theme.foundations.spacing).toMatchObject(spacing)
    store.redo()
    expect(store.theme.foundations.spacing).toMatchObject({ '1': 4, '2': 8, '3': 12, '4': 16 })
  })
})
