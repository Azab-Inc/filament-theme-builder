import { describe, expect, it } from 'vitest'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { projectFoundations } from '@/utils/foundation-projection'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'

describe('foundation projection scopes', () => {
  it('projects an explicitly overridden shade with its complete palette family', () => {
    const state = createDefaultFoundationState()
    state.palettes.gray.overrides[50] = '#123456'
    state.explicitPaths.push('palettes.gray.overrides.50')

    const grayMappings = projectFoundations(state, 'light').mappings.filter(({ id }) => id.startsWith('palette.gray.'))

    expect(grayMappings).toHaveLength(12)
    expect(grayMappings).toContainEqual(expect.objectContaining({ id: 'palette.gray.shades.50', value: '#123456' }))
  })

  it.each(['compact', 'default', 'spacious'] as const)('projects %s table density with the verified selector', (density) => {
    const state = createDefaultFoundationState()
    state.density = density
    state.explicitPaths.push('density')

    expect(projectFoundations(state, 'light').mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'density',
         mapping: 'live-emulation',
          selectors: expect.arrayContaining(['.fi-ta']),
          value: density,
        }),
      ]),
    )
  })

  it('projects scoped controls without arbitrary selectors', () => {
    const state = createDefaultFoundationState()
    state.explicitPaths.push('surfaces.page.light')
    const projection = projectFoundations(state, 'light')

    expect(projection.mappings.some((mapping) => mapping.id === 'surface.page')).toBe(true)
    expect(projection.mappings.every((mapping) => mapping.selectors === undefined || mapping.selectors.length > 0)).toBe(true)
  })

  it('keeps every preview tuple tied to the inventory id and variable', () => {
    const projection = projectFoundations(createDefaultFoundationState(), 'dark')

    for (const mapping of projection.mappings) {
      const inventory = lookupFoundationMapping(mapping.id)
       expect(inventory).toMatchObject({ id: mapping.id })
      if (mapping.id === 'density') {
        expect(mapping.selectors).toContain('.fi-ta')
        expect(mapping.variable).toBeUndefined()
      } else {
        expect(mapping.variable).toBe(inventory?.variable)
      }
    }
  })
})
