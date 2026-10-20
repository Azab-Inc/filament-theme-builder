import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

function createField() {
  return mount(ColorField, { attachTo: document.body, props: {
    id: 'test-color', label: 'Test color', value: 'var(--gray-900)', effectiveValue: '#101828',
    profile: 'foundation', contextKey: 'light',
  } })
}

describe('ColorPopover interactions', () => {
  it('searches, reports empty results, recovers, and dismisses without mutation', async () => {
    const wrapper = createField()
    await wrapper.get('[aria-label="Choose Test color from Tailwind palette"]').trigger('click')
    const search = document.querySelector<HTMLInputElement>('#test-color-tailwind-search')!
    expect(search.getAttribute('aria-label')).toBe('Search Tailwind colors')
    search.value = 'no-such-token'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#test-color-color-popover')?.textContent).toContain('0 colors')
    expect(document.querySelector('.color-popover__empty')?.textContent).toContain('Clear search')
    search.value = ''
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('#test-color-color-popover')?.textContent).toContain('286 colors')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.get('#test-color-palette-trigger').attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('input')).toBeUndefined()
    wrapper.unmount()
  })

  it('closes on context change and reset key even when canonical value is unchanged', async () => {
    const wrapper = createField()
    const input = wrapper.get('#test-color')
    await input.setValue('invalid draft')
    await wrapper.get('[aria-label="Choose Test color from Tailwind palette"]').trigger('click')
    await wrapper.setProps({ contextKey: 'dark' })
    await nextTick()
    expect((wrapper.get('#test-color').element as HTMLInputElement).value).toBe('var(--gray-900)')
    expect(wrapper.get('#test-color-palette-trigger').attributes('aria-expanded')).toBe('false')
    await wrapper.setProps({ contextKey: 'dark', resetKey: 'reset-1' })
    await nextTick()
    expect((wrapper.get('#test-color').element as HTMLInputElement).value).toBe('var(--gray-900)')
    wrapper.unmount()
  })

  it('does not steal focus from another input when outside dismissal occurs', async () => {
    const wrapper = createField()
    const outside = document.createElement('input')
    document.body.append(outside)
    await wrapper.get('[aria-label="Choose Test color from Tailwind palette"]').trigger('click')
    outside.focus()
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(outside)
    expect(wrapper.get('#test-color-palette-trigger').attributes('aria-expanded')).toBe('false')
    outside.remove()
    wrapper.unmount()
  })
})
