import { describe, expect, it } from 'vitest'

import { createThemeRegistry, lookupRegistryEntry } from '@/registry/theme-registry'
import { createTestRegistry } from './theme-registry.fixtures'

describe('theme registry lookup', () => {
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
    for (const selector of ['.fi-section', '.fi-fo-field', '.fi-fo-text-input', '.fi-fo-select', '.fi-select-input', '.fi-fo-toggle', '.fi-fo-date-time-picker', '.fi-fo-textarea', '.fi-fo-file-upload', '.fi-checkbox-input', '.fi-fo-checkbox-list', '.fi-fo-code-editor', '.fi-fo-color-picker', '.fi-fo-builder', '.fi-fo-key-value', '.fi-fo-markdown-editor', '.fi-fo-modal-table-select', '.fi-one-time-code-input-ctn', '.fi-fo-rich-editor', '.fi-fo-slider', '.fi-fo-tags-input', '.fi-sc-wizard', '.fi-sc-wizard-header-step-btn', '.fi-sc-wizard-step', '.fi-tabs', '.fi-tabs-item', '.fi-sc-actions', '.fi-callout', '.fi-sc-callout', '.fi-empty-state', '.fi-sc-empty-state', '.fi-sc-fused-group', '.fi-sc-form', '.fi-sc-icon', '.fi-sc-image', '.fi-sc-text', '.fi-sc-unordered-list', '.fi-btn', '.fi-ac', '.fi-modal-window', '.fi-modal-heading', '.fi-modal-content', '.fi-modal-footer', '.fi-no', '.fi-no-notification']) {
      expect(lookupRegistryEntry(registry, { selectors: [selector], filamentVersion: '5.9' }), selector).toMatchObject({ status: 'matched' })
    }
    expect(lookupRegistryEntry(registry, { selectors: ['ProductEditorForm'], filamentVersion: '5.9' })).toEqual({ status: 'no-match' })
  })

  it('rejects lookup when the active Filament compatibility baseline is unsupported', () => {
    expect(lookupRegistryEntry(createThemeRegistry(), { selectors: ['.fi-btn.fi-color-primary'], filamentVersion: '4.0' })).toEqual({ status: 'incompatible', required: '5.x' })
  })
})
