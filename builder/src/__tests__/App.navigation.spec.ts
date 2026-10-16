import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App navigation', () => {
  it('keeps the normal editor layout when prototype mode is absent', () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.find('[data-prototype]').exists()).toBe(false)
    expect(wrapper.find('section.foundations').exists()).toBe(true)
  })

  it('promotes accessible Sidebar and Top navigation modes without forking editor state', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe').element
    const iframeSrc = wrapper.get('iframe').attributes('src')
    const primary = wrapper.get('input[type="color"]')

    expect(wrapper.get('[data-editor-navigation]')).toBeTruthy()
    expect(wrapper.get('[data-editor-navigation] [role="radio"][aria-checked="true"]').attributes('aria-label')).toBe('Sidebar')
    expect(wrapper.get('[data-editor-nav-rail]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="foundations"]')).toBeTruthy()

    await primary.setValue('#0f766e')
    await wrapper.get('input[value="top"]').setValue(true)
    await wrapper.get('[data-editor-section-tab="components"]').trigger('click')

    expect(wrapper.get('[data-editor-navigation] [role="radio"][aria-checked="true"]').attributes('aria-label')).toBe('Top navigation')
    expect(wrapper.get('[data-editor-tabs]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="components"]')).toBeTruthy()
    expect((primary.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('iframe').element).toBe(iframe)
    expect(wrapper.get('iframe').attributes('src')).toBe(iframeSrc)

    await wrapper.get('input[value="sidebar"]').setValue(true)

    expect(wrapper.get('[data-editor-nav-rail]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="components"]')).toBeTruthy()
    expect(wrapper.get('iframe').element).toBe(iframe)

    await wrapper.get('[data-editor-section-button="foundations"]').trigger('click')
    expect(wrapper.get('[data-editor-section="foundations"]')).toBeTruthy()
    expect((primary.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('iframe').element).toBe(iframe)

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('does not expose the production prototype query path', () => {
    window.history.replaceState({}, '', '/?prototype=1&variant=C')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.find('[data-prototype]').exists()).toBe(false)
    expect(wrapper.find('[data-editor-navigation]').exists()).toBe(true)

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })
})
