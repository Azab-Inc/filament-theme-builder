import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CustomColorPanel from '@/components/CustomColorPanel.vue'

describe('Custom color tab native picker', () => {
  it.each(['', 'var(--primary-500)', '#12345678'])('preserves %s until explicit native replacement', async (value) => {
    const wrapper = mount(CustomColorPanel, { props: { id: 'preserved', label: 'Preserved', value, profile: 'foundation' } })
    const native = wrapper.get<HTMLInputElement>('input[type="color"]')
    expect(native.attributes('disabled')).toBeUndefined()
    expect(wrapper.get('#preserved-custom-color').element).toHaveProperty('value', value)
    expect(wrapper.emitted('apply')).toBeUndefined()
    await native.setValue('#123456')
    expect(wrapper.emitted('apply')).toEqual([['#123456']])
    wrapper.unmount()
  })

  it('allows explicitly choosing fallback black without overwriting a reference on open', async () => {
    const wrapper = mount(CustomColorPanel, { props: { id: 'black-choice', label: 'Black choice', value: 'var(--primary-500)', profile: 'foundation' } })
    expect(wrapper.emitted('apply')).toBeUndefined()
    await wrapper.findAll('button').find((button) => button.text() === 'Use black')!.trigger('click')
    expect(wrapper.emitted('apply')).toEqual([['#000000']])
    wrapper.unmount()
  })
  it('does not apply a preview and applies one explicit native selection', async () => {
    const wrapper = mount(CustomColorPanel, { props: {
      id: 'custom-native', label: 'Page surface', value: '#abcdef', profile: 'foundation',
    } })
    const native = wrapper.get('[aria-label="Page surface custom color picker"]')
    expect(wrapper.emitted('apply')).toBeUndefined()
    await native.setValue('#654321')
    expect(wrapper.emitted('apply')).toEqual([['#654321']])
    wrapper.unmount()
  })

  it('keeps references unchanged until an explicit native replacement', async () => {
    const wrapper = mount(CustomColorPanel, { props: {
      id: 'reference-native', label: 'Page surface', value: 'var(--gray-900)', profile: 'foundation',
    } })
    const native = wrapper.get('[aria-label="Page surface custom color picker"]')
    expect(native.attributes('disabled')).toBeUndefined()
    expect((native.element as HTMLInputElement).value).toBe('#000000')
    expect(wrapper.get('#reference-native-custom-color').element).toHaveProperty('value', 'var(--gray-900)')
    expect(wrapper.emitted('apply')).toBeUndefined()
    await native.setValue('#234567')
    expect(wrapper.emitted('apply')).toEqual([['#234567']])
    wrapper.unmount()
  })

  it('associates invalid text with its inline error and disables spell correction', async () => {
    const wrapper = mount(CustomColorPanel, { props: {
      id: 'invalid-color', label: 'Primary', value: '#abcdef', profile: 'foundation',
    } })
    const input = wrapper.get('#invalid-color-custom-color')
    await input.setValue('not-a-color')

    expect(input.attributes('name')).toBe('invalid-color-custom-color')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('spellcheck')).toBe('false')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('invalid-color-custom-error')
    expect(wrapper.get('#invalid-color-custom-error').text()).toContain('valid color')
  })
})
