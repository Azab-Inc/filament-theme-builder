import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('ColorField alpha preservation', () => {
  it('preserves an eight-digit alpha literal until an explicit replacement', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'alpha-token', label: 'Alpha token', value: '#12345678', effectiveValue: '#12345678', profile: 'hex68', contextKey: 'alpha',
    } })
    const text = wrapper.get('#alpha-token')
    const native = wrapper.get('[aria-label="Alpha token native color picker"]')
    expect((text.element as HTMLInputElement).value).toBe('#12345678')
    expect((native.element as HTMLInputElement).value).toBe('#000000')
    expect(native.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('Choosing a native color replaces the current value')
    await wrapper.get('[aria-label="Choose Alpha token from Tailwind palette"]').trigger('click')
    document.querySelector<HTMLButtonElement>('[aria-label="Close Alpha token color choices"]')?.click()
    expect((text.element as HTMLInputElement).value).toBe('#12345678')
    expect(wrapper.emitted('input')).toBeUndefined()
    await native.setValue('#654321')
    expect((wrapper.emitted('input')?.[0]?.[0] as Event).target).toBe(native.element)
    wrapper.unmount()
  })
})
