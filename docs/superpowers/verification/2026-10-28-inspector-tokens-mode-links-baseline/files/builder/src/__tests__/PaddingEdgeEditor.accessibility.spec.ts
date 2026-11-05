import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PaddingEdgeEditor from '@/components/PaddingEdgeEditor.vue'
import PaddingValueField from '@/components/PaddingValueField.vue'

describe('PaddingEdgeEditor validation associations', () => {
  it('marks invalid linked padding and associates the inline error', async () => {
    const wrapper = mount(PaddingEdgeEditor, { props: {
      linked: true, contextKey: 'dialog', contextLabel: 'Dialog component',
      edges: { top: '12px', right: '12px', bottom: '12px', left: '12px' },
    } })
    const input = wrapper.get('input[type="number"]')
    await wrapper.findComponent(PaddingValueField).vm.$emit('update:value', '-2px')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('padding-dialog-error')
    expect(wrapper.get('#padding-dialog-error').text()).toContain('approved raw property')
  })
})
