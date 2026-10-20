import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import ColorField from '@/components/ColorField.vue'

function createField() {
  return mount(ColorField, { attachTo: document.body, props: {
    id: 'test-color', label: 'Test color', value: 'var(--gray-900)', effectiveValue: '#101828',
    profile: 'foundation', contextKey: 'light',
  } })
}

function buttonByName(name: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.getAttribute('aria-label') === name || button.textContent?.trim() === name)
}
function inputByLabel(name: string): HTMLInputElement {
  const label = [...document.querySelectorAll('label')].find((candidate) => candidate.textContent?.trim() === name)
  return document.getElementById(label?.htmlFor ?? '') as HTMLInputElement
}
describe('ColorPopover interactions', () => {
  it('searches, reports empty results, recovers, and dismisses without mutation', async () => {
    const wrapper = createField()
    await wrapper.get('[aria-label="Choose Test color from Tailwind palette"]').trigger('click')
    const search = inputByLabel('Search Tailwind colors')
    expect(search.getAttribute('aria-label')).toBe('Search Tailwind colors')
    search.value = 'no-such-token'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('0 colors')
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Clear search')
    search.value = ''
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('286 colors')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.get('#test-color-palette-trigger').attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('input')).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.get('#test-color-palette-trigger').element)
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
    await wrapper.get('#test-color').setValue('another invalid draft')
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

  it('removes document listeners when the open popover is unmounted', async () => {
    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    const wrapper = createField()
    await wrapper.get('[aria-label="Choose Test color from Tailwind palette"]').trigger('click')
    await nextTick()
    expect(added.mock.calls.some(([name]) => name === 'keydown')).toBe(true)
    expect(added.mock.calls.some(([name]) => name === 'pointerdown')).toBe(true)
    wrapper.unmount()
    expect(removed.mock.calls.some(([name]) => name === 'keydown')).toBe(true)
    expect(removed.mock.calls.some(([name]) => name === 'pointerdown')).toBe(true)
  })

})
