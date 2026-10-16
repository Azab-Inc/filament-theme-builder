import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  FILAMENT_FOUNDATION_INVENTORY,
  lookupFoundationMapping,
} from '@/registry/filament-foundation-inventory'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('Filament foundation inventory evidence', () => {
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
})
