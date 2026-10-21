import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('color field labels and context', () => {
  it('preserves separate visible and accessible names', () => {
    const wrapper = mount(ColorField, { props: {
      id: 'shade-50', label: 'primary shade 50 override', visibleLabel: '50',
      value: '', effectiveValue: '#f9fafb', profile: 'hex68', contextKey: 'primary:50',
    } })
    expect(wrapper.get('label[for="shade-50"]').text()).toBe('50')
    expect(wrapper.get('#shade-50').attributes('aria-label')).toBe('primary shade 50 override')
    expect((wrapper.get('#shade-50').element as HTMLInputElement).labels?.[0]).toBe(wrapper.get('label').element)
    wrapper.unmount()
  })

  it('clears a draft on reset even when the canonical value is unchanged', async () => {
    const wrapper = mount(ColorField, { props: {
      id: 'resettable', label: 'Resettable', value: '#abcdef', effectiveValue: '#abcdef',
      profile: 'hex6', contextKey: 'resettable', resetKey: 0,
    } })
    await wrapper.get('#resettable').setValue('#not-a-color')
    expect((wrapper.get('#resettable').element as HTMLInputElement).value).toBe('#not-a-color')
    await wrapper.setProps({ resetKey: 1 })
    expect((wrapper.get('#resettable').element as HTMLInputElement).value).toBe('#abcdef')
    wrapper.unmount()
  })

  it('closes and discards drafts when field context changes', async () => {
    const wrapper = mount(ColorField, { props: {
      id: 'contextual', label: 'Contextual', value: 'var(--gray-900)', effectiveValue: '#101828',
      profile: 'foundation', contextKey: 'light',
    } })
    await wrapper.get('[aria-label="Choose Contextual from Tailwind palette"]').trigger('click')
    expect(document.getElementById('contextual-color-popover')).toBeTruthy()
    await wrapper.setProps({ contextKey: 'dark', value: '#101828', effectiveValue: '#101828' })
    expect(document.getElementById('contextual-color-popover')).toBeNull()
    expect((wrapper.get('#contextual').element as HTMLInputElement).value).toBe('#101828')
    wrapper.unmount()
  })
})
