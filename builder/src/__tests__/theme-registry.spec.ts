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
      'infolist.entry.repeatable',
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
      'action.button',
      'action.group',
      'button.primary',
      'button.secondary',
      'form.control.builder',
      'form.control.checkbox',
      'form.control.checkbox-list',
      'form.control.code-editor',
      'form.control.color-picker',
      'form.control.date',
      'form.control.file-upload',
      'form.control.key-value',
      'form.control.markdown-editor',
      'form.control.modal-table-select',
      'form.control.one-time-code',
      'form.control.radio',
      'form.control.rich-editor',
      'form.control.select',
      'form.control.slider',
      'form.control.tags-input',
      'form.control.text',
      'form.control.textarea',
      'form.control.toggle',
      'form.control.toggle-buttons',
      'form.field',
      'form.layout.actions',
      'form.layout.callout',
      'form.layout.empty-state',
      'form.layout.fieldset',
      'form.layout.form',
      'form.layout.fused-group',
      'form.layout.grid',
      'form.layout.icon',
      'form.layout.image',
      'form.layout.repeater',
      'form.layout.tabs',
      'form.layout.text',
      'form.layout.unordered-list',
      'form.layout.wizard',
      'form.product-name',
      'form.section',
      'global.primary',
      'infolist.entry.color',
      'infolist.entry.icon',
      'infolist.entry.image',
      'infolist.entry.key-value',
      'infolist.entry.repeatable',
      'infolist.entry.text',
      'infolist.layout.flex',
      'modal.content',
      'modal.footer',
      'modal.heading',
      'modal.window',
      'notification.container',
      'notification.item',
    ])
    expect(registry.entries.find((entry) => entry.id === 'button.primary')?.selectors).toEqual(['.fi-btn.fi-color-primary'])
    expect(registry.entries.find((entry) => entry.id === 'button.secondary')?.selectors).toEqual(['.fi-btn.fi-outlined'])
  })

  it('registers the shared forms and schemas surfaces from the named showcase fixtures', () => {
    const registry = createThemeRegistry()
    const forms = registry.entries.filter((entry) => entry.id.startsWith('form.'))

    expect(forms.map((entry) => entry.id)).toEqual([
      'form.control.builder',
      'form.control.checkbox',
      'form.control.checkbox-list',
      'form.control.code-editor',
      'form.control.color-picker',
      'form.control.date',
      'form.control.file-upload',
      'form.control.key-value',
      'form.control.markdown-editor',
      'form.control.modal-table-select',
      'form.control.one-time-code',
      'form.control.radio',
      'form.control.rich-editor',
      'form.control.select',
      'form.control.slider',
      'form.control.tags-input',
      'form.control.text',
      'form.control.textarea',
      'form.control.toggle',
      'form.control.toggle-buttons',
      'form.field',
      'form.layout.actions',
      'form.layout.callout',
      'form.layout.empty-state',
      'form.layout.fieldset',
      'form.layout.form',
      'form.layout.fused-group',
      'form.layout.grid',
      'form.layout.icon',
      'form.layout.image',
      'form.layout.repeater',
      'form.layout.tabs',
      'form.layout.text',
      'form.layout.unordered-list',
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
    expect(forms.find((entry) => entry.id === 'form.control.checkbox')?.selectors).toEqual(['.fi-checkbox-input'])
    expect(forms.find((entry) => entry.id === 'form.control.checkbox-list')?.selectors).toEqual(['.fi-fo-checkbox-list'])
    expect(forms.find((entry) => entry.id === 'form.control.code-editor')?.selectors).toEqual(['.fi-fo-code-editor'])
    expect(forms.find((entry) => entry.id === 'form.control.color-picker')?.selectors).toEqual(['.fi-fo-color-picker'])
    expect(forms.find((entry) => entry.id === 'form.control.builder')?.selectors).toEqual(['.fi-fo-builder'])
    expect(forms.find((entry) => entry.id === 'form.control.key-value')?.selectors).toEqual(['.fi-fo-key-value'])
    expect(forms.find((entry) => entry.id === 'form.control.markdown-editor')?.selectors).toEqual(['.fi-fo-markdown-editor'])
    expect(forms.find((entry) => entry.id === 'form.control.modal-table-select')?.selectors).toEqual(['.fi-fo-modal-table-select'])
    expect(forms.find((entry) => entry.id === 'form.control.one-time-code')?.selectors).toEqual(['.fi-one-time-code-input-ctn'])
    expect(forms.find((entry) => entry.id === 'form.control.rich-editor')?.selectors).toEqual(['.fi-fo-rich-editor'])
    expect(forms.find((entry) => entry.id === 'form.control.slider')?.selectors).toEqual(['.fi-fo-slider'])
    expect(forms.find((entry) => entry.id === 'form.control.tags-input')?.selectors).toEqual(['.fi-fo-tags-input'])
    expect(forms.find((entry) => entry.id === 'form.layout.fieldset')?.selectors).toEqual(['.fi-fieldset'])
    expect(forms.find((entry) => entry.id === 'form.layout.actions')?.selectors).toEqual(['.fi-sc-actions'])
    expect(forms.find((entry) => entry.id === 'form.layout.callout')?.selectors).toEqual(['.fi-callout', '.fi-sc-callout'])
    expect(forms.find((entry) => entry.id === 'form.layout.empty-state')?.selectors).toEqual(['.fi-empty-state', '.fi-sc-empty-state'])
    expect(forms.find((entry) => entry.id === 'form.layout.fused-group')?.selectors).toEqual(['.fi-sc-fused-group'])
    expect(forms.find((entry) => entry.id === 'form.layout.form')?.selectors).toEqual(['.fi-sc-form'])
    expect(forms.find((entry) => entry.id === 'form.layout.grid')?.selectors).toEqual(['.fi-grid'])
    expect(forms.find((entry) => entry.id === 'form.layout.icon')?.selectors).toEqual(['.fi-sc-icon'])
    expect(forms.find((entry) => entry.id === 'form.layout.image')?.selectors).toEqual(['.fi-sc-image'])
    expect(forms.find((entry) => entry.id === 'form.layout.repeater')?.selectors).toEqual(['.fi-fo-repeater'])
    expect(forms.find((entry) => entry.id === 'form.layout.text')?.selectors).toEqual(['.fi-sc-text'])
    expect(forms.find((entry) => entry.id === 'form.layout.unordered-list')?.selectors).toEqual(['.fi-sc-unordered-list'])
    expect(forms.filter((entry) => entry.id !== 'form.product-name').every((entry) => entry.controls.length === 0)).toBe(true)
    expect(forms.filter((entry) => entry.id !== 'form.product-name').every((entry) => entry.variants.length === 0 && entry.states.length === 0)).toBe(true)
  })

  it('registers action, modal, and notification component variants and states', () => {
    const registry = createThemeRegistry()

    expect(registry.entries.find((entry) => entry.id === 'action.button')).toMatchObject({
      family: 'action',
      selectors: ['.fi-btn'],
      variants: ['primary', 'danger', 'success', 'warning', 'info', 'gray', 'outline', 'icon-only'],
      states: ['default', 'disabled', 'loading'],
    })
    expect(registry.entries.find((entry) => entry.id === 'action.group')).toMatchObject({
      family: 'action',
      selectors: ['.fi-ac'],
      variants: ['grouped'],
      states: ['default'],
    })
    expect(registry.entries.find((entry) => entry.id === 'modal.window')).toMatchObject({
      family: 'modal',
      selectors: ['.fi-modal-window'],
      variants: ['small', 'medium', 'large', 'extra-large', 'slide-over'],
      states: ['open'],
    })
    for (const id of ['modal.heading', 'modal.content', 'modal.footer']) {
      expect(registry.entries.find((entry) => entry.id === id)).toMatchObject({ family: 'modal', states: ['open'] })
    }
    expect(registry.entries.find((entry) => entry.id === 'notification.container')).toMatchObject({
      family: 'notification',
      selectors: ['.fi-no'],
      variants: ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'],
      states: ['visible'],
    })
    expect(registry.entries.find((entry) => entry.id === 'notification.item')).toMatchObject({
      family: 'notification',
      selectors: ['.fi-no-notification'],
      variants: ['success', 'danger', 'warning', 'info'],
      states: ['persistent', 'transient'],
    })
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
      '.fi-checkbox-input',
      '.fi-fo-checkbox-list',
      '.fi-fo-code-editor',
      '.fi-fo-color-picker',
      '.fi-fo-builder',
      '.fi-fo-key-value',
      '.fi-fo-markdown-editor',
      '.fi-fo-modal-table-select',
      '.fi-one-time-code-input-ctn',
      '.fi-fo-rich-editor',
      '.fi-fo-slider',
      '.fi-fo-tags-input',
      '.fi-sc-wizard',
      '.fi-sc-wizard-header-step-btn',
      '.fi-sc-wizard-step',
      '.fi-tabs',
      '.fi-tabs-item',
      '.fi-sc-actions',
      '.fi-callout',
      '.fi-sc-callout',
      '.fi-empty-state',
      '.fi-sc-empty-state',
      '.fi-sc-fused-group',
      '.fi-sc-form',
      '.fi-sc-icon',
      '.fi-sc-image',
      '.fi-sc-text',
      '.fi-sc-unordered-list',
      '.fi-btn',
      '.fi-ac',
      '.fi-modal-window',
      '.fi-modal-heading',
      '.fi-modal-content',
      '.fi-modal-footer',
      '.fi-no',
      '.fi-no-notification',
    ]) {
      expect(lookupRegistryEntry(registry, { selectors: [selector], filamentVersion: '5.9' }), selector).toMatchObject({ status: 'matched' })
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
