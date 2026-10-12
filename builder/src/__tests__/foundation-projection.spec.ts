import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  FILAMENT_FOUNDATION_INVENTORY,
  lookupFoundationMapping,
} from '@/registry/filament-foundation-inventory'
import { createDefaultFoundationState } from '@/services/foundation-defaults'
import { validateFoundationMapping } from '@/services/foundation-validation'
import { projectFoundations } from '@/services/foundation-projection'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('Filament foundation inventory', () => {
  it('classifies every FTB-005 control exactly once', () => {
    const expected = [
      ...['primary', 'success', 'warning', 'danger', 'info', 'gray'].flatMap((palette) => [
        `palette.${palette}.base`,
        ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => `palette.${palette}.shades.${shade}`),
      ]),
      ...['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'].map((name) => `surface.${name}`),
      ...['default', 'strong'].map((name) => `border.${name}`),
      ...['primary', 'muted', 'disabled'].map((name) => `text.${name}`),
      'typography.body', 'typography.heading', 'typography.mono',
      ...['0', 'px', '0.5', '1', '1.5', '2', '3', '4', '6', '8'].map((key) => `spacing.${key}`),
      'density', 'radius', 'borderWidth', 'shadow',
    ]

    for (const id of expected) expect(lookupFoundationMapping(id)).toBeDefined()
    expect(new Set(expected.map((id) => lookupFoundationMapping(id)?.id)).size).toBe(expected.length)
  })

  it('classifies every foundation control as a live preview mapping', () => {
    const foundationIds = FILAMENT_FOUNDATION_INVENTORY
      .filter(({ id }) => !id.includes('.') || id.startsWith('palette.') || id.startsWith('surface.') || id.startsWith('border.') || id.startsWith('text.') || id.startsWith('typography.') || id.startsWith('spacing.'))
      .map(({ id }) => id)

    expect(foundationIds.every((id) => ['preview-emulatable', 'live-emulation'].includes(lookupFoundationMapping(id)?.mapping ?? ''))).toBe(true)
    expect(FILAMENT_FOUNDATION_INVENTORY.filter(({ id }) => id === 'radius')[0]?.mapping).toBe('live-emulation')
  })
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
    }
  })

  it('ties every preview mapping to its exact emitted variable or selector', () => {
    for (const entry of FILAMENT_FOUNDATION_INVENTORY.filter(
      (entry) => entry.mapping === 'preview-emulatable',
    )) {
      expect(entry.variable ?? entry.selectors.length).toBeTruthy()
      expect(entry.evidence.needle).toBe('projects every foundation family live in the iframe without reload')
    }
  })

  it('records fixed runtime scopes for semantic mappings', () => {
    for (const id of ['surface.page', 'surface.card', 'border.default', 'text.primary', 'typography.body', 'spacing.1', 'radius', 'borderWidth', 'shadow']) {
      expect(lookupFoundationMapping(id)?.selectors?.length, id).toBeGreaterThan(0)
      expect(lookupFoundationMapping(id)?.property, id).toBeTruthy()
    }
  })

  it('records the verified native table density CSS evidence', () => {
    const mapping = lookupFoundationMapping('density')

    expect(mapping).toMatchObject({
           mapping: 'live-emulation',
      selectors: expect.arrayContaining(['.fi-ta']),
    })
    expect(mapping?.evidence.reason).toMatch(/fixed selectors/i)
  })

  it('uses canonical text IDs and only verified concrete selectors', () => {
    expect(lookupFoundationMapping('text.primary')?.id).toBe('text.primary')
    expect(lookupFoundationMapping('tex.primary')).toBeUndefined()

    const selectors = FILAMENT_FOUNDATION_INVENTORY.flatMap(({ selectors }) => selectors)
    expect(selectors).not.toEqual(expect.arrayContaining(['.fi-card', '.fi-textarea', '.fi-popover', '.fi-code']))
  })

  it('contains no invented Filament variable tokens', () => {
    for (const entry of FILAMENT_FOUNDATION_INVENTORY) {
      if (entry.variable) expect(entry.variable).not.toMatch(/^--fi-/)
    }
  })

  it('only exposes the verified bridge variables and compiled fi selectors', () => {
    const variables = FILAMENT_FOUNDATION_INVENTORY.flatMap((entry) =>
      entry.variable ? [entry.variable] : [],
    )
    const selectors = FILAMENT_FOUNDATION_INVENTORY.flatMap((entry) => entry.selectors)

    expect(variables).toEqual(
      expect.arrayContaining(['--ftb-primary', '--primary-50', '--primary-500', '--primary-950']),
    )
    expect(selectors).toEqual(expect.arrayContaining(['.fi-color-primary', '.fi-btn.fi-color-primary', '.fi-ta', '.fi-sidebar', '.fi-topbar', '.fi-section']))
  })

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
    state.palettes.primary.shades[500] = '#0f766e'

    expect(projectFoundations(state, 'dark')).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        compatibility: 'filament-5.9',
        mode: 'dark',
      }),
    )
    expect(projectFoundations(state, 'dark').mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'palette.primary.base',
          variable: '--ftb-primary',
          value: '#0f766e',
        }),
        expect.objectContaining({
          id: 'palette.primary.shades.500',
          variable: '--primary-500',
          value: '#0f766e',
        }),
      ]),
    )
    expect(projectFoundations(state, 'dark').mappings.length).toBe(FILAMENT_FOUNDATION_INVENTORY.filter(({ id }) => !['global.primary', 'button.primary', 'button.secondary', 'badge', 'logo.light', 'logo.dark'].includes(id)).length)
    expect(projectFoundations(state, 'dark').mappings.every((mapping) => ['preview-emulatable', 'live-emulation'].includes(mapping.mapping))).toBe(true)
    expect(JSON.stringify(projectFoundations(state, 'dark'))).not.toMatch(/url\(|@import/i)
  })

  it.each(['compact', 'default', 'spacious'] as const)('projects %s table density with the verified selector', (density) => {
    const state = createDefaultFoundationState()
    state.density = density

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
    const projection = projectFoundations(createDefaultFoundationState(), 'light')

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

  it('requires bridge compatibility handling for forged tuples and unmapped modes', () => {
    const bridge = readFileSync(
      resolve(repositoryRoot, 'demo/resources/views/filament/preview-bridge.blade.php'),
      'utf8',
    )

    expect(bridge).toContain('isSafeOverride')
    expect(bridge).toContain('sameArray(candidate.selectors, expected.selectors)')
    expect(bridge).toContain('projection.mappings')
    expect(bridge).toContain('ftb:preview-message-accepted')
    expect(bridge).not.toContain('ftb:preview-compatibility')
  })
})
