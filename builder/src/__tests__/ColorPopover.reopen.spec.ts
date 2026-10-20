import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

function tab(fieldId: string, name: string): HTMLButtonElement {
  const dialog = document.getElementById(`${fieldId}-color-popover`)!
  return [...dialog.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((button) => button.textContent?.trim() === name)!
}
function labeledInput(name: string): HTMLInputElement {
  const label = [...document.querySelectorAll('label')].find((candidate) => candidate.textContent?.trim() === name)!
  return document.getElementById(label.htmlFor) as HTMLInputElement
}

describe('ColorPopover reopen behavior', () => {
  it('preserves references without edits and reopens on Tailwind with cleared search', async () => {
    const wrapper = mount(ColorField, { attachTo: document.body, props: {
      id: 'token-field', label: 'Token', value: 'var(--gray-900)', effectiveValue: '#101828', profile: 'foundation', contextKey: 'token',
    } })
    const trigger = wrapper.get('[aria-label="Choose Token from Tailwind palette"]')
    await trigger.trigger('click')
    expect(tab('token-field', 'Tailwind').getAttribute('aria-selected')).toBe('true')
    tab('token-field', 'Custom').click()
    await nextTick()
    expect(wrapper.emitted('input')).toBeUndefined()
    tab('token-field', 'Tailwind').click()
    await nextTick()
    const search = labeledInput('Search Tailwind colors')
    search.value = 'red-500'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    tab('token-field', 'Custom').click()
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect((wrapper.get('#token-field').element as HTMLInputElement).value).toBe('var(--gray-900)')
    expect(wrapper.emitted('input')).toBeUndefined()
    await trigger.trigger('click')
    expect(tab('token-field', 'Tailwind').getAttribute('aria-selected')).toBe('true')
    expect(labeledInput('Search Tailwind colors').value).toBe('')
    wrapper.unmount()
  })
})
