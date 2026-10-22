import { describe, expect, it } from 'vitest'

import { createThemeRegistry } from '@/registry/theme-registry'

describe('theme registry catalog', () => {
  it('keeps labels independent from stable semantic IDs and registers primary selectors', () => {
    const registry = createThemeRegistry()
    expect(registry.entries.find((entry) => entry.id === 'button.primary')?.label).toBe('Primary button')
    expect(registry.entries.map((entry) => entry.id)).toEqual([
      'action.button', 'action.group', 'button.primary', 'button.secondary', 'dashboard.chart', 'dashboard.stats', 'dashboard.table',
      'form.control.builder', 'form.control.checkbox', 'form.control.checkbox-list', 'form.control.code-editor', 'form.control.color-picker',
      'form.control.date', 'form.control.file-upload', 'form.control.key-value', 'form.control.markdown-editor', 'form.control.modal-table-select',
      'form.control.one-time-code', 'form.control.radio', 'form.control.rich-editor', 'form.control.select', 'form.control.slider',
      'form.control.tags-input', 'form.control.text', 'form.control.textarea', 'form.control.toggle', 'form.control.toggle-buttons',
      'form.field', 'form.layout.actions', 'form.layout.callout', 'form.layout.empty-state', 'form.layout.fieldset', 'form.layout.form',
      'form.layout.fused-group', 'form.layout.grid', 'form.layout.icon', 'form.layout.image', 'form.layout.repeater', 'form.layout.tabs',
      'form.layout.text', 'form.layout.unordered-list', 'form.layout.wizard', 'form.product-name', 'form.section', 'global.primary',
      'infolist.entry.color', 'infolist.entry.icon', 'infolist.entry.image', 'infolist.entry.key-value', 'infolist.entry.repeatable',
      'infolist.entry.text', 'infolist.layout.flex', 'modal.content', 'modal.footer', 'modal.heading', 'modal.window', 'navigation.global-search',
      'navigation.login', 'navigation.profile-menu', 'navigation.sidebar', 'navigation.sidebar-badge', 'navigation.tenant-switcher',
       'navigation.topbar', 'notification.container', 'notification.item', 'table.cell.image', 'table.cell.text', 'table.container', 'table.header', 'table.header-cell',
    ])
    expect(registry.entries.find((entry) => entry.id === 'button.primary')?.selectors).toEqual(['.fi-btn.fi-color-primary'])
    expect(registry.entries.find((entry) => entry.id === 'button.secondary')?.selectors).toEqual(['.fi-btn.fi-outlined'])
  })

  it('registers unique selector-only entries for first-party infolist components and layouts', () => {
    const entries = createThemeRegistry().entries.filter(({ id }) => id.startsWith('infolist.'))
    expect(entries.map(({ id }) => id)).toEqual(['infolist.entry.color', 'infolist.entry.icon', 'infolist.entry.image', 'infolist.entry.key-value', 'infolist.entry.repeatable', 'infolist.entry.text', 'infolist.layout.flex'])
    expect(entries.every(({ controls, variants, states }) => !controls.length && !variants.length && !states.length)).toBe(true)
    expect(new Set(entries.flatMap(({ selectors }) => selectors)).size).toBe(entries.flatMap(({ selectors }) => selectors).length)
  })

  it('registers the verified dashboard and navigation surfaces', () => {
    const registry = createThemeRegistry()
    const ids = registry.entries.map(({ id }) => id)
    expect(ids).toEqual(expect.arrayContaining(['dashboard.chart', 'dashboard.stats', 'dashboard.table', 'navigation.sidebar', 'navigation.sidebar-badge', 'navigation.topbar', 'navigation.global-search', 'navigation.profile-menu', 'navigation.login', 'navigation.tenant-switcher']))
    expect(registry.entries.filter(({ id }) => id.startsWith('navigation.')).every(({ filamentCompatibility }) => filamentCompatibility === '5.x')).toBe(true)
  })

  it('allows selector-only surfaces without inventing controls or state metadata', () => {
    const entries = createThemeRegistry().entries.filter((entry) => entry.family === 'form' && entry.id !== 'form.product-name')
    expect(entries.every((entry) => entry.controls.length === 0 && entry.variants.length === 0 && entry.states.length === 0)).toBe(true)
  })

  it('registers padding metadata without changing the existing core color entries', () => {
    const registry = createThemeRegistry()
    expect(registry.entries.find((entry) => entry.id === 'button.primary')).toMatchObject({
      id: 'button.primary',
      variants: ['primary', 'secondary'],
    })
    expect(registry.entries.flatMap((entry) => entry.paddingTargets ?? []).map(({ id }) => id)).toEqual(expect.arrayContaining([
      'forms.input', 'forms.textarea', 'forms.select', 'forms.section', 'forms.section.header', 'forms.section.content',
      'tables.container', 'tables.header', 'tables.header-cell', 'tables.cell.text', 'tables.cell.image', 'buttons.default',
    ]))
  })
})
