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
  it('registers unique selector-only entries for first-party infolist components and layouts', () => {
    const registry = createThemeRegistry()
    const infolistEntries = registry.entries.filter(({ id }) => id.startsWith('infolist.'))

    expect(infolistEntries.map(({ id }) => id)).toEqual([
      'infolist.entry.color',
      'infolist.entry.icon',
      'infolist.entry.image',
      'infolist.entry.key-value',
      'infolist.entry.text',
      'infolist.layout.flex',
    ])
    expect(infolistEntries.every(({ controls, variants, states }) => !controls.length && !variants.length && !states.length)).toBe(true)
    expect(new Set(infolistEntries.flatMap(({ selectors }) => selectors)).size).toBe(infolistEntries.flatMap(({ selectors }) => selectors).length)
  })

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

  it('keeps labels independent from stable semantic IDs', () => {
    const registry = createThemeRegistry()

    expect(registry.entries.find((entry) => entry.id === 'button.primary')?.label).toBe('Primary button')
    expect(registry.entries.map((entry) => entry.id)).toEqual([
      'button.primary',
      'button.secondary',
      'form.control.date',
      'form.control.file-upload',
      'form.control.radio',
      'form.control.select',
      'form.control.text',
      'form.control.textarea',
      'form.control.toggle',
      'form.control.toggle-buttons',
      'form.field',
      'form.layout.fieldset',
      'form.layout.grid',
      'form.layout.repeater',
      'form.layout.tabs',
      'form.layout.wizard',
      'form.product-name',
      'form.section',
      'global.primary',
      'infolist.entry.color',
      'infolist.entry.icon',
      'infolist.entry.image',
      'infolist.entry.key-value',
      'infolist.entry.text',
      'infolist.layout.flex',
    ])
    expect(registry.entries.find((entry) => entry.id === 'button.primary')?.selectors).toEqual(['.fi-btn.fi-color-primary'])
    expect(registry.entries.find((entry) => entry.id === 'button.secondary')?.selectors).toEqual(['.fi-btn.fi-outlined'])
  })

  it('registers the shared forms and schemas surfaces from the named showcase fixtures', () => {
    const registry = createThemeRegistry()
    const forms = registry.entries.filter((entry) => entry.id.startsWith('form.'))

    expect(forms.map((entry) => entry.id)).toEqual([
      'form.control.date',
      'form.control.file-upload',
      'form.control.radio',
      'form.control.select',
      'form.control.text',
      'form.control.textarea',
      'form.control.toggle',
      'form.control.toggle-buttons',
      'form.field',
      'form.layout.fieldset',
      'form.layout.grid',
      'form.layout.repeater',
      'form.layout.tabs',
      'form.layout.wizard',
      'form.product-name',
      'form.section',
    ])
    expect(forms.every((entry) => entry.family === 'form' && entry.filamentCompatibility === '5.x')).toBe(true)
    expect(forms.find((entry) => entry.id === 'form.section')?.selectors).toEqual(['.fi-section'])
    expect(forms.find((entry) => entry.id === 'form.layout.wizard')?.selectors).toEqual([
      '.fi-sc-wizard',
      '.fi-sc-wizard-header-step-btn',
      '.fi-sc-wizard-step',
    ])
    expect(forms.find((entry) => entry.id === 'form.layout.tabs')?.selectors).toEqual(['.fi-tabs', '.fi-tabs-item'])
    expect(forms.find((entry) => entry.id === 'form.control.select')?.selectors).toEqual(['.fi-fo-select', '.fi-select-input'])
    expect(forms.find((entry) => entry.id === 'form.control.radio')?.selectors).toEqual(['.fi-fo-radio', '.fi-radio-input'])
    expect(forms.find((entry) => entry.id === 'form.control.toggle-buttons')?.selectors).toEqual(['.fi-fo-toggle-buttons', '.fi-fo-toggle-buttons-input'])
    expect(forms.find((entry) => entry.id === 'form.layout.fieldset')?.selectors).toEqual(['.fi-fieldset'])
    expect(forms.find((entry) => entry.id === 'form.layout.grid')?.selectors).toEqual(['.fi-grid'])
    expect(forms.find((entry) => entry.id === 'form.layout.repeater')?.selectors).toEqual(['.fi-fo-repeater'])
    expect(forms.filter((entry) => entry.id !== 'form.product-name').every((entry) => entry.controls.length === 0)).toBe(true)
    expect(forms.filter((entry) => entry.id !== 'form.product-name').every((entry) => entry.variants.length === 0 && entry.states.length === 0)).toBe(true)
  })

  it('registers only the Product name input as an editable production form target', () => {
    const registry = createThemeRegistry()
    const target = registry.entries.find((entry) => entry.id === 'form.product-name')

    expect(target).toMatchObject({
      family: 'form',
      selectors: ['.fi-fo-text-input .fi-input'],
      variants: ['default'],
      states: ['focus'],
      controls: [{ id: 'background', valueType: 'color' }],
    })
    expect(registry.entries.filter((entry) => entry.controls.length > 0).map((entry) => entry.id)).toEqual([
      'button.primary',
      'button.secondary',
      'form.product-name',
      'global.primary',
    ])
  })

  it('returns unique, no-match, and ambiguous lookup results deterministically', () => {
    const registry = createThemeRegistry()
    const testRegistry = createTestRegistry()

    expect(lookupRegistryEntry(registry, { selectors: ['.fi-btn.fi-color-primary'], filamentVersion: '5.0' })).toMatchObject({ status: 'matched', entry: { id: 'button.primary' } })
    expect(lookupRegistryEntry(registry, { selectors: ['.fi-btn.fi-outlined'], filamentVersion: '5.0' })).toMatchObject({ status: 'matched', entry: { id: 'button.secondary' } })
    expect(lookupRegistryEntry(registry, { selectors: ['.fi-color-primary'], filamentVersion: '5.0' })).toMatchObject({ status: 'matched', entry: { id: 'global.primary' } })
    expect(lookupRegistryEntry(registry, { selectors: ['.not-a-filament-selector'], filamentVersion: '5.0' })).toEqual({ status: 'no-match' })
    expect(lookupRegistryEntry(testRegistry, { selectors: ['.fi-shared'], filamentVersion: '5.0' })).toMatchObject({ status: 'ambiguous', candidateIds: ['button.primary', 'button.secondary'] })
  })

  it('looks up each registered forms selector without using fixture names or labels', () => {
    const registry = createThemeRegistry()

    for (const selector of [
      '.fi-section',
      '.fi-fo-field',
      '.fi-fo-text-input',
      '.fi-fo-select',
      '.fi-select-input',
      '.fi-fo-toggle',
      '.fi-fo-date-time-picker',
      '.fi-fo-textarea',
      '.fi-fo-file-upload',
      '.fi-sc-wizard',
      '.fi-sc-wizard-header-step-btn',
      '.fi-sc-wizard-step',
      '.fi-tabs',
      '.fi-tabs-item',
    ]) {
      expect(lookupRegistryEntry(registry, { selectors: [selector], filamentVersion: '5.9' })).toMatchObject({ status: 'matched' })
    }

    expect(lookupRegistryEntry(registry, { selectors: ['ProductEditorForm'], filamentVersion: '5.9' })).toEqual({ status: 'no-match' })
  })

  it('allows selector-only surfaces without inventing controls or state metadata', () => {
    const registry = createThemeRegistry()

    expect(registry.entries.filter((entry) => entry.family === 'form' && entry.id !== 'form.product-name').every((entry) => {
      return entry.controls.length === 0 && entry.variants.length === 0 && entry.states.length === 0
    })).toBe(true)
  })

  it('rejects lookup when the active Filament compatibility baseline is unsupported', () => {
    expect(lookupRegistryEntry(createThemeRegistry(), { selectors: ['.fi-btn.fi-color-primary'], filamentVersion: '4.0' })).toEqual({ status: 'incompatible', required: '5.x' })
  })

  it('rejects registries whose candidates declare conflicting compatibility baselines', () => {
    expect(() => validateRegistry([
      buttonEntry,
      { ...buttonEntry, id: 'button.secondary', filamentCompatibility: '4.x' },
    ])).toThrow(/compatibility.*consistent/i)
  })

  it('clones caller metadata so nested mutations cannot change registry behavior', () => {
    const pattern = /^#[\da-f]{6}$/i
    const sourceEntry = {
      ...buttonEntry,
      selectors: [...buttonEntry.selectors],
      controls: [{ ...backgroundControl, constraints: { pattern } }],
      variants: [...buttonEntry.variants],
      states: [...buttonEntry.states],
    }
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
