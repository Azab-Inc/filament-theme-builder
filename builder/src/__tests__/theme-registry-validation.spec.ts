import { describe, expect, it } from 'vitest'

import { validateRegistry } from '@/registry/theme-registry'
import { PADDING_UNITS, type RegistryPaddingTarget } from '@/models/padding-registry.model'
import { backgroundControl, buttonEntry } from './theme-registry.fixtures'

describe('theme registry validation', () => {
  it('rejects duplicate stable IDs and malformed selector/control metadata', () => {
    expect(() => validateRegistry([buttonEntry, { ...buttonEntry }])).toThrow(/duplicate.*button\.primary/i)
    expect(() => validateRegistry([{ ...buttonEntry, selectors: [] }])).toThrow(/selectors/i)
    expect(() => validateRegistry([{ ...buttonEntry, controls: [{ ...backgroundControl, valueType: 'unknown' as never }] }])).toThrow(/control.*type/i)
  })

  it('rejects empty, malformed, unsafe, and invalid numeric default metadata', () => {
    for (const selector of ['', ' ', '. ', '[', '.fi-btn > .fi-icon', 'javascript:alert(1)']) {
      expect(() => validateRegistry([{ ...buttonEntry, selectors: [selector] }])).toThrow(/selectors/i)
    }
    expect(() => validateRegistry([{ ...buttonEntry, controls: [{ ...backgroundControl, defaultValue: 1 as never }] }])).toThrow(/default/i)
    expect(() => validateRegistry([{ ...buttonEntry, controls: [{ ...backgroundControl, valueType: 'number', defaultValue: Number.NaN }] }])).toThrow(/default/i)
  })

  it('rejects registries whose candidates declare conflicting compatibility baselines', () => {
    expect(() => validateRegistry([buttonEntry, { ...buttonEntry, id: 'button.secondary', filamentCompatibility: '4.x' }])).toThrow(/compatibility.*consistent/i)
  })

  it('rejects duplicate padding identities and active mappings without evidence', () => {
    const invalidTarget: RegistryPaddingTarget = { id: 'x', entryId: 'button.primary', sectionId: 'buttons', nestedPolicy: 'leaf-defaults', order: 99, selectors: ['.fi-btn-primary'], targetKind: 'leaf', status: 'supported', units: PADDING_UNITS, variants: [], states: [], variantSelectors: {}, stateSelectors: {}, evidence: [] }
    expect(() => validateRegistry([{ ...buttonEntry, paddingTargets: [invalidTarget] }])).toThrow(/evidence/i)
    const validTarget: RegistryPaddingTarget = { ...invalidTarget, evidence: [{ selector: '.fi-btn-primary', source: 'test', sampleCount: 1, verified: true, values: { top: '0', right: '0', bottom: '0', left: '0' } }] }
    const validEntry = { ...buttonEntry, paddingTargets: [validTarget] }
    expect(() => validateRegistry([validEntry, { ...validEntry, id: 'button.secondary' }])).toThrow(/duplicate/i)
  })

  it('clones caller metadata so nested mutations cannot change registry behavior', () => {
    const pattern = /^#[\da-f]{6}$/i
    const sourceEntry = { ...buttonEntry, selectors: [...buttonEntry.selectors], controls: [{ ...backgroundControl, constraints: { pattern } }], variants: [...buttonEntry.variants], states: [...buttonEntry.states] }
    const validated = validateRegistry([sourceEntry])
    sourceEntry.selectors[0] = '.fi-mutated'
    sourceEntry.controls[0]!.constraints!.pattern = /mutated/
    sourceEntry.variants[0] = 'mutated'
    pattern.lastIndex = 99
    expect(validated.entries[0]!.selectors).toEqual(['.fi-btn-primary'])
    expect(validated.entries[0]!.variants).toContain('primary')
    expect(validated.entries[0]!.controls[0]!.constraints!.pattern).toEqual({ source: '^#[\\da-f]{6}$', flags: 'i' })
    expect(validated.entries[0]!.controls[0]!.constraints!.pattern).not.toBe(pattern)
  })
})
