import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import FoundationsPaletteControls from '@/components/FoundationsPaletteControls.vue'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

describe('FoundationsPaletteControls', () => {
  it('preserves the palette fieldset hooks and emits typed palette actions', async () => {
    const wrapper = mount(FoundationsPaletteControls, {
      props: {
        palettes: createDefaultFoundationState().palettes,
        paletteNames: PALETTE_NAMES,
        paletteShades: PALETTE_SHADES,
        statusFor: (path: string) => (path === 'palettes.primary.base' ? 'explicit' : 'generated'),
      },
    })

    const fieldset = wrapper.get('fieldset')
    expect(fieldset.classes()).toEqual([
      'grid',
      'gap-4',
      'rounded-lg',
      'border',
      'border-zinc-200',
      'p-4',
    ])
    expect(fieldset.get('legend').text()).toBe('Color palettes')
    expect(wrapper.get('#primary-palette-base').attributes('value')).toBe('#6366f1')
    expect(wrapper.get('#primary-shade-50').attributes('aria-label')).toBe(
      'primary shade 50 override',
    )
    expect(wrapper.get('[role="status"]').text()).toBe('explicit')
    expect(wrapper.find('[aria-label="Reset primary palette base"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Reset primary shade 50"]').exists()).toBe(true)

    await wrapper.get('#primary-palette-base').setValue('#123456')
    await wrapper.get('#primary-shade-50').setValue('#abcdef')
    await wrapper.get('[aria-label="Reset primary palette base"]').trigger('click')
    await wrapper.get('[aria-label="Reset primary shade 50"]').trigger('click')

    expect(wrapper.emitted('set-palette-base')).toEqual([[{ name: 'primary', value: '#123456' }]])
    expect(wrapper.emitted('set-palette-shade')).toEqual([
      [{ name: 'primary', shade: 50, value: '#abcdef' }],
    ])
    expect(wrapper.emitted('reset-palette-base')).toEqual([['primary']])
    expect(wrapper.emitted('reset-palette-shade')).toEqual([[{ name: 'primary', shade: 50 }]])
  })
})
