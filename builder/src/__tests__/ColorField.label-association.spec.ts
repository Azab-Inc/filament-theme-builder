import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('native picker field label association', () => {
  it('keeps native/text names while linking the native picker to the visible field label and status', () => {
    const wrapper = mount(ColorField, { props: {
      id: 'labelled-surface', label: 'Page surface', value: '#ffffff', effectiveValue: '#ffffff',
      profile: 'foundation', contextKey: 'light', statusId: 'page-status',
    } })
    const native = wrapper.get('input[type="color"]').element as HTMLInputElement
    const label = wrapper.get('label[for="labelled-surface"]')
    expect(label.attributes('id')).toBeTruthy()
    expect(native.labels).toHaveLength(1)
    expect(native.labels?.[0]?.textContent).toContain('Page surface')
    expect(native.getAttribute('aria-label')).toBe('Page surface native color picker')
    expect(native.getAttribute('aria-describedby')?.split(' ')).toContain(label.attributes('id'))
    expect(native.getAttribute('aria-describedby')?.split(' ')).toContain('page-status')
    expect(wrapper.get('#labelled-surface').attributes('aria-label')).toBe('Page surface')
    wrapper.unmount()
  })
})
