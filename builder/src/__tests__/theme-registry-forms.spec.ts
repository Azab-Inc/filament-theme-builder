import { describe, expect, it } from 'vitest'

import { createThemeRegistry } from '@/registry/theme-registry'

describe('theme registry forms', () => {
  it('registers shared forms and schemas surfaces with Filament 5 compatibility', () => {
    const forms = createThemeRegistry().entries.filter((entry) => entry.id.startsWith('form.'))
    expect(forms.map((entry) => entry.id)).toEqual([
      'form.control.builder', 'form.control.checkbox', 'form.control.checkbox-list', 'form.control.code-editor', 'form.control.color-picker',
      'form.control.date', 'form.control.file-upload', 'form.control.key-value', 'form.control.markdown-editor', 'form.control.modal-table-select',
      'form.control.one-time-code', 'form.control.radio', 'form.control.rich-editor', 'form.control.select', 'form.control.slider',
      'form.control.tags-input', 'form.control.text', 'form.control.textarea', 'form.control.toggle', 'form.control.toggle-buttons',
      'form.field', 'form.layout.actions', 'form.layout.callout', 'form.layout.empty-state', 'form.layout.fieldset', 'form.layout.form',
      'form.layout.fused-group', 'form.layout.grid', 'form.layout.icon', 'form.layout.image', 'form.layout.repeater', 'form.layout.tabs',
      'form.layout.text', 'form.layout.unordered-list', 'form.layout.wizard', 'form.product-name', 'form.section',
    ])
    expect(forms.every((entry) => entry.family === 'form' && entry.filamentCompatibility === '5.x')).toBe(true)
  })

  it('preserves every named form and schema selector contract', () => {
    const forms = createThemeRegistry().entries.filter((entry) => entry.id.startsWith('form.'))
    const selectors: Record<string, string[]> = {
      'form.section': ['.fi-section'], 'form.layout.wizard': ['.fi-sc-wizard', '.fi-sc-wizard-header-step-btn', '.fi-sc-wizard-step'],
      'form.layout.tabs': ['.fi-tabs', '.fi-tabs-item'], 'form.control.select': ['.fi-fo-select', '.fi-select-input'],
      'form.control.radio': ['.fi-fo-radio', '.fi-radio-input'], 'form.control.toggle-buttons': ['.fi-fo-toggle-buttons', '.fi-fo-toggle-buttons-input'],
      'form.control.checkbox': ['.fi-checkbox-input'], 'form.control.checkbox-list': ['.fi-fo-checkbox-list'],
      'form.control.code-editor': ['.fi-fo-code-editor'], 'form.control.color-picker': ['.fi-fo-color-picker'],
      'form.control.builder': ['.fi-fo-builder'], 'form.control.key-value': ['.fi-fo-key-value'],
      'form.control.markdown-editor': ['.fi-fo-markdown-editor'], 'form.control.modal-table-select': ['.fi-fo-modal-table-select'],
      'form.control.one-time-code': ['.fi-one-time-code-input-ctn'], 'form.control.rich-editor': ['.fi-fo-rich-editor'],
      'form.control.slider': ['.fi-fo-slider'], 'form.control.tags-input': ['.fi-fo-tags-input'], 'form.layout.fieldset': ['.fi-fieldset'],
      'form.layout.actions': ['.fi-sc-actions'], 'form.layout.callout': ['.fi-callout', '.fi-sc-callout'],
      'form.layout.empty-state': ['.fi-empty-state', '.fi-sc-empty-state'], 'form.layout.fused-group': ['.fi-sc-fused-group'],
      'form.layout.form': ['.fi-sc-form'], 'form.layout.grid': ['.fi-grid'], 'form.layout.icon': ['.fi-sc-icon'],
      'form.layout.image': ['.fi-sc-image'], 'form.layout.repeater': ['.fi-fo-repeater'], 'form.layout.text': ['.fi-sc-text'],
      'form.layout.unordered-list': ['.fi-sc-unordered-list'],
    }
    for (const [id, expected] of Object.entries(selectors)) expect(forms.find((entry) => entry.id === id)?.selectors).toEqual(expected)
    expect(forms.filter((entry) => entry.id !== 'form.product-name').every((entry) => entry.controls.length === 0)).toBe(true)
    expect(forms.filter((entry) => entry.id !== 'form.product-name').every((entry) => entry.variants.length === 0 && entry.states.length === 0)).toBe(true)
  })

  it('registers action, modal, and notification component variants and states', () => {
    const entries = createThemeRegistry().entries
    expect(entries.find((entry) => entry.id === 'action.button')).toMatchObject({ family: 'action', selectors: ['.fi-btn'], variants: ['primary', 'danger', 'success', 'warning', 'info', 'gray', 'outline', 'icon-only'], states: ['default', 'disabled', 'loading'] })
    expect(entries.find((entry) => entry.id === 'action.group')).toMatchObject({ family: 'action', selectors: ['.fi-ac'], variants: ['grouped'], states: ['default'] })
    expect(entries.find((entry) => entry.id === 'modal.window')).toMatchObject({ family: 'modal', selectors: ['.fi-modal-window'], variants: ['small', 'medium', 'large', 'extra-large', 'slide-over'], states: ['open'] })
    for (const id of ['modal.heading', 'modal.content', 'modal.footer']) expect(entries.find((entry) => entry.id === id)).toMatchObject({ family: 'modal', states: ['open'] })
    expect(entries.find((entry) => entry.id === 'notification.container')).toMatchObject({ family: 'notification', selectors: ['.fi-no'], variants: ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'], states: ['visible'] })
    expect(entries.find((entry) => entry.id === 'notification.item')).toMatchObject({ family: 'notification', selectors: ['.fi-no-notification'], variants: ['success', 'danger', 'warning', 'info'], states: ['persistent', 'transient'] })
  })

  it('registers only the Product name input as an editable production form target', () => {
    const entries = createThemeRegistry().entries
    expect(entries.find((entry) => entry.id === 'form.product-name')).toMatchObject({ family: 'form', selectors: ['.fi-fo-text-input .fi-input'], variants: ['default'], states: ['focus'], controls: [{ id: 'background', valueType: 'color' }] })
    expect(entries.filter((entry) => entry.controls.length > 0).map((entry) => entry.id)).toEqual(['button.primary', 'button.secondary', 'form.product-name', 'global.primary'])
  })
})
