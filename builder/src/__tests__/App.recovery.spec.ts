import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import { createDefaultThemeState } from '@/utils/foundation-defaults'

describe('App recovery', () => {
  it('exposes explicit recovery actions for an archived legacy theme', async () => {
    const legacy = createDefaultThemeState()
    delete (legacy.foundations as unknown as { explicitPaths?: string[] }).explicitPaths
    delete (legacy.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    localStorage.setItem('ftb-theme', JSON.stringify(legacy))
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('[role="alert"]').text()).toContain('legacy customization')
    expect(wrapper.get('button[aria-label="Restore legacy customization"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Download archived legacy JSON"]')).toBeTruthy()
    await wrapper.get('button[aria-label="Restore legacy customization"]').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('offers raw download but disables restoration for malformed archived JSON', async () => {
    localStorage.setItem('ftb-theme', '{invalid')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('[role="alert"]').text()).toContain('not valid JSON')
    expect((wrapper.get('button[aria-label="Restore legacy customization"]').element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.get('button[aria-label="Download archived legacy JSON"]')).toBeTruthy()
  })
})
