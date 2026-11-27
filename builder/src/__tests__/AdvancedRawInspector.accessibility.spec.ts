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

  it('exposes an accessible unique ID switch and rejects malformed edits inline', async () => {
    const wrapper = mount(AdvancedRawInspector, { props: {
      selector: '.fi-section-header', selectorClassification: { selector: '.fi-section-header', quality: 'stable' },
      properties: [], propertyValue: () => '', visible: true, uniqueElementIdAvailable: true,
      uniqueElementIdEnabled: true, uniqueElementId: 'ftb-section-header-2',
    } })
    expect(wrapper.get('#unique-element-id-toggle').attributes('role')).toBe('switch')
    await wrapper.get('#unique-element-id').setValue('bad id')
    expect(wrapper.get('#unique-element-id').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#unique-element-id').attributes('aria-describedby')).toBe('unique-element-id-error')
  })

  it('keeps the accepted ID visible when a valid rename is rejected', () => {
    const wrapper = mount(AdvancedRawInspector, { props: {
      selector: '#accepted-id', selectorClassification: { selector: '#accepted-id', quality: 'stable' },
      properties: [], propertyValue: () => '', visible: true, uniqueElementIdAvailable: true,
      uniqueElementIdEnabled: true, uniqueElementId: 'accepted-id', uniqueElementIdError: 'This ID is already assigned.',
    } })
    expect(wrapper.get('#unique-element-id').element).toHaveProperty('value', 'accepted-id')
    expect(wrapper.get('#unique-element-id').attributes('aria-describedby')).toBe('unique-element-id-error')
    expect(wrapper.get('#unique-element-id-error').text()).toContain('already assigned')
  })
})
