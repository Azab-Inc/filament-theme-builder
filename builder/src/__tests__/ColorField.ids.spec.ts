import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import ColorField from '@/components/ColorField.vue'

function customTab(fieldId: string): HTMLButtonElement {
  const dialog = document.getElementById(`${fieldId}-color-popover`)!
  return [...dialog.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((button) => button.textContent?.trim() === 'Custom')!
}

describe('ColorField custom IDs', () => {
  it('uses distinct field IDs and matching label associations for repeated human labels', async () => {
    const props = { label: 'Repeated label', value: '#abcdef', effectiveValue: '#abcdef', profile: 'hex6' as const }
    const first = mount(ColorField, { props: { ...props, id: 'field-one', contextKey: 'one' } })
    const second = mount(ColorField, { props: { ...props, id: 'field-two', contextKey: 'two' } })
    await first.get('[aria-label="Choose Repeated label from Tailwind palette"]').trigger('click')
    await second.get('[aria-label="Choose Repeated label from Tailwind palette"]').trigger('click')
    customTab('field-one').click()
    customTab('field-two').click()
    await nextTick()
    const one = document.getElementById('field-one-custom-color')!
    const two = document.getElementById('field-two-custom-color')!
    expect(one).not.toBe(two)
    expect(document.querySelector(`label[for="${one.id}"]`)?.textContent).toBe('Custom color')
    expect(document.querySelector(`label[for="${two.id}"]`)?.textContent).toBe('Custom color')
    first.unmount()
    second.unmount()
  })
})
