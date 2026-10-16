import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import ThrowawayThemePrototype from '../components/ThrowawayThemePrototype.vue'

describe('App preview', () => {
  it('embeds the public Filament preview and reserves a subtle notice area', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
    expect(wrapper.find('[data-demo-notice]').exists()).toBe(true)
    expect(wrapper.get('input[type="color"]').attributes('aria-label')).toBe('Primary color')
    expect(wrapper.find('button[aria-label="Undo"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Redo"]').exists()).toBe(true)
  })

  it('passes the supplied demo URL to the prototype iframe and gives it explicit height', () => {
    const previewUrl = 'http://127.0.0.1:4174/demo/admin'
    const wrapper = mount(ThrowawayThemePrototype, {
      props: { initialVariant: 'C', previewUrl },
    })
    const iframe = wrapper.get('iframe')

    expect(iframe.attributes('src')).toBe(previewUrl)
    expect(iframe.attributes('style')).toContain('height: 100%')

    wrapper.unmount()
  })
})
