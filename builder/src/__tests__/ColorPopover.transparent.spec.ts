import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

describe('ColorPopover transparent choice', () => {
  it('offers a labeled selected transparent button and applies it independently of reset', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'transparent-field', label: 'Page background', value: '#abcdef', effectiveValue: '#abcdef',
      profile: 'foundation', contextKey: 'light',
    } })
    await wrapper.get('[aria-label="Choose Page background from Tailwind palette"]').trigger('click')
    const transparent = document.querySelector<HTMLButtonElement>('[data-color-choice="transparent"]')
    expect(transparent).not.toBeNull()
    expect(transparent?.getAttribute('aria-label')).toBe('Transparent')
    expect(transparent?.getAttribute('aria-pressed')).toBe('false')
    await transparent?.click()
    expect((wrapper.get('#transparent-field').element as HTMLInputElement).value).toBe('transparent')
    wrapper.unmount()
  })

  it('does not offer transparent for literal palette seed/shade fields', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'palette-shade', label: 'Primary shade', value: '#abcdef', effectiveValue: '#abcdef',
      profile: 'hex68', contextKey: 'light',
    } })
    await wrapper.get('[aria-label="Choose Primary shade from Tailwind palette"]').trigger('click')
    expect(document.querySelector('[data-color-choice="transparent"]')).toBeNull()
    wrapper.unmount()
  })

  it('visibly marks transparent as selected in the custom tab', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'custom-transparent-field', label: 'Card background', value: 'transparent', effectiveValue: 'transparent',
      profile: 'foundation', contextKey: 'light',
    } })
    await wrapper.get('[aria-label="Choose Card background from Tailwind palette"]').trigger('click')
    await document.querySelector<HTMLButtonElement>('[role="tab"][aria-controls="custom-transparent-field-custom-panel"]')?.click()
    const transparent = document.querySelector<HTMLButtonElement>('[data-color-choice="transparent"]')
    expect(transparent?.classList.contains('color-popover__transparent')).toBe(true)
    expect(transparent?.getAttribute('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('does not offer transparent for the literal primary palette control', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'primary-color', label: 'Primary color', value: '#6366f1', effectiveValue: '#6366f1',
      profile: 'hex6', contextKey: 'light', nativePrimary: true,
    } })
    await wrapper.get('[aria-label="Choose Primary color from Tailwind palette"]').trigger('click')
    expect(document.querySelector('[data-color-choice="transparent"]')).toBeNull()
    wrapper.unmount()
  })
})
