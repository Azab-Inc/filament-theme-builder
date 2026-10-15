import type { RegistryEntry } from '@/models/theme-registry.model'
import { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog-constants'

function formEntry(id: string, label: string, selectors: readonly string[]): RegistryEntry {
  return {
    id,
    label,
    family: 'form',
    selectors,
    controls: [],
    variants: [],
    states: [],
    filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
  }
}

function infolistEntry(id: string, label: string, selectors: readonly string[]): RegistryEntry {
  return { ...formEntry(id, label, selectors), family: 'infolist' }
}

export const formRegistryEntries: readonly RegistryEntry[] = [
  formEntry('form.control.builder', 'Builder control', ['.fi-fo-builder']),
  formEntry('form.control.checkbox', 'Checkbox control', ['.fi-checkbox-input']),
  formEntry('form.control.checkbox-list', 'Checkbox list control', ['.fi-fo-checkbox-list']),
  formEntry('form.control.code-editor', 'Code editor control', ['.fi-fo-code-editor']),
  formEntry('form.control.color-picker', 'Color picker control', ['.fi-fo-color-picker']),
  formEntry('form.control.date', 'Date control', ['.fi-fo-date-time-picker']),
  formEntry('form.control.file-upload', 'File upload control', ['.fi-fo-file-upload']),
  formEntry('form.control.key-value', 'Key-value control', ['.fi-fo-key-value']),
  formEntry('form.control.markdown-editor', 'Markdown editor control', ['.fi-fo-markdown-editor']),
  formEntry('form.control.modal-table-select', 'Modal table select control', [
    '.fi-fo-modal-table-select',
  ]),
  formEntry('form.control.one-time-code', 'One-time code control', ['.fi-one-time-code-input-ctn']),
  formEntry('form.control.radio', 'Radio control', ['.fi-fo-radio', '.fi-radio-input']),
  formEntry('form.control.rich-editor', 'Rich editor control', ['.fi-fo-rich-editor']),
  formEntry('form.control.select', 'Select control', ['.fi-fo-select', '.fi-select-input']),
  formEntry('form.control.slider', 'Slider control', ['.fi-fo-slider']),
  formEntry('form.control.tags-input', 'Tags input control', ['.fi-fo-tags-input']),
  formEntry('form.control.text', 'Text control', ['.fi-fo-text-input', '.fi-input']),
  formEntry('form.control.textarea', 'Textarea control', ['.fi-fo-textarea']),
  formEntry('form.control.toggle', 'Toggle control', ['.fi-fo-toggle', '.fi-toggle']),
  formEntry('form.control.toggle-buttons', 'Toggle buttons control', [
    '.fi-fo-toggle-buttons',
    '.fi-fo-toggle-buttons-input',
  ]),
  formEntry('form.field', 'Form field', ['.fi-fo-field']),
  formEntry('form.layout.actions', 'Actions layout', ['.fi-sc-actions']),
  formEntry('form.layout.callout', 'Callout layout', ['.fi-callout', '.fi-sc-callout']),
  formEntry('form.layout.empty-state', 'Empty state layout', [
    '.fi-empty-state',
    '.fi-sc-empty-state',
  ]),
  formEntry('form.layout.fieldset', 'Fieldset layout', ['.fi-fieldset']),
  formEntry('form.layout.fused-group', 'Fused group layout', ['.fi-sc-fused-group']),
  formEntry('form.layout.form', 'Schema form layout', ['.fi-sc-form']),
  formEntry('form.layout.grid', 'Grid layout', ['.fi-grid']),
  formEntry('form.layout.icon', 'Icon layout', ['.fi-sc-icon']),
  formEntry('form.layout.image', 'Image layout', ['.fi-sc-image']),
  formEntry('form.layout.repeater', 'Repeater layout', ['.fi-fo-repeater']),
  formEntry('form.layout.tabs', 'Tabs layout', ['.fi-tabs', '.fi-tabs-item']),
  formEntry('form.layout.text', 'Text layout', ['.fi-sc-text']),
  formEntry('form.layout.unordered-list', 'Unordered list layout', ['.fi-sc-unordered-list']),
  formEntry('form.layout.wizard', 'Wizard layout', [
    '.fi-sc-wizard',
    '.fi-sc-wizard-header-step-btn',
    '.fi-sc-wizard-step',
  ]),
  formEntry('form.section', 'Section layout', ['.fi-section']),
  infolistEntry('infolist.entry.color', 'Infolist color entry', ['.fi-in-color']),
  infolistEntry('infolist.entry.icon', 'Infolist icon entry', ['.fi-in-icon']),
  infolistEntry('infolist.entry.image', 'Infolist image entry', ['.fi-in-image']),
  infolistEntry('infolist.entry.key-value', 'Infolist key-value entry', ['.fi-in-key-value']),
  infolistEntry('infolist.entry.repeatable', 'Infolist repeatable entry', [
    '.fi-in-repeatable',
    '.fi-in-table-repeatable',
  ]),
  infolistEntry('infolist.entry.text', 'Infolist text entry', ['.fi-in-text']),
  infolistEntry('infolist.layout.flex', 'Infolist flex layout', ['.fi-sc-flex']),
]
