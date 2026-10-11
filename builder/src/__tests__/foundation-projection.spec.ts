import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { FILAMENT_FOUNDATION_INVENTORY, lookupFoundationMapping } from '@/registry/filament-foundation-inventory'
import { createDefaultFoundationState } from '@/services/foundation-defaults'
import { validateFoundationMapping } from '@/services/foundation-validation'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('Filament foundation inventory', () => {
  it('is frozen at the collection and entry levels', () => {
    expect(Object.isFrozen(FILAMENT_FOUNDATION_INVENTORY)).toBe(true)
    for (const entry of FILAMENT_FOUNDATION_INVENTORY) expect(Object.isFrozen(entry)).toBe(true)
  })

  it('records evidence for every mapped selector or variable', () => {
    for (const entry of FILAMENT_FOUNDATION_INVENTORY) {
      const source = readFileSync(resolve(repositoryRoot, entry.evidence.source), 'utf8')
      const baseline = readFileSync(resolve(repositoryRoot, entry.evidence.baseline), 'utf8')

      expect(entry.compatibility).toBe('filament-5.9')
      expect(source).toContain(entry.evidence.needle)
      expect(baseline).toContain('"filament/filament": "^5.9"')
      expect(entry.evidence.reason).toBeTruthy()
      for (const absent of entry.evidence.absent ?? []) expect(source).not.toContain(absent)
    }
  })

  it('ties every preview mapping to its exact emitted variable or selector', () => {
    for (const entry of FILAMENT_FOUNDATION_INVENTORY.filter((entry) => entry.mapping === 'preview-emulatable')) {
      expect(entry.variable ?? entry.selector).toBeTruthy()
      if (entry.id.endsWith('.base')) expect(entry.evidence.needle).toBe(entry.variable)
      else expect(entry.evidence.needle).toBe('--primary-${shade}')
    }
  })

  it('does not treat unrelated bridge evidence as a page-surface mapping', () => {
    const mapping = lookupFoundationMapping('surface.page')

    expect(mapping).toMatchObject({ mapping: 'unmapped' })
    expect(mapping?.evidence.reason).toMatch(/no verified .*page surface/i)
    expect(mapping?.variable).toBeUndefined()
    expect(mapping?.selector).toBeUndefined()
  })

  it('does not treat panel sidebar configuration as density CSS evidence', () => {
    const mapping = lookupFoundationMapping('density')

    expect(mapping).toMatchObject({ mapping: 'unmapped' })
    expect(mapping?.evidence.reason).toMatch(/no verified .*spacing|sidebar.*variable|rule/i)
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
    expect(selectors).toEqual(expect.arrayContaining(['.fi-color-primary', '.fi-btn.fi-color-primary', '.fi-badge', '.fi-logo-light', '.fi-logo-dark']))
  })

  it('distinguishes mapping classifications while returning the validated state', () => {
    const state = createDefaultFoundationState()
    expect(validateFoundationMapping('palette.primary.base', state)).toMatchObject({ valid: true, mapping: { mapping: 'preview-emulatable' }, state })
    expect(validateFoundationMapping('global.primary', state)).toMatchObject({ valid: true, mapping: { mapping: 'export-only' }, state })
    expect(validateFoundationMapping('surface.page', state)).toMatchObject({ valid: true, mapping: { mapping: 'unmapped' }, state })
    expect(lookupFoundationMapping('palette.primary.base')).toMatchObject({ id: 'palette.primary.base', variable: '--ftb-primary' })
  })
})
