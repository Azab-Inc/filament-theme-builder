import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('ColorField', () => {
  it('preserves existing labels and IDs while showing empty shade overrides with their effective swatch', () => {
    const wrapper = mount(ColorField, { props: {
      id: 'primary-shade-500', label: 'Primary 500', value: '', effectiveValue: '#fb2c36',
      profile: 'palette', contextKey: 'primary-500',
    } })
    expect(wrapper.get('#primary-shade-500').attributes('aria-label')).toBe('Primary 500')
    expect((wrapper.get('[type="color"]').element as HTMLInputElement).value).toBe('#fb2c36')
    expect((wrapper.get('[type="text"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('button[aria-label="Choose Primary 500 from Tailwind palette"]').attributes('type')).toBe('button')
  })

  it('preserves unsupported native values and emits the owned input event for a named selection', async () => {
    const wrapper = mount(ColorField, { props: {
      id: 'surface', label: 'Surface', value: 'var(--gray-900)', effectiveValue: '#101828',
      profile: 'foundation', contextKey: 'surface',
    } })
    expect((wrapper.get('[type="color"]').element as HTMLInputElement).value).not.toBe('#101828')
    expect(wrapper.text()).toContain('Native color picker unavailable')
    await wrapper.get('[aria-label="Choose Surface from Tailwind palette"]').trigger('click')
    document.querySelector(`#${CSS.escape('surface-color-popover')} button[role="tab"]:nth-child(2)`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    document.querySelector('#surface-color-popover button[aria-label="gray 900 #101828"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    const input = wrapper.emitted('input')?.[0]?.[0] as Event
    expect(input.target).toBe(wrapper.get('[type="text"]').element)
    expect((input.target as HTMLInputElement).value).toBe('#101828')
    expect(wrapper.emitted('input')).toHaveLength(1)
  })

  it('keeps invalid inline drafts visible and clears them on a valid named choice', async () => {
    const wrapper = mount(ColorField, { props: {
      id: 'primary', label: 'Primary color', value: '#abcdef', effectiveValue: '#abcdef',
      profile: 'primary', contextKey: 'primary',
    } })
    const input = wrapper.get('[type="text"]')
    await input.setValue('#bad-value')
    expect(wrapper.emitted('input')).toHaveLength(1)
    expect((input.element as HTMLInputElement).value).toBe('#bad-value')
    await wrapper.get('[aria-label="Choose Primary color from Tailwind palette"]').trigger('click')
    document.querySelector('#primary-color-popover button[role="tab"]:nth-child(2)')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    document.querySelector('#primary-color-popover button[aria-label="gray 900 #101828"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('input')).toHaveLength(2)
    expect((wrapper.get('[type="text"]').element as HTMLInputElement).value).toBe('#101828')
  })

  it('applies custom color once through the field input and preserves native input event targets', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'brand', label: 'Brand color', value: '#abcdef', effectiveValue: '#abcdef',
      profile: 'primary', contextKey: 'brand',
    } })
    const native = wrapper.get('[type="color"]')
    await native.setValue('#123456')
    expect((wrapper.emitted('input')?.[0]?.[0] as Event).target).toBe(native.element)
    await wrapper.get('[aria-label="Choose Brand color from Tailwind palette"]').trigger('click')
    document.querySelector('#brand-color-popover button[role="tab"]:first-child')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    const custom = document.querySelector<HTMLInputElement>('#custom-brand-color')!
    custom.value = '#654321'
    custom.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('#brand-color-popover .color-popover__custom button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('input')).toHaveLength(2)
    expect((wrapper.emitted('input')?.[1]?.[0] as Event).target).toBe(wrapper.get('#brand').element)
    expect((wrapper.get('#brand').element as HTMLInputElement).value).toBe('#654321')
    expect(document.activeElement).toBe(wrapper.get('#brand-palette-trigger').element)
  })
})
