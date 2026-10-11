import { describe, expect, it } from 'vitest'

import { FILAMENT_FOUNDATION_INVENTORY, lookupFoundationMapping } from '@/registry/filament-foundation-inventory'

describe('Filament foundation inventory', () => {
  it('is frozen at the collection and entry levels', () => {
    expect(Object.isFrozen(FILAMENT_FOUNDATION_INVENTORY)).toBe(true)
    for (const entry of FILAMENT_FOUNDATION_INVENTORY) expect(Object.isFrozen(entry)).toBe(true)
  })

  it('records evidence for every mapped selector or variable', () => {
    for (const entry of FILAMENT_FOUNDATION_INVENTORY) {
      expect(entry.compatibility).toBe('filament-5.9')
      expect(entry.evidence.source).toBeTruthy()
      expect(entry.evidence.references.length).toBeGreaterThan(0)
      if (entry.selector || entry.variable) expect(entry.evidence.references.join(' ')).toMatch(/filament-5\.9/i)
    }
  })

  it('contains no invented Filament variable tokens', () => {
    for (const entry of FILAMENT_FOUNDATION_INVENTORY) {
      if (entry.variable) expect(entry.variable).not.toMatch(/^--fi-/)
    }
  })

  it('only exposes the verified bridge variables and compiled fi selectors', () => {
    const variables = FILAMENT_FOUNDATION_INVENTORY.flatMap((entry) => entry.variable ? [entry.variable] : [])
    const selectors = FILAMENT_FOUNDATION_INVENTORY.flatMap((entry) => entry.selector ? [entry.selector] : [])

    expect(variables).toEqual(expect.arrayContaining(['--ftb-primary', '--primary-50', '--primary-500', '--primary-950']))
    expect(selectors).toEqual(expect.arrayContaining(['.fi-btn.fi-color-primary', '.fi-badge', '.fi-dropdown', '.fi-simple-header']))
  })

  it('returns a mapping only for an inventory identifier', () => {
    expect(lookupFoundationMapping('palette.primary.base')).toMatchObject({ id: 'palette.primary.base', variable: '--ftb-primary' })
    expect(lookupFoundationMapping('surface.page')).toBeUndefined()
  })
})
