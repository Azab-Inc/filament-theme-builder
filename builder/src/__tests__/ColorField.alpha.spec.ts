import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('ColorField alpha preservation', () => {
  it('keeps an eight-digit palette literal intact and disables the native picker without edits', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'alpha-token', label: 'Alpha token', value: '#12345678', effectiveValue: '#12345678', profile: 'hex68', contextKey: 'alpha',
    } })
    const text = wrapper.get('#alpha-token')
    const native = wrapper.get('[aria-label="Alpha token native color picker"]')
    expect((text.element as HTMLInputElement).value).toBe('#12345678')
    expect(native.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Native color picker unavailable')
    await wrapper.get('[aria-label="Choose Alpha token from Tailwind palette"]').trigger('click')
    const custom = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((button) => button.textContent?.trim() === 'Custom')!
    custom.click()
    await wrapper.get('[aria-label="Choose Alpha token from Tailwind palette"]').trigger('click')
    expect((text.element as HTMLInputElement).value).toBe('#12345678')
    expect(wrapper.emitted('input')).toBeUndefined()
    wrapper.unmount()
  })
})
