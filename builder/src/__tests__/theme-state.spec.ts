import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { ResolveRequest, ThemeOverride } from '@/models/theme.model'
import { createDefaultThemeState } from '@/services/foundation-defaults'
import { generatePalette } from '@/services/palette-generator'
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

    expect(theme.theme.schemaVersion).toBe(3)
    expect(theme.theme.colors.primary).toBe('#6366f1')
    expect(theme.theme.overrides).toEqual([])
    for (const name of PALETTE_NAMES) {
      expect(theme.theme.foundations.palettes[name].shades).toEqual(
        generatePalette(theme.theme.foundations.palettes[name].base),
      )
    }
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
    const persisted = JSON.parse(localStorage.getItem('ftb-theme')!)
    expect(persisted.colors).toEqual(theme.theme.colors)
    expect(persisted.foundations.palettes.primary.shades).toBeUndefined()

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
    expect(store.theme.schemaVersion).toBe(3)
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

    const store = useThemeStore()

    expect(store.theme.schemaVersion).toBe(3)
    expect(store.theme.colors.primary).toBe('#0f766e')
    expect(store.theme.foundations.palettes.primary.base).toBe('#0f766e')
    expect(store.theme.overrides).toEqual([primaryButtonVariantOverride])
    for (const name of PALETTE_NAMES) {
      expect(store.theme.foundations.palettes[name].shades).toEqual(
        generatePalette(store.theme.foundations.palettes[name].base),
      )
    }
  })

  it('sets and resets one foundation control as one sparse history mutation', () => {
    const store = useThemeStore()
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

  it('retains a palette shade override when the base changes and resets only that shade', () => {
    const store = useThemeStore()
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
    const store = useThemeStore()
    const original = store.theme.foundations.palettes.primary.shades[500]

    store.setFoundation('palettes.primary.shades.500', '#ffffff')

    expect(store.theme.foundations.palettes.primary.shades[500]).toBe(original)
  })

  it('keeps palette derivation consistent when a base is changed through setFoundation', () => {
    const store = useThemeStore()

    store.setFoundation('palettes.primary.base', '#0f766e')

    expect(store.theme.colors.primary).toBe('#0f766e')
    expect(store.theme.foundations.palettes.primary.shades[500]).toBe('#0f766e')
  })

  it('resolves the selected light or dark value without copying it into canonical state', () => {
    const store = useThemeStore()
    store.setFoundation('surfaces.page.light', '#fff7ed')
    store.setFoundation('surfaces.page.dark', '#431407')

    expect(store.resolveFoundation('light').surfaces.page).toBe('#fff7ed')
    expect(store.resolveFoundation('dark').surfaces.page).toBe('#431407')
    expect(store.theme.foundations.surfaces.page).toEqual({ light: '#fff7ed', dark: '#431407' })
  })

  it.each(['compact', 'default', 'spacious'] as const)('sets the %s density value', (density) => {
    const store = useThemeStore()
    store.setDensity(density)
    expect(store.theme.foundations.density).toBe(density)
  })

  it('derives a validated preview without storing projection data', () => {
    const store = useThemeStore()
    const projection = store.previewFoundation('dark')

    expect(projection.schemaVersion).toBe(1)
    expect(projection.mode).toBe('dark')
    expect(store.theme).not.toHaveProperty('projection')
    expect(PALETTE_SHADES).toHaveLength(11)
  })

  it('persists the canonical version-3 state after one debounce', () => {
    vi.useFakeTimers()
    const store = useThemeStore()
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

    const store = useThemeStore()

    expect(store.theme.foundations.palettes.primary.shades).toEqual(generatePalette('#0f766e'))
  })

  it('falls back to an editable default when persisted V3 state is invalid', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({
      schemaVersion: 3,
      colors: { primary: '#6366f1' },
      foundations: { density: 'invalid' },
      overrides: [],
      customCss: '',
    }))

    const store = useThemeStore()
    expect(store.theme.schemaVersion).toBe(3)
    expect(store.theme.foundations.density).toBe('default')
    expect(() => store.setDensity('spacious')).not.toThrow()
  })

  it('uses the canonical primary color for component, variant, and state resolution without overrides', () => {
    const store = useThemeStore()
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

    expect(useThemeStore().theme.schemaVersion).toBe(3)
    expect(useThemeStore().theme.colors.primary).toBe('#6366f1')
    expect(useThemeStore().theme.overrides).toEqual([])
  })

  it('stores Inherit as absence and reset removes only the selected override', () => {
    const store = useThemeStore()
    store.setOverride(primaryButtonVariantOverride)
    store.resetOverride(primaryButtonVariantRequest)
    expect(store.theme.overrides).not.toContainEqual(primaryButtonVariantOverride)
    expect(store.resolve(primaryButtonVariantRequest)).toMatchObject({ source: 'global' })
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
    const persisted = JSON.parse(localStorage.getItem('ftb-theme')!)
    expect(persisted.overrides).toEqual(store.theme.overrides)
    expect(persisted.foundations.palettes.primary.shades).toBeUndefined()
    expect(persisted.overrides).not.toContainEqual(expect.objectContaining({ scope: 'state', value: '#4f46e5' }))
  })

  it('ignores invalid persisted overrides and leaves editing usable', () => {
    localStorage.setItem('ftb-theme', JSON.stringify({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [invalidExternalOverride] }))
    const store = useThemeStore()
    expect(store.theme.overrides).toEqual([])
    expect(() => store.setPrimaryColor('#0f766e')).not.toThrow()
  })
})
