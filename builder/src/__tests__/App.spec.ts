import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('embeds the public Filament preview and reserves a subtle notice area', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
    expect(wrapper.find('[data-demo-notice]').exists()).toBe(true)
    expect(wrapper.get('input[type="color"]').attributes('aria-label')).toBe('Primary color')
    expect(wrapper.find('button[aria-label="Undo"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Redo"]').exists()).toBe(true)
  })

  it('enables undo and immediately updates the color editor after a color change', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const colorInput = wrapper.get('input[type="color"]')

    await colorInput.setValue('#0f766e')

    expect((colorInput.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('button[aria-label="Undo"]').attributes('disabled')).toBeUndefined()
  })

  it('exposes accessible foundation sections without replacing the preview controls', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('h2').text()).toBe('Foundations')
    expect(wrapper.get('input[aria-label="primary shade 500 override"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Light mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('select[aria-label="Density"], select#density')).toBeTruthy()
    expect(wrapper.get('#body-font-name')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Reset radius"]')).toBeTruthy()
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
  })

  it('keeps typography as names-only state and supports density and mode controls', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('#body-font-name').setValue('Editorial Sans')
    await wrapper.get('button[aria-label="Dark mode"]').trigger('click')
    await wrapper.get('button[aria-label="Compact density"]').trigger('click')

    expect(wrapper.get('#body-font-name').element).toHaveProperty('value', 'Editorial Sans')
    expect(wrapper.get('button[aria-label="Dark mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('#density').element).toHaveProperty('value', 'compact')
  })
})
