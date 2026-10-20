import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App typography and density', () => {
  it('keeps typography as names-only state and supports density and mode controls', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('#body-font-name').setValue('Editorial Sans')
    await wrapper.get('button[aria-label="Dark mode"]').trigger('click')
    await wrapper.get('button[aria-label="Compact density"]').trigger('click')

    expect(wrapper.get('#body-font-name').element).toHaveProperty('value', 'Editorial Sans')
    expect(wrapper.get('button[aria-label="Dark mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('#density').element).toHaveProperty('value', 'compact')
  })

  it('renders every exposed foundation control with an individual reset', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('button[aria-label="Light mode"]').trigger('click')
    for (const palette of ['primary', 'success', 'warning', 'danger', 'info', 'gray']) {
      await wrapper.get(`[data-palette-header="${palette}"]`).trigger('click')
      expect(wrapper.find(`[aria-label="Reset ${palette} palette base"]`).exists(), palette).toBe(true)
    }

    for (const control of [
      'density',
      'spacing 1',
      'border default light',
      'border strong light',
      'text primary light',
      'text muted light',
      'text disabled light',
      'page surface',
      'body font',
      'radius',
      'border width',
      'shadow',
    ]) {
      expect(wrapper.find(`[aria-label="Reset ${control}"]`).exists(), control).toBe(true)
    }
  })
})
