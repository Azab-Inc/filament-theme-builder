import { describe, expect, it } from 'vitest'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { validateFoundationMapping } from '@/utils/foundation-validation'
import { projectFoundations } from '@/utils/foundation-projection'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'

describe('foundation projection', () => {
  it('distinguishes mapping classifications while returning the validated state', () => {
    const state = createDefaultFoundationState()
    expect(validateFoundationMapping('palette.primary.base', state)).toMatchObject({
      valid: true,
      mapping: { mapping: 'preview-emulatable' },
      state,
    })
     expect(validateFoundationMapping('surface.page', state)).toMatchObject({ valid: true, mapping: { mapping: 'preview-emulatable' }, state })
    expect(lookupFoundationMapping('palette.primary.base')).toMatchObject({
      id: 'palette.primary.base',
      variable: '--ftb-primary',
    })
  })

  it('projects every inventory-approved foundation mapping with the v1 protocol shape', () => {
    const state = createDefaultFoundationState()
    state.palettes.primary.base = '#0f766e'
    state.palettes.primary.overrides[500] = '#0f766e'
    state.explicitPaths.push('palettes.primary.base', 'palettes.primary.overrides.500')

    expect(projectFoundations(state, 'dark')).toEqual(
      expect.objectContaining({ schemaVersion: 1, compatibility: 'filament-5.9', mode: 'dark' }),
    )
    expect(projectFoundations(state, 'dark').mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'palette.primary.base', variable: '--ftb-primary', value: '#0f766e' }),
        expect.objectContaining({ id: 'palette.primary.shades.500', variable: '--primary-500', value: '#0f766e' }),
      ]),
    )
    expect(projectFoundations(state, 'dark').mappings.length).toBe(12)
    expect(projectFoundations(state, 'dark').mappings.every((mapping) => ['preview-emulatable', 'live-emulation'].includes(mapping.mapping))).toBe(true)
    expect(JSON.stringify(projectFoundations(state, 'dark'))).not.toMatch(/url\(|@import/i)
  })

  it('does not project untouched foundation values over Filament native styles', () => {
    const projection = projectFoundations(createDefaultFoundationState(), 'light')

    expect(projection.mappings).toEqual([])
  })

  it('projects an explicit value even when it equals the builder default', () => {
    const state = createDefaultFoundationState()
    state.explicitPaths.push('borders.default.light')

    expect(projectFoundations(state, 'light').mappings).toContainEqual(
      expect.objectContaining({ id: 'border.default', value: 'var(--gray-200)' }),
    )
  })

  it('projects a light edit into dark mode until dark is explicitly edited', () => {
    const state = createDefaultFoundationState()
    state.text.primary.light = '#123456'
    state.explicitPaths.push('text.primary.light')

    expect(projectFoundations(state, 'dark').mappings).toContainEqual(
      expect.objectContaining({ id: 'text.primary', value: '#123456' }),
    )

    state.text.primary.dark = '#abcdef'
    state.explicitPaths.push('text.primary.dark')
    expect(projectFoundations(state, 'dark').mappings).toContainEqual(
      expect.objectContaining({ id: 'text.primary', value: '#abcdef' }),
    )
  })

  it('omits untouched palettes but projects every value for an explicitly edited family', () => {
    const state = createDefaultFoundationState()

    expect(projectFoundations(state, 'light').mappings.filter(({ id }) => id.startsWith('palette.'))).toEqual([])

    state.palettes.primary.base = '#0f766e'
    state.explicitPaths.push('palettes.primary.base')
    const primaryMappings = projectFoundations(state, 'light').mappings.filter(({ id }) => id.startsWith('palette.primary.'))

    expect(primaryMappings).toHaveLength(12)
    expect(primaryMappings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'palette.primary.base', value: '#0f766e' }),
      expect.objectContaining({ id: 'palette.primary.shades.500' }),
    ]))
    expect(projectFoundations(state, 'light').mappings.some(({ id }) => id.startsWith('palette.gray.'))).toBe(false)
  })
})
