import { describe, expect, it } from 'vitest'

import type { RegistryEntry } from '@/models/theme-registry.model'
import { createThemeRegistry, lookupRegistryEntry, validateRegistry } from '@/registry/theme-registry'

const backgroundControl = {
  id: 'background',
  valueType: 'color' as const,
  constraints: { pattern: /^#[\da-f]{6}$/i },
}

const buttonEntry: RegistryEntry = {
  id: 'button.primary',
  label: 'Primary button',
  family: 'button',
  selectors: ['.fi-btn-primary'],
  controls: [backgroundControl],
  variants: ['primary', 'secondary'],
  states: ['default', 'hover'],
  filamentCompatibility: '5.x',
}

function createTestRegistry() {
  return validateRegistry([
    { ...buttonEntry, selectors: ['.fi-shared'] },
    {
      ...buttonEntry,
      id: 'button.secondary',
      label: 'Secondary button',
      selectors: ['.fi-shared'],
    },
  ])
}

describe('theme registry', () => {
  it('rejects duplicate stable IDs and malformed selector/control metadata', () => {
    expect(() => validateRegistry([buttonEntry, { ...buttonEntry }])).toThrow(/duplicate.*button\.primary/i)
    expect(() => validateRegistry([{ ...buttonEntry, selectors: [] }])).toThrow(/selectors/i)
    expect(() => validateRegistry([{ ...buttonEntry, controls: [{ ...backgroundControl, valueType: 'unknown' as never }] }])).toThrow(/control.*type/i)
  })

  it('keeps labels independent from stable semantic IDs', () => {
    const registry = createThemeRegistry()

    expect(registry.entries.find((entry) => entry.id === 'button.primary')?.label).toBe('Primary button')
  })

  it('returns unique, no-match, and ambiguous lookup results deterministically', () => {
    const registry = createThemeRegistry()
    const testRegistry = createTestRegistry()

    expect(lookupRegistryEntry(registry, { selectors: ['.fi-btn-primary'], filamentVersion: '5.0' })).toMatchObject({ status: 'matched', entry: { id: 'button.primary' } })
    expect(lookupRegistryEntry(registry, { selectors: ['.not-a-filament-selector'], filamentVersion: '5.0' })).toEqual({ status: 'no-match' })
    expect(lookupRegistryEntry(testRegistry, { selectors: ['.fi-shared'], filamentVersion: '5.0' })).toMatchObject({ status: 'ambiguous', candidateIds: ['button.primary', 'button.secondary'] })
  })

  it('rejects lookup when the active Filament compatibility baseline is unsupported', () => {
    expect(lookupRegistryEntry(createThemeRegistry(), { selectors: ['.fi-btn-primary'], filamentVersion: '4.0' })).toEqual({ status: 'incompatible', required: '5.x' })
  })
})
