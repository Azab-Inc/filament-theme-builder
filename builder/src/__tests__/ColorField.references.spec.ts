import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('ColorField reference presentation', () => {
  const props = { id: 'reference-field', label: 'Color', value: '#123456', effectiveValue: '#123456', profile: 'hex6' as const, contextKey: 'references' }

  it('shows built-ins and simple custom names, forwarding one owned input event', async () => {
    const wrapper = mount(ColorField, { props, global: { provide: { 'user-token-options': ref(['user.color.secondary']) } } })
    const select = wrapper.get<HTMLSelectElement>('select[data-user-token-select]')
    expect(select.get('option[value="var(--ftb-palette-primary-500)"]').text()).toBe('primary 500')
    expect(select.get('option[value="user.color.secondary"]').text()).toBe('secondary')
    await select.setValue('user.color.secondary')
    expect(wrapper.emitted('input')).toHaveLength(1)
    expect((wrapper.emitted('input')![0]![0] as Event).target).toBe(wrapper.get('#reference-field').element)
    await wrapper.setProps({ value: 'user.color.secondary' })
    expect(select.element.selectedOptions[0]?.text).toBe('secondary')
    await select.setValue('')
    expect(wrapper.emitted('input')).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not offer reference choices in literal-only seed controls', async () => {
    const wrapper = mount(ColorField, { props: { ...props, profile: 'hex68' } })
    expect(wrapper.find('select[data-user-token-select]').exists()).toBe(false)
    await wrapper.get('[aria-label="Choose Color from Tailwind palette"]').trigger('click')
    expect(document.getElementById('reference-field-theme-tab')).toBeNull()
    wrapper.unmount()
  })

  it('keeps an existing native reference selected without silently changing its meaning', async () => {
    const wrapper = mount(ColorField, { props: { ...props, value: 'var(--primary-500)', effectiveValue: 'var(--primary-500)' } })
    const select = wrapper.get<HTMLSelectElement>('select[data-user-token-select]')
    expect(select.element.value).toBe('var(--primary-500)')
    expect(select.element.selectedOptions[0]?.text).toBe('primary 500 (native)')
    await select.setValue('')
    expect(select.element.value).toBe('var(--primary-500)')
    expect(wrapper.emitted('input')).toBeUndefined()
    wrapper.unmount()
  })
})
