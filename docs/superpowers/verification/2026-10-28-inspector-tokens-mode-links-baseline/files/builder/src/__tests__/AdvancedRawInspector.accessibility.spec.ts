import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdvancedRawInspector from '@/components/AdvancedRawInspector.vue'

describe('Advanced Inspector error associations', () => {
  it('connects an invalid selector to its inline error text', () => {
    const wrapper = mount(AdvancedRawInspector, { props: {
      selector: '.unsafe', selectorError: 'Choose a supported selector.',
      selectorClassification: { selector: '.unsafe', quality: 'unavailable' },
      properties: [], propertyValue: () => '', visible: true,
    } })
    const input = wrapper.get('#raw-selector')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('raw-selector-error')
    expect(wrapper.get('#raw-selector-error').text()).toBe('Choose a supported selector.')
  })
})
