import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('embeds the public Filament preview and reserves a subtle notice area', () => {
    const wrapper = mount(App)
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
    expect(wrapper.find('[data-demo-notice]').exists()).toBe(true)
  })
})
