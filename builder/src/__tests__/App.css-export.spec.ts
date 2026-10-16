import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import * as vanillaCssExport from '@/utils/vanilla-css-export'

describe('App CSS export', () => {
  it('copies the exact generated CSS content to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Copy vanilla CSS"]').trigger('click')

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0]?.[0]).toContain('/* Generated with Filament Theme Builder */')
    expect(wrapper.get('[data-export-status]').text()).toContain('copied to clipboard')
    wrapper.unmount()
  })

  it('downloads CSS as a Blob containing raw rules', async () => {
    const state = createDefaultThemeState()
    state.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#0f766e' } }]
    localStorage.setItem('ftb-theme', JSON.stringify(state))
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:theme-css')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Download vanilla CSS"]').trigger('click')

    const blob = createObjectURL.mock.calls[0]?.[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(await (blob as Blob).text()).toContain('.fi-btn {')
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:theme-css')
    wrapper.unmount()
  })

  it('shows raw export errors while retaining and copying valid CSS output', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const exportSpy = vi.spyOn(vanillaCssExport, 'exportVanillaCss').mockReturnValue({
      css: '/* Foundations */\n.fi-btn { color: #ffffff; }',
      errors: ['Selector must contain only safe .fi-* class selectors and limited pseudo-classes'],
    })

    await wrapper.get('button[aria-label="Copy vanilla CSS"]').trigger('click')

    expect(wrapper.get('[data-export-status]').text()).toMatch(/safe \.fi-\* class selectors/i)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/* Foundations */'))
    exportSpy.mockRestore()
    wrapper.unmount()
  })
})
