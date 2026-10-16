import { describe, expect, it, vi } from 'vitest'

import { PALETTE_NAMES } from '@/models/foundations.model'
import {
  createThemeState,
  readActiveThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state foundations', () => {
  resetThemeStateTest()

  it('sets and resets one foundation control as one sparse history mutation', () => {
    const store = createThemeState()
    const original = store.theme.foundations.surfaces.page.light

    store.setFoundation('surfaces.page.light', '#fef3c7')
    expect(store.theme.foundations.surfaces.page.light).toBe('#fef3c7')

    store.undo()
    expect(store.theme.foundations.surfaces.page.light).toBe(original)
    store.redo()
    expect(store.theme.foundations.surfaces.page.light).toBe('#fef3c7')

    store.resetFoundation('surfaces.page.light')
    expect(store.theme.foundations.surfaces.page.light).toBe(original)
    store.undo()
    expect(store.theme.foundations.surfaces.page.light).toBe('#fef3c7')
  })

  it('sets and resets decimal spacing keys as atomic foundation paths', () => {
    const store = createThemeState()

    store.setFoundation('spacing.0.5', 19)
    expect(store.theme.foundations.spacing['0.5']).toBe(19)
    expect(store.previewFoundation('light').mappings.find(({ id }) => id === 'spacing.0.5')?.value).toBe(19)

    store.resetFoundation('spacing.0.5')
    expect(store.theme.foundations.spacing['0.5']).toBe(2)
  })

  it('resets a palette shade through the generic foundation reset path', () => {
    const store = createThemeState()

    store.setFoundation('palettes.gray.overrides.50', '#123456')
    expect(store.theme.foundations.explicitPaths).toContain('palettes.gray.overrides.50')

    store.resetFoundation('palettes.gray.overrides.50')

    expect(store.theme.foundations.palettes.gray.overrides).not.toHaveProperty('50')
    expect(store.theme.foundations.explicitPaths).not.toContain('palettes.gray.overrides.50')
  })

  it('rejects resets for foundation metadata while retaining palette override resets', () => {
    const store = createThemeState()
    const before = JSON.parse(JSON.stringify(store.theme.foundations))

    store.resetFoundation('provenanceVersion')
    store.resetFoundation('explicitPaths')
    store.resetFoundation('palettes.primary.shades.50')

    expect(store.theme.foundations).toEqual(before)
  })

  it('persists explicit foundation provenance, including equal-to-default edits', () => {
    vi.useFakeTimers()
    const store = createThemeState()

    store.setFoundation('surfaces.page.light', '#ffffff')

    expect(store.theme.foundations.explicitPaths).toContain('surfaces.page.light')
    vi.advanceTimersByTime(300)
    expect((readActiveThemeState() as { foundations: { explicitPaths: string[] } }).foundations.explicitPaths).toContain('surfaces.page.light')
    store.resetFoundation('surfaces.page.light')
    expect(store.theme.foundations.explicitPaths).not.toContain('surfaces.page.light')
  })
})
