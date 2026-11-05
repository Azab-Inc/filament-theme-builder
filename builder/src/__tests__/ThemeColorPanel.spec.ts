import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ThemeColorPanel from '@/components/ThemeColorPanel.vue'

describe('Theme color panel', () => {
  it('searches without writes and emits the reference only after an explicit choice', async () => {
    const wrapper = mount(ThemeColorPanel, { props: { id: 'theme-options', selectedValue: '', options: [
      { value: 'var(--primary-500)', label: 'primary 500', group: 'primary', color: '#123456' },
      { value: 'user.color.secondary', label: 'secondary', group: 'Named colors', color: '#654321' },
    ] } })
    await wrapper.get('input[type="search"]').setValue('secondary')
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.get('[data-theme-color-swatch]').attributes('style')).toContain('rgb(101, 67, 33)')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['user.color.secondary']])
    wrapper.unmount()
  })
})
