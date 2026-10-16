import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'

describe('App JSON export', () => {
  it('exports canonical JSON with rawOverrides', async () => {
    const state = createDefaultThemeState()
    state.rawOverrides = [{ selector: '.fi-input', properties: { 'border-radius': '0.75rem' } }]
    localStorage.setItem('ftb-theme', JSON.stringify(state))
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:theme-json')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    createObjectURL.mockClear()
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Export theme JSON"]').trigger('click')

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(JSON.parse(await blob.text()).rawOverrides).toEqual(state.rawOverrides)
    wrapper.unmount()
  })

  it('preserves the public export filenames and JSON export bytes', async () => {
    localStorage.clear()
    const downloads: string[] = []
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:builder-export')
    createObjectURL.mockClear()
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Export theme JSON"]').trigger('click')
    const jsonBlob = createObjectURL.mock.calls[0]?.[0]
    expect(jsonBlob).toBeInstanceOf(Blob)
    expect(await (jsonBlob as Blob).text()).toBe(
      JSON.stringify(serializeCanonicalTheme(createDefaultThemeState()), null, 2),
    )

    await wrapper.get('button[aria-label="Download vanilla CSS"]').trigger('click')
    await wrapper.get('button[aria-label="Export PanelProvider icon config"]').trigger('click')
    await wrapper.get('button[aria-label="Export panel branding JSON"]').trigger('click')
    await wrapper.get('button[aria-label="Export PanelProvider branding config"]').trigger('click')

    expect(downloads).toEqual([
      'filament-theme.json',
      'theme.css',
      'filament-panel-icon-config.php',
      'filament-panel-branding.json',
      'filament-panel-branding.php',
    ])
    wrapper.unmount()
  })
})
