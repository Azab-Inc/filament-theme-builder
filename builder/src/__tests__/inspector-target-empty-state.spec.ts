import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InspectorTargetControls from '@/components/InspectorTargetControls.vue'
import RawVisualProperties from '@/components/RawVisualProperties.vue'

describe('Inspector target empty state', () => {
  it('explains how to pick a target and disables the empty scope select', () => {
    const wrapper = mount(InspectorTargetControls, { props: { selector: '', evidence: null } })
    const select = wrapper.get('#inspector-target-scope')
    expect(select.attributes('disabled')).toBeDefined()
    expect(select.get('option').text()).toBe('No target picked')
    expect(wrapper.text()).toContain('Turn on Inspector in the toolbar')
  })

  it('keeps a typed custom selector editable when no evidence options exist', () => {
    const wrapper = mount(InspectorTargetControls, { props: { selector: '.fi-section', evidence: null } })
    const select = wrapper.get('#inspector-target-scope')
    expect(select.attributes('disabled')).toBeDefined()
    expect(select.get('option').text()).toBe('Custom selector')
    expect(wrapper.text()).not.toContain('Turn on Inspector in the toolbar')
  })

  it('disables raw visual property controls until a selector is picked', () => {
    const props = (selector: string) => ({
      selector,
      selectorClassification: selector
        ? { selector, quality: 'stable' as const }
        : { selector: null, quality: 'unavailable' as const },
      properties: ['color'] as const,
      propertyValue: () => '',
      visible: true,
    })
    const empty = mount(RawVisualProperties, { props: props('') })
    expect(empty.get('fieldset').attributes('disabled')).toBeDefined()
    expect((empty.get('#raw-color').element as HTMLInputElement).matches(':disabled')).toBe(true)

    const picked = mount(RawVisualProperties, { props: props('.fi-section') })
    expect(picked.get('fieldset').attributes('disabled')).toBeUndefined()
    expect((picked.get('#raw-color').element as HTMLInputElement).matches(':disabled')).toBe(false)
  })
})
