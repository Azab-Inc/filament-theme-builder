import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from '@/App.vue'

describe('App composition shell parity', () => {
  it('composes the normal editor through BuilderShell', () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.findComponent({ name: 'BuilderShell' }).exists()).toBe(true)

    wrapper.unmount()
  })

  it('keeps App.vue below the maintainability limit', () => {
    const source = readFileSync(`${process.cwd()}/src/App.vue`, 'utf8')

    expect(source.split('\n').length).toBeLessThanOrEqual(100)
  })
})
