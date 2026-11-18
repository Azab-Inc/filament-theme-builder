import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RawBorderEdgeControls from '@/components/RawBorderEdgeControls.vue'

describe('raw border edge controls', () => {
  it('emits one atomic batch for all sides and preserves explicit zero/none', async () => {
    const wrapper = mount(RawBorderEdgeControls, { props: { selector: '.fi-input', propertyValue: () => '' } })
    await wrapper.get('[aria-label="Raw border width"]').setValue('0')
    await wrapper.get('[aria-label="Raw border width"]').trigger('change')
    const batches = wrapper.emitted('set-properties') ?? []
    expect(batches[batches.length - 1]?.[0]).toEqual([
      { property: 'border-top-width', value: '0' }, { property: 'border-right-width', value: '0' },
      { property: 'border-bottom-width', value: '0' }, { property: 'border-left-width', value: '0' },
    ])
    await wrapper.get('[aria-label="Raw border property"]').setValue('style')
    await wrapper.get('[aria-label="Raw border style"]').setValue('none')
    const updatedBatches = wrapper.emitted('set-properties') ?? []
    expect(updatedBatches[updatedBatches.length - 1]?.[0]).toEqual([
      { property: 'border-top-style', value: 'none' }, { property: 'border-right-style', value: 'none' },
      { property: 'border-bottom-style', value: 'none' }, { property: 'border-left-style', value: 'none' },
    ])
  })

  it('shows a mixed all-sides value instead of silently presenting one side', () => {
    const wrapper = mount(RawBorderEdgeControls, { props: { selector: '.fi-input', propertyValue: (property) => property === 'border-top-width' ? '1px' : property === 'border-right-width' ? '2px' : '' } })
    expect(wrapper.get('[aria-label="Raw border width"]').element).toHaveProperty('value', '')
  })
})
